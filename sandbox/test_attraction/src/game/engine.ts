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
  updateGroupFacing,
} from './peopleGroup';
import { distance, moveTowards } from './utils';
import { GridManager } from './GridManager';
import { GroupBehavior } from './GroupBehavior';
import { IndividualManager } from './Individual';
import { TerrainMap } from '../types/environment';
import Logger from '../utils/Logger';

export type EventCallback = GameEventCallback;


export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private eventCallbacks: EventCallback[] = [];
  private gridManager: GridManager;
  private groupBehavior: GroupBehavior;
  private individualManager: IndividualManager;
  private terrainMap: TerrainMap;
  private lastSpawnTime: number = 0;
  private animationFrameId: number | null = null;
  /** Spawn tile centers (x, y) for exit and spawn. */
  private spawnTiles: Vector2[] = [];
  /** Event queue for buffering events */
  private eventQueue: GameEvent[] = [];
  /** Performance optimization settings */
  private maxActiveGroups: number = 100;
  private lastGroupUpdate: Map<string, number> = new Map();
  private updateFrequency: number = 100; // ms between updates for distant groups
  /** Individual spawning settings */
  private lastIndividualSpawnTime: Map<string, number> = new Map();
  private individualSpawnInterval: number = 2000; // 2 seconds between spawns

  constructor(config: Partial<GameConfig>, terrainMap: TerrainMap) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.terrainMap = terrainMap;
    this.gridManager = new GridManager(this.terrainMap.width, this.terrainMap.height);
    this.individualManager = new IndividualManager(terrainMap);
    this.groupBehavior = new GroupBehavior({
      settlementDurations: {
        individual: { min: 50000, max: 200000 },  // 50-200 seconds (short to long range)
        smallGroup: { min: 80000, max: 150000 }, // 80-150 seconds (shorter range)
        bigGroup: { min: 150000, max: 300000 }   // 150-300 seconds (long range)
      },
      settlementRequirements: {} // No requirements for now
    });
    this.state = this.createInitialState();
    this.initializeGrid();
    this.generateSpawnTile();
  }

  private generateSpawnTile(): void {
    // Step 1: Select a sand tile randomly in the whole map (sand tiles less than 10 tiles from border are forbidden)
    const sandTiles: Array<{ row: number; col: number }> = [];
    this.terrainMap.tiles.forEach((type, key) => {
      if (type === 'sand') {
        const [row, col] = key.split(',').map(Number);
        
        // Check if sand tile is at least 10 tiles from border
        const distanceFromBorder = Math.min(row, col, this.terrainMap.height - 1 - row, this.terrainMap.width - 1 - col);
        if (distanceFromBorder >= 10) {
          sandTiles.push({ row, col });
        }
      }
    });

    if (sandTiles.length === 0) {
      Logger.warn('GAME', 'No eligible sand tiles found for spawn tile generation');
      return;
    }

    // Randomly select one sand tile
    const selectedSandTile = sandTiles[Math.floor(Math.random() * sandTiles.length)];
    Logger.info('GAME', 'Step 1: Selected sand tile', { position: selectedSandTile });

    // Step 2: Choose the closest grass tile to this sand tile
    const grassTiles: Array<{ row: number; col: number; distance: number }> = [];
    this.terrainMap.tiles.forEach((type, key) => {
      if (type === 'grass') {
        const [row, col] = key.split(',').map(Number);
        const distance = Math.sqrt(Math.pow(row - selectedSandTile.row, 2) + Math.pow(col - selectedSandTile.col, 2));
        grassTiles.push({ row, col, distance });
      }
    });

    if (grassTiles.length === 0) {
      Logger.warn('GAME', 'No grass tiles found for spawn tile generation');
      return;
    }

    // Sort by distance and pick the closest
    grassTiles.sort((a, b) => a.distance - b.distance);
    const closestGrassTile = grassTiles[0];
    Logger.info('GAME', 'Step 2: Closest grass tile', { position: closestGrassTile, distance: closestGrassTile.distance });

    // Step 3: The spawn tile should be at a random distance, between 3 tiles and 10 tiles away, from this selected grass tile (grass tiles only)
    const minDistance = 3;
    const maxDistance = 10;
    const spawnCandidates: Array<{ row: number; col: number; distance: number }> = [];
    
    // Find all GRASS tiles between 3 and 10 tiles of the closest grass tile
    this.terrainMap.tiles.forEach((type, key) => {
      if (type === 'grass') { // Only grass tiles are eligible for spawn
        const [row, col] = key.split(',').map(Number);
        const distance = Math.sqrt(Math.pow(row - closestGrassTile.row, 2) + Math.pow(col - closestGrassTile.col, 2));
        if (distance >= minDistance && distance <= maxDistance) {
          spawnCandidates.push({ row, col, distance });
        }
      }
    });

    if (spawnCandidates.length === 0) {
      Logger.warn('GAME', 'No spawn candidates found between 3 and 10 tiles of closest grass tile');
      return;
    }

    // Randomly select from candidates
    const spawnTile = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
    Logger.info('GAME', 'Step 3: Selected spawn tile', { position: spawnTile, distance: spawnTile.distance });

    // Set the spawn tile
    this.gridManager.setTileType(spawnTile.col, spawnTile.row, 'spawn');
    this.spawnTiles.push({ x: spawnTile.col + 0.5, y: spawnTile.row + 0.5 });
    Logger.info('GAME', 'Spawn tile generated', { position: spawnTile });
    
    // Automatically center on spawn tile after generation
    this.centerViewportOnSpawn();
  }

  centerViewportOnSpawn(): void {
    if (this.spawnTiles.length === 0) return;
    
    const spawnTile = this.spawnTiles[0]; // Use first spawn tile
    this.on({ type: 'CENTER_ON_SPAWN', tileX: spawnTile.x, tileY: spawnTile.y });
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

  /**
   * Get the grid manager
   */
  public getGridManager(): GridManager {
    return this.gridManager;
  }

  /**
   * Get the group behavior manager
   */
  public getGroupBehavior(): GroupBehavior {
    return this.groupBehavior;
  }

  /**
   * Get the individual manager
   */
  public getIndividualManager(): IndividualManager {
    return this.individualManager;
  }

  
  public on(event: GameEvent): void {
    this.eventQueue.push(event);
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

  private processEventQueue(): void {
    while (this.eventQueue.length > 0 && this.eventCallbacks.length > 0) {
      const event = this.eventQueue.shift()!;
      this.eventCallbacks.forEach(callback => callback(event));
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

    // Process event queue first
    this.processEventQueue();

    // Spawn new groups
    this.updateSpawning();

    // Update existing groups
    this.updateGroups(deltaTime);

    // Update individuals
    this.updateIndividuals(deltaTime);

    // Update spatial grid and settled groups
    this.groupBehavior.updateSettledGroups(this.state.groups, this.state.time);

    // Clean up despawned groups
    this.cleanupGroups();
  }

  private updateSpawning(): void {
    const now = this.state.time;
    
    // Enforce maximum group limit for performance
    if (this.state.groups.length >= this.maxActiveGroups) {
      return;
    }
    
    if (now - this.lastSpawnTime < this.config.spawnInterval) return;
    if (Math.random() > this.config.spawnProbability) return;

    this.lastSpawnTime = now;
    this.spawnGroup();
  }

  private spawnGroup(): void {
    // Use spawn tile position
    if (this.spawnTiles.length === 0) return;
    
    const spawnPos = this.getSpawnTile();
    const group = createPeopleGroup(spawnPos, this.config);
    group.spawnTime = this.state.time; // Set spawn time to current game time
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;

    Logger.info('GAME', 'Group spawned at spawn tile');

    this.on({ type: 'GROUP_SPAWNED', group });
  }

  
  private updateGroups(deltaTime: number): void {
    this.state.groups.forEach(group => {
      if (this.shouldUpdateGroup(group, this.state.time)) {
        this.updateGroup(group, deltaTime);
        this.lastGroupUpdate.set(group.id, this.state.time);
      }
    });
  }

  private shouldUpdateGroup(group: PeopleGroup, currentTime: number): boolean {
    const lastUpdate = this.lastGroupUpdate.get(group.id) || 0;
    
    // Always update groups that are moving or in critical states
    if (group.state === 'spawning' || group.state === 'seeking' || group.state === 'wandering' || group.state === 'leaving') {
      return true;
    }
    
    // Throttle updates for settled and idle groups
    return currentTime - lastUpdate >= this.updateFrequency;
  }

  private updateGroup(group: PeopleGroup, deltaTime: number): void {
    switch (group.state) {
      case 'spawning':
        setGroupState(group, 'idle');
        break;

      case 'idle':
        if (!this.isOnSand(group)) {
          // Aim for closest sand tile when not on sand
          const closestSand = this.findClosestSandTile(group.position);
          if (closestSand) {
            group.targetPosition = closestSand;
            setGroupState(group, 'seeking');
          }
        } else {
          // Once on sand, find best settlement position
          const targetPos = this.findBestSettlementPosition(group);
          if (targetPos) {
            group.targetPosition = targetPos;
            setGroupState(group, 'wandering');
          } else {
            // Fallback to random walk
            const randomPos = this.findRandomWalkablePosition(group.position);
            group.targetPosition = randomPos;
            setGroupState(group, 'wandering');
          }
        }
        break;

      case 'seeking':
        // Move towards sand tile
        if (group.targetPosition) {
          const reached = this.moveGroupTowards(group, group.targetPosition, deltaTime);
          if (reached) {
            group.targetPosition = null;
            setGroupState(group, 'idle');
          }
        }
        break;

      case 'wandering':
        // Move freely when on sand
        if (group.targetPosition) {
          const reached = this.moveGroupTowards(group, group.targetPosition, deltaTime);
          if (reached) {
            // Check if group can settle here
            const tileX = Math.floor(group.position.x);
            const tileY = Math.floor(group.position.y);
            
            // Try to settle the group (manages failed attempts)
            this.groupBehavior.trySettle(group, tileX, tileY, this.state.time);
          }
        }
        break;

      case 'settled':
        // Groups don't move when settled
        break;

      case 'leaving':
        // Move back to spawn to despawn
        if (!group.targetPosition) {
          // Set target to spawn if not already set
          const spawnPos = this.getSpawnTile();
          group.targetPosition = spawnPos;
        }
        
        if (group.targetPosition) {
          const reached = this.moveGroupTowards(group, group.targetPosition, deltaTime);
          if (reached) {
            group.targetPosition = null;
            // Remove all individuals for this group
            this.individualManager.removeGroupIndividuals(group.id);
            setGroupState(group, 'despawned');
          }
        }
        break;
    }
    group.satisfaction = Math.max(0, group.satisfaction - this.config.satisfactionDecayRate * deltaTime / 1000);

    // Update patience
    group.patience = Math.max(0, group.patience - deltaTime / 1000);

    // Groups only despawn when reaching spawn tile after leaving
    // No other despawn conditions allowed
  }

  private updateIndividuals(deltaTime: number): void {
    const now = this.state.time;

    // Update all individuals
    const allIndividuals = this.individualManager.getAllIndividuals();
    for (const individual of allIndividuals) {
      this.individualManager.updateIndividual(individual, deltaTime);
    }

    // Spawn individuals from settled groups
    this.spawnIndividuals(now);

    // Check group leaving conditions
    this.checkGroupLeavingConditions();
  }

  private spawnIndividuals(now: number): void {
    for (const group of this.state.groups) {
      // Only spawn from settled groups (not leaving groups)
      if (group.state !== 'settled') continue;

      const groupIndividuals = this.individualManager.getGroupIndividuals(group.id);
      if (!groupIndividuals) {
        // Initialize group individuals tracking
        this.individualManager.initializeGroupIndividuals(group.id, group.size);
        continue;
      }

      const lastSpawnTime = this.lastIndividualSpawnTime.get(group.id) || 0;
      
      // Check if it's time to dispatch a new individual (leave group)
      if (now - lastSpawnTime >= this.individualSpawnInterval && 
          groupIndividuals.leftGroupCount < groupIndividuals.maxIndividuals) {
        
        const individual = this.individualManager.dispatchIndividual(
          group.id, 
          group.position
        );
        
        if (individual) {
          this.lastIndividualSpawnTime.set(group.id, now);
          Logger.info('GAME', 'Individual dispatched from group', { 
            groupId: group.id, 
            individualId: individual.id 
          });
        }
      }
    }
  }

  private checkGroupLeavingConditions(): void {
    for (const group of this.state.groups) {
      if (group.state === 'settled' && this.shouldLeaveSettlement(group)) {
        // Unsettle tiles immediately when leaving starts
        this.groupBehavior.unsettleGroup(group);
        setGroupState(group, 'leaving');
        Logger.info('GAME', 'Group leaving - all individuals have left exactly once', { groupId: group.id });
      }
    }
  }

  
  private moveGroupTowards(group: PeopleGroup, target: Vector2, deltaTime: number): boolean {
    const oldPos = { ...group.position };
    const speed = group.speed * this.config.groupSpeed;
    const newPos = moveTowards(group.position, target, speed, deltaTime / 1000);
    
    // Simple movement - just move towards target
    group.position = newPos;
    group.previousPosition = oldPos;
    updateGroupFacing(group);
    
    // Return true only if the group has reached the target
    return newPos.x === target.x && newPos.y === target.y;
  }

  
  private findRandomWalkablePosition(startPos: Vector2): Vector2 {
    const attempts = 10;
    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 2 + Math.random() * 8; // Random walk distance
      const targetX = startPos.x + Math.cos(angle) * distance;
      const targetY = startPos.y + Math.sin(angle) * distance;
      
      // Check if position is on sand and within bounds
      const testPos = { x: targetX, y: targetY };
      if (this.isPositionOnSand(testPos) && 
          targetX >= 0 && targetX < this.terrainMap.width &&
          targetY >= 0 && targetY < this.terrainMap.height) {
        return testPos;
      }
    }
    
    // Fallback to current position
    return startPos;
  }

  private findBestSettlementPosition(group: PeopleGroup): Vector2 | null {
    const searchRadius = 15; // Search within 15 tiles
    const currentPos = group.position;
    let bestPosition: Vector2 | null = null;
    let bestScore = -Infinity;

    // Search in a spiral pattern from current position
    for (let radius = 1; radius <= searchRadius; radius++) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
        const testX = Math.round(currentPos.x + Math.cos(angle) * radius);
        const testY = Math.round(currentPos.y + Math.sin(angle) * radius);
        
        // Check bounds and sand tile
        const testPos = { x: testX, y: testY };
        if (testX < 0 || testX >= this.terrainMap.width || 
            testY < 0 || testY >= this.terrainMap.height ||
            !this.isPositionOnSand(testPos)) {
          continue;
        }

        // Calculate settlement score
        let score = 0;
        
        // Base score for being a sand tile
        score += 10;
        
        // Distance penalty (prefer closer tiles)
        const distance = Math.sqrt(Math.pow(testX - currentPos.x, 2) + Math.pow(testY - currentPos.y, 2));
        score -= distance * 2;
        
        // Settlement requirements bonus
        if (this.groupBehavior.canSettle(testX, testY, group.size, group.id)) {
          score += 100; // Huge bonus for tiles that meet requirements
        }
        
        // For small groups, bonus for being near other groups
        if (group.size <= 3) {
          const nearbyCount = this.countNearbyGroups(testX, testY, 3);
          if (nearbyCount > 0 && nearbyCount <= 3) {
            score += nearbyCount * 20; // Bonus for having 1-3 nearby groups
          }
        }
        
        // For big groups, bonus for being away from others
        if (group.size > 3) {
          const nearbyCount = this.countNearbyGroups(testX, testY, 5);
          if (nearbyCount === 0) {
            score += 50; // Bonus for isolation
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestPosition = { x: testX, y: testY };
        }
      }
    }
    
    return bestPosition;
  }

  private countNearbyGroups(tileX: number, tileY: number, radius: number): number {
    let count = 0;
    for (const group of this.state.groups) {
      if (group.state === 'settled') { // Only count settled groups
        const distance = Math.sqrt(Math.pow(group.position.x - tileX, 2) + Math.pow(group.position.y - tileY, 2));
        if (distance <= radius) {
          count++;
        }
      }
    }
    return count;
  }

  private shouldLeaveSettlement(group: PeopleGroup): boolean {
    // Check if all individuals have returned
    return this.individualManager.canGroupLeave(group.id);
  }

  private findClosestSandTile(from: Vector2): Vector2 | null {
    let closestTile: Vector2 | null = null;
    let minDistance = Infinity;
    
    // Search through the terrain map for sand tiles
    this.terrainMap.tiles.forEach((terrainType, key) => {
      if (terrainType === 'sand') {
        const [row, col] = key.split(',').map(Number);
        const tilePos = { x: col + 0.5, y: row + 0.5 };
        const dist = distance(from, tilePos);
        
        if (dist < minDistance) {
          minDistance = dist;
          closestTile = tilePos;
        }
      }
    });
    
    return closestTile;
  }

  private isOnSand(group: PeopleGroup): boolean {
    const tile = this.gridManager.getTile(Math.floor(group.position.x), Math.floor(group.position.y));
    return tile?.type === 'path'; // Sand tiles are mapped to 'path' in grid
  }

  private isPositionOnSand(position: Vector2): boolean {
    const tile = this.gridManager.getTile(Math.floor(position.x), Math.floor(position.y));
    return tile?.type === 'path'; // Sand tiles are mapped to 'path' in grid
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
