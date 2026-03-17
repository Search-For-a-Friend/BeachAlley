import { PeopleGroup, Vector2 } from '../types';

export interface SettlementRequirements {
  // Future settlement requirements will go here
  // For now, just check if tile is free
}

export interface GroupBehaviorConfig {
  settlementDurations: {
    individual: { min: number; max: number }; // Short to long range
    smallGroup: { min: number; max: number }; // Shorter range
    bigGroup: { min: number; max: number }; // Long range
  };
  settlementRequirements: SettlementRequirements;
}

export class GroupBehavior {
  private settlementDurations: GroupBehaviorConfig['settlementDurations'];
  private settledGroups: Map<string, Vector2> = new Map(); // groupId -> tile position
  private occupiedTiles: Set<string> = new Set(); // Set of occupied tile coordinates
  private failedSettlementAttempts: Map<string, number> = new Map(); // groupId -> failed attempts

  constructor(config: GroupBehaviorConfig) {
    this.settlementDurations = config.settlementDurations;
  }

  /**
   * Generate random settlement duration based on group size
   */
  private generateSettlementDuration(groupSize: number): number {
    if (groupSize === 1) {
      // Individual: most random range (short to long)
      const range = this.settlementDurations.individual;
      return Math.random() * (range.max - range.min) + range.min;
    } else if (groupSize <= 3) {
      // Small group: shorter durations
      const range = this.settlementDurations.smallGroup;
      return Math.random() * (range.max - range.min) + range.min;
    } else {
      // Big group: very long durations
      const range = this.settlementDurations.bigGroup;
      return Math.random() * (range.max - range.min) + range.min;
    }
  }

  /**
   * Check if settlement is possible at the given tile position
   */
  public canSettle(tileX: number, tileY: number, groupSize: number, groupId: string): boolean {
    const tileKey = `${tileX},${tileY}`;
    
    // Check if tile is already occupied
    if (this.occupiedTiles.has(tileKey)) {
      return false;
    }
    
    // Apply group size settlement rules
    if (groupSize === 1) {
      // Individuals can settle anywhere (as long as tile is free)
      return true;
    } else if (groupSize <= 3) {
      // Small groups (2-3) settle near other groups (1-3 tiles away)
      const hasNearby = this.hasNearbyGroups(tileX, tileY, 1, 3);
      
      if (hasNearby) {
        // Reset failed attempts on successful settlement condition
        this.failedSettlementAttempts.delete(groupId);
        return true;
      } else {
        // Track failed attempt
        const attempts = (this.failedSettlementAttempts.get(groupId) || 0) + 1;
        this.failedSettlementAttempts.set(groupId, attempts);
        
        // After 3 failed attempts, allow settling anywhere
        if (attempts >= 3) {
          console.log(`Group ${groupId} (${groupSize} people) settling anywhere after ${attempts} failed attempts`);
          this.failedSettlementAttempts.delete(groupId);
          return true;
        }
        return false;
      }
    } else {
      // Big groups (4+) settle away from other groups (at least 5 tiles away)
      return this.hasNoNearbyGroups(tileX, tileY, 5);
    }
  }

  /**
   * Check if there are nearby groups within the specified distance range
   */
  private hasNearbyGroups(tileX: number, tileY: number, minDistance: number, maxDistance: number): boolean {
    for (const [, position] of this.settledGroups) {
      const distance = Math.sqrt(Math.pow(position.x - tileX, 2) + Math.pow(position.y - tileY, 2));
      if (distance >= minDistance && distance <= maxDistance) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if there are no nearby groups within the specified distance
   */
  private hasNoNearbyGroups(tileX: number, tileY: number, minDistance: number): boolean {
    for (const [, position] of this.settledGroups) {
      const distance = Math.sqrt(Math.pow(position.x - tileX, 2) + Math.pow(position.y - tileY, 2));
      if (distance < minDistance) {
        return false;
      }
    }
    return true;
  }

  /**
   * Settle a group at the given tile position
   */
  public settleGroup(group: PeopleGroup, tileX: number, tileY: number): void {
    const tileKey = `${tileX},${tileY}`;
    
    if (!this.canSettle(tileX, tileY, group.size, group.id)) {
      return; // Cannot settle here
    }

    // Mark group as settled
    this.settledGroups.set(group.id, { x: tileX, y: tileY });
    this.occupiedTiles.add(tileKey);
    
    // Set group state to settled with random duration
    group.state = 'settled';
    group.targetPosition = null;
    group.settledAt = Date.now(); // Set settled time
    
    // Store individual settlement duration for this group
    const settlementDuration = this.generateSettlementDuration(group.size);
    (group as any).settlementDuration = settlementDuration; // Store for this specific group
    
    console.log(`Group ${group.id} (${group.size} people) settled at tile (${tileX}, ${tileY}) for ${Math.round(settlementDuration / 1000)}s`);
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
    
    // Random behavior for small groups and individuals
    if (group.size <= 3) {
      // Small groups and individuals: randomly wander or leave
      const shouldWander = Math.random() < 0.6; // 60% chance to wander
      if (shouldWander) {
        group.state = 'idle'; // Will trigger wandering behavior
        console.log(`Group ${group.id} (${group.size} people) left settlement and will wander`);
      } else {
        group.state = 'leaving'; // Head back to spawn
        console.log(`Group ${group.id} (${group.size} people) left settlement and will leave`);
      }
    } else {
      // Big groups: always leave
      group.state = 'leaving';
      console.log(`Group ${group.id} (${group.size} people) left settlement and will leave`);
    }
  }

  /**
   * Check if a group should leave settlement based on time
   */
  private shouldLeaveSettlement(group: PeopleGroup, currentTime: number): boolean {
    // Use the individual group's settlement duration
    const settledAt = group.settledAt || currentTime;
    const settlementDuration = (group as any).settlementDuration || 10000; // Fallback to 10s
    return currentTime - settledAt > settlementDuration;
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
