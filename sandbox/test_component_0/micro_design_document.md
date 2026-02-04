# 🏠 Micro Design Document
## Test Component 0: Establishment & People Group Interaction
### Version 0.1 | Prototype Phase

---

# 📋 OVERVIEW

This document defines the core interaction loop between two fundamental game components:
1. **Establishment** - A stationary entity that can receive visitors
2. **People Group** - A mobile entity that seeks establishments

This prototype validates the basic attraction-visit-departure loop that will scale to the full Beach Alley simulation.

---

# 🏠 COMPONENT 1: ESTABLISHMENT

## Definition
An **Establishment** is a static game entity representing a place that can attract and serve people groups. In this prototype, it's represented as a simple house.

## Properties

```typescript
interface Establishment {
  id: string;
  
  // Position
  position: Vector2;
  
  // Capacity
  maxCapacity: number;          // Maximum people it can hold
  currentOccupancy: number;     // Current people inside
  
  // State
  state: EstablishmentState;
  
  // Attraction
  attractionRadius: number;     // How far it attracts people
  attractionPower: number;      // How strongly it attracts (0-100)
  
  // Conditions
  isOpen: boolean;              // Is it accepting visitors?
  entryRequirements: EntryRequirement[];
  
  // Timers
  serviceTime: number;          // How long people stay (ms)
  
  // Statistics
  totalVisitors: number;
  totalRevenue: number;
}
```

## Establishment States

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTABLISHMENT STATES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────┐                                                  │
│   │  CLOSED  │  ── isOpen = true ──▶  ┌──────────┐             │
│   │          │                         │ DESERTED │             │
│   └──────────┘  ◀── isOpen = false ── └──────────┘             │
│                                              │                   │
│                                              │ occupancy > 0     │
│                                              ▼                   │
│                                        ┌──────────┐             │
│                                        │ VISITED  │             │
│                                        │ (1-49%)  │             │
│                                        └──────────┘             │
│                                              │                   │
│                                              │ occupancy >= 50%  │
│                                              ▼                   │
│                                        ┌──────────┐             │
│                                        │   BUSY   │             │
│                                        │ (50-89%) │             │
│                                        └──────────┘             │
│                                              │                   │
│                                              │ occupancy >= 90%  │
│                                              ▼                   │
│                                        ┌──────────┐             │
│                                        │ CROWDED  │             │
│                                        │ (90-100%)│             │
│                                        └──────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### State Definitions

| State | Occupancy % | Visual Indicator | Effect on Attraction |
|-------|-------------|------------------|---------------------|
| `CLOSED` | N/A | Lights off, door closed | 0 (no attraction) |
| `DESERTED` | 0% | Lights on, empty | 100% attraction |
| `VISITED` | 1-49% | Some activity | 120% attraction (social proof) |
| `BUSY` | 50-89% | Lots of activity | 80% attraction |
| `CROWDED` | 90-100% | Packed, queue visible | 40% attraction |

```typescript
type EstablishmentState = 'closed' | 'deserted' | 'visited' | 'busy' | 'crowded';

function calculateState(establishment: Establishment): EstablishmentState {
  if (!establishment.isOpen) return 'closed';
  
  const occupancyPercent = (establishment.currentOccupancy / establishment.maxCapacity) * 100;
  
  if (occupancyPercent === 0) return 'deserted';
  if (occupancyPercent < 50) return 'visited';
  if (occupancyPercent < 90) return 'busy';
  return 'crowded';
}
```

## Entry Requirements

Conditions that must be met for a people group to enter:

```typescript
type EntryRequirement = 
  | { type: 'minGroupSize'; value: number }      // Group must have at least X people
  | { type: 'maxGroupSize'; value: number }      // Group must have at most X people
  | { type: 'hasMoney'; value: number }          // Group must have at least X money
  | { type: 'timeOfDay'; from: number; to: number }  // Only open certain hours
  | { type: 'weather'; allowed: WeatherType[] }  // Only open in certain weather
  | { type: 'groupType'; allowed: GroupType[] }; // Only accepts certain group types
```

---

# 👥 COMPONENT 2: PEOPLE GROUP

## Definition
A **People Group** is a mobile entity representing one or more people moving together. They spawn under certain conditions, seek establishments, and leave when conditions change.

## Properties

