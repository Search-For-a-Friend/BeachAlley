# 🏠 Micro Design Document
## Test Component 0: Establishment & People Group Interaction
### Version 0.2 | Isometric Architecture Phase

---

# 📋 OVERVIEW

This document defines the core interaction loop between two fundamental game components:
1. **Establishment** - A stationary entity that can receive visitors
2. **People Group** - A mobile entity that seeks establishments

This prototype validates the basic attraction-visit-departure loop that will scale to the full Beach Alley simulation.

## Architecture Principles

### Separation of Concerns

The application is structured in three distinct layers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│    APPLICATION LAYER                                                         │
│    ├── React Components (UI, Controls, Stats)                               │
│    └── PixiGameView (Renderer Integration)                                  │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    GAME LOGIC LAYER                                                          │
│    ├── GameEngine (Update Loop, Systems)                                     │
│    ├── Entities (Establishment, PeopleGroup)                                 │
│    ├── Systems (Spawn, Decision, Movement, Visit, Leave)                    │
│    └── World Coordinates (Flat 2D plane - 20x20 grid)                       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    RENDERING LAYER                                                           │
│    ├── IRenderer Interface (Abstract)                                       │
│    ├── Isometric Math (Coordinate Conversion)                               │
│    ├── PixiIsometricRenderer (Diamond Tile Implementation)                  │
│    └── Future: TableRenderer, ThreeJSRenderer, etc.                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Points:**
- Game logic operates in **world space** (flat 2D plane)
- Rendering layer projects world to **isometric screen space**
- Renderers can be swapped without touching game logic
- All coordinates in game entities are world coordinates

---

# 🎨 ISOMETRIC RENDERING SYSTEM

## Diamond Tile Perspective

Classic isometric games use a diamond (rhombus) tile projection:

```
         TOP VIEW (World Space)              ISOMETRIC VIEW (Screen Space)
         
    ╔═══════════════════╗                        ╱╲
    ║  20x20 Grid       ║                      ╱    ╲
    ║                   ║                    ╱        ╲
    ║    [1,1]→→→[20,1] ║                  ╱   Tile   ╲
    ║      ↓      ↓     ║                ╱   (64x32)   ╲
    ║   [1,20]→[20,20]  ║              ╱                ╲
    ║                   ║            ╱                    ╲
    ╚═══════════════════╝          ╱                      ╲
                                 ╱________________________╲
    
    Entities move at constant       Entities appear at varying
    speed in world space            speed on screen
```

### Coordinate Conversion

**World to Isometric:**
```typescript
screenX = (worldX - worldY) * (tileWidth / 2) + originX
screenY = (worldX + worldY) * (tileHeight / 2) + originY
```

**Isometric to World:**
```typescript
worldX = (screenX / (tileWidth / 2) + screenY / (tileHeight / 2)) / 2
worldY = (screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2
```

### Visual Speed Variation

In isometric view, constant world-space movement appears at different speeds:

```
     Movement Direction Analysis
     
     World Space (Top View):
     
     ↑ North (+Y)        All directions have
     │                   EQUAL speed (2.5 units/sec)
     │
     └────→ East (+X)
     
     
     Isometric Screen Space:
     
        ╱  NE (diagonal)    Appears FASTEST
       ╱                    (longest screen distance)
      ╱
     ╱___→  E (right)       Appears MEDIUM
         
     
     │  N (up-left)         Appears SLOWER  
     │                      (compressed Y axis)
     ↓
```

**Key Insight:** The game engine calculates movement in world space at constant speed. The renderer projects this to screen space where it naturally appears at varying speeds due to the isometric projection.

## Grid Visualization

The isometric grid is generated by converting world-space grid lines:

```
Horizontal lines:  Constant Y in world → Diamond rows on screen
Vertical lines:    Constant X in world → Diamond columns on screen

Result: Diamond lattice pattern
```

---

# 🏠 COMPONENT 1: ESTABLISHMENT

## Definition
An **Establishment** is a static game entity representing a place that can attract and serve people groups. Rendered as a diamond tile in isometric view.

## Properties (World Coordinates)

