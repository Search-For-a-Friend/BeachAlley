export interface Vector2 {
  x: number;
  y: number;
}

export type IndividualState = 
  | 'spawning'      // Just created from group
  | 'seeking'       // Moving toward activity
  | 'enjoying'      // At activity, gaining enjoyment
  | 'returning'     // Moving back to parent group
  | 'returned'      // Back at parent group
  | 'inactive';     // Waiting for next activity

export interface Individual {
  id: string;                    // Unique identifier
  groupId: string;               // Parent group ID
  position: Vector2;             // Current position
  targetPosition: Vector2 | null; // Target activity position
  state: IndividualState;         // Current state
  activityTarget: Vector2 | null; // Target activity tile
  returnPosition: Vector2;        // Parent group position
  enjoymentStartTime: number;     // When activity enjoyment started
  enjoymentDuration: number;      // How long to enjoy activity
  speed: number;                 // Movement speed
}

export interface Activity {
  position: Vector2;
  type: 'water';              // Currently only water tiles
  occupied: boolean;           // Currently being enjoyed
  occupiedBy: string | null;  // Individual ID
}

export interface GroupIndividuals {
  groupId: string;
  individuals: Map<string, Individual>;  // Individual ID → Individual
  maxIndividuals: number;               // Equal to group size
  leftGroupCount: number;               // How many individuals have left group
  canLeave: boolean;                   // All individuals left exactly once?
}

export class ActivityManager {
  private activities: Map<string, Activity> = new Map();
  private terrainMap: any;

  constructor(terrainMap: any) {
    this.terrainMap = terrainMap;
    this.initializeActivities();
  }

  private initializeActivities(): void {
    // Find all water tiles and create activities
    this.terrainMap.tiles.forEach((type: string, key: string) => {
      if (type === 'water') {
        const [row, col] = key.split(',').map(Number);
        const position = { x: col, y: row };
        this.activities.set(key, {
          position,
          type: 'water',
          occupied: false,
          occupiedBy: null
        });
      }
    });
  }

  // Find nearest available activity
  findNearestAvailableActivity(position: Vector2): Activity | null {
    let nearestActivity: Activity | null = null;
    let nearestDistance = Infinity;

    for (const activity of this.activities.values()) {
      if (!activity.occupied) {
        const distance = Math.sqrt(
          Math.pow(activity.position.x - position.x, 2) +
          Math.pow(activity.position.y - position.y, 2)
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestActivity = activity;
        }
      }
    }

    return nearestActivity;
  }

  // Claim activity for individual
  claimActivity(position: Vector2, individualId: string): boolean {
    const key = `${position.y},${position.x}`;
    const activity = this.activities.get(key);
    
    if (activity && !activity.occupied) {
      activity.occupied = true;
      activity.occupiedBy = individualId;
      return true;
    }
    
    return false;
  }

  // Release activity when individual leaves
  releaseActivity(position: Vector2, individualId: string): void {
    const key = `${position.y},${position.x}`;
    const activity = this.activities.get(key);
    
    if (activity && activity.occupiedBy === individualId) {
      activity.occupied = false;
      activity.occupiedBy = null;
    }
  }

  // Check if activity is available
  isActivityAvailable(position: Vector2): boolean {
    const key = `${position.y},${position.x}`;
    const activity = this.activities.get(key);
    return activity ? !activity.occupied : false;
  }

  // Get all activities for rendering
  getAllActivities(): Activity[] {
    return Array.from(this.activities.values());
  }
}

export class IndividualManager {
  private individuals: Map<string, Individual> = new Map();
  private groupIndividuals: Map<string, GroupIndividuals> = new Map();
  private activityManager: ActivityManager;
  private nextIndividualId: number = 0;
  private BASE_ENJOYMENT_DURATION = 3000;
  private INDIVIDUAL_SPEED = 2.0;

  constructor(terrainMap: any) {
    this.activityManager = new ActivityManager(terrainMap);
  }

  // Create a new individual that leaves the group
  createIndividual(groupId: string, groupPosition: Vector2, _groupSize: number): Individual | null {
    const groupIndividuals = this.groupIndividuals.get(groupId);
    if (!groupIndividuals || groupIndividuals.leftGroupCount >= groupIndividuals.maxIndividuals) {
      return null;
    }

    const individual: Individual = {
      id: `individual_${this.nextIndividualId++}`,
      groupId,
      position: { ...groupPosition },
      targetPosition: null,
      state: 'seeking', // Start seeking immediately (no spawning state)
      activityTarget: null,
      returnPosition: { ...groupPosition },
      enjoymentStartTime: 0,
      enjoymentDuration: this.BASE_ENJOYMENT_DURATION + Math.random() * 2000, // 3-5 seconds
      speed: this.INDIVIDUAL_SPEED
    };

    // Add to tracking
    groupIndividuals.individuals.set(individual.id, individual);
    groupIndividuals.leftGroupCount++;

    return individual;
  }

  // Update individual logic
  updateIndividual(individual: Individual, deltaTime: number): void {
    switch (individual.state) {
      case 'seeking':
        this.updateSeeking(individual, deltaTime);
        break;
      case 'enjoying':
        this.updateEnjoying(individual, deltaTime);
        break;
      case 'returning':
        this.updateReturning(individual, deltaTime);
        break;
      case 'inactive':
        this.updateInactive(individual);
        break;
    }
  }