```typescript
interface PeopleGroup {
  id: string;
  
  // Composition
  size: number;                 // Number of people in group
  type: GroupType;              // Type of group
  
  // Position & Movement
  position: Vector2;
  targetPosition: Vector2 | null;
  speed: number;                // Movement speed (pixels/sec)
  
  // State
  state: GroupState;
  currentEstablishment: string | null;  // ID of establishment they're in
  
  // Needs & Desires
  desire: number;               // How much they want to visit (0-100)
  patience: number;             // How long they'll wait/stay (0-100)
  satisfaction: number;         // Current satisfaction (0-100)
  money: number;                // Available budget
  
  // Timers
  spawnTime: number;            // When they appeared
  timeInEstablishment: number;  // How long they've been inside
  maxWaitTime: number;          // Max time they'll wait in queue
  
  // Conditions
  leaveConditions: LeaveCondition[];
}
```

## Group Types

| Type | Size Range | Behavior | Preferences |
|------|------------|----------|-------------|
| `solo` | 1 | Quick decisions, impatient | Any establishment |
| `couple` | 2 | Medium patience, romantic | Quiet places |
| `family` | 3-5 | High patience, needs space | Family-friendly |
| `friends` | 3-8 | Social, follows crowds | Popular places |
| `tour` | 10-20 | Very patient, guided | Must visit all |

```typescript
type GroupType = 'solo' | 'couple' | 'family' | 'friends' | 'tour';
```

## Group States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PEOPLE GROUP STATES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐                                                              │
│   │ SPAWNING │──▶ spawn animation complete ──▶┌──────────┐                 │
│   └──────────┘                                 │  IDLE    │                 │
│                                                └──────────┘                 │
│                                                      │                      │
│                         ┌────────────────────────────┼────────────────┐     │
│                         │                            │                │     │
│                         ▼                            ▼                ▼     │
│                   ┌──────────┐              ┌──────────┐       ┌──────────┐│
│                   │ SEEKING  │              │ WANDERING│       │ LEAVING  ││
│                   │(has target)│             │(no target)│       │          ││
│                   └──────────┘              └──────────┘       └──────────┘│
│                         │                            │                │     │
│                         │ reached target             │                │     │
│                         ▼                            │                ▼     │
│                   ┌──────────┐                       │          ┌──────────┐│
│                   │ QUEUING  │◀──────────────────────┘          │DESPAWNED ││
│                   │          │  found target while wandering    └──────────┘│
│                   └──────────┘                                              │
│                         │                                                   │
│                         │ reached front of queue                            │
│                         ▼                                                   │
│                   ┌──────────┐                                              │
│                   │ ENTERING │                                              │
│                   └──────────┘                                              │
│                         │                                                   │
│                         │ inside establishment                              │
│                         ▼                                                   │
│                   ┌──────────┐                                              │
│                   │ VISITING │──▶ leave condition met ──▶ LEAVING           │
│                   └──────────┘                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```typescript
type GroupState = 
  | 'spawning'
  | 'idle'
  | 'seeking'
  | 'wandering'
  | 'queuing'
  | 'entering'
  | 'visiting'
  | 'leaving'
  | 'despawned';
```

---

# 🎯 SPAWN CONDITIONS

## When Do People Groups Appear?

People groups spawn when **spawn conditions** are met. Multiple conditions can be combined.

```typescript
type SpawnCondition = 
  | { type: 'time'; from: number; to: number }           // Time of day (hour)
  | { type: 'weather'; allowed: WeatherType[] }          // Weather condition
  | { type: 'establishmentExists'; nearby: boolean }     // An establishment exists
  | { type: 'establishmentState'; states: EstablishmentState[] }  // Establishment in state
  | { type: 'random'; probability: number }              // Random chance (0-1)
  | { type: 'interval'; every: number }                  // Every X milliseconds
  | { type: 'maxGroups'; limit: number };                // Cap on total groups
```

### Example Spawn Rules

