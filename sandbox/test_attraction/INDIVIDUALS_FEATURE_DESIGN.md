# Individuals Feature Design Document

## 🎯 Core Concept

Settled groups can spawn individuals who seek activities (water tiles) and return to their parent group. Individuals are sub-units that enhance group experience by providing activity-based enjoyment while maintaining group cohesion.

## 🔄 Core Gameplay Loop

```
Group Settles → Spawn Individuals → Individuals Seek Activities → Enjoy Activities → Return to Group → Group Can Leave
```

## 👥 Individual System Architecture

### 1. Individual Entity
```typescript
interface Individual {
  id: string;                    // Unique identifier
  groupId: string;               // Parent group ID
  position: Vector2;             // Current position
  targetPosition: Vector2 | null; // Target activity position
  state: IndividualState;         // Current state
  activityTarget: Vector2 | null; // Target activity tile
  returnPosition: Vector2;        // Parent group position
  sprite: Sprite;                // Individual sprite
  enjoymentStartTime: number;     // When activity enjoyment started
  enjoymentDuration: number;      // How long to enjoy activity
}
```

### 2. Individual States
```typescript
type IndividualState = 
  | 'spawning'      // Just created from group
  | 'seeking'       // Moving toward activity
  | 'enjoying'      // At activity, gaining enjoyment
  | 'returning'     // Moving back to parent group
  | 'returned'      // Back at parent group
  | 'inactive';     // Waiting for next activity
```

### 3. Group-Individual Relationship
```typescript
interface GroupIndividuals {
  groupId: string;
  individuals: Map<string, Individual>;  // Individual ID → Individual
  maxIndividuals: number;               // Equal to group size
  activeIndividuals: number;            // Currently active individuals
  returnedIndividuals: number;           // Individuals back at group
  canLeave: boolean;                   // All individuals returned?
}
```

## 🎯 Activity System

### 1. Activity Targets
```typescript
interface Activity {
  position: Vector2;
  type: 'water';              // Currently only water tiles
  occupied: boolean;           // Currently being enjoyed
  occupiedBy: string | null;  // Individual ID
  enjoymentDuration: number;    // Base enjoyment time
}
```

### 2. Activity Management
```typescript
class ActivityManager {
  activities: Map<string, Activity>;  // Position key → Activity
  
  // Find nearest available activity
  findNearestAvailableActivity(position: Vector2): Activity | null;
  
  // Claim activity for individual
  claimActivity(position: Vector2, individualId: string): boolean;
  
  // Release activity when individual leaves
  releaseActivity(position: Vector2, individualId: string): void;
  
  // Check if activity is available
  isActivityAvailable(position: Vector2): boolean;
}
```

## 🏃 Individual Behavior Logic

### 1. Spawning
```typescript
function spawnIndividual(groupId: string, groupPosition: Vector2): Individual {
  return {
    id: generateIndividualId(),
    groupId: groupId,
    position: { ...groupPosition },
    targetPosition: null,
    state: 'spawning',
    activityTarget: null,
    returnPosition: groupPosition,
    sprite: loadIndividualSprite(),
    enjoymentStartTime: 0,
    enjoymentDuration: 3000 + Math.random() * 2000, // 3-5 seconds
  };
}
```

### 2. Activity Seeking
```typescript
function updateIndividualSeeking(individual: Individual, activityManager: ActivityManager): void {
  // Find nearest available water tile
  const activity = activityManager.findNearestAvailableActivity(individual.position);
  
  if (activity) {
    individual.targetPosition = activity.position;
    individual.activityTarget = activity.position;
    activityManager.claimActivity(activity.position, individual.id);
    individual.state = 'seeking';
  } else {
    // No available activities, wait
    individual.state = 'inactive';
  }
}
```

### 3. Activity Enjoyment
```typescript
function updateIndividualEnjoying(individual: Individual, deltaTime: number): void {
  const now = Date.now();
  
  if (now - individual.enjoymentStartTime >= individual.enjoymentDuration) {
    // Finished enjoying, return to group
    individual.targetPosition = individual.returnPosition;
    individual.state = 'returning';
    
    // Release the activity
    activityManager.releaseActivity(individual.activityTarget!, individual.id);
    individual.activityTarget = null;
  }
}
```

### 4. Return to Group
```typescript
function updateIndividualReturning(individual: Individual): void {
  const distance = Math.sqrt(
    Math.pow(individual.position.x - individual.returnPosition.x, 2) +
    Math.pow(individual.position.y - individual.returnPosition.y, 2)
  );
  
  if (distance < 0.5) { // Close enough to group
    individual.position = { ...individual.returnPosition };
    individual.state = 'returned';
    individual.targetPosition = null;
  }
}
```

## 🎮 Group Integration

### 1. Individual Spawning Rules
```typescript
function canSpawnIndividual(group: PeopleGroup, groupIndividuals: GroupIndividuals): boolean {
  return (
    group.state === 'settled' &&
    groupIndividuals.activeIndividuals < groupIndividuals.maxIndividuals
  );
}

function spawnIndividualFromGroup(group: PeopleGroup, groupIndividuals: GroupIndividuals): void {
  if (!canSpawnIndividual(group, groupIndividuals)) return;
  
  const individual = spawnIndividual(group.id, group.position);
  groupIndividuals.individuals.set(individual.id, individual);
  groupIndividuals.activeIndividuals++;
}
```