  private updateSeeking(individual: Individual, deltaTime: number): void {
    if (!individual.targetPosition) {
      // Find nearest available water activity
      const activity = this.activityManager.findNearestAvailableActivity(individual.position);
      
      if (activity) {
        individual.targetPosition = activity.position;
        individual.activityTarget = activity.position;
        this.activityManager.claimActivity(activity.position, individual.id);
      } else {
        // No available activities, wait
        individual.state = 'inactive';
      }
    } else {
      // Move toward target
      this.moveIndividual(individual, deltaTime);
      
      // Check if reached target
      if (this.hasReachedTarget(individual)) {
        individual.state = 'enjoying';
        individual.enjoymentStartTime = Date.now();
      }
    }
  }

  private updateEnjoying(individual: Individual, _deltaTime: number): void {
    const now = Date.now();
    
    if (now - individual.enjoymentStartTime >= individual.enjoymentDuration) {
      // Finished enjoying, return to group
      individual.targetPosition = individual.returnPosition;
      individual.state = 'returning';
      
      // Release the activity
      if (individual.activityTarget) {
        this.activityManager.releaseActivity(individual.activityTarget, individual.id);
        individual.activityTarget = null;
      }
    }
  }

  private updateReturning(individual: Individual, deltaTime: number): void {
    // Move toward return position
    this.moveIndividual(individual, deltaTime);
    
    // Check if reached group
    if (this.hasReachedTarget(individual)) {
      // Individual disappears when returning to group
      this.removeIndividual(individual.id);
    }
  }

  private updateInactive(individual: Individual): void {
    // Try to find new activity after some delay
    const activity = this.activityManager.findNearestAvailableActivity(individual.position);
    
    if (activity) {
      individual.state = 'seeking';
    }
  }

  private moveIndividual(individual: Individual, deltaTime: number): void {
    if (!individual.targetPosition) return;

    const dx = individual.targetPosition.x - individual.position.x;
    const dy = individual.targetPosition.y - individual.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.1) {
      const moveDistance = Math.min(individual.speed * deltaTime / 1000, distance); // Use deltaTime in seconds
      individual.position.x += (dx / distance) * moveDistance;
      individual.position.y += (dy / distance) * moveDistance;
    }
  }

  private hasReachedTarget(individual: Individual): boolean {
    if (!individual.targetPosition) return false;

    const dx = individual.targetPosition.x - individual.position.x;
    const dy = individual.targetPosition.y - individual.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < 0.5;
  }

  // Initialize group individuals tracking
  initializeGroupIndividuals(groupId: string, groupSize: number): void {
    this.groupIndividuals.set(groupId, {
      groupId,
      individuals: new Map(),
      maxIndividuals: groupSize,
      leftGroupCount: 0,
      canLeave: false
    });
  }

  // Get group individuals
  getGroupIndividuals(groupId: string): GroupIndividuals | undefined {
    return this.groupIndividuals.get(groupId);
  }

  // Get all individuals
  getAllIndividuals(): Individual[] {
    return Array.from(this.individuals.values());
  }

  // Get activity manager
  getActivityManager(): ActivityManager {
    return this.activityManager;
  }

  // Remove an individual completely
  removeIndividual(individualId: string): void {
    const individual = this.individuals.get(individualId);
    if (!individual) return;
    
    // Remove from main tracking
    this.individuals.delete(individualId);
    
    // Remove from group tracking
    const groupIndividuals = this.groupIndividuals.get(individual.groupId);
    if (groupIndividuals) {
      groupIndividuals.individuals.delete(individualId);
    }
    
    // Release any activity
    if (individual.activityTarget) {
      this.activityManager.releaseActivity(individual.activityTarget, individualId);
    }
  }

  // Check if group can leave (all individuals left exactly once)
  canGroupLeave(groupId: string): boolean {
    const groupIndividuals = this.groupIndividuals.get(groupId);
    if (!groupIndividuals) return true;
    
    // Group can only leave if each individual has left exactly once
    return groupIndividuals.leftGroupCount >= groupIndividuals.maxIndividuals;
  }

  // Call back all individuals for a group
  callBackIndividuals(groupId: string): void {
    const groupIndividuals = this.groupIndividuals.get(groupId);
    if (!groupIndividuals) return;

    for (const individual of groupIndividuals.individuals.values()) {
      if (individual.state === 'seeking' || individual.state === 'enjoying') {
        // Release activity if enjoying
        if (individual.activityTarget) {
          this.activityManager.releaseActivity(individual.activityTarget, individual.id);
        }
        
        // Return to group immediately
        individual.targetPosition = individual.returnPosition;
        individual.state = 'returning';
        individual.activityTarget = null;
      }
    }
  }

  // Remove group individuals when group despawns
  removeGroupIndividuals(groupId: string): void {
    const groupIndividuals = this.groupIndividuals.get(groupId);
    if (!groupIndividuals) return;

    // Remove all individuals
    for (const individual of groupIndividuals.individuals.values()) {
      // Release any occupied activities
      if (individual.activityTarget) {
        this.activityManager.releaseActivity(individual.activityTarget, individual.id);
      }
      
      // Remove from main individuals map
      this.individuals.delete(individual.id);
    }

    // Remove group individuals tracking
    this.groupIndividuals.delete(groupId);
  }
}