```typescript
const SPAWN_RULES: SpawnRule[] = [
  {
    id: 'morning_visitors',
    conditions: [
      { type: 'time', from: 8, to: 12 },
      { type: 'weather', allowed: ['sunny', 'partly_cloudy'] },
      { type: 'establishmentState', states: ['deserted', 'visited'] },
      { type: 'random', probability: 0.3 },
      { type: 'maxGroups', limit: 10 },
    ],
    groupTypes: ['solo', 'couple'],
    spawnRate: 5000,  // Check every 5 seconds
  },
  {
    id: 'afternoon_families',
    conditions: [
      { type: 'time', from: 12, to: 18 },
      { type: 'weather', allowed: ['sunny'] },
      { type: 'random', probability: 0.2 },
    ],
    groupTypes: ['family', 'friends'],
    spawnRate: 8000,
  },
];
```

---

# 🚪 ENTRY CONDITIONS

## When Does a Group Choose an Establishment?

A people group will seek an establishment when:

```typescript
interface AttractionCheck {
  // Distance check
  isWithinRadius: boolean;
  distance: number;
  
  // Establishment state
  isOpen: boolean;
  hasCapacity: boolean;
  meetsRequirements: boolean;
  
  // Group state
  groupHasDesire: boolean;
  groupCanAfford: boolean;
  
  // Final score
  attractionScore: number;  // 0-100
}

function shouldSeekEstablishment(
  group: PeopleGroup,
  establishment: Establishment
): boolean {
  // Basic checks
  if (!establishment.isOpen) return false;
  if (establishment.currentOccupancy >= establishment.maxCapacity) return false;
  
  // Distance check
  const distance = calculateDistance(group.position, establishment.position);
  if (distance > establishment.attractionRadius) return false;
  
  // Entry requirements
  for (const req of establishment.entryRequirements) {
    if (!meetsRequirement(group, req)) return false;
  }
  
  // Calculate attraction score
  const stateMultiplier = STATE_ATTRACTION_MULTIPLIERS[establishment.state];
  const baseAttraction = establishment.attractionPower * stateMultiplier;
  const distanceFactor = 1 - (distance / establishment.attractionRadius);
  const desireFactor = group.desire / 100;
  
  const finalScore = baseAttraction * distanceFactor * desireFactor;
  
  // Probabilistic decision based on score
  return Math.random() * 100 < finalScore;
}
```

### Attraction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATTRACTION DECISION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GROUP SPAWNS                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Scan for nearby │                                            │
│  │ establishments  │                                            │
│  └─────────────────┘                                            │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐     NO      ┌─────────────────┐            │
│  │ Any within      │───────────▶│ Enter WANDERING │            │
│  │ attraction      │             │ state           │            │
│  │ radius?         │             └─────────────────┘            │
│  └─────────────────┘                                            │
│       │ YES                                                      │
│       ▼                                                          │
│  ┌─────────────────┐     NO      ┌─────────────────┐            │
│  │ Is establishment│───────────▶│ Skip this one,  │            │
│  │ OPEN?           │             │ check next      │            │
│  └─────────────────┘             └─────────────────┘            │
│       │ YES                                                      │
│       ▼                                                          │
│  ┌─────────────────┐     NO      ┌─────────────────┐            │
│  │ Has CAPACITY?   │───────────▶│ Skip or QUEUE   │            │
│  └─────────────────┘             └─────────────────┘            │
│       │ YES                                                      │
│       ▼                                                          │
│  ┌─────────────────┐     NO      ┌─────────────────┐            │
│  │ Group meets     │───────────▶│ Skip this one   │            │
│  │ REQUIREMENTS?   │             └─────────────────┘            │
│  └─────────────────┘                                            │
│       │ YES                                                      │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Calculate       │                                            │
│  │ ATTRACTION      │                                            │
│  │ SCORE           │                                            │
│  └─────────────────┘                                            │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐     NO      ┌─────────────────┐            │
│  │ Random roll     │───────────▶│ Maybe later,    │            │
│  │ < score?        │             │ keep wandering  │            │
│  └─────────────────┘             └─────────────────┘            │
│       │ YES                                                      │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Enter SEEKING   │                                            │
│  │ state, move to  │                                            │
│  │ establishment   │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🚶 LEAVE CONDITIONS

## When Does a Group Leave an Establishment?

```typescript
type LeaveCondition = 
  | { type: 'timeElapsed'; duration: number }           // Been here X ms
  | { type: 'satisfactionLow'; threshold: number }      // Satisfaction dropped below X
  | { type: 'moneyDepleted'; threshold: number }        // Money dropped below X
  | { type: 'patienceExhausted' }                       // Patience reached 0
  | { type: 'establishmentClosed' }                     // Establishment closed
  | { type: 'overcrowded'; threshold: number }          // Occupancy exceeded X%
  | { type: 'weatherChanged'; badWeather: WeatherType[] }  // Weather turned bad
  | { type: 'timeOfDay'; after: number }                // After hour X
  | { type: 'random'; probability: number };            // Random chance per tick
```

