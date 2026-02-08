/**
 * Game Engine - initializes from TerrainMap: center sand, establishment on nearest grass, spawn ~10 away.
 */

import {
  GameState,
  GameConfig,
  GameEvent,
  DEFAULT_CONFIG,
  PeopleGroup,
  Establishment,
  EstablishmentState,
  Vector2,
} from '../types';
import {
  createEstablishment,
  updateEstablishmentState,
  hasCapacity,
  addOccupants,
  removeOccupants,
  addRevenue,
  getAttractionMultiplier,
} from './establishment';
import {
  createPeopleGroup,
  setGroupState,
  isOutOfBounds,
  updateGroupFacing,
} from './peopleGroup';
import { distance, moveTowards, clamp } from './utils';
import { GridManager } from './GridManager';
import { Pathfinder } from './Pathfinder';
import { TerrainMap } from '../types/environment';
import { tileKey } from '../utils/terrainGeneration';
import { CANVAS_CONFIG } from '../canvas/config';

export type EventCallback = (event: GameEvent) => void;

function findSandTileForCenter(terrainMap: TerrainMap): { row: number; col: number } | null {
  const centerRow = terrainMap.height / 2;
  const centerCol = terrainMap.width / 2;
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;
  terrainMap.tiles.forEach((type, key) => {
    if (type !== 'sand') return;
    const [row, col] = key.split(',').map(Number);
    const dist = (row - centerRow) ** 2 + (col - centerCol) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = { row, col };
    }
  });
  return best;
}

function findNearestGrassTile(terrainMap: TerrainMap, fromRow: number, fromCol: number): { row: number; col: number } | null {
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;
  terrainMap.tiles.forEach((type, key) => {
    if (type !== 'grass') return;
    const [row, col] = key.split(',').map(Number);
    const dist = (row - fromRow) ** 2 + (col - fromCol) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = { row, col };
    }
  });
  return best;
}

/** Check if 2x2 block at (row, col) is all walkable (grass or sand). */
function is2x2Walkable(terrainMap: TerrainMap, row: number, col: number): boolean {
  for (let dr = 0; dr <= 1; dr++) {
    for (let dc = 0; dc <= 1; dc++) {
      const t = terrainMap.tiles.get(tileKey(row + dr, col + dc));
      if (t !== 'grass' && t !== 'sand') return false;
    }
  }
  return true;
}

