# Test Environments - Implementation Brainstorm

## Overview

Create a map configuration system that allows players to choose from 5 distinct beach resort environments at game start. Each environment features unique procedural terrain generation with gradual transitions from water to sand to grass.

## Environment Types

### 1. 🏖️ Tropical Seafront
**Theme**: Classic beachfront resort with ocean on one side
**Map Shape**: Full diamond (entire 80x80 grid)
**Terrain Rules**:
- Bottom-left edge: Ocean meeting shore
  - Row 1 (outermost): 3 tiles of water
  - Row 2: 2-5 tiles of sand (variable/random)
  - Remaining rows: Grass tiles
- Gradient transition: water → sand → grass
- Creates a natural beachfront along one edge

### 2. 🏞️ Crystal Lake
**Theme**: Mountain lake resort surrounded by sandy beaches
**Map Shape**: Circular map boundary
**Terrain Rules**:
- Center: Circular body of water (lake)
- Water radius: ~20-25% of map radius
- Sand ring: Surrounds water completely (beach area)
- Sand width: ~15-20% of map radius
- Grass: Outer area up to map boundary
- Gradient: water (center) → sand (ring) → grass (outer)

### 3. 🌊 Azure Cove
**Theme**: Protected bay with curved shoreline
**Map Shape**: Full diamond
**Terrain Rules**:
- Water: Crescent/arc shape entering from one corner
- Crescent opens from top-right, curves through map
- Sand: Follows water edge (beach lining the cove)
- Sand width: 3-5 tiles from water edge
- Grass: Fills remaining inland area
- Gradient: water (cove) → sand (beach) → grass (inland)

### 4. 🏝️ Emerald Peninsula
**Theme**: Narrow land strip jutting into ocean
**Map Shape**: Full diamond
**Terrain Rules**:
- Peninsula: Band running diagonally through map
- Peninsula width: ~25-35% of map width
- Water: Surrounds peninsula on both long sides
- Peninsula terrain: Mix of grass (center) and sand (edges)
- Gradient on peninsula: sand (water edges) → grass (center spine)

### 5. 🌴 Coral Island
**Theme**: Isolated island surrounded by ocean
**Map Shape**: Full diamond
**Terrain Rules**:
- Water: All edges (4-6 tiles deep from boundary)
- Island: Irregular organic shape in center
- Island terrain: Random/organic distribution of sand and grass
- More sand near water edge, more grass toward center
- Island size: ~60-70% of map area
- Gradient: water (perimeter) → sand (island coast) → grass (island interior)

## Technical Architecture

### Core Components

#### 1. EnvironmentSelector Component
```
Location: src/screens/EnvironmentSelector.tsx

Purpose: 
- Pre-game screen for environment selection
- Displays 5 environment cards with icons and descriptions
- Passes selected environment to game initialization

State:
- selectedEnvironment: EnvironmentType | null

UI Elements:
- Title: "Choose Your Paradise"
- 5 environment cards (grid or scrollable)
- Each card shows: icon, name, description
- "Start Game" button (enabled when selection made)
```

#### 2. Environment Configuration System
```
Location: src/systems/EnvironmentGenerator.ts

Purpose:
- Generate terrain layout based on environment type
- Apply procedural rules for each environment
- Calculate tile types for entire map

Methods:
- generateEnvironment(type: EnvironmentType): TerrainMap
- Private methods for each environment type
- Helper methods for gradients, shapes, distances
```

#### 3. Type Definitions
```
Location: src/types/environment.ts

Interfaces:
- EnvironmentType: 'seafront' | 'lake' | 'cove' | 'peninsula' | 'island'
- EnvironmentConfig: { name, icon, description, type }
- TerrainMap: Map<string, TerrainType>
- TerrainType: 'water' | 'sand' | 'grass'
```

#### 4. Procedural Generation Utilities
```
Location: src/utils/terrainGeneration.ts

Helper Functions:
- calculateDistance(tile, point): number
- isInsideCircle(tile, center, radius): boolean
- isInsideShape(tile, shapePoints): boolean
- getGradientTerrain(distance, thresholds): TerrainType
- getNearestEdgeDistance(tile, mapSize): number
- createCrescentShape(center, radius, arc): Point[]
```

## Procedural Generation Algorithms

### 1. Tropical Seafront Algorithm

