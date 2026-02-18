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
  Staff,
  Vector2,
  TransactionType,
  BuildingCosts,
  BUILDING_COSTS,
  MONEY_THRESHOLDS,
  STATE_THRESHOLDS,
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

function findGrassTileNextToSand(terrainMap: TerrainMap, fromRow: number, fromCol: number): { row: number; col: number } | null {
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;
  
  terrainMap.tiles.forEach((type, key) => {
    if (type !== 'grass') return;
    const [row, col] = key.split(',').map(Number);
    
    // Check if this grass tile is adjacent to any sand tile
    const neighbors = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ];
    
    const hasSandNeighbor = neighbors.some(n => {
      if (n.r < 0 || n.c < 0 || n.r >= terrainMap.height || n.c >= terrainMap.width) return false;
      const neighborType = terrainMap.tiles.get(tileKey(n.r, n.c));
      return neighborType === 'sand';
    });
    
    if (hasSandNeighbor) {
      const dist = (row - fromRow) ** 2 + (col - fromCol) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = { row, col };
      }
    }
  });
  
  return best;
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

export function getBuildingCapacity(buildingName: string): number {
  switch (buildingName.toLowerCase()) {
    case 'shop':
      return 8;
    case 'mall':
      return 20;
    case 'restaurant':
      return 7;
    case 'beach bar':
    case 'sun lounger':
    default:
      return 4;
  }
}

