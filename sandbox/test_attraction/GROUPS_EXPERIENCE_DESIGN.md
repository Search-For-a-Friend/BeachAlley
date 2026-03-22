# Groups Experience & Beach Attraction System Design

## 🎯 Core Concept

Groups seek beach experiences for immediate enjoyment and satisfaction. Their beach-going tendencies drive the overall attraction of the beach, creating a key gameplay loop where visitor satisfaction directly impacts beach popularity and growth.

## 🔄 Core Gameplay Loop

```
New Groups Spawn → Evaluate Beach Conditions → Settle on Beach → Gain Fun Based on Settlement Rules → Leave Beach → Attract More Groups
```

## 🏖️ Beach Attraction Mechanics

### 1. Beach Evaluation & Settlement Behavior
- **Beach Assessment**: Groups evaluate beach conditions before deciding to settle
- **Settlement Decision**: Based on beach quality and group preferences
- **Smart Settlement**: Groups choose optimal locations after beach evaluation

### 2. Attraction System
- **Base Attraction**: Inherent beach appeal value
- **Dynamic Multiplier**: Modified by current group satisfaction levels
- **New Group Generation**: Higher attraction = more frequent group spawning

### 3. Satisfaction Feedback Loop
- **Fun Accumulation**: Time spent on beach directly increases group satisfaction
- **Expectation Management**: Groups compare current fun to previous experiences
- **Attraction Impact**: Satisfied groups boost overall beach attraction

## 📊 Settlement-Based Fun System

### 1. Fun Generation Rules
Groups generate fun based on settlement conditions and group size:

**Individual Groups (1 person):**
- **Base Fun Rate**: 1.0x fun per second (always satisfied)
- **No Requirements**: Can settle anywhere on sand
- **Consistent Enjoyment**: Steady fun accumulation regardless of surroundings

**Small Groups (2-3 people):**
- **Base Fun Rate**: 0.8x fun per second
- **Social Bonus**: +0.2x fun per nearby settled group (up to 3 groups)
- **Maximum Fun Rate**: 1.4x fun per second (with 3+ nearby groups)
- **Social Requirement**: Prefer settling near other groups for maximum enjoyment

**Large Groups (4+ people):**
- **Base Fun Rate**: 0.7x fun per second
- **Crowding Penalty**: -0.1x fun per nearby settled group
- **Minimum Fun Rate**: 0.4x fun per second (with 3+ nearby groups)
- **Isolation Preference**: Maximum fun when settled away from other groups

### 2. Settlement Fun Calculation
```typescript
interface SettlementFun {
  baseFunRate: number;           // Base rate based on group size
  nearbyGroups: number;          // Count of nearby settled groups
  socialBonus: number;           // Fun bonus/penalty from nearby groups
  currentFunRate: number;        // Actual fun rate after modifiers
  totalFun: number;              // Accumulated fun during settlement
}
```

### 3. Fun Accumulation System
```typescript
interface GroupFunExperience {
  currentFun: number;            // Current accumulated fun (0-100)
  funRate: number;              // Current fun rate per second
  settlementStartTime: number;   // When group settled
  totalSettlementTime: number;   // Time spent settled
  nearbyGroupHistory: number[];  // History of nearby group counts
}
```

## 🎮 Implementation Components

### 1. Settlement Fun Manager
```typescript
class SettlementFunManager {
  // Track settlement-based fun accumulation
  updateGroupFun(groupId: string, deltaTime: number): void;
  calculateSettlementFunRate(groupSize: number, nearbyGroups: number): number;
  countNearbySettledGroups(position: Vector2, radius: number): number;
  updateGroupSatisfaction(group: PeopleGroup): void;
}
```

### 2. Beach Attraction Calculator
```typescript
class BeachAttractionCalculator {
  // Calculate beach attraction based on settlement satisfaction
  calculateBaseAttraction(): number;
  applySatisfactionMultiplier(baseAttraction: number, averageSatisfaction: number): number;
  getGroupSpawnRate(attraction: number): number;
  updateOverallAttraction(): void;
}
```

### 3. Settlement History Tracker
```typescript
interface SettlementHistory {
  groupId: string;
  settlementStartTime: number;
  settlementEndTime: number;
  funGained: number;
  satisfactionLevel: number;
  nearbyGroupsCount: number;
  settlementQuality: number;
}
```