```typescript
For each tile (row, col):
  1. Calculate distance from bottom-left edge
  2. If distance < 3 tiles: water
  3. Else if distance < 3 + random(2,5): sand
  4. Else: grass
  
  Add noise/variation for natural look
```

### 2. Crystal Lake Retreat Algorithm

```typescript
For each tile (row, col):
  1. Calculate distance from map center
  2. Calculate distance from map edge
  3. If distance from edge > boundary radius: skip (outside circular map)
  4. If distance from center < water radius: water
  5. Else if distance from center < water radius + sand width: sand
  6. Else: grass
```

### 3. Azure Cove Paradise Algorithm

```typescript
For each tile (row, col):
  1. Define crescent center and arc parameters
  2. Calculate distance from crescent arc
  3. If inside crescent shape: water
  4. Else if distance from water < 3-5 tiles: sand
  5. Else: grass
  
  Use bezier curve or circular arc for smooth crescent
```

### 4. Emerald Peninsula Escape Algorithm

```typescript
For each tile (row, col):
  1. Calculate perpendicular distance from peninsula axis
  2. If distance > peninsula width/2: water
  3. Else (on peninsula):
     - Calculate distance from peninsula edges
     - If distance from edge < 2-3 tiles: sand
     - Else: grass
```

### 5. Coral Island Sanctuary Algorithm

```typescript
For each tile (row, col):
  1. Calculate distance from nearest map edge
  2. If distance < 4-6 tiles: water
  3. Else (island area):
     - Generate organic island shape using Perlin/simplex noise
     - Calculate distance from water
     - Apply gradient: sand near water, grass inland
     - Add randomness for natural appearance
```

## Gradient Implementation

All environments use smooth terrain transitions:

```typescript
function calculateTerrain(distanceFromWater: number): TerrainType {
  if (distanceFromWater < waterThreshold) return 'water';
  if (distanceFromWater < sandThreshold) return 'sand';
  return 'grass';
}

// With noise for natural variation
const noiseValue = getPerlinNoise(x, y) * 2; // ±2 tiles variation
const effectiveDistance = distanceFromWater + noiseValue;
```

## Environment Configuration Data

```typescript
export const ENVIRONMENTS: EnvironmentConfig[] = [
  {
    type: 'seafront',
    name: '🏖️ Tropical Seafront',
    description: 'Classic beachfront with endless ocean views',
    icon: '🏖️',
  },
  {
    type: 'lake',
    name: '🏞️ Crystal Lake',
    description: 'Serene mountain lake surrounded by sandy shores',
    icon: '🏞️',
  },
  {
    type: 'cove',
    name: '🌊 Azure Cove',
    description: 'Protected bay with curved golden beaches',
    icon: '🌊',
  },
  {
    type: 'peninsula',
    name: '🏝️ Emerald Peninsula',
    description: 'Exclusive land strip jutting into crystal waters',
    icon: '🏝️',
  },
  {
    type: 'island',
    name: '🌴 Coral Island',
    description: 'Private island paradise in endless blue',
    icon: '🌴',
  },
];
```

## UI/UX Flow

### Game Start Flow

1. **App Loads** → Show Environment Selector screen
2. **User Selects Environment** → Highlight selected card
3. **User Clicks "Start Game"** → Generate terrain, load GameScreen
4. **GameScreen Initializes** → Use generated terrain data

### Environment Selector Design

```
┌─────────────────────────────────────┐
│     Choose Your Paradise 🌅         │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐         │
│  │   🏖️    │  │   🏞️    │         │
│  │Tropical │  │ Crystal │         │
│  │Seafront │  │  Lake   │         │
│  │         │  │         │         │
│  └─────────┘  └─────────┘         │
│                                     │
│  ┌─────────┐  ┌─────────┐         │
│  │   🌊    │  │   🏝️    │         │
│  │ Azure   │  │ Emerald │         │
│  │  Cove   │  │Peninsula│         │
│  │         │  │         │         │
│  └─────────┘  └─────────┘         │
│                                     │
│      ┌─────────┐                   │
│      │   🌴    │                   │
│      │  Coral  │                   │
│      │ Island  │                   │
│      │         │                   │
│      └─────────┘                   │
│                                     │
│      [ Start Game ]                │
└─────────────────────────────────────┘
```

**Card States**:
- Default: Subtle border, semi-transparent background
- Hover: Brighter background, scale slightly
- Selected: Bright border, glowing effect, checkmark

