import {
  GameState,
  GameConfig,
  GameEvent,
  DEFAULT_CONFIG,
  PeopleGroup,
  Establishment,
  EstablishmentState,
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
  getExitPosition,
  setGroupState,
  isOutOfBounds,
  updateGroupFacing,
} from './peopleGroup';
import { distance, moveTowards, randomBetween, clamp, randomInt } from './utils';

export type EventCallback = (event: GameEvent) => void;

/**
 * Game Engine - Manages the game loop and all systems
 */
export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  private lastSpawnCheck: number = 0;
  private eventListeners: EventCallback[] = [];
  private establishmentGridPositions: Map<string, { gridX: number, gridY: number }> = new Map();
  
  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }
  
  private createInitialState(): GameState {
    // TEST CONFIGURATION: All establishments closed, 4 groups spawn at cardinal directions
    const establishments: Establishment[] = [];
    
    // Convert grid coordinates to screen coordinates for establishment positioning
    const gridToScreen = (gridX: number, gridY: number) => {
      const TILE_WIDTH = 64;
      const TILE_HEIGHT = 32;
      const GRID_ROWS = 20;
      const isoX = (gridX - gridY) * (TILE_WIDTH / 2);
      const isoY = (gridX + gridY) * (TILE_HEIGHT / 2);
      const offsetX = this.config.canvasWidth / 2;
      const offsetY = this.config.canvasHeight / 2 - (GRID_ROWS * TILE_HEIGHT / 2);
      return {
        x: isoX + offsetX,
        y: isoY + offsetY
      };
    };
    
    // Helper to check if position is far enough from others
    const usedPositions: Set<string> = new Set();
    const isFarEnough = (gx: number, gy: number, minDist: number = 3): boolean => {
      for (const posKey of usedPositions) {
        const [x, y] = posKey.split(',').map(Number);
        const dist = Math.abs(gx - x) + Math.abs(gy - y);
        if (dist < minDist) return false;
      }
      return true;
    };
    
    // Generate random positions
    const getRandomGridPos = (size: number): { gridX: number, gridY: number } => {
      const margin = Math.ceil(size / 2) + 1;
      let attempts = 0;
      while (attempts < 100) {
        const gridX = Math.floor(Math.random() * (20 - margin * 2)) + margin;
        const gridY = Math.floor(Math.random() * (20 - margin * 2)) + margin;
        if (isFarEnough(gridX, gridY, 4)) {
          usedPositions.add(`${gridX},${gridY}`);
          return { gridX, gridY };
        }
        attempts++;
      }
      const gridX = 10;
      const gridY = 10;
      return { gridX, gridY };
    };
    
    // Create 3 CLOSED establishments at random positions
    const pos1 = getRandomGridPos(1);
    const est1Pos = gridToScreen(pos1.gridX, pos1.gridY);
    const est1 = createEstablishment(
      est1Pos,
      {
        maxCapacity: 4,
        attractionRadius: 4,
        attractionPower: 75,
        serviceTime: this.config.defaultServiceTime,
      }
    );
    est1.gridPosition = { x: pos1.gridX, y: pos1.gridY };
    est1.isOpen = false; // CLOSED FOR TEST
    establishments.push(est1);
    this.establishmentGridPositions.set(est1.id, { gridX: pos1.gridX, gridY: pos1.gridY });
    
    const pos2 = getRandomGridPos(2);
    const est2Pos = gridToScreen(pos2.gridX, pos2.gridY);
    const est2 = createEstablishment(
      est2Pos,
      {
        maxCapacity: 8,
        attractionRadius: 5,
        attractionPower: 80,
        serviceTime: this.config.defaultServiceTime,
      }
    );
    est2.gridPosition = { x: pos2.gridX, y: pos2.gridY };
    est2.isOpen = false; // CLOSED FOR TEST
    establishments.push(est2);
    this.establishmentGridPositions.set(est2.id, { gridX: pos2.gridX, gridY: pos2.gridY });
    
    const pos3 = getRandomGridPos(3);
    const est3Pos = gridToScreen(pos3.gridX, pos3.gridY);
    const est3 = createEstablishment(
      est3Pos,
      {
        maxCapacity: 12,
        attractionRadius: 6,
        attractionPower: 85,
        serviceTime: this.config.defaultServiceTime,
      }
    );
    est3.gridPosition = { x: pos3.gridX, y: pos3.gridY };
    est3.isOpen = false; // CLOSED FOR TEST
    establishments.push(est3);
    this.establishmentGridPositions.set(est3.id, { gridX: pos3.gridX, gridY: pos3.gridY });
    
    // Create 4 test groups at visual cardinal directions (isometric diagonals in grid space)
    // All heading to center and should arrive simultaneously
    const centerX = 10;
    const centerY = 10;
    const testGroups: PeopleGroup[] = [];
    
    // TOP of screen (up visually) = both X and Y decrease in grid
    const topGroup = createPeopleGroup({ x: 4, y: 4 }, this.config);
    topGroup.targetPosition = { x: centerX, y: centerY };
    topGroup.state = 'wandering';
    topGroup.spawnTime = 0;
    testGroups.push(topGroup);
    
    // BOTTOM of screen (down visually) = both X and Y increase in grid
    const bottomGroup = createPeopleGroup({ x: 16, y: 16 }, this.config);
    bottomGroup.targetPosition = { x: centerX, y: centerY };
    bottomGroup.state = 'wandering';
    bottomGroup.spawnTime = 0;
    testGroups.push(bottomGroup);
    
    // LEFT of screen (left visually) = X decreases, Y increases in grid
    const leftGroup = createPeopleGroup({ x: 4, y: 16 }, this.config);
    leftGroup.targetPosition = { x: centerX, y: centerY };
    leftGroup.state = 'wandering';
    leftGroup.spawnTime = 0;
    testGroups.push(leftGroup);
    
    // RIGHT of screen (right visually) = X increases, Y decreases in grid
    const rightGroup = createPeopleGroup({ x: 16, y: 4 }, this.config);
    rightGroup.targetPosition = { x: centerX, y: centerY };
    rightGroup.state = 'wandering';
    rightGroup.spawnTime = 0;
    testGroups.push(rightGroup);
    
    return {
      establishments,
      groups: testGroups,
      time: 0,
      isPaused: false,
      stats: {
        totalGroupsSpawned: 4,
        totalGroupsDespawned: 0,
        totalVisits: 0,
        totalRevenue: 0,
      },
    };
  }
  
  /**
   * Subscribe to game events
   */
  onEvent(callback: EventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) this.eventListeners.splice(index, 1);
    };
  }
  
  private emit(event: GameEvent): void {
    for (const listener of this.eventListeners) {
      listener(event);
    }
  }
  
  /**
   * Get current game state (creates new references for React)
   */
  getState(): GameState {
    // Return new object references so React detects changes
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
  
  /**
   * Toggle pause state
   */
  togglePause(): void {
    this.state.isPaused = !this.state.isPaused;
  }
  
  /**
   * Reset the game
   */
  reset(): void {
    this.state = this.createInitialState();
    this.lastSpawnCheck = 0;
  }
  
  /**
   * Main update function - called every frame
   */
  update(deltaTime: number): void {
    if (this.state.isPaused) return;
    
    this.state.time += deltaTime;
    
    // Run all phases
    this.spawnPhase(deltaTime);
    this.decisionPhase();
    this.movementPhase(deltaTime);
    this.entryPhase();
    this.visitPhase(deltaTime);
    this.leavePhase();
    this.cleanupPhase();
    this.stateUpdatePhase();
  }
  
  // ============================================
  // PHASE 1: SPAWN
  // ============================================
  private spawnPhase(deltaTime: number): void {
    // TEST MODE: No spawning - we start with 4 test groups
    // First, transition any spawning groups to their target state
    for (const group of this.state.groups) {
      if (group.state === 'spawning') {
        const timeSinceSpawn = this.state.time - group.spawnTime;
        if (timeSinceSpawn > 300) {
          setGroupState(group, 'idle');
        }
      }
    }
    
    // Disabled for test: no random spawning
    return;
  }
  
  // ============================================
  // PHASE 2: DECISION
  // ============================================
  private decisionPhase(): void {
    for (const group of this.state.groups) {
      if (group.state !== 'idle' && group.state !== 'wandering') continue;
      
      // Find best establishment to visit
      const target = this.findBestEstablishment(group);
      
      if (target) {
        group.currentEstablishment = target.id;
        // Set target to grid position of establishment
        const estGridPos = this.establishmentGridPositions.get(target.id);
        if (estGridPos) {
          group.targetPosition = { x: estGridPos.gridX, y: estGridPos.gridY };
        }
        setGroupState(group, 'seeking');
      } else if (group.state === 'idle') {
        // No target found, start wandering in grid coordinates (stay in visible area)
        group.targetPosition = {
          x: randomBetween(4, 16),
          y: randomBetween(4, 16),
        };
        setGroupState(group, 'wandering');
      }
    }
  }
  
  private findBestEstablishment(group: PeopleGroup): Establishment | null {
    let bestEstablishment: Establishment | null = null;
    let bestScore = 0;
    
    for (const establishment of this.state.establishments) {
      // Basic checks
      if (!establishment.isOpen) continue;
      if (!hasCapacity(establishment, group.size)) continue;
      
      // Distance check in grid space
      const estGridPos = this.establishmentGridPositions.get(establishment.id);
      if (!estGridPos) continue;
      
      const dist = distance(group.position, { x: estGridPos.gridX, y: estGridPos.gridY });
      if (dist > establishment.attractionRadius) continue;
      
      // Calculate attraction score
      const multiplier = getAttractionMultiplier(establishment);
      const baseAttraction = establishment.attractionPower * multiplier;
      const distanceFactor = 1 - (dist / establishment.attractionRadius);
      const desireFactor = group.desire / 100;
      
      const score = baseAttraction * distanceFactor * desireFactor;
      
      // Probabilistic decision
      if (Math.random() * 100 < score && score > bestScore) {
        bestScore = score;
        bestEstablishment = establishment;
      }
    }
    
    return bestEstablishment;
  }
  
  // ============================================
  // PHASE 3: MOVEMENT
  // ============================================
  private movementPhase(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds
    
    for (const group of this.state.groups) {
      if (!['seeking', 'wandering', 'leaving'].includes(group.state)) continue;
      if (!group.targetPosition) continue;
      
      // Store previous position for direction calculation
      const prevPos = { ...group.position };
      
      // Move towards target
      group.position = moveTowards(
        group.position,
        group.targetPosition,
        group.speed,
        dt
      );
      
      // Update facing direction based on actual movement
      group.previousPosition = prevPos;
      updateGroupFacing(group);
      
      // Check if reached target (in grid coordinates, 0.5 is about half a tile)
      const dist = distance(group.position, group.targetPosition);
      
      if (dist < 0.5) {
        if (group.state === 'seeking') {
          setGroupState(group, 'entering');
        } else if (group.state === 'wandering') {
          setGroupState(group, 'idle');
          group.targetPosition = null;
        } else if (group.state === 'leaving') {
          setGroupState(group, 'despawned');
        }
      }
    }
  }
  
  // ============================================
  // PHASE 4: ENTRY
  // ============================================
  private entryPhase(): void {
    for (const group of this.state.groups) {
      if (group.state !== 'entering') continue;
      if (!group.currentEstablishment) continue;
      
      const establishment = this.state.establishments.find(
        e => e.id === group.currentEstablishment
      );
      
      if (!establishment) {
        setGroupState(group, 'idle');
        group.currentEstablishment = null;
        continue;
      }
      
      // Check if still has capacity
      if (!hasCapacity(establishment, group.size)) {
        // No room, go back to wandering in grid space (stay in visible area)
        setGroupState(group, 'wandering');
        group.currentEstablishment = null;
        group.targetPosition = {
          x: randomBetween(4, 16),
          y: randomBetween(4, 16),
        };
        continue;
      }
      
      // Enter establishment
      addOccupants(establishment, group.size);
      group.timeInEstablishment = 0;
      setGroupState(group, 'visiting');
      this.state.stats.totalVisits++;
      
      this.emit({
        type: 'GROUP_ENTERED',
        groupId: group.id,
        establishmentId: establishment.id,
      });
    }
  }
  
  // ============================================
  // PHASE 5: VISIT
  // ============================================
  private visitPhase(deltaTime: number): void {
    for (const group of this.state.groups) {
      if (group.state !== 'visiting') continue;
      if (!group.currentEstablishment) continue;
      
      const establishment = this.state.establishments.find(
        e => e.id === group.currentEstablishment
      );
      
      if (!establishment) continue;
      
      // Update time in establishment
      group.timeInEstablishment += deltaTime;
      
      // Deduct money and generate revenue
      const moneySpent = (this.config.moneyPerSecond * deltaTime) / 1000;
      group.money -= moneySpent;
      addRevenue(establishment, moneySpent * group.size);
      this.state.stats.totalRevenue += moneySpent * group.size;
      
      // Update satisfaction based on crowding
      const occupancyPercent = (establishment.currentOccupancy / establishment.maxCapacity) * 100;
      let satisfactionChange = -this.config.satisfactionDecayRate * (deltaTime / 1000);
      
      // Extra decay if crowded
      if (occupancyPercent > 80) {
        satisfactionChange *= 2;
      }
      
      // Bonus if not crowded
      if (occupancyPercent < 50) {
        satisfactionChange *= 0.5;
      }
      
      group.satisfaction = clamp(group.satisfaction + satisfactionChange, 0, 100);
      
      // Decay patience slowly
      group.patience -= (deltaTime / 1000) * 0.5;
    }
  }
  
  // ============================================
  // PHASE 6: LEAVE
  // ============================================
  private leavePhase(): void {
    for (const group of this.state.groups) {
      if (group.state !== 'visiting') continue;
      if (!group.currentEstablishment) continue;
      
      const establishment = this.state.establishments.find(
        e => e.id === group.currentEstablishment
      );
      
      if (!establishment) continue;
      
      let shouldLeave = false;
      let reason = '';
      
      // Check leave conditions
      if (group.timeInEstablishment >= establishment.serviceTime) {
        shouldLeave = true;
        reason = 'Finished visit';
      } else if (group.satisfaction < 20) {
        shouldLeave = true;
        reason = 'Not satisfied';
      } else if (group.money < 0) {
        shouldLeave = true;
        reason = 'Out of money';
      } else if (group.patience <= 0) {
        shouldLeave = true;
        reason = 'Lost patience';
      } else if (!establishment.isOpen) {
        shouldLeave = true;
        reason = 'Establishment closed';
      } else if (Math.random() < 0.001) {
        shouldLeave = true;
        reason = 'Decided to leave';
      }
      
      if (shouldLeave) {
        // Remove from establishment
        removeOccupants(establishment, group.size);
        
        // Set to leaving state
        group.targetPosition = getExitPosition(group.position, 20);
        setGroupState(group, 'leaving');
        
        this.emit({
          type: 'GROUP_LEFT',
          groupId: group.id,
          establishmentId: establishment.id,
          reason,
        });
        
        group.currentEstablishment = null;
      }
    }
  }
  
  // ============================================
  // PHASE 7: CLEANUP
  // ============================================
  private cleanupPhase(): void {
    const toRemove: string[] = [];
    
    for (const group of this.state.groups) {
      if (group.state === 'despawned') {
        toRemove.push(group.id);
        this.state.stats.totalGroupsDespawned++;
        this.emit({ type: 'GROUP_DESPAWNED', groupId: group.id });
      }
      
      // Also remove groups that wandered off world
      if (group.state === 'leaving' && isOutOfBounds(group, 20)) {
        toRemove.push(group.id);
        this.state.stats.totalGroupsDespawned++;
        this.emit({ type: 'GROUP_DESPAWNED', groupId: group.id });
      }
    }
    
    this.state.groups = this.state.groups.filter(g => !toRemove.includes(g.id));
  }
  
  // ============================================
  // PHASE 8: STATE UPDATE
  // ============================================
  private stateUpdatePhase(): void {
    for (const establishment of this.state.establishments) {
      const { changed, previousState } = updateEstablishmentState(establishment);
      
      if (changed) {
        this.emit({
          type: 'STATE_CHANGED',
          establishmentId: establishment.id,
          from: previousState,
          to: establishment.state as EstablishmentState,
        });
      }
    }
  }
  
  // ============================================
  // PLAYER ACTIONS
  // ============================================
  
  /**
   * Toggle establishment open/closed
   */
  toggleEstablishment(id: string): void {
    const establishment = this.state.establishments.find(e => e.id === id);
    if (establishment) {
      establishment.isOpen = !establishment.isOpen;
    }
  }
  
  /**
   * Force spawn a group
   */
  forceSpawn(): void {
    if (this.state.groups.length >= this.config.maxGroups * 2) return;
    
    // Spawn inside the canvas, in a corner
    const spawnPos = {
      x: Math.random() < 0.5 
        ? randomBetween(50, 150)
        : randomBetween(this.config.canvasWidth - 150, this.config.canvasWidth - 50),
      y: Math.random() < 0.5
        ? randomBetween(50, 150)
        : randomBetween(this.config.canvasHeight - 150, this.config.canvasHeight - 50),
    };
    
    const group = createPeopleGroup(spawnPos, this.config);
    group.spawnTime = this.state.time;
    
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;
    
    this.emit({ type: 'GROUP_SPAWNED', group });
  }
}