### Leave Decision Logic

```typescript
function shouldLeave(
  group: PeopleGroup,
  establishment: Establishment,
  conditions: LeaveCondition[]
): { shouldLeave: boolean; reason: string } {
  
  for (const condition of conditions) {
    switch (condition.type) {
      case 'timeElapsed':
        if (group.timeInEstablishment >= condition.duration) {
          return { shouldLeave: true, reason: 'Time to go' };
        }
        break;
        
      case 'satisfactionLow':
        if (group.satisfaction < condition.threshold) {
          return { shouldLeave: true, reason: 'Not satisfied' };
        }
        break;
        
      case 'moneyDepleted':
        if (group.money < condition.threshold) {
          return { shouldLeave: true, reason: 'Out of money' };
        }
        break;
        
      case 'patienceExhausted':
        if (group.patience <= 0) {
          return { shouldLeave: true, reason: 'Lost patience' };
        }
        break;
        
      case 'establishmentClosed':
        if (!establishment.isOpen) {
          return { shouldLeave: true, reason: 'Establishment closed' };
        }
        break;
        
      case 'overcrowded':
        const occupancy = (establishment.currentOccupancy / establishment.maxCapacity) * 100;
        if (occupancy > condition.threshold) {
          return { shouldLeave: true, reason: 'Too crowded' };
        }
        break;
        
      case 'random':
        if (Math.random() < condition.probability) {
          return { shouldLeave: true, reason: 'Decided to leave' };
        }
        break;
    }
  }
  
  return { shouldLeave: false, reason: '' };
}
```

### Leave Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       LEAVE DECISION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GROUP IN VISITING STATE                                         │
│       │                                                          │
│       ▼ (Every tick)                                             │
│  ┌─────────────────┐                                            │
│  │ Update timers   │                                            │
│  │ & satisfaction  │                                            │
│  └─────────────────┘                                            │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Check ALL leave │                                            │
│  │ conditions      │                                            │
│  └─────────────────┘                                            │
│       │                                                          │
│       ├─── Time elapsed > serviceTime? ─────▶ LEAVE             │
│       │                                                          │
│       ├─── Satisfaction < 20? ──────────────▶ LEAVE (unhappy)   │
│       │                                                          │
│       ├─── Money < 0? ──────────────────────▶ LEAVE (broke)     │
│       │                                                          │
│       ├─── Establishment closed? ───────────▶ LEAVE (kicked)    │
│       │                                                          │
│       ├─── Patience <= 0? ──────────────────▶ LEAVE (fed up)    │
│       │                                                          │
│       ├─── Random leave chance? ────────────▶ LEAVE (bored)     │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ No conditions   │                                            │
│  │ met, continue   │                                            │
│  │ VISITING        │                                            │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 🔄 GAMEPLAY LOOP