```typescript
interface Establishment {
  id: string;
  
  // Position (World Coordinates)
  position: Vector2;        // Center: [10, 10] in 20x20 grid
  
  // Capacity
  maxCapacity: number;
  currentOccupancy: number;
  
  // State
  state: EstablishmentState;
  
  // Attraction (World Units)
  attractionRadius: number;  // e.g., 6 world units
  attractionPower: number;   // 0-100
  
  // Conditions
  isOpen: boolean;
  
  // Timers
  serviceTime: number;       // ms
  
  // Statistics
  totalVisitors: number;
  totalRevenue: number;
}
```

## Establishment States

| State | Occupancy % | Isometric Color | Effect on Attraction |
|-------|-------------|-----------------|---------------------|
| `CLOSED` | N/A | Dark Gray | 0 (no attraction) |
| `DESERTED` | 0% | Blue | 100% attraction |
| `VISITED` | 1-49% | Green | 120% attraction (social proof) |
| `BUSY` | 50-89% | Orange | 80% attraction |
| `CROWDED` | 90-100% | Red | 40% attraction |

**Rendering:** Each state has a different fill color for the diamond tile.

---

# 👥 COMPONENT 2: PEOPLE GROUP

## Definition
A **People Group** moves in world space and is rendered as a circle in isometric projection.

## Properties (World Coordinates)

```typescript
interface PeopleGroup {
  id: string;
  
  // Composition
  size: number;
  type: GroupType;
  
  // Position & Movement (World Coordinates)
  position: Vector2;           // Current world position
  previousPosition: Vector2;   // For direction calculation
  targetPosition: Vector2 | null;
  speed: number;               // World units per second (e.g., 2.5)
  
  // Direction (For sprite rendering)
  facingDirection: 'up' | 'down' | 'left' | 'right';
  
  // State
  state: GroupState;
  currentEstablishment: string | null;
  
  // Needs & Desires
  desire: number;
  patience: number;
  satisfaction: number;
  money: number;
  
  // Timers
  spawnTime: number;
  timeInEstablishment: number;
}
```

## Movement in World vs Screen Space

```
Example: Group moves from [5, 5] to [15, 15]

World Space:
  Start: [5, 5]
  End:   [15, 15]
  Distance: √((15-5)² + (15-5)²) = √200 ≈ 14.14 units
  Speed: 2.5 units/sec
  Time: 14.14 / 2.5 ≈ 5.7 seconds

Isometric Screen Space:
  Start: worldToIso(5, 5) → [originX, originY + 320]
  End:   worldToIso(15, 15) → [originX, originY + 480]
  Screen Distance: 160 pixels (appears to move straight down)
  Apparent Speed: ~28 pixels/sec on screen
  
BUT: If moving from [5, 5] to [15, 5]:
  World Distance: 10 units (same speed)
  Screen Distance: ~320 pixels (appears faster)
  Apparent Speed: ~56 pixels/sec on screen
```

**Key:** Speed is constant in world space, varies on screen due to projection.

---

# 🔄 GAMEPLAY LOOP (World Space)

All game logic operates in world coordinates:

```
1. SPAWN PHASE
   - Create group at world edge: [1-3] or [17-19] on each axis
   - Position is in world units

2. DECISION PHASE
   - Calculate distances in world space
   - Check attraction radius (world units)
   - Set target position (world coordinates)

3. MOVEMENT PHASE
   - Move toward target in world space
   - speed * deltaTime = units traveled
   - Update position in world coordinates
   - Calculate facing direction from movement vector

4. ENTRY/VISIT/LEAVE PHASES
   - All position checks in world space
   - Service time, satisfaction updates

5. CLEANUP PHASE
   - Check if out of world bounds
   - Remove if beyond [-2, 22] range

6. RENDERING (Separate)
   - Convert all world positions to screen positions
   - Apply isometric projection
   - Sort by depth (worldX + worldY)
   - Draw on canvas
```

---

# 🎯 RENDERER INTERFACE

## IRenderer

```typescript
interface IRenderer {
  initialize(container: HTMLElement, width: number, height: number): void;
  render(gameState: GameState, deltaTime: number): void;
  destroy(): void;
  resize(width: number, height: number): void;
  
  // Coordinate conversion (for mouse interaction)
  screenToWorld(screenX: number, screenY: number): { x: number; y: number };
  worldToScreen(worldX: number, worldY: number): { x: number; y: number };
}
```

## Implementations

### PixiIsometricRenderer

