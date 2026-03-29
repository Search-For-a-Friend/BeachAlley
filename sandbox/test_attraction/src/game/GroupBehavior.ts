import { PeopleGroup, Vector2 } from '../types';
import { TerrainType } from '../types/environment';
import { setGroupState } from './peopleGroup';

export interface GroupBehaviorConfig {
  settlementDurations: {
    individual: { min: number; max: number }; // Short to long range
    smallGroup: { min: number; max: number }; // Shorter range
    bigGroup: { min: number; max: number }; // Long range
  };
  terrainMap?: Map<string, TerrainType>; // Optional terrain map for tide checks
  tideManager?: import('../systems/TideManager').TideManager; // Optional tide manager for wet sand checks
}

// Simple spatial grid for performance optimization
class SpatialGrid {
  private cellSize: number = 10; // 10 tiles per cell
  private grid: Map<string, Vector2[]> = new Map();
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  addGroup(groupId: string, position: Vector2): void {
    const key = this.getCellKey(position.x, position.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push({ x: position.x, y: position.y, id: groupId } as any);
  }
  
  removeGroup(groupId: string, position: Vector2): void {
    const key = this.getCellKey(position.x, position.y);
    const cell = this.grid.get(key);
    if (cell) {
      const index = cell.findIndex(pos => (pos as any).id === groupId);
      if (index !== -1) {
        cell.splice(index, 1);
        if (cell.length === 0) {
          this.grid.delete(key);
        }
      }
    }
  }
  
  getNearbyGroups(position: Vector2, radius: number): Vector2[] {
    const nearby: Vector2[] = [];
    const minCellX = Math.floor((position.x - radius) / this.cellSize);
    const maxCellX = Math.floor((position.x + radius) / this.cellSize);
    const minCellY = Math.floor((position.y - radius) / this.cellSize);
    const maxCellY = Math.floor((position.y + radius) / this.cellSize);
    
    for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
      for (let cellY = minCellY; cellY <= maxCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cell = this.grid.get(key);
        if (cell) {
          nearby.push(...cell);
        }
      }
    }
    
    return nearby.filter(pos => {
      const dx = pos.x - position.x;
      const dy = pos.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }
  
  clear(): void {
    this.grid.clear();
  }
}

export class GroupBehavior {
  private settlementDurations: GroupBehaviorConfig['settlementDurations'];
  private terrainMap?: Map<string, TerrainType>;
  private tideManager?: import('../systems/TideManager').TideManager;
  
  // Add public getter for tideManager
  getTideManager(): import('../systems/TideManager').TideManager | undefined {
    return this.tideManager;
  }
  
  // Add public setter for tideManager
  setTideManager(tideManager: import('../systems/TideManager').TideManager): void {
    this.tideManager = tideManager;
  }
  private occupiedTiles: Set<string> = new Set(); // Track occupied tiles
  private settledGroups: Map<string, Vector2> = new Map(); // groupId -> position
  private settlementAreas: Map<string, Vector2[]> = new Map(); // groupId -> area tiles
  private failedSettlementAttempts: Map<string, number> = new Map(); // groupId -> failed attempts
  private spatialGrid: SpatialGrid = new SpatialGrid();

  constructor(config: GroupBehaviorConfig) {
    this.settlementDurations = config.settlementDurations;
    this.terrainMap = config.terrainMap;
    this.tideManager = config.tideManager;
  }

  /**
   * Get settlement area size based on group size
   */
  private getSettlementAreaSize(groupSize: number): { width: number; height: number } {
    if (groupSize === 1) {
      return { width: 2, height: 1 }; // Single group: 2x1 tiles
    } else if (groupSize <= 3) {
      return { width: 2, height: 2 }; // Small group: 2x2 tiles
    } else {
      return { width: 3, height: 3 }; // Big group: 3x3 tiles
    }
  }

  /**
   * Get all tiles in a settlement area
   */
  private getSettlementAreaTiles(centerX: number, centerY: number, width: number, height: number): Vector2[] {
    const tiles: Vector2[] = [];
    
    // Calculate starting position to center the area
    const startX = centerX - Math.floor(width / 2);
    const startY = centerY - Math.floor(height / 2);
    
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        tiles.push({ x: startX + dx, y: startY + dy });
      }
    }
    
    return tiles;
  }

  /**
   * Generate random settlement duration based on group size
   */
  private generateSettlementDuration(groupSize: number): number {
    if (groupSize === 1) {
      // Single group: most random range (short to long)
      const range = this.settlementDurations.individual;
      return Math.random() * (range.max - range.min) + range.min;
    } else if (groupSize <= 3) {
      // Small group: shorter durations
      const range = this.settlementDurations.smallGroup;
      return Math.random() * (range.max - range.min) + range.min;
    } else {
      // Big group: longer durations
      const range = this.settlementDurations.bigGroup;
      return Math.random() * (range.max - range.min) + range.min;
    }
  }

