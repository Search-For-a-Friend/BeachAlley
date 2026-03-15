/**
 * Simplified Game Engine - only tiles and groups spawning mechanics
 */

import {
  GameState,
  GameConfig,
  GameEvent,
  DEFAULT_CONFIG,
  PeopleGroup,
  Vector2,
  EventCallback as GameEventCallback,
} from '../types';
import {
  createPeopleGroup,
  setGroupState,
  isOutOfBounds,
  updateGroupFacing,
} from './peopleGroup';
import { distance, moveTowards } from './utils';
import { GridManager } from './GridManager';
import { Pathfinder } from './Pathfinder';
import { TerrainMap } from '../types/environment';
import Logger from '../utils/Logger';

export type EventCallback = GameEventCallback;

/** Find grass tiles approximately targetDist tiles away from (centerRow, centerCol). */
function findGrassTilesAboutDistanceAway(
  terrainMap: TerrainMap,
  centerRow: number,
  centerCol: number,
  targetDist: number,
  tolerance: number
): Array<{ row: number; col: number }> {
  const out: Array<{ row: number; col: number }> = [];
  const minD = targetDist - tolerance;
  const maxD = targetDist + tolerance;
  terrainMap.tiles.forEach((type, key) => {
    if (type !== 'grass') return;
    const [row, col] = key.split(',').map(Number);
    const d = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
    if (d >= minD && d <= maxD) out.push({ row, col });
  });
  return out;
}