## 🏖️ Settlement Fun States

### 1. Settlement Seeking
- **State**: `seeking_settlement`
- **Behavior**: Groups actively search for optimal settlement locations
- **Decision Making**: Evaluate settlement locations based on group size requirements

### 2. Active Settlement
- **State**: `settled`
- **Behavior**: Groups accumulate fun based on settlement rules
- **Fun Generation**: Continuous fun accumulation based on nearby groups

### 3. Settlement Departure
- **State**: `leaving_settlement`
- **Behavior**: Groups leave based on satisfaction and time limits
- **Memory**: Store settlement experience for future expectations

## 📈 Satisfaction & Expectation Dynamics

### 1. Settlement-Based Fun Accumulation
```typescript
// Track search duration for efficiency bonus
let searchStartTime = Date.now();

// Fun gained based on settlement conditions and group size rules
const nearbyGroups = countNearbySettledGroups(group.position, 5);
const searchDuration = (Date.now() - searchStartTime) / 1000; // seconds

// Calculate base fun rate and apply search penalty
const baseFunRate = calculateSettlementFunRate(group.size, nearbyGroups);
const searchingFunRate = calculateSearchingFunRate(baseFunRate, searchDuration);

// Apply settlement efficiency bonus when settling
const efficiencyBonus = calculateSettlementEfficiencyBonus(group.size, searchDuration);
const finalFunRate = group.state === 'settled' 
  ? (baseFunRate + efficiencyBonus)
  : searchingFunRate;

group.currentFun = Math.min(group.currentFun + finalFunRate * deltaTime, group.maxFun);

// Reset search timer when settled
if (group.state === 'settled') {
  searchStartTime = Date.now();
}
```

### 2. Group Size Fun Rate Calculation
```typescript
function calculateSettlementFunRate(groupSize: number, nearbyGroups: number): number {
  if (groupSize === 1) {
    // Individuals: always 1.0x fun rate
    return 1.0;
  } else if (groupSize <= 3) {
    // Small groups: base 0.8x + social bonus
    const socialBonus = Math.min(nearbyGroups * 0.2, 0.6); // Max +0.6x
    return 0.8 + socialBonus;
  } else {
    // Large groups: base 0.7x - crowding penalty
    const crowdingPenalty = Math.min(nearbyGroups * 0.1, 0.3); // Max -0.3x
    return Math.max(0.7 - crowdingPenalty, 0.4);
  }
}

function calculateSearchingFunRate(baseRate: number, searchDuration: number): number {
  // Fun loss while searching/walking
  const searchPenalty = Math.min(searchDuration / 60, 0.5); // Max 0.5x penalty
  return Math.max(baseRate * (1.0 - searchPenalty), 0.1); // Minimum 0.1x
}
```

### 3. Settlement Efficiency Bonus
```typescript
function calculateSettlementEfficiencyBonus(groupSize: number, searchDuration: number): number {
  // Bonus for finding settlement quickly
  const efficiencyScore = Math.max(1.0 - (searchDuration / 120), 0.0); // 2 minutes = perfect
  return efficiencyScore * 0.3; // Max +0.3x bonus
}
```

### 3. Satisfaction Based on Fun Achievement
```typescript
// Satisfaction based on achieved fun vs group expectations
const satisfactionScore = calculateSettlementSatisfaction(
  group.currentFun,
  group.expectedFunLevel,
  group.totalSettlementTime
);
```

## 🎯 Beach Attraction Impact

### 1. Attraction Formula
```typescript
const overallAttraction = baseAttraction * satisfactionMultiplier;

// Satisfaction multiplier based on average group satisfaction
const satisfactionMultiplier = 1.0 + (averageSatisfaction - 50) / 100;
// Range: 0.5x (very unsatisfied) to 1.5x (very satisfied)
```

### 2. Group Spawn Rate
```typescript
// More attraction = more frequent group spawning
const spawnInterval = baseSpawnInterval / attractionMultiplier;

// Minimum spawn interval to prevent overwhelming
const finalSpawnInterval = Math.max(spawnInterval, minSpawnInterval);
```

### 3. Beach Reputation
```typescript
// Long-term beach reputation based on satisfaction history
const beachReputation = calculateReputation(satisfactionHistory);

// Reputation affects base attraction
const baseAttraction = calculateBaseAttraction(beachReputation);
```