```typescript
class PixiIsometricRenderer implements IRenderer {
  private isoConfig: IsometricConfig;
  
  render(gameState: GameState) {
    // For each entity in gameState:
    // 1. Read position from entity (world coordinates)
    // 2. Convert to screen: worldToIso(entity.position.x, entity.position.y)
    // 3. Draw at screen position
    // 4. Set depth for Y-sorting
  }
}
```

### Future: TableRenderer

```typescript
class TableRenderer implements IRenderer {
  render(gameState: GameState) {
    // Draw top-down view
    // 1:1 mapping from world to screen
    // No coordinate conversion needed
  }
}
```

### Future: ThreeJSRenderer

```typescript
class ThreeJSRenderer implements IRenderer {
  render(gameState: GameState) {
    // Convert world XY to 3D XZ plane
    // Camera at isometric angle
    // Full 3D rendering
  }
}
```

---

# 📊 CONFIGURATION

## World Space Configuration

```typescript
const WORLD_CONFIG = {
  width: 20,              // World units
  height: 20,             // World units
  centerX: 10,            // World units
  centerY: 10,            // World units
};

const GAME_CONFIG = {
  groupSpeed: 2.5,        // World units per second
  attractionRadius: 6,    // World units
  spawnEdgeMin: 1,        // World units
  spawnEdgeMax: 3,        // World units
};
```

## Isometric Configuration

```typescript
const ISO_CONFIG = {
  tileWidth: 64,          // Pixels
  tileHeight: 32,         // Pixels (half of width for 2:1 ratio)
  originX: 400,           // Screen pixels
  originY: 150,           // Screen pixels
};
```

---

# 🧪 TEST SCENARIOS

## Scenario 1: Movement Speed Perception
```
1. Spawn group at [2, 10]
2. Set target to [18, 10] (horizontal in world)
3. Observe: Fast diagonal movement on screen
4. Spawn another at [10, 2]
5. Set target to [10, 18] (vertical in world)
6. Observe: Slower vertical movement on screen
7. Both take same time (constant world-space speed)
```

## Scenario 2: Grid Visualization
```
1. Toggle grid on/off
2. Observe diamond lattice pattern
3. Place establishment at [10, 10]
4. Verify it sits at grid center
5. Spawn groups at grid edges
6. Verify movement follows grid structure
```

## Scenario 3: Depth Sorting
```
1. Spawn multiple groups
2. Move them to cross paths
3. Verify correct overlap (Y-sort)
4. Group with higher worldX + worldY draws on top
```

---

# 📁 FILE STRUCTURE

```
src/
├── rendering/
│   ├── IRenderer.ts                    # Abstract renderer interface
│   ├── isometricMath.ts                # Coordinate conversion
│   ├── PixiIsometricRenderer.ts        # Pixi.js implementation
│   └── index.ts
│
├── game/
│   ├── engine.ts                       # Game loop (world space)
│   ├── establishment.ts                # World-space entity
│   ├── peopleGroup.ts                  # World-space entity
│   └── utils.ts                        # World-space math
│
├── components/
│   ├── PixiGameView.tsx                # Renderer wrapper
│   ├── StatsPanel.tsx                  # UI
│   └── EventLog.tsx                    # UI
│
└── types/
    └── index.ts                        # All use world coordinates
```

---

# 🔑 KEY TAKEAWAYS

1. **Game Logic = World Space**
   - All positions, distances, speeds in flat 2D plane
   - Simple Euclidean math
   - Easy to test and reason about

2. **Rendering = Projection**
   - Renderer converts world to screen
   - Different renderers, same game logic
   - Visual effects don't affect gameplay

3. **Isometric = Visual Only**
   - Diamond tiles are purely visual
   - Speed variation is perceptual, not real
   - Grid helps visualize world structure

4. **Separation Enables Iteration**
   - Can swap renderers without touching game
   - Can test game logic without rendering
   - Can add 3D view later without refactoring

---

*Micro Design Document v0.2*
*Test Component 0: Isometric Architecture*

```
    ┌─────────────────────────────────────────┐
    │  🏠 + 👥 = 🎮                           │
    │                                         │
    │  World space logic,                     │
    │  Screen space rendering,                │
    │  Clean separation                       │
    └─────────────────────────────────────────┘
```