## Main Loop Sequence

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MAIN GAMEPLAY LOOP                                 │
│                         (Runs every game tick)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        1. SPAWN PHASE                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  • Check spawn conditions against current game state                 │    │
│  │  • If conditions met → Create new PeopleGroup                        │    │
│  │  • Initialize group properties (type, size, money, desires)          │    │
│  │  • Place at spawn point (map edge or designated area)                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      2. DECISION PHASE                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each IDLE or WANDERING group:                                   │    │
│  │  • Scan nearby establishments                                        │    │
│  │  • Calculate attraction scores                                       │    │
│  │  • Make probabilistic decision to seek or continue wandering         │    │
│  │  • Update group state accordingly                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       3. MOVEMENT PHASE                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each SEEKING, WANDERING, or LEAVING group:                      │    │
│  │  • Calculate next position based on speed and target                 │    │
│  │  • Update position                                                   │    │
│  │  • Check if reached destination → Update state                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        4. ENTRY PHASE                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each group that reached an establishment:                       │    │
│  │  • Verify entry requirements still met                               │    │
│  │  • If establishment has capacity → Enter (add to occupancy)          │    │
│  │  • If no capacity → Enter queue or give up                           │    │
│  │  • Update establishment state based on new occupancy                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        5. VISIT PHASE                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each VISITING group:                                            │    │
│  │  • Increment time in establishment                                   │    │
│  │  • Update satisfaction based on establishment quality                │    │
│  │  • Deduct money for services                                         │    │
│  │  • Decay patience if issues exist                                    │    │
│  │  • Generate revenue for establishment                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        6. LEAVE PHASE                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each VISITING group:                                            │    │
│  │  • Check all leave conditions                                        │    │
│  │  • If any condition met → Exit establishment                         │    │
│  │  • Decrement establishment occupancy                                 │    │
│  │  • Update establishment state                                        │    │
│  │  • Set group to LEAVING state with exit destination                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       7. CLEANUP PHASE                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each LEAVING group that reached exit:                           │    │
│  │  • Record statistics (satisfaction, money spent, time)               │    │
│  │  • Remove from active groups                                         │    │
│  │  • Despawn (remove from rendering)                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   8. STATE UPDATE PHASE                              │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  For each establishment:                                             │    │
│  │  • Recalculate state based on current occupancy                      │    │
│  │  • Update visual representation                                      │    │
│  │  • Emit state change events if state changed                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│                            [NEXT TICK]                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Loop Implementation

```typescript
// Core game loop function
function gameLoop(deltaTime: number, state: GameState): GameState {
  let newState = { ...state };
  
  // 1. SPAWN PHASE
  newState = spawnPhase(newState, deltaTime);
  
  // 2. DECISION PHASE
  newState = decisionPhase(newState);
  
  // 3. MOVEMENT PHASE
  newState = movementPhase(newState, deltaTime);
  
  // 4. ENTRY PHASE
  newState = entryPhase(newState);
  
  // 5. VISIT PHASE
  newState = visitPhase(newState, deltaTime);
  
  // 6. LEAVE PHASE
  newState = leavePhase(newState);
  
  // 7. CLEANUP PHASE
  newState = cleanupPhase(newState);
  
  // 8. STATE UPDATE PHASE
  newState = stateUpdatePhase(newState);
  
  return newState;
}
```

---

# 📊 STATE INTERACTIONS

## How Components Affect Each Other

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        STATE INTERACTION DIAGRAM                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│    PEOPLE GROUP                              ESTABLISHMENT                    │
│    ════════════                              ═════════════                    │
│                                                                               │
│    ┌─────────────┐      attracts       ┌─────────────────┐                   │
│    │   desire    │◀────────────────────│ attractionPower │                   │
│    └─────────────┘                     └─────────────────┘                   │
│                                                                               │
│    ┌─────────────┐       enters        ┌─────────────────┐                   │
│    │    size     │────────────────────▶│ currentOccupancy│                   │
│    └─────────────┘                     └─────────────────┘                   │
│                                                  │                            │
│                                                  │ affects                    │
│                                                  ▼                            │
│    ┌─────────────┐                     ┌─────────────────┐                   │
│    │ satisfaction│◀────────────────────│     state       │                   │
│    └─────────────┘     determines      └─────────────────┘                   │
│           │                                      │                            │
│           │ affects                              │ changes                    │
│           ▼                                      ▼                            │
│    ┌─────────────┐                     ┌─────────────────┐                   │
│    │   money     │────────────────────▶│   totalRevenue  │                   │
│    └─────────────┘      generates      └─────────────────┘                   │
│                                                                               │
│    ┌─────────────┐      leaves         ┌─────────────────┐                   │
│    │   state     │────────────────────▶│ currentOccupancy│ (decrements)      │
│    │ (LEAVING)   │                     └─────────────────┘                   │
│    └─────────────┘                                                           │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## State Change Events

```typescript
// Events emitted during state changes
type GameEvent = 
  // People Group Events
  | { type: 'GROUP_SPAWNED'; group: PeopleGroup }
  | { type: 'GROUP_STARTED_SEEKING'; groupId: string; targetId: string }
  | { type: 'GROUP_ENTERED'; groupId: string; establishmentId: string }
  | { type: 'GROUP_LEFT'; groupId: string; establishmentId: string; reason: string }
  | { type: 'GROUP_DESPAWNED'; groupId: string; stats: GroupStats }
  
  // Establishment Events
  | { type: 'ESTABLISHMENT_STATE_CHANGED'; id: string; from: EstablishmentState; to: EstablishmentState }
  | { type: 'ESTABLISHMENT_FULL'; id: string }
  | { type: 'ESTABLISHMENT_EMPTY'; id: string }
  | { type: 'ESTABLISHMENT_REVENUE'; id: string; amount: number };
```

