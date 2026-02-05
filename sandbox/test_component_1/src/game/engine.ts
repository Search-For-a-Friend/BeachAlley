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
  getExitSpawnTile,
  setGroupState,
  isOutOfBounds,
  updateGroupFacing,
} from './peopleGroup';
import { distance, moveTowards, randomBetween, clamp, randomInt } from './utils';
import { GridManager } from './GridManager';
import { Pathfinder } from './Pathfinder';

export type EventCallback = (event: GameEvent) => void;

/**
 * Game Engine - Manages the game loop and all systems
 */
export class GameEngine {
  private state: GameState;
  private config: GameConfig;
  // private lastSpawnCheck: number = 0; // DISABLED: automatic spawn disabled for manual testing
  private eventListeners: EventCallback[] = [];
  private establishmentGridPositions: Map<string, { gridX: number, gridY: number }> = new Map();
  private gridManager: GridManager;
  private pathfinder: Pathfinder;
  
  constructor(config: Partial<GameConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.gridManager = new GridManager(20, 20);
    this.pathfinder = new Pathfinder();
    this.state = this.createInitialState();
  }
  
  private createInitialState(): GameState {
    // TEST CONFIGURATION: Pathfinding test with obstacles
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
    
    // Create ONE establishment (2x2) with entrance
    const estGridX = 10;
    const estGridY = 10;
    const estPos = gridToScreen(estGridX, estGridY);
    const est1 = createEstablishment(
      estPos,
      {
        maxCapacity: 8,
        attractionRadius: 30,  // Large radius to cover entire grid for testing
        attractionPower: 100,
        serviceTime: this.config.defaultServiceTime,
      }
    );
    est1.gridPosition = { x: estGridX, y: estGridY };
    
    // Set entrance adjacent to establishment, on the horizontal path at y=10
    // Building occupies (9,9), (10,9), (9,10), (10,10)
    // Entrance at (8, 10) - west of building, on the path
    // Use tile CENTER for entrance position
    const entranceX = 8;
    const entranceY = 10;
    est1.entrance = { x: entranceX + 0.5, y: entranceY + 0.5 };
    
    establishments.push(est1);
    this.establishmentGridPositions.set(est1.id, { gridX: estGridX, gridY: estGridY });
    
    // FIRST: Mark ALL tiles as water by default
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        this.gridManager.setTileType(x, y, 'water');
      }
    }
    
    // SECOND: Mark the cross-shaped PATH network
    // Horizontal paths at y = 5, 10, 15 (full rows)
    for (let x = 0; x < 20; x++) {
      this.gridManager.setTileType(x, 5, 'path');
      this.gridManager.setTileType(x, 10, 'path');
      this.gridManager.setTileType(x, 15, 'path');
    }
    
    // Vertical paths at x = 5, 10, 15 (full columns)
    for (let y = 0; y < 20; y++) {
      this.gridManager.setTileType(5, y, 'path');
      this.gridManager.setTileType(10, y, 'path');
      this.gridManager.setTileType(15, y, 'path');
    }
    
    // THEN: Mark establishment footprint on top (overwrites path tiles with building/entrance)
    this.gridManager.markEstablishmentFootprint(est1, est1.entrance);
    
    // Mark spawn tiles at path intersections (excluding building area)
    const pathCoords = [5, 10, 15];
    const validSpawns: string[] = [];
    for (const x of pathCoords) {
      for (const y of pathCoords) {
        const tile = this.gridManager.getTile(x, y);
        // Only mark as spawn if it's still a path tile (not building/entrance)
        if (tile && tile.type === 'path') {
          this.gridManager.setTileType(x, y, 'spawn');
          validSpawns.push(`(${x},${y})`);
        }
      }
    }
    // Spawn tiles and entrance configured
    
    // Make sure establishment is OPEN
    est1.isOpen = true;
    
    return {
      establishments,
      groups: [], // Start with no groups - they will spawn naturally
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
   * Get grid manager for rendering
   */
  getGridManager(): GridManager {
    return this.gridManager;
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
    // this.lastSpawnCheck = 0; // DISABLED: automatic spawn disabled for manual testing
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
    this.pathfindingPhase();  // NEW: Compute paths for seeking groups
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
    // Transition spawning groups to idle
    for (const group of this.state.groups) {
      if (group.state === 'spawning') {
        const timeSinceSpawn = this.state.time - group.spawnTime;
        if (timeSinceSpawn > 300) {
          setGroupState(group, 'idle');
        }
      }
    }
    
    // AUTOMATIC SPAWN DISABLED FOR MANUAL TESTING
    // Check if we should spawn a new group
    // this.lastSpawnCheck += deltaTime;
    // 
    // if (this.lastSpawnCheck < this.config.spawnInterval) return;
    // if (this.state.groups.length >= this.config.maxGroups) return;
    // 
    // this.lastSpawnCheck = 0;
    // 
    // // Probabilistic spawn
    // if (Math.random() > this.config.spawnProbability) return;
    // 
    // // Spawn at a random SPAWN tile
    // const validSpawnPoints: { x: number; y: number }[] = [];
    // 
    // // Find all spawn tiles
    // const tiles = this.gridManager.getAllTiles();
    // for (let y = 0; y < tiles.length; y++) {
    //   for (let x = 0; x < tiles[y].length; x++) {
    //     const tile = tiles[y][x];
    //     if (tile && tile.type === 'spawn') {
    //       validSpawnPoints.push({ x, y });
    //     }
    //   }
    // }
    // 
    // if (validSpawnPoints.length === 0) {
    //   console.error('❌ No spawn tiles found!');
    //   return;
    // }
    // 
    // // Pick random valid spawn point
    // const spawnPos = validSpawnPoints[Math.floor(Math.random() * validSpawnPoints.length)];
    // 
    // // Spawn at tile center for proper alignment
    // const spawnPosCenter = {
    //   x: spawnPos.x + 0.5,
    //   y: spawnPos.y + 0.5,
    // };
    // 
    // const group = createPeopleGroup(spawnPosCenter, this.config);
    // group.spawnTime = this.state.time;
    // 
    // this.state.groups.push(group);
    // this.state.stats.totalGroupsSpawned++;
    // 
    // 
    // this.emit({ type: 'GROUP_SPAWNED', group });
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
        // IMPORTANT: Target position will be set during pathfinding to the ENTRANCE
        // Don't set targetPosition here - let pathfinding phase handle it
        group.targetPosition = target.entrance || null;
        setGroupState(group, 'seeking');
      } else if (group.state === 'idle') {
        // No target found, start wandering to a random path/spawn tile CENTER
        const pathTiles = [5, 10, 15];  // Our path intersections
        group.targetPosition = {
          x: pathTiles[Math.floor(Math.random() * pathTiles.length)] + 0.5,
          y: pathTiles[Math.floor(Math.random() * pathTiles.length)] + 0.5,
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
      
      // Select best establishment (deterministic for testing with single establishment)
      if (score > bestScore) {
        bestScore = score;
        bestEstablishment = establishment;
      }
    }
    
    return bestEstablishment;
  }
  
  // ============================================
  // PHASE 3: PATHFINDING
  // ============================================
  private pathfindingPhase(): void {
    for (const group of this.state.groups) {
      // Compute paths for seeking, wandering, OR leaving groups that don't have one
      if (group.state !== 'seeking' && group.state !== 'wandering' && group.state !== 'leaving') continue;
      if (group.path && group.path.length > 0) continue;  // Already has a valid path
      if (!group.targetPosition) continue;
      
      let targetPos = group.targetPosition;
      let pathDescription = '';
      
      // If seeking, target is the establishment entrance
      if (group.state === 'seeking' && group.currentEstablishment) {
        pathDescription = 'to entrance';
        const establishment = this.state.establishments.find(
          e => e.id === group.currentEstablishment
        );
        
        if (!establishment || !establishment.entrance) {
          // Invalid target - go back to wandering
          const pathTiles = [5, 10, 15];
          group.state = 'wandering';
          group.currentEstablishment = null;
          group.targetPosition = {
            x: pathTiles[Math.floor(Math.random() * pathTiles.length)],
            y: pathTiles[Math.floor(Math.random() * pathTiles.length)],
          };
          continue;
        }
        
        targetPos = establishment.entrance;
      } else if (group.state === 'leaving') {
        pathDescription = 'to spawn tile (exit)';
      } else if (group.state === 'wandering') {
        pathDescription = 'wandering';
      }
      
      // Find path (works for seeking, wandering, and leaving)
      const path = this.pathfinder.findPath(
        group.position,
        targetPos,
        this.gridManager.getAllTiles(),
        (x, y) => this.gridManager.getNeighbors(x, y)
      );
      
      if (path) {
        // Keep ALL waypoints - don't simplify!
        // This ensures paths follow the grid tile-by-tile with visible right angles
        group.path = path;
        group.currentWaypoint = 0;
        // Path computed successfully
      } else {
        // No path found - target is unreachable
        if (group.state === 'seeking') {
          // Give up on establishment, pick new wander target
          const pathTiles = [5, 10, 15];
          group.state = 'wandering';
          group.currentEstablishment = null;
          group.targetPosition = {
            x: pathTiles[Math.floor(Math.random() * pathTiles.length)],
            y: pathTiles[Math.floor(Math.random() * pathTiles.length)],
          };
        } else {
          // Can't reach wander target, become idle
          group.state = 'idle';
          group.targetPosition = null;
        }
      }
    }
  }
  
  // ============================================
  // PHASE 4: MOVEMENT
  // ============================================
  private movementPhase(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds
    
    for (const group of this.state.groups) {
      if (!['seeking', 'wandering', 'leaving'].includes(group.state)) continue;
      
      // Store previous position for direction calculation
      const prevPos = { ...group.position };
      
      // PATHFINDING MODE: Follow waypoints if seeking, wandering, OR leaving with a path
      if ((group.state === 'seeking' || group.state === 'wandering' || group.state === 'leaving') && group.path && group.path.length > 0) {
        const currentWaypoint = group.path[group.currentWaypoint];
        
        // Move towards current waypoint
        group.position = moveTowards(
          group.position,
          currentWaypoint,
          group.speed,
          dt
        );
        
        // Check if reached current waypoint
        const dist = distance(group.position, currentWaypoint);
        if (dist < 0.3) {  // Reached waypoint
          group.currentWaypoint++;
          
          // Reached end of path?
          if (group.currentWaypoint >= group.path.length) {
            if (group.state === 'seeking') {
              // Verify we're actually at an entrance tile before entering
              const tile = this.gridManager.getTile(
                Math.floor(group.position.x),
                Math.floor(group.position.y)
              );
              if (tile && tile.type === 'entrance') {
                setGroupState(group, 'entering');
              } else {
                setGroupState(group, 'idle');
                group.currentEstablishment = null;
              }
            } else if (group.state === 'wandering') {
              setGroupState(group, 'idle');
            } else if (group.state === 'leaving') {
              // Verify we're at a spawn tile before despawning
              const tile = this.gridManager.getTile(
                Math.floor(group.position.x),
                Math.floor(group.position.y)
              );
              if (tile && tile.type === 'spawn') {
                setGroupState(group, 'despawned');
              } else {
                // Try to find a new spawn tile
                group.targetPosition = getExitSpawnTile();
                group.path = null;
              }
            }
            group.path = null;
            group.currentWaypoint = 0;
          }
        }
      }
      // NORMAL MODE: Move directly to target
      else if (group.targetPosition) {
        group.position = moveTowards(
          group.position,
          group.targetPosition,
          group.speed,
          dt
        );
        
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
      
      // Update facing direction based on actual movement
      group.previousPosition = prevPos;
      updateGroupFacing(group);
    }
  }
  
  // ============================================
  // PHASE 5: ENTRY
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
        // No room, go back to wandering to a random PATH tile CENTER
        const pathTiles = [5, 10, 15];
        setGroupState(group, 'wandering');
        group.currentEstablishment = null;
        group.targetPosition = {
          x: pathTiles[Math.floor(Math.random() * pathTiles.length)] + 0.5,
          y: pathTiles[Math.floor(Math.random() * pathTiles.length)] + 0.5,
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
  // PHASE 6: VISIT
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
  // PHASE 7: LEAVE
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
        
        // NEW FEATURE: Groups must leave via spawn tiles
        // Get a random spawn tile as exit target
        group.targetPosition = getExitSpawnTile();
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
  // PHASE 8: CLEANUP
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
  // PHASE 9: STATE UPDATE
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
   * Force spawn a group (manual spawn button)
   */
  forceSpawn(): void {
    if (this.state.groups.length >= this.config.maxGroups * 2) {
      console.warn('⚠️ Too many groups, cannot spawn more');
      return;
    }
    
    // Find all spawn tiles
    const validSpawnPoints: { x: number; y: number }[] = [];
    const tiles = this.gridManager.getAllTiles();
    
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const tile = tiles[y][x];
        if (tile && tile.type === 'spawn') {
          validSpawnPoints.push({ x, y });
        }
      }
    }
    
    if (validSpawnPoints.length === 0) {
      console.error('❌ No spawn tiles found for manual spawn!');
      return;
    }
    
    // Pick random spawn tile
    const spawnTile = validSpawnPoints[Math.floor(Math.random() * validSpawnPoints.length)];
    
    // Spawn at tile center
    const spawnPos = {
      x: spawnTile.x + 0.5,
      y: spawnTile.y + 0.5,
    };
    
    const group = createPeopleGroup(spawnPos, this.config);
    group.spawnTime = this.state.time;
    
    this.state.groups.push(group);
    this.state.stats.totalGroupsSpawned++;
    
    
    this.emit({ type: 'GROUP_SPAWNED', group });
  }
}