## Integration with test_ui_2

### Modified Files

1. **App.tsx**
   - Add state for selected environment
   - Show EnvironmentSelector before GameScreen
   - Pass environment to GameScreen

2. **GameScreen.tsx**
   - Accept `environment` prop
   - Pass to LayoutTabbed or canvas system

3. **InteractiveCanvas.tsx**
   - Accept `terrainMap` prop instead of generating random
   - Use provided terrain data for rendering

4. **TileLoader.ts**
   - Modify `createTile()` to use terrain map
   - Look up tile type from map instead of random generation

### New Files

1. **src/screens/EnvironmentSelector.tsx** - Selection UI
2. **src/systems/EnvironmentGenerator.ts** - Terrain generation
3. **src/types/environment.ts** - Type definitions
4. **src/utils/terrainGeneration.ts** - Helper functions
5. **src/data/environments.ts** - Environment configuration data

## Implementation Phases

### Phase 1: Foundation (Types & Data)
- Create type definitions
- Define environment configuration data
- Set up constants

### Phase 2: Terrain Generation System
- Implement EnvironmentGenerator class
- Create helper functions for shapes and distances
- Implement algorithm for each environment type
- Test generation with console visualization

### Phase 3: Environment Selector UI
- Create EnvironmentSelector component
- Design and style environment cards
- Implement selection logic
- Add start button

### Phase 4: Integration
- Modify App.tsx flow
- Update InteractiveCanvas to use terrain map
- Update TileLoader to read from map
- Connect all pieces

### Phase 5: Polish & Testing
- Fine-tune terrain generation parameters
- Add smooth gradients and natural variation
- Test all 5 environments
- Verify tile loading works correctly
- Ensure performance is maintained

## Technical Considerations

### Terrain Map Storage

**Option A: Pre-generate entire map**
- Generate all tiles on environment selection
- Store in Map<string, TerrainType>
- Pros: Simple, consistent
- Cons: Memory usage for large maps (80x80 = 6,400 tiles)

**Option B: Generate on-demand**
- Generate only when tiles load
- Use deterministic algorithm (same input → same output)
- Pros: Memory efficient
- Cons: Must recalculate, need seed for consistency

**Recommendation: Option A**
- Map size is manageable (6,400 entries)
- Ensures consistency
- Faster tile loading (no recalculation)
- Memory: ~100KB for terrain map (negligible)

### Coordinate System Alignment

Isometric tiles map to grid coordinates (row, col):
- Row 0, Col 0 = Top corner
- Row MAX, Col 0 = Left corner
- Row 0, Col MAX = Right corner
- Row MAX, Col MAX = Bottom corner

Generation algorithms work in (row, col) space, then convert to world coordinates for rendering.

### Random Variation

Use seeded random for consistency:
```typescript
class SeededRandom {
  private seed: number;
  
  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
```

### Performance

- Terrain generation: One-time on environment selection (~10-50ms)
- Tile lookup: O(1) from Map
- No impact on rendering performance
- Lazy loading still works as before

## Testing Strategy

### Unit Tests (Conceptual)

1. **Environment Generation**
   - Test each environment generates correct tile counts
   - Verify water/sand/grass ratios
   - Check gradients are smooth

2. **Shape Algorithms**
   - Test circle detection for lake
   - Test crescent generation for cove
   - Test island shape generation

3. **UI Components**
   - Test environment selection
   - Verify state management
   - Test start button enablement

### Manual Testing

1. **Visual Verification**
   - Generate each environment
   - Verify shapes match descriptions
   - Check gradients look natural

2. **Navigation Testing**
   - Drag around each environment
   - Verify lazy loading works
   - Test boundary clamping

3. **Transition Testing**
   - Select each environment
   - Start game
   - Verify correct terrain loads

## Visual Examples (ASCII Art)

### Tropical Seafront (Bottom-Left Ocean)
```
G G G G G G G G G G
G G G G G G G G G G
G G G G G G G G G G
G G G G G G G G G G
S S S S G G G G G G
S S S S S G G G G G
S S S S S S G G G G
W W S S S S S G G G
W W W S S S S S G G
W W W W S S S S S G
```

### Crystal Lake (Circular)
```
. . . G G G G . . .
. G G S S S G G . .
G G S S W W S S G G
G S S W W W S S G G
G S W W W W W S G G
G S W W W W W S G G
G S S W W W S S G G
G G S S W W S S G G
. G G S S S G G . .
. . . G G G G . . .
```