### 2. Group Leaving Logic
```typescript
function canGroupLeave(group: PeopleGroup, groupIndividuals: GroupIndividuals): boolean {
  return groupIndividuals.returnedIndividuals === groupIndividuals.maxIndividuals;
}

function initiateGroupLeave(group: PeopleGroup, groupIndividuals: GroupIndividuals): void {
  // Call back all individuals
  for (const individual of groupIndividuals.individuals.values()) {
    if (individual.state === 'seeking' || individual.state === 'enjoying') {
      // Release activity if enjoying
      if (individual.activityTarget) {
        activityManager.releaseActivity(individual.activityTarget, individual.id);
      }
      
      // Return to group immediately
      individual.targetPosition = individual.returnPosition;
      individual.state = 'returning';
      individual.activityTarget = null;
    }
  }
}
```

## 🎨 Visual Design

### 1. Individual Sprites
```typescript
interface IndividualSprite {
  // Placeholder sprite design
  size: { width: 8, height: 8 };  // Smaller than group sprites
  colors: {
    individual: '#FFD700',          // Gold color
    seeking: '#FFA500',             // Orange when seeking
    enjoying: '#00FF00',            // Green when enjoying
    returning: '#87CEEB'            // Sky blue when returning
  };
  animations: {
    idle: AnimationFrames;
    walking: AnimationFrames;
    enjoying: AnimationFrames;
  };
}
```

### 2. Visual Feedback
- **State Colors**: Different colors for different states
- **Activity Indicators**: Visual indicators when enjoying water
- **Return Lines**: Optional lines showing return path to group
- **Activity Occupancy**: Visual indicators for occupied water tiles

## 📊 Performance Considerations

### 1. Optimization Strategies
```typescript
class IndividualManager {
  // Spatial grid for efficient nearby queries
  spatialGrid: SpatialGrid<Individual>;
  
  // Update batching for performance
  updateBatch(individuals: Individual[], deltaTime: number): void;
  
  // Culling for off-screen individuals
  cullOffscreenIndividuals(viewport: Viewport): Individual[];
  
  // Pool system for individual objects
  individualPool: ObjectPool<Individual>;
}
```

### 2. Memory Management
- **Object Pooling**: Reuse individual objects
- **Spatial Partitioning**: Efficient collision detection
- **Update Throttling**: Limit update frequency for distant individuals
- **Sprite Optimization**: Shared sprite sheets for individuals

## 🎯 Game Balance

### 1. Spawning Rates
```typescript
const INDIVIDUAL_SPAWN_INTERVAL = 2000; // 2 seconds between spawns
const MAX_INDIVIDUALS_PER_GROUP = 5;     // Maximum individuals per group
const ACTIVITY_SEARCH_RADIUS = 20;         // Search radius for activities
```

### 2. Activity Duration
```typescript
const BASE_ENJOYMENT_DURATION = 3000;     // 3 seconds base
const ENJOYMENT_VARIANCE = 2000;         // ±2 seconds variance
const ACTIVITY_OCCUPANCY_DURATION = 5000;  // 5 seconds max occupancy
```

### 3. Movement Speed
```typescript
const INDIVIDUAL_SPEED = 2.0;            // Faster than groups
const RETURN_SPEED_MULTIPLIER = 1.5;      // Faster when returning
```

## 🔄 State Machine Integration

### 1. Group State Modifications
```typescript
// Enhanced group states
type GroupState = 
  | 'spawning'
  | 'idle'
  | 'seeking_settlement'
  | 'wandering'
  | 'settled'           // Can spawn individuals
  | 'calling_back'      // Calling individuals to return
  | 'waiting_return'    // Waiting for all individuals
  | 'leaving'
  | 'despawned';
```

### 2. State Transitions with Individuals
```typescript
// Group transition logic
if (group.state === 'settled' && shouldLeave(group)) {
  group.state = 'calling_back';
  initiateGroupLeave(group, groupIndividuals);
}

if (group.state === 'waiting_return' && canGroupLeave(group, groupIndividuals)) {
  group.state = 'leaving';
}
```

## 📈 Implementation Phases

### Phase 1: Core Individual System
1. Create Individual entity and state management
2. Implement basic spawning from settled groups
3. Add simple movement and state transitions
4. Create placeholder sprites

### Phase 2: Activity System
1. Implement ActivityManager for water tile management
2. Add activity seeking and enjoyment logic
3. Implement activity occupancy system
4. Add return-to-group behavior

### Phase 3: Visual Polish
1. Create dedicated individual sprite sheets
2. Add state-based visual feedback
3. Implement activity occupancy indicators
4. Add smooth animations and transitions

### Phase 4: Performance Optimization
1. Implement spatial partitioning
2. Add object pooling for individuals
3. Optimize rendering with culling
4. Balance update frequencies

## 🎮 Expected Player Experience

Players will see settled groups spawn smaller individual units that actively seek water activities, enjoy them, and return to their parent group. This creates:

1. **Visual Richness**: More movement and activity on the beach
2. **Strategic Depth**: Groups must wait for individuals before leaving
3. **Realistic Behavior**: Groups send members to activities while maintaining cohesion
4. **Activity Management**: Water tiles become valuable resources for enjoyment

The system enhances the beach simulation by adding micro-interactions while maintaining group-based gameplay mechanics.