/** Find grass tiles approximately 10 tiles away from (centerRow, centerCol). */
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
  private lastSpawnCheck: number = 0;
  private eventListeners: EventCallback[] = [];
  private establishmentGridPositions: Map<string, { gridX: number; gridY: number }> = new Map();
  private gridManager: GridManager;
  private pathfinder: Pathfinder;
  /** Spawn tile centers (x, y) for exit and spawn. */
  private spawnTiles: Vector2[] = [];

  constructor(config: Partial<GameConfig> = {}, terrainMap?: TerrainMap) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const width = terrainMap ? terrainMap.width : 20;
    const height = terrainMap ? terrainMap.height : 20;
    this.gridManager = new GridManager(width, height);
    this.pathfinder = new Pathfinder();
    this.state = terrainMap ? this.createInitialStateFromTerrain(terrainMap) : this.createInitialStateFallback();
  }

  private createInitialStateFallback(): GameState {
    this.gridManager.initializeEmpty();
    return {
      establishments: [],
      groups: [],
      time: 0,
      isPaused: false,
      stats: { totalGroupsSpawned: 0, totalGroupsDespawned: 0, totalVisits: 0, totalRevenue: 0 },
    };
  }

  private createInitialStateFromTerrain(terrainMap: TerrainMap): GameState {
    this.gridManager.initializeFromTerrainMap(terrainMap);
    const establishments: Establishment[] = [];
    const sandTile = findSandTileForCenter(terrainMap);
    const centerRow = sandTile?.row ?? terrainMap.height / 2;
    const centerCol = sandTile?.col ?? terrainMap.width / 2;

    const grassTile = findNearestGrassTile(terrainMap, centerRow, centerCol);
    if (!grassTile) {
      return {
        establishments: [],
        groups: [],
        time: 0,
        isPaused: false,
        stats: { totalGroupsSpawned: 0, totalGroupsDespawned: 0, totalVisits: 0, totalRevenue: 0 },
      };
    }

    let estRow = grassTile.row;
    let estCol = grassTile.col;
    if (!is2x2Walkable(terrainMap, estRow, estCol)) {
      const candidates: Array<{ row: number; col: number }> = [];
      terrainMap.tiles.forEach((type, key) => {
        if (type !== 'grass') return;
        const [r, c] = key.split(',').map(Number);
        if (is2x2Walkable(terrainMap, r, c)) candidates.push({ row: r, col: c });
      });
      const byDist = candidates.sort(
        (a, b) =>
          (a.row - centerRow) ** 2 + (a.col - centerCol) ** 2 -
          ((b.row - centerRow) ** 2 + (b.col - centerCol) ** 2)
      );
      if (byDist.length) {
        estRow = byDist[0].row;
        estCol = byDist[0].col;
      }
    }

    const gridCenterX = estCol + 1;
    const gridCenterY = estRow + 1;
    const worldPos = this.gridToWorld(gridCenterX, gridCenterY);
    const est = createEstablishment(worldPos, {
      maxCapacity: 8,
      attractionRadius: 25,
      attractionPower: 100,
      serviceTime: this.config.defaultServiceTime,
    });
    est.gridPosition = { x: gridCenterX, y: gridCenterY };
    const adj = [
      [estRow - 1, estCol],
      [estRow, estCol - 1],
      [estRow + 2, estCol],
      [estRow + 2, estCol + 1],
      [estRow, estCol + 2],
      [estRow + 1, estCol + 2],
      [estRow - 1, estCol + 1],
      [estRow + 1, estCol - 1],
    ];
    let entranceRow = estRow;
    let entranceCol = estCol;
    for (const [r, c] of adj) {
      if (r >= 0 && r < terrainMap.height && c >= 0 && c < terrainMap.width && this.gridManager.isWalkable(c, r)) {
        entranceRow = r;
        entranceCol = c;
        break;
      }
    }
    est.entrance = { x: entranceCol + 0.5, y: entranceRow + 0.5 };
    establishments.push(est);
    this.establishmentGridPositions.set(est.id, { gridX: gridCenterX, gridY: gridCenterY });
    this.gridManager.markEstablishmentFootprint(est, est.entrance);
    est.isOpen = true;

    const spawnCandidates = findGrassTilesAboutDistanceAway(terrainMap, estRow, estCol, 10, 3);
    if (spawnCandidates.length > 0) {
      const spawn = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
      const sx = spawn.col;
      const sy = spawn.row;
      this.gridManager.setTileType(sx, sy, 'spawn');
      this.spawnTiles.push({ x: sx + 0.5, y: sy + 0.5 });
    }

    return {
      establishments,
      groups: [],
      time: 0,
      isPaused: false,
      stats: { totalGroupsSpawned: 0, totalGroupsDespawned: 0, totalVisits: 0, totalRevenue: 0 },
    };
  }

  private gridToWorld(gridX: number, gridY: number): Vector2 {
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    return {
      x: (gridX - gridY) * (TILE_WIDTH / 2),
      y: (gridX + gridY) * (TILE_HEIGHT / 2),
    };
  }

  getExitSpawnTile(): Vector2 {
    if (this.spawnTiles.length === 0) return { x: 0.5, y: 0.5 };
    return this.spawnTiles[Math.floor(Math.random() * this.spawnTiles.length)];
  }

  onEvent(callback: EventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      const i = this.eventListeners.indexOf(callback);
      if (i > -1) this.eventListeners.splice(i, 1);
    };
  }

  private emit(event: GameEvent): void {
    this.eventListeners.forEach(cb => cb(event));
  }

  getState(): GameState {
    return {
      ...this.state,
      establishments: this.state.establishments.map(e => ({ ...e })),
      groups: this.state.groups.map(g => ({
        ...g,
        position: { ...g.position },
        previousPosition: { ...g.previousPosition },
      })),
      stats: { ...this.state.stats },
    };
  }

  getGridManager(): GridManager {
    return this.gridManager;
  }

  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
  }

  update(deltaTime: number): void {
    if (this.state.isPaused) return;
    this.state.time += deltaTime;
    this.spawnPhase(deltaTime);
    this.decisionPhase();
    this.pathfindingPhase();
    this.movementPhase(deltaTime);
    this.entryPhase();
    this.visitPhase(deltaTime);
    this.leavePhase();
    this.cleanupPhase();
    this.stateUpdatePhase();
  }

  private spawnPhase(deltaTime: number): void {
    for (const group of this.state.groups) {
      if (group.state === 'spawning' && this.state.time - group.spawnTime > 300) {
        setGroupState(group, 'idle');
      }
    }
    this.lastSpawnCheck += deltaTime;
    if (this.lastSpawnCheck < this.config.spawnInterval) return;
    if (this.state.groups.length >= this.config.maxGroups) return;
    this.lastSpawnCheck = 0;
    if (Math.random() > this.config.spawnProbability) return;
    if (this.spawnTiles.length === 0) return;
    const spawnPos = this.spawnTiles[Math.floor(Math.random() * this.spawnTiles.length)];
    const group = createPeopleGroup(spawnPos, this.config);
    group.spawnTime = this.state.time;
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;
    this.emit({ type: 'GROUP_SPAWNED', group });
  }

  private decisionPhase(): void {
    const pathTiles = this.spawnTiles.length ? this.spawnTiles : [{ x: 0.5, y: 0.5 }];
    for (const group of this.state.groups) {
      if (group.state !== 'idle' && group.state !== 'wandering') continue;
      const target = this.findBestEstablishment(group);
      if (target) {
        group.currentEstablishment = target.id;
        group.targetPosition = target.entrance || null;
        setGroupState(group, 'seeking');
      } else if (group.state === 'idle') {
        const pt = pathTiles[Math.floor(Math.random() * pathTiles.length)];
        group.targetPosition = { ...pt };
        setGroupState(group, 'wandering');
      }
    }
  }

  private findBestEstablishment(group: PeopleGroup): Establishment | null {
    let best: Establishment | null = null;
    let bestScore = 0;
    for (const est of this.state.establishments) {
      if (!est.isOpen || !hasCapacity(est, group.size)) continue;
      const pos = this.establishmentGridPositions.get(est.id);
      if (!pos) continue;
      const dist = distance(group.position, { x: pos.gridX, y: pos.gridY });
      if (dist > est.attractionRadius) continue;
      const mult = getAttractionMultiplier(est);
      const score = est.attractionPower * mult * (1 - dist / est.attractionRadius) * (group.desire / 100);
      if (score > bestScore) {
        bestScore = score;
        best = est;
      }
    }
    return best;
  }

  private pathfindingPhase(): void {
    const pathTiles = this.spawnTiles.length ? this.spawnTiles : [{ x: 0.5, y: 0.5 }];
    for (const group of this.state.groups) {
      if (group.state !== 'seeking' && group.state !== 'wandering' && group.state !== 'leaving') continue;
      if (group.path && group.path.length > 0) continue;
      if (!group.targetPosition) continue;
      let targetPos = group.targetPosition;
      if (group.state === 'seeking' && group.currentEstablishment) {
        const est = this.state.establishments.find(e => e.id === group.currentEstablishment);
        if (!est?.entrance) {
          group.state = 'wandering';
          group.currentEstablishment = null;
          group.targetPosition = pathTiles[Math.floor(Math.random() * pathTiles.length)];
          continue;
        }
        targetPos = est.entrance;
      } else if (group.state === 'leaving') {
        targetPos = this.getExitSpawnTile();
        group.targetPosition = targetPos;
      }
      const path = this.pathfinder.findPath(
        group.position,
        targetPos,
        this.gridManager.getAllTiles(),
        (x, y) => this.gridManager.getNeighbors(x, y)
      );
      if (path) {
        group.path = path;
        group.currentWaypoint = 0;
      } else {
        if (group.state === 'seeking') {
          group.state = 'wandering';
          group.currentEstablishment = null;
          group.targetPosition = pathTiles[Math.floor(Math.random() * pathTiles.length)];
        } else {
          group.state = 'idle';
          group.targetPosition = null;
        }
      }
    }
  }

  private movementPhase(deltaTime: number): void {
    const dt = deltaTime / 1000;
    const dims = this.gridManager.getDimensions();
    for (const group of this.state.groups) {
      if (!['seeking', 'wandering', 'leaving'].includes(group.state)) continue;
      const prevPos = { ...group.position };
      if (group.path && group.path.length > 0) {
        const wp = group.path[group.currentWaypoint];
        group.position = moveTowards(group.position, wp, group.speed, dt);
        if (distance(group.position, wp) < 0.3) {
          group.currentWaypoint++;
          if (group.currentWaypoint >= group.path.length) {
            if (group.state === 'seeking') {
              const tile = this.gridManager.getTile(Math.floor(group.position.x), Math.floor(group.position.y));
              if (tile?.type === 'entrance') setGroupState(group, 'entering');
              else setGroupState(group, 'idle'), (group.currentEstablishment = null);
            } else if (group.state === 'wandering') setGroupState(group, 'idle');
            else if (group.state === 'leaving') {
              const tile = this.gridManager.getTile(Math.floor(group.position.x), Math.floor(group.position.y));
              if (tile?.type === 'spawn') setGroupState(group, 'despawned');
              else group.targetPosition = this.getExitSpawnTile(), (group.path = null);
            }
            group.path = null;
            group.currentWaypoint = 0;
          }
        }
      } else if (group.targetPosition) {
        group.position = moveTowards(group.position, group.targetPosition, group.speed, dt);
        if (distance(group.position, group.targetPosition) < 0.5) {
          if (group.state === 'seeking') setGroupState(group, 'entering');
          else if (group.state === 'wandering') setGroupState(group, 'idle'), (group.targetPosition = null);
          else if (group.state === 'leaving') setGroupState(group, 'despawned');
        }
      }
      group.previousPosition = prevPos;
      updateGroupFacing(group);
    }
  }

  private entryPhase(): void {
    const pathTiles = this.spawnTiles.length ? this.spawnTiles : [{ x: 0.5, y: 0.5 }];
    for (const group of this.state.groups) {
      if (group.state !== 'entering' || !group.currentEstablishment) continue;
      const est = this.state.establishments.find(e => e.id === group.currentEstablishment);
      if (!est) {
        setGroupState(group, 'idle');
        group.currentEstablishment = null;
        continue;
      }
      if (!hasCapacity(est, group.size)) {
        setGroupState(group, 'wandering');
        group.currentEstablishment = null;
        group.targetPosition = pathTiles[Math.floor(Math.random() * pathTiles.length)];
        continue;
      }
      addOccupants(est, group.size);
      group.timeInEstablishment = 0;
      setGroupState(group, 'visiting');
      this.state.stats.totalVisits++;
      this.emit({ type: 'GROUP_ENTERED', groupId: group.id, establishmentId: est.id });
    }
  }

  private visitPhase(deltaTime: number): void {
    for (const group of this.state.groups) {
      if (group.state !== 'visiting' || !group.currentEstablishment) continue;
      const est = this.state.establishments.find(e => e.id === group.currentEstablishment);
      if (!est) continue;
      group.timeInEstablishment += deltaTime;
      const moneySpent = (this.config.moneyPerSecond * deltaTime) / 1000;
      group.money -= moneySpent;
      addRevenue(est, moneySpent * group.size);
      this.state.stats.totalRevenue += moneySpent * group.size;
      const occ = (est.currentOccupancy / est.maxCapacity) * 100;
      let satChange = -this.config.satisfactionDecayRate * (deltaTime / 1000);
      if (occ > 80) satChange *= 2;
      if (occ < 50) satChange *= 0.5;
      group.satisfaction = clamp(group.satisfaction + satChange, 0, 100);
      group.patience -= (deltaTime / 1000) * 0.5;
    }
  }

  private leavePhase(): void {
    for (const group of this.state.groups) {
      if (group.state !== 'visiting' || !group.currentEstablishment) continue;
      const est = this.state.establishments.find(e => e.id === group.currentEstablishment);
      if (!est) continue;
      let leave = false;
      let reason = '';
      if (group.timeInEstablishment >= est.serviceTime) leave = true, reason = 'Finished visit';
      else if (group.satisfaction < 20) leave = true, reason = 'Not satisfied';
      else if (group.money < 0) leave = true, reason = 'Out of money';
      else if (group.patience <= 0) leave = true, reason = 'Lost patience';
      else if (!est.isOpen) leave = true, reason = 'Closed';
      else if (Math.random() < 0.001) leave = true, reason = 'Decided to leave';
      if (leave) {
        removeOccupants(est, group.size);
        group.targetPosition = this.getExitSpawnTile();
        setGroupState(group, 'leaving');
        this.emit({ type: 'GROUP_LEFT', groupId: group.id, establishmentId: est.id, reason });
        group.currentEstablishment = null;
      }
    }
  }

  private cleanupPhase(): void {
    const dims = this.gridManager.getDimensions();
    const toRemove: string[] = [];
    for (const group of this.state.groups) {
      if (group.state === 'despawned') toRemove.push(group.id), this.state.stats.totalGroupsDespawned++, this.emit({ type: 'GROUP_DESPAWNED', groupId: group.id });
      if (group.state === 'leaving' && isOutOfBounds(group, dims.width, dims.height)) toRemove.push(group.id), this.state.stats.totalGroupsDespawned++, this.emit({ type: 'GROUP_DESPAWNED', groupId: group.id });
    }
    this.state.groups = this.state.groups.filter(g => !toRemove.includes(g.id));
  }

  private stateUpdatePhase(): void {
    for (const est of this.state.establishments) {
      const { changed, previousState } = updateEstablishmentState(est);
      if (changed) this.emit({ type: 'STATE_CHANGED', establishmentId: est.id, from: previousState, to: est.state as EstablishmentState });
    }
  }

  forceSpawn(): void {
    if (this.spawnTiles.length === 0 || this.state.groups.length >= this.config.maxGroups * 2) return;
    const spawnPos = this.spawnTiles[Math.floor(Math.random() * this.spawnTiles.length)];
    const group = createPeopleGroup(spawnPos, this.config);
    group.spawnTime = this.state.time;
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;
    this.emit({ type: 'GROUP_SPAWNED', group });
  }
}
