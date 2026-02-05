# 🚶 Test Component 1: Pathfinding & Entrance System

## Overview

This component extends test_component_0 with a tile-based navigation system where groups must navigate through valid path tiles to reach establishment entrances.

---

## Core Concepts

### 1. Tile Types

The game grid now has different tile types that affect navigation:

```
┌─────────────────────────────────────────┐
│ TILE TYPES                               │
├─────────────────────────────────────────┤
│ • PATH         - Walkable by all groups  │
│ • ENTRANCE     - Access point to estab. │
│ • BUILDING     - Non-walkable (blocked)  │
│ • RESTRICTED   - Only certain groups     │
│ • WATER        - Blocks movement         │
│ • GRASS        - Slower movement         │
└─────────────────────────────────────────┘
```

### 2. Establishment Structure

Each establishment now has:

**Footprint:**
- Occupies multiple tiles (e.g., 2x2, 3x3)
- Most tiles are BUILDING type (non-walkable)
- One or more tiles designated as ENTRANCE

**Entrance Definition:**
```typescript
interface Entrance {
  gridX: number;      // Grid position of entrance tile
  gridY: number;
  direction: 'north' | 'south' | 'east' | 'west';  // Which side
  capacity: number;   // Queue capacity at entrance
}
```

**Example Layout (2x2 Restaurant):**
```
┌──────┬──────┐
│  🏢  │  🏢  │  Building tiles (non-walkable)
├──────┼──────┤
│  🚪  │  🏢  │  Entrance tile + Building
└──────┴──────┘
```

### 3. Group Navigation Behavior

**Old Behavior (test_component_0):**
- Groups move directly toward establishment center
- No obstacles considered
- Simple straight-line movement

**New Behavior (test_component_1):**
```
1. SELECT DESTINATION
   ↓
2. FIND ENTRANCE TILE
   ↓
3. PATHFIND to entrance through valid tiles
   ↓
4. FOLLOW PATH waypoints
   ↓
5. ARRIVE at entrance
   ↓
6. ENTER establishment
```

### 4. Pathfinding Algorithm

**A* Pathfinding:**
- Start: Current group position
- Goal: Establishment entrance tile
- Heuristic: Manhattan distance (isometric-friendly)
- Cost: Base movement cost + tile type modifiers

**Tile Movement Costs:**
```typescript
{
  PATH: 1.0,        // Normal movement
  GRASS: 1.5,       // Slightly slower
  ENTRANCE: 1.0,    // Normal (only as destination)
  BUILDING: Infinity, // Blocked
  WATER: Infinity,  // Blocked
}
```

**Path Validation:**
- Check if path exists before selecting establishment
- Recompute path if blocked (dynamic obstacles)
- Groups with different types may have different valid tiles

---

## Implementation Architecture

### Data Structures

**Grid Tile System:**
```typescript
interface Tile {
  gridX: number;
  gridY: number;
  type: TileType;
  walkable: boolean;
  movementCost: number;
  occupiedBy?: string;  // Entity ID if occupied
}

type TileType = 
  | 'path' 
  | 'grass' 
  | 'entrance' 
  | 'building' 
  | 'water'
  | 'restricted';

// 20x20 grid
const grid: Tile[][] = [];
```

**Enhanced Establishment:**
```typescript
interface Establishment {
  // ... existing properties
  footprint: {
    gridX: number;
    gridY: number;
    width: number;   // tiles
    height: number;  // tiles
  };
  entrances: Entrance[];
  buildingTiles: Vector2[];  // List of occupied tiles
}
```

**Enhanced PeopleGroup:**
```typescript
interface PeopleGroup {
  // ... existing properties
  path: Vector2[] | null;       // Waypoints to follow
  currentWaypoint: number;      // Index in path array
  pathBlockedCount: number;     // Retry counter
  allowedTileTypes: TileType[]; // What tiles can this group walk on
}
```

### Core Systems

#### 1. Grid Manager
```typescript
class GridManager {
  private grid: Tile[][];
  
  initialize(width: number, height: number): void;
  getTile(x: number, y: number): Tile | null;
  setTileType(x: number, y: number, type: TileType): void;
  isWalkable(x: number, y: number, groupType?: GroupType): boolean;
  getNeighbors(x: number, y: number): Tile[];
  markEstablishmentFootprint(establishment: Establishment): void;
}
```

