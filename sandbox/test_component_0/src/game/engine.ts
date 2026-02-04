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
  
  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }
  
  private createInitialState(): GameState {
    // Create establishment in center of canvas
    const centerX = this.config.canvasWidth / 2;
    const centerY = this.config.canvasHeight / 2;
    
    const establishment = createEstablishment(
      { x: centerX, y: centerY },
      {
        maxCapacity: 8,
        attractionRadius: 300,
        attractionPower: 75,
        serviceTime: this.config.defaultServiceTime,
      }
    );
    
    return {
      establishments: [establishment],
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
    // First, transition any spawning groups to idle
    for (const group of this.state.groups) {
      if (group.state === 'spawning') {
        const timeSinceSpawn = this.state.time - group.spawnTime;
        if (timeSinceSpawn > 300) {
          setGroupState(group, 'idle');
        }
      }
    }
    
    this.lastSpawnCheck += deltaTime;
    
    if (this.lastSpawnCheck < this.config.spawnInterval) return;
    this.lastSpawnCheck = 0;
    
    // Check spawn conditions
    if (this.state.groups.length >= this.config.maxGroups) return;
    if (Math.random() > this.config.spawnProbability) return;
    
    // Spawn new group INSIDE the canvas (not at edges)
    const spawnPos = {
      x: Math.random() < 0.5 
        ? randomBetween(50, 150)  // Left side
        : randomBetween(this.config.canvasWidth - 150, this.config.canvasWidth - 50), // Right side
      y: Math.random() < 0.5
        ? randomBetween(50, 150)  // Top side
        : randomBetween(this.config.canvasHeight - 150, this.config.canvasHeight - 50), // Bottom side
    };
    
    const group = createPeopleGroup(spawnPos, this.config);
    group.spawnTime = this.state.time; // Use game time, not Date.now()
    
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;
    
    this.emit({ type: 'GROUP_SPAWNED', group });
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
        group.targetPosition = { ...target.position };
        setGroupState(group, 'seeking');
      } else if (group.state === 'idle') {
        // No target found, start wandering
        group.targetPosition = {
          x: randomBetween(50, this.config.canvasWidth - 50),
          y: randomBetween(50, this.config.canvasHeight - 50),
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
      
      // Distance check
      const dist = distance(group.position, establishment.position);
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
      
      // Check if reached target
      const dist = distance(group.position, group.targetPosition);
      
      if (dist < 5) {
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
        // No room, go back to wandering
        setGroupState(group, 'wandering');
        group.currentEstablishment = null;
        group.targetPosition = {
          x: randomBetween(50, this.config.canvasWidth - 50),
          y: randomBetween(50, this.config.canvasHeight - 50),
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
        group.targetPosition = getExitPosition(
          group.position,
          this.config.canvasWidth,
          this.config.canvasHeight
        );
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
      
      // Also remove groups that wandered off screen
      if (group.state === 'leaving' && isOutOfBounds(group, this.config.canvasWidth, this.config.canvasHeight)) {
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