---

# 🎮 PROTOTYPE CONFIGURATION

## Default Values for Testing

```typescript
const PROTOTYPE_CONFIG = {
  // Establishment defaults
  establishment: {
    maxCapacity: 10,
    attractionRadius: 200,      // pixels
    attractionPower: 70,
    serviceTime: 10000,         // 10 seconds
    entryRequirements: [],
  },
  
  // People Group defaults
  peopleGroup: {
    speed: 50,                  // pixels per second
    initialDesire: 80,
    initialPatience: 100,
    initialSatisfaction: 100,
    initialMoney: 100,
    maxWaitTime: 5000,          // 5 seconds
  },
  
  // Spawn configuration
  spawn: {
    interval: 3000,             // Check every 3 seconds
    probability: 0.5,           // 50% chance per check
    maxGroups: 20,
  },
  
  // Satisfaction decay
  satisfaction: {
    baseDecayPerSecond: 1,
    crowdedPenalty: 2,          // Extra decay when crowded
    goodServiceBonus: 0.5,      // Decay reduction with good service
  },
  
  // Leave conditions
  leave: {
    minVisitTime: 5000,         // At least 5 seconds
    maxVisitTime: 30000,        // At most 30 seconds
    satisfactionThreshold: 20,  // Leave if below 20
    randomLeaveChance: 0.01,    // 1% per tick
  },
};
```

---

# 🧪 TEST SCENARIOS

## Scenario 1: Basic Flow
```
1. Start with one establishment (DESERTED)
2. Spawn one group (solo)
3. Group should detect establishment
4. Group moves toward establishment
5. Group enters → Establishment becomes VISITED
6. After serviceTime → Group leaves
7. Establishment becomes DESERTED again
```

## Scenario 2: Capacity Test
```
1. Start with one establishment (capacity: 5)
2. Spawn 10 groups rapidly
3. First 5 should enter → CROWDED state
4. Next 5 should queue or wander
5. As groups leave, queued groups enter
```

## Scenario 3: Leave Conditions
```
1. Establishment with poor satisfaction modifier
2. Spawn group with patience: 50
3. Group enters
4. Satisfaction drops over time
5. When satisfaction < threshold → Group leaves early
```

## Scenario 4: State Transitions
```
1. Track establishment state through:
   DESERTED → VISITED → BUSY → CROWDED → BUSY → VISITED → DESERTED
2. Verify correct thresholds trigger transitions
3. Verify attraction multipliers change with state
```

---

# 📁 FILE STRUCTURE FOR IMPLEMENTATION

```
test_component_0/
├── micro_design_document.md     # This document
├── src/
│   ├── types/
│   │   ├── establishment.ts     # Establishment interfaces
│   │   ├── peopleGroup.ts       # PeopleGroup interfaces
│   │   ├── conditions.ts        # Spawn/Entry/Leave conditions
│   │   └── events.ts            # Event types
│   │
│   ├── entities/
│   │   ├── Establishment.ts     # Establishment class
│   │   └── PeopleGroup.ts       # PeopleGroup class
│   │
│   ├── systems/
│   │   ├── SpawnSystem.ts       # Handles spawning
│   │   ├── DecisionSystem.ts    # Handles attraction decisions
│   │   ├── MovementSystem.ts    # Handles movement
│   │   ├── VisitSystem.ts       # Handles visiting logic
│   │   └── StateSystem.ts       # Handles state updates
│   │
│   ├── config/
│   │   └── prototype.config.ts  # Default values
│   │
│   └── index.ts                 # Main entry, game loop
│
└── tests/
    ├── establishment.test.ts
    ├── peopleGroup.test.ts
    └── gameLoop.test.ts
```

---

*Micro Design Document v0.1*
*Test Component 0: Establishment & People Group*

```
    ┌─────────────────────────────────────────┐
    │  🏠 + 👥 = 🎮                           │
    │                                         │
    │  Simple components,                     │
    │  Emergent gameplay                      │
    └─────────────────────────────────────────┘
```