## 🎨 Visual Feedback Systems

### 1. Group Satisfaction Indicators
- **Color Coding**: Group colors change based on satisfaction level
- **Emoji States**: Different emojis for satisfaction ranges
- **Progress Bars**: Visual fun accumulation bars

### 2. Beach Attraction Display
- **Attraction Meter**: Shows current beach attraction level
- **Satisfaction Graph**: Displays average satisfaction trends
- **Reputation Badge**: Visual reputation indicator

### 3. Experience Notifications
- **Fun Gained**: Floating numbers showing fun accumulation
- **Satisfaction Alerts**: Notifications when expectations met/exceeded
- **Beach Popularity**: Updates when attraction changes

## 🎮 Game Balance Considerations

### 1. Fun Rates
- **Individuals**: Higher fun rate (more easily satisfied)
- **Small Groups**: Moderate fun rate (social enjoyment)
- **Large Groups**: Lower fun rate (harder to satisfy everyone)

### 2. Expectation Scaling
- **First Visit**: Moderate expectations based on beach appearance
- **Return Visits**: Expectations based on previous experiences
- **Exceptional Experiences**: Bonus satisfaction increases future expectations

### 3. Attraction Decay
- **Time-Based**: Attraction slowly decreases without satisfied groups
- **Negative Feedback**: Poor satisfaction reduces attraction more quickly
- **Recovery**: Positive experiences gradually restore attraction

## 🔄 State Machine Integration

### 1. Beach Evaluation States
```typescript
// Include beach evaluation phase
type GroupState = 
  | 'spawning'
  | 'idle'
  | 'evaluating_beach'    // Assess beach conditions
  | 'seeking_settlement'   // Find optimal settlement after evaluation
  | 'wandering'
  | 'settled'             // Active fun accumulation
  | 'leaving'             // Leaving settlement
  | 'despawned';
```

### 2. Beach Evaluation Flow
```typescript
// Complete beach evaluation flow
spawning → idle → evaluating_beach → seeking_settlement → settled → leaving → despawned

// Groups assess beach conditions before settling
```

### 3. Beach Assessment Mechanics
- **Beach Quality Check**: Groups evaluate sand quality, crowd levels, amenities
- **Settlement Decision**: Based on beach evaluation results
- **Optimal Placement**: Choose best settlement location after assessment

## 📊 Data Tracking

### 1. Group Metrics
- **Total Visits**: Number of beach visits per group
- **Average Satisfaction**: Rolling average of satisfaction scores
- **Fun Accumulation Rate**: How quickly groups gain fun
- **Expectation Accuracy**: How well expectations match reality

### 2. Beach Metrics
- **Overall Attraction**: Current beach attraction level
- **Daily Visitors**: Number of groups visiting per day
- **Satisfaction Trends**: Historical satisfaction data
- **Reputation Score**: Long-term beach reputation

## 🎯 Success Metrics

### 1. Short-Term Goals
- Groups successfully find and enjoy beach areas
- Positive satisfaction feedback loops established
- Visual systems clearly communicate states

### 2. Long-Term Goals
- Sustainable attraction-satisfaction equilibrium
- Diverse group visitation patterns
- Meaningful reputation and progression systems

## 🚀 Implementation Priority

### Phase 1: Core Experience System
1. Implement GroupExperienceManager class
2. Add fun accumulation mechanics
3. Create satisfaction calculation system
4. Integrate with existing group states

### Phase 2: Attraction Integration
1. Implement BeachAttractionCalculator
2. Connect satisfaction to spawn rates
3. Add beach reputation system
4. Create visual feedback displays

### Phase 3: Polish & Balance
1. Fine-tune fun rates and satisfaction curves
2. Add visual effects and notifications
3. Implement advanced expectation AI
4. Balance difficulty and progression

---

## 🎮 Expected Player Experience

Players will watch as groups naturally seek beach enjoyment, creating a living ecosystem where visitor satisfaction directly impacts beach popularity. The system creates meaningful feedback loops where good experiences lead to growth, while poor experiences require improvement.

The attraction system provides clear goals (maintain high satisfaction) and visible rewards (increased visitors, beach growth), making beach management engaging and rewarding.