export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private lastSpawnCheck: number = 0;
  private eventListeners: EventCallback[] = [];
  private establishmentGridPositions: Map<string, { gridX: number; gridY: number }> = new Map();
  private gridManager: GridManager;
  private pathfinder: Pathfinder;
  private terrainMap?: TerrainMap;
  /** Spawn tile centers (x, y) for exit and spawn. */
  private spawnTiles: Vector2[] = [];

  constructor(config: Partial<GameConfig> = {}, terrainMap?: TerrainMap) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const width = terrainMap ? terrainMap.width : 20;
    const height = terrainMap ? terrainMap.height : 20;
    this.gridManager = new GridManager(width, height);
    this.pathfinder = new Pathfinder();
    this.terrainMap = terrainMap;
    this.state = terrainMap ? this.createInitialStateFromTerrain(terrainMap) : this.createInitialStateFallback();
  }

  // Money Management Methods
  public getMoney(): number {
    return this.state.money;
  }

  public canAfford(cost: number): boolean {
    return this.state.money >= cost;
  }

  public addMoney(amount: number, transactionType: TransactionType): void {
    this.state.money += amount;
    if (transactionType === 'customer_revenue') {
      this.state.totalRevenue += amount;
    }
    this.emit({ type: 'MONEY_CHANGED', amount, transactionType, newBalance: this.state.money });
    this.checkWinLoseConditions();
  }

  public deductMoney(amount: number, transactionType: TransactionType): boolean {
    if (!this.canAfford(amount)) {
      return false;
    }
    this.state.money -= amount;
    if (transactionType === 'daily_operations' || transactionType === 'building_purchase') {
      this.state.totalExpenses += amount;
    }
    this.emit({ type: 'MONEY_CHANGED', amount: -amount, transactionType, newBalance: this.state.money });
    this.checkWinLoseConditions();
    return true;
  }

  public processDailyCosts(): void {
    let totalDailyCost = 0;
    
    // Calculate costs from all staff members
    this.state.staff.forEach(staff => {
      totalDailyCost += staff.dailyCost;
    });
    
    if (totalDailyCost > 0) {
      this.deductMoney(totalDailyCost, 'daily_operations');
    }
  }

  public checkWinLoseConditions(): void {
    if (this.state.money <= MONEY_THRESHOLDS.LOSE_THRESHOLD && !this.state.isGameOver) {
      this.state.isGameOver = true;
      this.state.gameWon = false;
      this.emit({ type: 'GAME_OVER', won: false, reason: `Money fell below $${MONEY_THRESHOLDS.LOSE_THRESHOLD}` });
    } else if (this.state.money >= MONEY_THRESHOLDS.WIN_THRESHOLD && !this.state.isGameOver) {
      this.state.isGameOver = true;
      this.state.gameWon = true;
      this.emit({ type: 'GAME_OVER', won: true, reason: `Money reached $${MONEY_THRESHOLDS.WIN_THRESHOLD}` });
    }
  }

  private getEstablishmentName(est: Establishment): string {
    // This is a placeholder - in a real implementation, you'd store the building type
    // For now, we'll infer from capacity
    if (est.maxCapacity <= 4) return 'beach bar';
    if (est.maxCapacity <= 8) return 'restaurant';
    return 'mall';
  }

  // Staff Management Methods
  public createStaffForEstablishment(establishmentId: string): Staff[] {
    const establishment = this.state.establishments.find(e => e.id === establishmentId);
    if (!establishment) {
      return [];
    }

    const buildingCosts = BUILDING_COSTS[establishment.buildingType.toLowerCase()];
    if (!buildingCosts) {
      return [];
    }

    const newStaff: Staff[] = [];
    let totalStaffCost = 0;

    buildingCosts.staffRequired.forEach(staffReq => {
      for (let i = 0; i < staffReq.count; i++) {
        const staff: Staff = {
          id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${staffReq.occupation} ${i + 1}`,
          occupation: staffReq.occupation,
          establishmentId: establishmentId,
          dailyCost: staffReq.dailyCost,
          efficiency: 0.8 + Math.random() * 0.4, // 0.8 to 1.2 efficiency
        };
        newStaff.push(staff);
        totalStaffCost += staffReq.dailyCost;
      }
    });

    // Add staff to game state
    this.state.staff.push(...newStaff);
    
    // Update establishment with staff IDs and daily cost
    establishment.staffIds = newStaff.map(s => s.id);
    establishment.dailyStaffCost = totalStaffCost;

    return newStaff;
  }

  public getStaffForEstablishment(establishmentId: string): Staff[] {
    return this.state.staff.filter(s => s.establishmentId === establishmentId);
  }

  public getAllStaff(): Staff[] {
    return this.state.staff;
  }

  public removeStaff(staffId: string): boolean {
    const staffIndex = this.state.staff.findIndex(s => s.id === staffId);
    if (staffIndex === -1) return false;

    const staff = this.state.staff[staffIndex];
    
    // Remove staff from game state
    this.state.staff.splice(staffIndex, 1);
    
    // Update establishment
    const establishment = this.state.establishments.find(e => e.id === staff.establishmentId);
    if (establishment) {
      establishment.staffIds = establishment.staffIds.filter(id => id !== staffId);
      establishment.dailyStaffCost = establishment.staffIds
        .map(id => this.state.staff.find(s => s.id === id)?.dailyCost || 0)
        .reduce((sum, cost) => sum + cost, 0);
    }

    return true;
  }

  private createInitialStateFallback(): GameState {
    this.gridManager.initializeEmpty();
    return {
      establishments: [],
      groups: [],
      staff: [],
      time: 0,
      isPaused: false,
      stats: { totalGroupsSpawned: 0, totalGroupsDespawned: 0, totalVisits: 0, totalRevenue: 0 },
      money: MONEY_THRESHOLDS.STARTING_MONEY,
      totalRevenue: 0,
      totalExpenses: 0,
      dayCount: 1,
      isGameOver: false,
      gameWon: false,
    };
  }

  private createInitialStateFromTerrain(terrainMap: TerrainMap): GameState {
    this.gridManager.initializeFromTerrainMap(terrainMap);
    
    // Initialize empty state first
    const initialState: GameState = {
      establishments: [],
      groups: [],
      staff: [],
      time: 0,
      isPaused: false,
      stats: { totalGroupsSpawned: 0, totalGroupsDespawned: 0, totalVisits: 0, totalRevenue: 0 },
      money: MONEY_THRESHOLDS.STARTING_MONEY,
      totalRevenue: 0,
      totalExpenses: 0,
      dayCount: 1,
      isGameOver: false,
      gameWon: false,
    };
    
    // Set state before calling tryBuildEstablishment
    this.state = initialState;
    
    // Find first grass tile next to a sand tile for initial establishment
    const grassTile = findGrassTileNextToSand(terrainMap, Math.floor(terrainMap.height / 2), Math.floor(terrainMap.width / 2));
    if (!grassTile) {
      return initialState;
    }

    // Build initial establishment using tryBuildEstablishment (1x1 tile)
    const building = { icon: '🏖️', name: 'Beach Bar', price: '$0' };
    const success = this.tryBuildEstablishment(grassTile.row, grassTile.col, building, 0);
    
    if (success) {
      // Create spawn tile 10 tiles away from the establishment
      const spawnCandidates = findGrassTilesAboutDistanceAway(terrainMap, grassTile.row, grassTile.col, 10, 3);
      if (spawnCandidates.length > 0) {
        const spawn = spawnCandidates[Math.floor(Math.random() * spawnCandidates.length)];
        const sx = spawn.col;
        const sy = spawn.row;
        this.gridManager.setTileType(sx, sy, 'spawn');
        this.spawnTiles.push({ x: sx + 0.5, y: sy + 0.5 });
      }
    }
    
    return this.getState();
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

  tryBuildEstablishment(
    row: number,
    col: number,
    _building: { icon: string; name: string; price: string },
    rotation: number = 0
  ): boolean {
    if (!this.terrainMap) return false;

    // Check if player can afford the building
    const buildingCosts = BUILDING_COSTS[_building.name.toLowerCase()];
    if (!buildingCosts || !this.canAfford(buildingCosts.buildCost)) {
      return false;
    }

    if (row < 0 || col < 0 || row >= this.terrainMap.height || col >= this.terrainMap.width) {
      return false;
    }

    const terrainType = this.terrainMap.tiles.get(tileKey(row, col)) || 'water';
    if (terrainType !== 'grass') {
      return false;
    }

    const existingTile = this.gridManager.getTile(col, row);
    if (existingTile?.type === 'building' || existingTile?.type === 'entrance') {
      return false;
    }

    const isOccupied = this.state.establishments.some((e) => {
      if (!e.gridPosition) return false;
      return Math.floor(e.gridPosition.x) === col && Math.floor(e.gridPosition.y) === row;
    });
    if (isOccupied) {
      return false;
    }

    const gridX = col;
    const gridY = row;
    const worldPos = this.gridToWorld(gridX + 0.5, gridY + 0.5);

    const est = createEstablishment(worldPos, {
      maxCapacity: getBuildingCapacity(_building.name),
      attractionRadius: 25,
      attractionPower: 100,
      serviceTime: this.config.defaultServiceTime,
    });

    est.gridPosition = { x: gridX, y: gridY };
    est.buildingType = _building.name; // Store the actual building type

    // Place entrance based on rotation (0=North, 1=West, 2=South, 3=East)
    // For larger establishments, entrance should be placed relative to center of footprint
    const size = est.maxCapacity <= 4 ? 1 : est.maxCapacity <= 8 ? 2 : 3;
    const sizeOffset = Math.floor(size / 2);
    const centerRow = row + sizeOffset;
    const centerCol = col + sizeOffset;
    
    const entranceDirections = [
      { r: centerRow - 1, c: centerCol }, // North
      { r: centerRow, c: centerCol - 1 }, // West
      { r: centerRow + 1, c: centerCol }, // South
      { r: centerRow, c: centerCol + 1 }, // East
    ];
    
    const entranceDir = entranceDirections[rotation % 4];
    let entranceRow = entranceDir.r;
    let entranceCol = entranceDir.c;

    // Validate entrance position
    if (entranceRow < 0 || entranceCol < 0 || entranceRow >= this.terrainMap.height || entranceCol >= this.terrainMap.width) {
      return false;
    }
    
    if (!this.gridManager.isWalkable(entranceCol, entranceRow)) {
      return false;
    }

    est.entrance = { x: entranceCol + 0.5, y: entranceRow + 0.5 };
    est.isOpen = true;

    // Deduct building cost
    this.deductMoney(buildingCosts.buildCost, 'building_purchase');

    this.state.establishments.push(est);
    this.establishmentGridPositions.set(est.id, { gridX, gridY });
    this.gridManager.markEstablishmentFootprint(est, est.entrance);
            
    // Create staff for the new establishment
    this.createStaffForEstablishment(est.id);

    this.emit({ type: 'STATE_CHANGED', establishmentId: est.id, from: 'deserted', to: est.state as EstablishmentState });
    return true;
  }

  advanceDay(): void {
    if (this.state.isGameOver) return;
    
    this.state.dayCount++;
    this.processDailyCosts();
    
    // Emit event for UI updates
    this.emit({ type: 'MONEY_CHANGED', amount: 0, transactionType: 'daily_operations', newBalance: this.state.money });
  }

  update(deltaTime: number): void {
    if (this.state.isPaused) return;
    this.state.time += deltaTime;
    
    // Check for day advancement (every 60 seconds = 1 game day)
    const dayLength = 60000; // 60 seconds in milliseconds
    if (Math.floor(this.state.time / dayLength) > Math.floor((this.state.time - deltaTime) / dayLength)) {
      this.advanceDay();
    }
    
    this.spawnPhase(deltaTime);
    this.decisionPhase();
    this.pathfindingPhase();
    this.movementPhase(deltaTime);
    this.entryPhase();
    this.visitPhase(deltaTime);
    this.leavePhase();
    this.cleanupPhase();
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
      } else {
        // If no suitable establishment is found, make the group wander randomly
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
      const occ = (est.currentOccupancy / est.maxCapacity) * 100;
      
      // Update establishment state based on occupancy
      const previousState = est.state;
      if (occ >= STATE_THRESHOLDS.crowded) {
        est.state = 'crowded';
      } else if (occ >= STATE_THRESHOLDS.busy) {
        est.state = 'busy';
      } else if (occ >= STATE_THRESHOLDS.visited) {
        est.state = 'visited';
      } else {
        est.state = 'closed';
      }
      
      // Emit state change event if state changed
      if (previousState !== est.state) {
        this.emit({ type: 'STATE_CHANGED', establishmentId: est.id, from: previousState, to: est.state });
      }
      
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
        
        // Add customer revenue based on establishment type
        const buildingCosts = BUILDING_COSTS[est.buildingType.toLowerCase()];
        if (buildingCosts) {
          const customerRevenue = buildingCosts.customerSpending * group.size;
          this.addMoney(customerRevenue, 'customer_revenue');
          
          // Update establishment's total revenue
          est.totalRevenue += customerRevenue;
        }
        
        group.targetPosition = this.getExitSpawnTile();
        setGroupState(group, 'leaving');
        this.emit({ type: 'GROUP_LEFT', groupId: group.id, establishmentId: est.id, reason });
        group.currentEstablishment = null;
      }
    }
  }

  private cleanupPhase(): void {
    const toRemove: string[] = [];
    for (const group of this.state.groups) {
      if (group.state === 'despawned') toRemove.push(group.id), this.state.stats.totalGroupsDespawned++, this.emit({ type: 'GROUP_DESPAWNED', groupId: group.id });
      if (group.state === 'leaving' && isOutOfBounds(group, this.gridManager.getDimensions().width, this.gridManager.getDimensions().height)) toRemove.push(group.id), this.state.stats.totalGroupsDespawned++, this.emit({ type: 'GROUP_DESPAWNED', groupId: group.id });
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