export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private eventCallbacks: EventCallback[] = [];
  private gridManager: GridManager;
  private pathfinder: Pathfinder;
  private terrainMap: TerrainMap;
  private lastSpawnTime: number = 0;
  private animationFrameId: number | null = null;
  /** Spawn tile centers (x, y) for exit and spawn. */
  private spawnTiles: Vector2[] = [];

  constructor(config: Partial<GameConfig>, terrainMap: TerrainMap) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.terrainMap = terrainMap;
    this.gridManager = new GridManager(this.terrainMap.width, this.terrainMap.height);
    this.pathfinder = new Pathfinder();
    this.state = this.createInitialState();
    this.initializeGrid();
    this.generateSpawnTile();
  }

  private generateSpawnTile(): void {
    // Find all grass tiles
    const grassTiles: Array<{ row: number; col: number }> = [];
    this.terrainMap.tiles.forEach((type, key) => {
      if (type === 'grass') {
        const [row, col] = key.split(',').map(Number);
        grassTiles.push({ row, col });
      }
    });

    if (grassTiles.length === 0) {
      Logger.warn('GAME', 'No grass tiles found for spawn tile generation');
      return;
    }

    // Try to find a spawn tile at least 10 tiles away from sand
    let spawnTile: { row: number; col: number } | null = null;
    
    // First try: Find grass tiles 10 tiles away from sand
    for (const grassTile of grassTiles) {
      const spawnCandidates = findGrassTilesAboutDistanceAway(this.terrainMap, grassTile.row, grassTile.col, 10, 3);
      if (spawnCandidates.length > 0) {
        spawnTile = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
        break;
      }
    }

    // Fallback: Use any grass tile
    if (!spawnTile) {
      spawnTile = grassTiles[Math.floor(Math.random() * grassTiles.length)];
    }

    // Set the spawn tile
    if (spawnTile) {
      this.gridManager.setTileType(spawnTile.col, spawnTile.row, 'spawn');
      this.spawnTiles.push({ x: spawnTile.col + 0.5, y: spawnTile.row + 0.5 });
      Logger.info('GAME', 'Spawn tile generated', { position: spawnTile });
    }
  }

  getSpawnTile(): Vector2 {
    if (this.spawnTiles.length === 0) return { x: 0.5, y: 0.5 };
    return this.spawnTiles[Math.floor(Math.random() * this.spawnTiles.length)];
  }

  private createInitialState(): GameState {
    const state: GameState = {
      groups: [],
      time: 0,
      isPaused: false,
      stats: {
        totalGroupsSpawned: 0,
        totalGroupsDespawned: 0,
        totalVisits: 0,
        totalRevenue: 0,
      },
    };

    Logger.info('GAME', 'Initial game state created');

    return state;
  }

  private initializeGrid(): void {
    // Initialize grid from terrain map
    this.terrainMap.tiles.forEach((terrainType, key) => {
      const [row, col] = key.split(',').map(Number);
      
      // Map terrain types to tile types
      let tileType: 'path' | 'grass' | 'water';
      switch (terrainType) {
        case 'sand':
          tileType = 'path';
          break;
        case 'grass':
          tileType = 'grass';
          break;
        case 'water':
          tileType = 'water';
          break;
        case 'spawn':
          tileType = 'grass'; // Spawn tiles are walkable like grass
          break;
        default:
          tileType = 'path';
      }
      
      this.gridManager.setTileType(col, row, tileType);
    });

    Logger.info('GAME', 'Grid initialized from terrain map');
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public getGridManager(): GridManager {
    return this.gridManager;
  }

  public getPathfinder(): Pathfinder {
    return this.pathfinder;
  }

  public on(event: GameEvent): void {
    this.eventCallbacks.forEach(callback => callback(event));
  }

  public addEventListener(callback: EventCallback): void {
    this.eventCallbacks.push(callback);
  }

  public removeEventListener(callback: EventCallback): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index > -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  public pause(): void {
    this.state.isPaused = true;
    Logger.info('GAME', 'Game paused');
  }

  public resume(): void {
    this.state.isPaused = false;
    Logger.info('GAME', 'Game resumed');
  }

  public update(deltaTime: number): void {
    if (this.state.isPaused) return;

    this.state.time += deltaTime;

    // Spawn new groups
    this.updateSpawning();

    // Update existing groups
    this.updateGroups(deltaTime);

    // Clean up despawned groups
    this.cleanupGroups();
  }

  private updateSpawning(): void {
    const now = this.state.time;
    if (now - this.lastSpawnTime < this.config.spawnInterval) return;
    if (this.state.groups.length >= this.config.maxGroups) return;
    if (Math.random() > this.config.spawnProbability) return;

    this.lastSpawnTime = now;
    this.spawnGroup();
  }

  private spawnGroup(): void {
    // Use spawn tile position
    if (this.spawnTiles.length === 0) return;
    
    const spawnPos = this.getSpawnTile();
    const group = createPeopleGroup(spawnPos, this.config);
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;

    Logger.info('GAME', 'Group spawned at spawn tile');

    this.on({ type: 'GROUP_SPAWNED', group });
  }

  
  private updateGroups(deltaTime: number): void {
    this.state.groups.forEach(group => {
      this.updateGroup(group, deltaTime);
    });
  }

  private updateGroup(group: PeopleGroup, deltaTime: number): void {
    switch (group.state) {
      case 'spawning':
        setGroupState(group, 'idle');
        break;

      case 'idle':
        // Random wandering
        if (Math.random() < 0.01) {
          setGroupState(group, 'wandering');
          group.targetPosition = this.findRandomWalkablePosition(group.position);
        }
        break;

      case 'wandering':
        if (group.targetPosition) {
          const moved = this.moveGroupTowards(group, group.targetPosition, deltaTime);
          if (moved) {
            const dist = distance(group.position, group.targetPosition);
            if (dist < 0.5) {
              setGroupState(group, 'idle');
              group.targetPosition = null;
            }
          }
        }
        break;

      case 'seeking':
      case 'queuing':
      case 'entering':
      case 'visiting':
      case 'leaving':
        // These states are not used in simplified version
        setGroupState(group, 'idle');
        break;
    }

    // Update satisfaction
    group.satisfaction = Math.max(0, group.satisfaction - this.config.satisfactionDecayRate * deltaTime / 1000);

    // Update patience
    group.patience = Math.max(0, group.patience - deltaTime / 1000);

    // Check if group should despawn
    if (group.patience <= 0 || group.satisfaction <= 0 || isOutOfBounds(group, this.terrainMap.width, this.terrainMap.height)) {
      setGroupState(group, 'despawned');
    }
  }

  private moveGroupTowards(group: PeopleGroup, target: Vector2, deltaTime: number): boolean {
    const oldPos = { ...group.position };
    const speed = group.speed * this.config.groupSpeed;
    const newPos = moveTowards(group.position, target, speed, deltaTime / 1000);
    
    group.position = newPos;
    group.previousPosition = oldPos;
    
    updateGroupFacing(group);
    
    return true;
  }

  private findRandomWalkablePosition(from: Vector2): Vector2 {
    const radius = 5;
    let attempts = 0;
    
    while (attempts < 20) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const x = Math.round(from.x + Math.cos(angle) * dist);
      const y = Math.round(from.y + Math.sin(angle) * dist);
      
      const tile = this.gridManager.getTile(x, y);
      if (tile && tile.type === 'path') {
        return { x, y };
      }
      
      attempts++;
    }
    
    return from;
  }

  private cleanupGroups(): void {
    const beforeCount = this.state.groups.length;
    
    this.state.groups = this.state.groups.filter(group => {
      if (group.state === 'despawned') {
        this.state.stats.totalGroupsDespawned++;
        Logger.info('GAME', 'Group despawned');
        
        this.on({ type: 'GROUP_DESPAWNED', groupId: group.id });
        return false;
      }
      return true;
    });
    
    const removed = beforeCount - this.state.groups.length;
    if (removed > 0) {
      Logger.info('GAME', 'Cleaned up groups');
    }
  }

  public start(): void {
    if (this.animationFrameId) return;
    
    let lastTime = performance.now();
    
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      this.update(deltaTime);
      
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    this.animationFrameId = requestAnimationFrame(gameLoop);
    
    Logger.info('GAME', 'Game loop started');
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    Logger.info('GAME', 'Game loop stopped');
  }

  public destroy(): void {
    this.stop();
    this.eventCallbacks = [];
    
    Logger.info('GAME', 'Game engine destroyed');
  }
}