  /**
   * Check if settlement is possible at the given tile position (multi-tile aware)
   */
  public canSettle(tileX: number, tileY: number, groupSize: number, _groupId: string): boolean {
    const areaSize = this.getSettlementAreaSize(groupSize);
    const areaTiles = this.getSettlementAreaTiles(tileX, tileY, areaSize.width, areaSize.height);
    
    // Check if any tile in the area is already occupied or wet sand
    for (const tile of areaTiles) {
      const tileKey = `${tile.x},${tile.y}`;
      if (this.occupiedTiles.has(tileKey)) {
        return false;
      }
      
      // Check for wet sand (groups can't settle on wet sand)
      if (this.tideManager && this.terrainMap) {
        const terrainType = this.terrainMap.get(tileKey);
        if (terrainType === 'sand' && this.tideManager.isTileWet(tileKey)) {
          return false;
        }
      }
    }
    
    // Apply group size settlement rules (pure check, no side effects)
    if (groupSize === 1) {
      // Single groups can settle anywhere (as long as area is free)
      return true;
    } else if (groupSize <= 3) {
      // Small groups (2-3) settle near other groups (1-3 tiles away)
      const hasNearby = this.hasNearbyGroups(tileX, tileY, 1, 3);
      return hasNearby;
    } else {
      // Big groups (4+) settle away from other groups (at least 5 tiles away)
      return this.hasNoNearbyGroups(tileX, tileY, 5);
    }
  }

  /**
   * Check if there are nearby SETTLED groups within specified distance range (optimized)
   */
  private hasNearbyGroups(tileX: number, tileY: number, minDistance: number, maxDistance: number): boolean {
    const position = { x: tileX, y: tileY };
    const nearbyGroups = this.spatialGrid.getNearbyGroups(position, maxDistance);
    
    return nearbyGroups.some(nearbyPos => {
      const distance = Math.sqrt(Math.pow(nearbyPos.x - tileX, 2) + Math.pow(nearbyPos.y - tileY, 2));
      return distance >= minDistance && distance <= maxDistance;
    });
  }

  /**
   * Check if there are no nearby groups within the specified distance (optimized)
   */
  private hasNoNearbyGroups(tileX: number, tileY: number, minDistance: number): boolean {
    const position = { x: tileX, y: tileY };
    const nearbyGroups = this.spatialGrid.getNearbyGroups(position, minDistance);
    
    return nearbyGroups.length === 0;
  }

  /**
   * Try to settle a group at the given tile position (manages failed attempts)
   */
  public trySettle(group: PeopleGroup, tileX: number, tileY: number, currentTime: number): void {
    // First check if settlement is possible
    if (!this.canSettle(tileX, tileY, group.size, group.id)) {
      // Track failed attempt for small groups
      if (group.size <= 3 && group.size > 1) {
        const attempts = (this.failedSettlementAttempts.get(group.id) || 0) + 1;
        this.failedSettlementAttempts.set(group.id, attempts);
        
        // After 3 failed attempts, allow settling anywhere
        if (attempts >= 3) {
          console.log(`Group ${group.id} (${group.size} people) settling anywhere after ${attempts} failed attempts`);
          // Force settlement by bypassing canSettle
          this.settleGroup(group, tileX, tileY, currentTime);
          return;
        }
      }
      
      // Can't settle, find new target
      group.targetPosition = null;
      setGroupState(group, 'idle');
      return;
    }
    
    // Can settle normally
    this.settleGroup(group, tileX, tileY, currentTime);
  }

  /**
   * Settle a group at the given tile position (multi-tile aware)
   */
  public settleGroup(group: PeopleGroup, tileX: number, tileY: number, currentTime: number): void {
    // Only check basic tile availability, not canSettle (which would reset failed attempts)
    const areaSize = this.getSettlementAreaSize(group.size);
    const areaTiles = this.getSettlementAreaTiles(tileX, tileY, areaSize.width, areaSize.height);
    
    // Check if any tile in area is already occupied
    for (const tile of areaTiles) {
      const tileKey = `${tile.x},${tile.y}`;
      if (this.occupiedTiles.has(tileKey)) {
        return; // Cannot settle here - area occupied
      }
    }

    // Mark group as settled
    const position = { x: tileX, y: tileY };
    this.settledGroups.set(group.id, position);
    this.settlementAreas.set(group.id, areaTiles); // Store settlement area
    
    // Occupy all tiles in the settlement area
    for (const tile of areaTiles) {
      const tileKey = `${tile.x},${tile.y}`;
      this.occupiedTiles.add(tileKey);
    }
    
    this.spatialGrid.addGroup(group.id, position); // Add center to spatial grid
    
    // Reset failed attempts ONLY when group is actually settled
    this.failedSettlementAttempts.delete(group.id);
    
    // Set group state to settled with random duration
    group.state = 'settled';
    group.targetPosition = null;
    group.settledAt = currentTime; // Set settled time
    
    // Store individual settlement duration for this group
    const settlementDuration = this.generateSettlementDuration(group.size);
    (group as any).settlementDuration = settlementDuration; // Store for this specific group
    
    console.log(`Group ${group.id} (${group.size} people) settled at tile (${tileX}, ${tileY}) occupying ${areaTiles.length} tiles for ${Math.round(settlementDuration / 1000)}s`);
  }