### Azure Cove (Crescent Water)
```
. . . . W W W W . .
. . . W W W W . . .
G G G S S W W . . .
G G G G S S W . . .
G G G G G S S . . .
G G G G G G S S . .
G G G G G G G S S .
G G G G G G G G S S
G G G G G G G G G G
G G G G G G G G G G
```

### Emerald Peninsula (Vertical Band)
```
W W W G S S W W W W
W W W G G S S W W W
W W W G G G S W W W
W W W S G G S S W W
W W W S G G G S W W
W W W S S G G S W W
W W W S S G G S W W
W W W W S G G S W W
W W W W S S G S W W
W W W W W S S S W W
```

### Coral Island (Center Organic)
```
W W W W W W W W W W
W W S S S S S S W W
W S S G G G G S S W
W S G G G S G G S W
W S G G G G G G S W
W S G G S G G G S W
W S G G G G G G S W
W S S G G G G S S W
W W S S S S S S W W
W W W W W W W W W W
```

Legend: W=Water, S=Sand, G=Grass, .=Outside map boundary

## Configuration Constants

```typescript
export const TERRAIN_CONFIG = {
  // Seafront
  SEAFRONT_WATER_ROWS: 3,
  SEAFRONT_SAND_MIN: 2,
  SEAFRONT_SAND_MAX: 5,
  
  // Lake
  LAKE_WATER_RADIUS_PERCENT: 0.22,
  LAKE_SAND_WIDTH_PERCENT: 0.18,
  LAKE_MAP_RADIUS_PERCENT: 0.85,
  
  // Cove
  COVE_ARC_ANGLE: 180, // degrees
  COVE_SAND_WIDTH: 4,
  
  // Peninsula
  PENINSULA_WIDTH_PERCENT: 0.30,
  PENINSULA_SAND_EDGE_WIDTH: 2,
  
  // Island
  ISLAND_WATER_DEPTH: 5,
  ISLAND_SAND_WIDTH: 3,
  ISLAND_NOISE_SCALE: 0.1,
  
  // General
  GRADIENT_NOISE_AMPLITUDE: 1.5,
  SEED: 12345, // Default seed for random generation
};
```

## Success Criteria

✅ 5 distinct environment types selectable
✅ Each environment has unique terrain pattern
✅ Smooth gradients between terrain types
✅ Natural-looking procedural generation
✅ Environment selector UI is intuitive
✅ Terrain data integrates with existing canvas
✅ Lazy loading still works correctly
✅ No performance degradation
✅ All environments tested and verified

## Future Enhancements

- [ ] Custom environment editor
- [ ] More terrain types (forest, rocks, paths)
- [ ] Seasonal variants (winter, autumn)
- [ ] Day/night cycle affecting visuals
- [ ] Weather effects (rain, waves)
- [ ] Animated water tiles
- [ ] Save/load favorite configurations
- [ ] Random environment option
- [ ] Environment-specific challenges/goals

## Risk Assessment

### Low Risk
- UI implementation (standard React patterns)
- Type definitions (straightforward)
- Integration with existing code (clean interfaces)

### Medium Risk
- Procedural generation complexity (requires testing/tuning)
- Natural-looking gradients (may need iteration)
- Performance with large maps (likely fine, but monitor)

### Mitigation Strategies
- Start with simple generation, refine iteratively
- Use visualization tools during development
- Profile performance with all environments
- Keep algorithms deterministic for debugging

## Development Timeline Estimate

- **Phase 1** (Foundation): 30 minutes
- **Phase 2** (Generation): 2-3 hours
- **Phase 3** (UI): 1-2 hours
- **Phase 4** (Integration): 1 hour
- **Phase 5** (Polish): 1-2 hours

**Total**: 5-8 hours of implementation work

## File Size Estimates

- EnvironmentSelector.tsx: ~200 lines
- EnvironmentGenerator.ts: ~400 lines
- terrainGeneration.ts: ~200 lines
- environment.ts: ~50 lines
- environments.ts: ~50 lines
- Modified files: ~50 lines of changes

**Total new code**: ~950 lines

---

**Status**: Brainstorming complete, ready for implementation approval
**Date**: February 6, 2026
**Dependencies**: Requires test_ui_2 as base