#### 2. Pathfinding System
```typescript
class Pathfinder {
  findPath(
    start: Vector2,
    goal: Vector2,
    grid: Tile[][],
    allowedTiles: TileType[]
  ): Vector2[] | null;
  
  private heuristic(a: Vector2, b: Vector2): number;
  private reconstructPath(cameFrom: Map, current: Vector2): Vector2[];
}
```

#### 3. Navigation System (Game Engine Phase)
```typescript
class GameEngine {
  // NEW PHASE: Path Planning
  private pathPlanningPhase(): void {
    for (group of seeking groups) {
      if (!group.path) {
        const entrance = findNearestEntrance(group, establishment);
        const path = pathfinder.findPath(
          group.position,
          entrance,
          grid,
          group.allowedTileTypes
        );
        
        if (path) {
          group.path = path;
          group.currentWaypoint = 0;
        } else {
          // No path found - give up on this establishment
          group.state = 'wandering';
        }
      }
    }
  }
  
  // MODIFIED: Movement Phase
  private movementPhase(deltaTime: number): void {
    for (group of moving groups) {
      if (group.path && group.currentWaypoint < group.path.length) {
        // Move toward current waypoint
        const waypoint = group.path[group.currentWaypoint];
        moveTowards(group.position, waypoint, group.speed, deltaTime);
        
        if (distance(group.position, waypoint) < 0.3) {
          group.currentWaypoint++;
          
          // Reached final waypoint (entrance)?
          if (group.currentWaypoint >= group.path.length) {
            group.state = 'entering';
            group.path = null;
          }
        }
      }
    }
  }
}
```

---

## Visual Representation

### Grid Visualization

Render different tile types with distinct colors:

```
• PATH      → Dark gray (walkable)
• GRASS     → Green tint (slower)
• ENTRANCE  → Yellow highlight (destination)
• BUILDING  → Solid color (blocked)
• WATER     → Blue (blocked)
```

### Path Visualization

When a group is seeking:
- Draw their planned path as a dashed line
- Highlight current waypoint
- Show entrance tile they're heading to

---

## Test Scenarios

### Test 1: Simple Direct Path
```
┌─────────────────┐
│  👥  ─→ 🚪🏢    │  Group walks straight to entrance
└─────────────────┘
```

### Test 2: Obstacle Avoidance
```
┌──────────────────────┐
│  👥              🏢🚪 │
│      🌊🌊🌊      🏢🏢 │  Group must path around water
│                      │
└──────────────────────┘
```

### Test 3: Multiple Entrances
```
┌──────────────────┐
│  🚪  🏢🏢  🚪    │  Group picks nearest accessible entrance
│  🏢  🏢🏢  🏢    │
└──────────────────┘
```

### Test 4: Entrance Queue
```
┌──────────────────┐
│  👥→→🚪🏢        │  Multiple groups queue at entrance
│  👥→→↑           │
│  👥→→↑           │
└──────────────────┘
```

---

## Configuration for Initial Test

**Setup:**
- 20x20 grid, mostly PATH tiles
- 1 establishment (2x2) with 1 entrance on south side
- 3-4 water obstacles creating barriers
- 4 groups spawning at corners, all targeting the establishment
- Visualize their paths as colored lines

**Expected Behavior:**
- Each group computes A* path to entrance
- Groups navigate around water obstacles
- Paths may be different based on spawn position
- All converge at entrance tile
- Queue forms if entrance is crowded

---

## Future Enhancements

1. **Dynamic Pathfinding:**
   - Recompute paths when obstacles appear
   - Avoid tiles occupied by other groups

2. **Group-Specific Navigation:**
   - VIP groups can use restricted tiles
   - Families prefer grass/scenic routes
   - Large groups need wider paths

3. **Entrance Management:**
   - Queue system at entrances
   - Multiple entrance priorities
   - Entrance capacity and wait times

4. **Performance Optimization:**
   - Path caching for common routes
   - Hierarchical pathfinding for large maps
   - Jump Point Search for grid optimization

---

## Success Metrics

The system is working correctly when:
- ✅ Groups never walk through building tiles
- ✅ All groups successfully find paths when they exist
- ✅ Groups correctly navigate around obstacles
- ✅ Entrance tiles are properly identified and reached
- ✅ No groups get stuck or freeze
- ✅ Paths are visually sensible (not zigzagging randomly)