  /**
   * Update all groups in spatial grid (settled groups only for proximity checks)
   */
  public updateAllGroups(groups: PeopleGroup[]): void {
    // Clear and rebuild spatial grid with SETTLED groups only
    this.spatialGrid.clear();
    
    for (const group of groups) {
      if (group.state === 'settled') {
        // Add settled groups to spatial grid
        const settledPosition = this.settledGroups.get(group.id);
        if (settledPosition) {
          this.spatialGrid.addGroup(group.id, settledPosition);
        }
      }
      // Note: Wandering/idle groups are NOT added to spatial grid
      // Only settled groups matter for proximity-based settlement decisions
    }
  }

  /**
   * Update settled groups and check if any should leave settlement
   */
  public updateSettledGroups(groups: PeopleGroup[], _currentTime: number): void {
    this.updateAllGroups(groups); // Update spatial grid first
    
    // NOTE: Group leaving is now handled by the individual-based system in GameEngine
    // This old time-based leaving system is disabled to prevent conflicts
    // Groups now leave only when all their individuals have completed cycles
    
    // for (const group of groups) {
    //   if (group.state !== 'settled') continue;
    //   
    //   const settledPosition = this.settledGroups.get(group.id);
    //   if (!settledPosition) continue;

    //   // Check if group should leave settlement (after fixed duration)
    //   // For now, all groups leave after the same duration
    //   const shouldLeave = this.shouldLeaveSettlement(group, currentTime);
    //   
    //   if (shouldLeave) {
    //     this.unsettleGroup(group);
    //   }
    // }
  }

  /**
   * Unsettle a group and make them leave (multi-tile aware)
   */
  public unsettleGroup(group: PeopleGroup): void {
    const settledPosition = this.settledGroups.get(group.id);
    const settlementArea = this.settlementAreas.get(group.id);
    if (!settledPosition || !settlementArea) return;

    // Remove from tracking
    this.settledGroups.delete(group.id);
    this.settlementAreas.delete(group.id);
    this.spatialGrid.removeGroup(group.id, settledPosition); // Remove from spatial grid
    
    // Free all tiles in the settlement area
    for (const tile of settlementArea) {
      const tileKey = `${tile.x},${tile.y}`;
      this.occupiedTiles.delete(tileKey);
    }
    
    // Random behavior for small groups and individuals
    if (group.size <= 3) {
      // Small groups and individuals: randomly wander or leave
      const shouldWander = Math.random() < 0.6; // 60% chance to wander
      if (shouldWander) {
        group.state = 'idle'; // Will trigger wandering behavior
        console.log(`Group ${group.id} (${group.size} people) left settlement and will wander`);
      } else {
        group.state = 'leaving'; // Head back to spawn
        console.log(`Group ${group.id} (${group.size} people) left settlement and is leaving`);
      }
    } else {
      // Big groups always leave
      group.state = 'leaving';
      console.log(`Group ${group.id} (${group.size} people) left settlement and is leaving`);
    }
  }

  // Old time-based leaving system removed - now using individual-based system in GameEngine

  /**
   * Get all tiles occupied by settled groups (for visual feedback)
   */
  public getAllSettledTiles(): Set<string> {
    const settledTiles = new Set<string>();
    
    for (const [, areaTiles] of this.settlementAreas) {
      for (const tile of areaTiles) {
        const tileKey = `${tile.x},${tile.y}`;
        settledTiles.add(tileKey);
      }
    }
    
    return settledTiles;
  }

  /**
   * Get all occupied tile positions
   */
  public getOccupiedTiles(): Set<string> {
    return new Set(this.occupiedTiles);
  }

  /**
   * Check if a tile is occupied
   */
  public isTileOccupied(tileX: number, tileY: number): boolean {
    const tileKey = `${tileX},${tileY}`;
    return this.occupiedTiles.has(tileKey);
  }

  /**
   * Get settled group at a specific tile
   */
  public getSettledGroupAt(tileX: number, tileY: number): PeopleGroup | null {
    for (const [, position] of this.settledGroups) {
      if (position.x === tileX && position.y === tileY) {
        // TODO: Pass group reference or maintain group map
        return null;
      }
    }
    
    return null;
  }
}
