import { PeopleGroup, Vector2 } from '../types';

export interface SettlementRequirements {
  // Future settlement requirements will go here
  // For now, just check if tile is free
}

export interface GroupBehaviorConfig {
  settlementDuration: number; // How long groups stay settled
  settlementRequirements: SettlementRequirements;
}

export class GroupBehavior {
  private settlementDuration: number;
  private settledGroups: Map<string, Vector2> = new Map(); // groupId -> tile position
  private occupiedTiles: Set<string> = new Set(); // Set of occupied tile coordinates

  constructor(config: GroupBehaviorConfig) {
    this.settlementDuration = config.settlementDuration;
  }

  /**
   * Check if settlement is possible at the given tile position
   */
  public canSettle(tileX: number, tileY: number): boolean {
    const tileKey = `${tileX},${tileY}`;
    return !this.occupiedTiles.has(tileKey);
  }

  /**
   * Settle a group at the given tile position
   */
  public settleGroup(group: PeopleGroup, tileX: number, tileY: number): void {
    const tileKey = `${tileX},${tileY}`;
    
    if (!this.canSettle(tileX, tileY)) {
      return; // Cannot settle here
    }

    // Mark group as settled
    this.settledGroups.set(group.id, { x: tileX, y: tileY });
    this.occupiedTiles.add(tileKey);
    
    // Set group state to settled
    group.state = 'settled';
    group.targetPosition = null;
    
    console.log(`Group ${group.id} settled at tile (${tileX}, ${tileY})`);
  }

  /**
   * Update settled groups and check if any should leave settlement
   */
  public updateSettledGroups(groups: PeopleGroup[], currentTime: number): void {
    for (const group of groups) {
      if (group.state !== 'settled') continue;
      
      const settledPosition = this.settledGroups.get(group.id);
      if (!settledPosition) continue;

      // Check if group should leave settlement (after fixed duration)
      // For now, all groups leave after the same duration
      const shouldLeave = this.shouldLeaveSettlement(group, currentTime);
      
      if (shouldLeave) {
        this.unsettleGroup(group);
      }
    }
  }

  /**
   * Remove a group from settlement
   */
  public unsettleGroup(group: PeopleGroup): void {
    const settledPosition = this.settledGroups.get(group.id);
    if (!settledPosition) return;

    const tileKey = `${settledPosition.x},${settledPosition.y}`;
    
    // Remove from tracking
    this.settledGroups.delete(group.id);
    this.occupiedTiles.delete(tileKey);
    
    // Set group to leaving state
    group.state = 'leaving';
    
    console.log(`Group ${group.id} left settlement at tile (${settledPosition.x}, ${settledPosition.y})`);
  }

  /**
   * Check if a group should leave settlement based on time
   */
  private shouldLeaveSettlement(group: PeopleGroup, currentTime: number): boolean {
    // Use the configured settlement duration
    // In the future, this could be based on group satisfaction, weather, etc.
    const settledAt = group.settledAt || currentTime;
    return currentTime - settledAt > this.settlementDuration;
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
