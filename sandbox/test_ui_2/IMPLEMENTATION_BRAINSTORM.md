# Test UI 2: Interactive Isometric Canvas with Lazy Loading

**Goal**: Integrate the isometric canvas from test_component_1 into test_ui with drag-to-pan navigation and efficient lazy loading of visible tiles.

---

## Core Requirements

### 1. Canvas Integration
- Import `GameCanvas` component from `test_component_1`
- Replace `GameCanvasPlaceholder` in the game view
- Decouple from game logic (no spawning, pathfinding, or entity updates)
- Pure rendering component: display tiles and static elements only

### 2. Pan/Drag Navigation
- Mouse drag to pan around the map
- Touch drag support for mobile (primary target)
- Smooth panning with inertia/momentum
- Clamp camera position to map boundaries

### 3. Adaptive Map Boundaries
- Map size defined by existing tiles (e.g., 50x50 grid)
- Camera clamp adjusts to viewport size (don't show areas beyond map edges)
- Calculate visible tile range based on camera position + viewport

### 4. Lazy Loading System
- Load only visible tiles + buffer zone (e.g., 2-3 tiles beyond viewport)
- Unload tiles that move outside the buffer zone
- Console logging for all load/unload events
- Purely visual loading (game would compute all data in real time)

---

## Architecture & Components

### Component Structure

```
test_ui_2/
├── src/
│   ├── App.tsx                          # Main app, manages animation state
│   ├── main.tsx                         # Entry point
│   │
│   ├── screens/
│   │   └── GameScreen.tsx               # Game screen with integrated canvas
│   │
│   ├── layouts/
│   │   └── LayoutTabbed.tsx             # From test_ui (copied)
│   │
│   ├── components/
│   │   ├── TopBar.tsx                   # From test_ui
│   │   ├── InteractiveCanvas.tsx        # NEW: Wrapper for GameCanvas with pan/zoom
│   │   └── TileLoader.tsx               # NEW: Manages lazy loading logic
│   │
│   ├── canvas/
│   │   ├── GameCanvas.tsx               # From test_component_1 (adapted)
│   │   ├── rendering.ts                 # Isometric rendering functions
│   │   └── utils.ts                     # Grid/iso coordinate conversion
│   │
│   ├── systems/
│   │   ├── CameraSystem.ts              # NEW: Camera/viewport management
│   │   ├── TileManager.ts               # NEW: Tile loading/unloading
│   │   └── InputHandler.ts              # NEW: Mouse/touch input for panning
│   │
│   └── types/
│       └── index.ts                     # TypeScript interfaces
│
├── public/
│   └── assets/                          # Sprite assets (if needed)
│
└── IMPLEMENTATION_BRAINSTORM.md         # This file
```

---

## Detailed Implementation Steps

### Phase 1: Project Setup & Basic Integration

**Step 1.1: Initialize Project**
- Copy test_ui structure (package.json, tsconfig, vite.config)
- Copy UI layouts and components from test_ui
- Set up file structure

**Step 1.2: Copy Canvas Components**
- Copy `GameCanvas.tsx` from test_component_1
- Copy rendering utilities (`gridToIso`, `isoToGrid`, drawing functions)
- Copy sprite loading logic (if needed)
- Remove game engine dependencies (no entity updates, no game loop)

**Step 1.3: Create Static Tile Data**
- Define a large map (e.g., 50x50 tiles = 2,500 tiles)
- Create mock tile data structure:
  ```typescript
  interface Tile {
    x: number;
    y: number;
    type: 'sand' | 'water' | 'grass' | 'path';
    isLoaded: boolean;
  }
  ```
- Generate tiles programmatically for testing

---

### Phase 2: Camera System

**Step 2.1: Camera State Management**
```typescript
interface Camera {
  x: number;           // Camera position in world coordinates
  y: number;           // Camera position in world coordinates
  zoom: number;        // Zoom level (1.0 = normal)
  isDragging: boolean; // Is user currently dragging?
}
```

**Step 2.2: Viewport Calculations**
- Calculate which tiles are visible based on:
  - Camera position (x, y)
  - Canvas dimensions (width, height)
  - Isometric projection (diamond shape view)
- Function: `getVisibleTileRange(camera, canvasSize, mapSize) => { minX, maxX, minY, maxY }`

**Step 2.3: Boundary Clamping**
- Define map boundaries (e.g., 0 to 50 for 50x50 map)
- Clamp camera position so viewport never shows areas beyond map
- Account for viewport size (smaller viewports = tighter clamp)
- Function: `clampCamera(camera, mapSize, viewportSize) => Camera`

**Implementation Notes**:
- Camera position represents the CENTER of the viewport (not top-left)
- Clamp must consider visible tile range, not just camera position
- Edge case: If map is smaller than viewport, center the map

---

### Phase 3: Input Handling (Drag to Pan)

**Step 3.1: Mouse Input**
```typescript
// On canvas mousedown
- Store initial mouse position
- Set isDragging = true

// On canvas mousemove (if isDragging)
- Calculate delta from last position
- Update camera position by delta (accounting for zoom)
- Clamp camera to boundaries
- Request render

// On canvas mouseup
- Set isDragging = false
- (Optional) Apply momentum/inertia
```

**Step 3.2: Touch Input (Mobile-First)**
```typescript
// Similar to mouse but:
- Use touchstart, touchmove, touchend
- Handle single touch only (ignore multi-touch for now)
- Prevent default to avoid page scrolling
- Same delta calculation and camera update logic
```

**Step 3.3: Smooth Panning**
- Calculate delta in screen space (pixels)
- Convert to world space (accounting for isometric projection)
- Update camera smoothly (consider frame rate)
- Optionally: Add momentum/deceleration when drag ends

**Edge Cases**:
- Dragging beyond map boundaries (clamp immediately)
- Very fast drags (track velocity for momentum)
- Touch vs mouse (different event structures)

---

### Phase 4: Lazy Loading System

**Step 4.1: Tile Manager Architecture**
```typescript
class TileManager {
  private loadedTiles: Map<string, Tile>;     // Key: "x,y"
  private loadingQueue: Set<string>;          // Tiles currently loading
  
  constructor(mapSize: { width: number; height: number }) {}
  
  // Determine which tiles should be loaded
  getRequiredTiles(visibleRange: TileRange, bufferSize: number): string[]
  
  // Load tiles that aren't currently loaded
  loadTiles(tileKeys: string[]): void
  
  // Unload tiles outside the required range
  unloadTiles(tileKeys: string[]): void
  
  // Get all currently loaded tiles
  getLoadedTiles(): Tile[]
}
```

**Step 4.2: Buffer Zone Strategy**
- **Visible Zone**: Tiles currently on screen
- **Buffer Zone**: N tiles beyond visible area (e.g., 2-3 tiles)
- **Load Zone**: Visible + Buffer
- **Unload Zone**: Anything outside Load Zone

**Step 4.3: Loading Logic**
```typescript
// On camera move:
1. Calculate visible tile range
2. Expand by buffer size to get required tiles
3. Compare with currently loaded tiles
4. Load missing tiles
5. Unload tiles outside required range
6. Log all operations to console
```

**Step 4.4: Console Logging Format**
```javascript
console.log('[TileLoader] Loading tiles:', tileKeys);
console.log('[TileLoader] Unloading tiles:', tileKeys);
console.log('[TileLoader] Currently loaded:', count, 'tiles');
console.log('[TileLoader] Visible range:', { minX, maxX, minY, maxY });
```

---

### Phase 5: Rendering Pipeline

**Step 5.1: Render Loop Structure**
```typescript
function render() {
  // 1. Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // 2. Calculate camera transform
  const offsetX = camera.x * tileSize;
  const offsetY = camera.y * tileSize;
  
  // 3. Render loaded tiles only
  const loadedTiles = tileManager.getLoadedTiles();
  for (const tile of loadedTiles) {
    drawTile(ctx, tile, offsetX, offsetY);
  }
  
  // 4. (Optional) Draw loading indicators for tiles being loaded
  // 5. (Optional) Draw debug info (camera position, loaded tile count)
}
```

**Step 5.2: Coordinate Transformation**
- World coordinates (game logic): Fixed tile positions
- Camera coordinates: Relative to camera center
- Screen coordinates: Canvas pixel positions

```typescript
// World to Screen conversion
function worldToScreen(worldX, worldY, camera, canvas) {
  const relativeX = worldX - camera.x;
  const relativeY = worldY - camera.y;
  const screenPos = gridToIso(relativeX, relativeY, canvas.width, canvas.height);
  return screenPos;
}
```

**Step 5.3: Depth Sorting**
- Still sort tiles by Y coordinate (back to front)
- Only sort visible tiles (optimization)
- Isometric rendering requires proper z-order

---

## Performance Considerations

### Optimization Strategies

**1. Tile Loading Throttling**
- Don't recalculate on every pixel of movement
- Use threshold (e.g., only check when camera moves > 0.5 tiles)
- Debounce/throttle the tile loading logic

**2. Rendering Optimizations**
- Only render loaded tiles (already handled by TileManager)
- Use requestAnimationFrame for smooth rendering
- Consider: Canvas layers (static background vs dynamic elements)

**3. Memory Management**
- Limit max loaded tiles (e.g., max 500 tiles in memory)
- Unload distant tiles even if technically in buffer
- Clear references properly to avoid memory leaks

**4. Touch Performance**
- Use passive event listeners where possible
- Minimize reflows/repaints
- Consider: CSS transform for canvas instead of redrawing (if applicable)

---

## Test Map Design

### Map Layout (50x50 example)
```
┌─────────────────────────────────────────┐
│ 🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊 (Water top)       │
│ 🌊🏖️🏖️🏖️🏖️🏖️🏖️🏖️🌊               │
│ 🌊🏖️🏖️🏖️🏖️🏖️🏖️🏖️🌊               │
│ 🌊🏖️🏗️🏖️🏖️🏖️🏗️🏖️🌊 (Buildings)  │
│ 🌊🏖️🏖️🏖️🏖️🏖️🏖️🏖️🌊               │
│ 🌊🏖️🏖️🏖️🏖️🏖️🏖️🏖️🌊               │
│ 🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊                   │
│ ... (continues 50x50)                    │
└─────────────────────────────────────────┘
```

**Tile Distribution**:
- **Water tiles**: 30% (edges, making boundaries clear)
- **Sand/Beach tiles**: 60% (main playable area)
- **Grass/decoration tiles**: 5%
- **Path tiles**: 5%

**Size Rationale**:
- 50x50 = 2,500 tiles total
- Viewport shows ~20-30 tiles (depending on zoom)
- Requires 8-12 viewport moves to traverse entire map
- Good test for lazy loading effectiveness

---

## Integration with test_ui

### Modified Files

**1. GameScreen.tsx**
- Import `InteractiveCanvas` instead of `GameCanvasPlaceholder`
- Pass through animation state

**2. LayoutTabbed.tsx**
- Replace placeholder with `InteractiveCanvas`
- No changes to UI logic
- Canvas fills the game view area

**3. New InteractiveCanvas Component**
```typescript
interface InteractiveCanvasProps {
  animationsEnabled: boolean;
}

// Manages:
- Canvas element
- Camera state
- Input handling
- Render loop
- Tile loading coordination
```

---

## Data Flow

### State Management Flow

```
User Input (drag)
  ↓
InputHandler: Calculate delta
  ↓
CameraSystem: Update camera position (with clamp)
  ↓
TileManager: Check if new tiles needed
  ↓
  ├─ Load new visible tiles
  ├─ Unload distant tiles
  └─ Console log operations
  ↓
Renderer: Draw loaded tiles with camera offset
  ↓
Canvas displays updated view
```

---

## Implementation Phases (Detailed)

### Phase 1: Basic Setup (Foundation)
**Files to Create**:
- Project structure (package.json, tsconfig, vite.config)
- Copy UI components from test_ui
- Copy canvas utilities from test_component_1

**Deliverable**: Project builds and runs with test_ui layout

---

### Phase 2: Static Canvas (No Interaction)
**Files to Create**:
- `InteractiveCanvas.tsx`: Basic canvas component
- `rendering.ts`: Copy isometric drawing functions
- `types/index.ts`: Type definitions

**Tasks**:
- Render a fixed view of the map center
- Draw 20x20 tile area (no loading logic yet)
- Verify isometric rendering works correctly
- Integrate with test_ui layout

**Deliverable**: Static isometric map visible in game view

---

### Phase 3: Camera System
**Files to Create**:
- `systems/CameraSystem.ts`

**Tasks**:
- Implement Camera interface (position, zoom, isDragging)
- Create `getVisibleTileRange()` function
- Implement `clampCamera()` with adaptive boundaries
- Add debug overlay showing camera position

**Tests**:
- Camera clamps at all four edges
- Clamp adapts to different viewport sizes
- Edge case: Map smaller than viewport (should center)

**Deliverable**: Camera system with proper boundary clamping

---

### Phase 4: Input Handling (Drag to Pan)
**Files to Create**:
- `systems/InputHandler.ts`

**Tasks**:
- Mouse event handlers (mousedown, mousemove, mouseup)
- Touch event handlers (touchstart, touchmove, touchend)
- Calculate delta in screen space
- Convert delta to world space (accounting for isometric)
- Update camera position on drag
- Prevent default behaviors (page scrolling)

**Edge Cases**:
- Fast dragging (large deltas)
- Dragging to boundaries (clamp during drag)
- Touch vs mouse coordinate differences
- Multi-touch handling (ignore for now)

**Deliverable**: Smooth pan navigation with mouse and touch

---

### Phase 5: Tile Manager (Lazy Loading Core)
**Files to Create**:
- `systems/TileManager.ts`
- `systems/MapGenerator.ts` (generates 50x50 test map)

**Tasks**:
- Create TileManager class with Map for loaded tiles
- Implement `getRequiredTiles()` based on visible range + buffer
- Implement `loadTiles()` with console logging
- Implement `unloadTiles()` with console logging
- Generate large test map (50x50 tiles)

**Data Structure**:
```typescript
class TileManager {
  private loadedTiles: Map<string, Tile>;
  private allTiles: Map<string, Tile>;  // Full map data
  private bufferSize: number = 3;        // Tiles beyond viewport
  
  constructor(mapData: Tile[]) {
    // Store all tiles in allTiles map
    // loadedTiles starts empty
  }
  
  updateVisibleRange(range: TileRange) {
    const required = this.getRequiredTiles(range);
    const current = Array.from(this.loadedTiles.keys());
    
    // Find tiles to load
    const toLoad = required.filter(key => !this.loadedTiles.has(key));
    
    // Find tiles to unload
    const toUnload = current.filter(key => !required.includes(key));
    
    if (toLoad.length > 0) this.loadTiles(toLoad);
    if (toUnload.length > 0) this.unloadTiles(toUnload);
  }
  
  loadTiles(keys: string[]) {
    console.log('[TileLoader] Loading', keys.length, 'tiles:', keys);
    keys.forEach(key => {
      const tile = this.allTiles.get(key);
      if (tile) {
        this.loadedTiles.set(key, { ...tile, isLoaded: true });
      }
    });
    console.log('[TileLoader] Total loaded:', this.loadedTiles.size);
  }
  
  unloadTiles(keys: string[]) {
    console.log('[TileLoader] Unloading', keys.length, 'tiles:', keys);
    keys.forEach(key => this.loadedTiles.delete(key));
    console.log('[TileLoader] Total loaded:', this.loadedTiles.size);
  }
}
```

**Deliverable**: Tiles load/unload as camera moves, with console logs

---

### Phase 6: Render Loop Integration

**Tasks**:
- Connect camera system to render loop
- Update TileManager on camera change
- Only render loaded tiles
- Add visual indicators:
  - Loaded tile boundaries (debug)
  - Camera position overlay (debug)
  - FPS counter

**Optimization**: Throttle Updates
```typescript
let lastCameraUpdate = { x: 0, y: 0 };
const updateThreshold = 0.5; // Only update if moved > 0.5 tiles

function onCameraMove(newCamera: Camera) {
  const dx = Math.abs(newCamera.x - lastCameraUpdate.x);
  const dy = Math.abs(newCamera.y - lastCameraUpdate.y);
  
  if (dx > updateThreshold || dy > updateThreshold) {
    const visibleRange = getVisibleTileRange(newCamera, canvas, mapSize);
    tileManager.updateVisibleRange(visibleRange);
    lastCameraUpdate = { x: newCamera.x, y: newCamera.y };
  }
}
```

**Deliverable**: Complete render loop with lazy loading

---

### Phase 7: Polish & Debug Features

**Step 7.1: Debug Overlay (Toggle-able)**
```
┌─────────────────────────┐
│ Camera: (25.4, 18.2)    │
│ Loaded: 156 / 2500      │
│ Visible: 23 tiles       │
│ FPS: 60                 │
└─────────────────────────┘
```

**Step 7.2: Visual Feedback**
- Loading tiles: Show subtle shimmer/fade-in
- Unloaded areas: Show placeholder or darker shade
- Buffer zone visualization (optional debug)

**Step 7.3: Performance Monitoring**
- Track load/unload frequency
- Monitor render time
- Log excessive thrashing (loading/unloading same tiles repeatedly)

**Deliverable**: Polished experience with debug tools

---

## Technical Challenges & Solutions

### Challenge 1: Isometric Visible Range Calculation

**Problem**: Diamond-shaped isometric projection makes rectangular range calculation complex.

**Solution**:
- Calculate screen corners in world space
- Find min/max X and Y from all corners
- Add buffer uniformly in all directions
- Over-estimate is fine (better than under-loading)

```typescript
function getVisibleTileRange(camera, canvas, zoom) {
  const corners = [
    screenToWorld(0, 0, camera, canvas),           // Top-left
    screenToWorld(canvas.width, 0, camera, canvas),     // Top-right
    screenToWorld(0, canvas.height, camera, canvas),    // Bottom-left
    screenToWorld(canvas.width, canvas.height, camera, canvas), // Bottom-right
  ];
  
  const minX = Math.floor(Math.min(...corners.map(c => c.x)));
  const maxX = Math.ceil(Math.max(...corners.map(c => c.x)));
  const minY = Math.floor(Math.min(...corners.map(c => c.y)));
  const maxY = Math.ceil(Math.max(...corners.map(c => c.y)));
  
  return { minX, maxX, minY, maxY };
}
```

---

### Challenge 2: Smooth Panning with Discrete Tiles

**Problem**: Tiles are discrete (grid-based) but panning should be smooth (sub-pixel).

**Solution**:
- Camera position uses floating-point (25.4, 18.7)
- Tile positions remain integers (25, 18)
- Rendering offset uses camera sub-pixel precision
- Tile loading rounds to nearest integer

---

### Challenge 3: Preventing Loading Thrashing

**Problem**: Camera moving back and forth at buffer boundary causes rapid load/unload cycles.

**Solution**:
- Add hysteresis: Different thresholds for load vs unload
- Load at buffer boundary, unload at buffer + 1
- Debounce rapid camera movements
- Log warning if same tile loads/unloads frequently

```typescript
const LOAD_BUFFER = 3;   // Load tiles 3 beyond visible
const UNLOAD_BUFFER = 4; // Unload tiles 4 beyond visible (extra margin)
```

---

### Challenge 4: Initial Load

**Problem**: On first render, no tiles are loaded, screen is blank until tiles load.

**Solution**:
- Pre-load initial viewport tiles immediately
- Show loading indicator during initial load
- Once initial tiles loaded, enable panning
- Function: `preloadInitialView(camera, canvas, mapSize)`

---

## Testing Strategy

### Test Cases

**1. Boundary Testing**
- Pan to all four edges of map
- Verify clamp prevents going beyond boundaries
- Test with different viewport sizes (mobile, desktop)

**2. Loading Verification**
- Pan slowly across map
- Verify tiles load BEFORE entering viewport (buffer works)
- Verify old tiles unload after leaving buffer zone
- Check console logs for correct behavior

**3. Performance Testing**
- Pan rapidly back and forth
- Monitor FPS (should stay 60fps)
- Check memory usage (shouldn't grow indefinitely)
- Verify no duplicate loads of same tile

**4. Edge Cases**
- Map smaller than viewport (should center, not pan)
- Very fast drag (momentum handling)
- Drag beyond boundary (should clamp smoothly)
- Rapid tab switching (canvas should clean up properly)

---

## Configuration Constants

```typescript
// Map Configuration
const MAP_SIZE = { width: 50, height: 50 };
const TILE_SIZE = 64; // 64x64 isometric tiles

// Camera Configuration
const INITIAL_CAMERA = { x: 25, y: 25, zoom: 1.0 }; // Center of 50x50 map
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

// Loading Configuration
const LOAD_BUFFER_SIZE = 3;      // Tiles beyond viewport to load
const UNLOAD_BUFFER_SIZE = 4;    // Tiles beyond viewport to unload (hysteresis)
const MOVEMENT_THRESHOLD = 0.5;  // Min camera movement to trigger load check (in tiles)

// Performance Configuration
const MAX_LOADED_TILES = 500;    // Memory limit
const TARGET_FPS = 60;
```

---

## Debug Features

### Console Commands (for testing)
```typescript
// Expose to window for console access
window.debugCanvas = {
  camera: () => console.log(camera),
  loadedTiles: () => console.log(tileManager.getLoadedTiles()),
  loadCount: () => console.log(tileManager.getLoadedTiles().length),
  teleport: (x, y) => { camera.x = x; camera.y = y; },
  showBuffer: true, // Toggle buffer zone visualization
};
```

### Visual Debug Overlays (Toggle with key press)
- Press `D`: Show debug info
- Press `B`: Show buffer zone boundaries
- Press `G`: Show grid coordinates
- Press `F`: Show FPS

---

## Future Enhancements (Not in Initial Scope)

### Post-MVP Features
1. **Zoom functionality** (pinch-to-zoom, mouse wheel)
2. **Momentum/inertia** after drag release
3. **Double-tap to zoom** to specific location
4. **Minimap** showing full map with camera position
5. **Tile caching** (keep recently unloaded tiles in cache)
6. **Progressive loading** (load low-res first, then high-res)
7. **Network simulation** (simulate loading delays)
8. **Asset preloading** (load sprite sheets before game starts)

---

## Success Criteria

### Definition of Done

✅ **Must Have**:
1. Canvas integrated into test_ui layout
2. Smooth drag-to-pan with mouse and touch
3. Camera clamps to map boundaries (adaptive)
4. Lazy loading: Only visible + buffer tiles loaded
5. Console logs show load/unload operations
6. 50x50 map navigable by dragging
7. No performance degradation during panning
8. Works on mobile viewport (320px width)

✅ **Nice to Have**:
1. Debug overlay showing camera/tile info
2. Visual loading indicators
3. Smooth animations (if global animation enabled)
4. Buffer zone visualization (debug mode)

---

## Risk Assessment

### Potential Issues

**High Risk**:
- **Coordinate system confusion**: Isometric projection complicates screen-to-world conversion
  - *Mitigation*: Extensive testing with debug overlays, coordinate logging
  
- **Performance with large maps**: 50x50 might still be too much
  - *Mitigation*: Start with smaller map (30x30), scale up gradually

**Medium Risk**:
- **Touch input conflicts**: Drag might interfere with tab navigation
  - *Mitigation*: Proper event handling, stopPropagation where needed
  
- **Loading thrashing**: Rapid panning at buffer boundaries
  - *Mitigation*: Hysteresis (different load/unload thresholds)

**Low Risk**:
- **Memory leaks**: Tiles not properly unloaded
  - *Mitigation*: Clear Map entries, use WeakMap if applicable
  
- **Animation conflicts**: Global animation toggle might break canvas
  - *Mitigation*: Canvas has separate render loop, independent of CSS animations

---

## File Size & Complexity Estimates

### New Files
- `InteractiveCanvas.tsx`: ~300 lines
- `CameraSystem.ts`: ~150 lines
- `TileManager.ts`: ~200 lines
- `InputHandler.ts`: ~150 lines
- `MapGenerator.ts`: ~100 lines
- `rendering.ts`: ~200 lines (copied + adapted)
- `types/index.ts`: ~50 lines

**Total**: ~1,150 new lines + existing test_ui (~3,600 lines) = **~4,750 total lines**

---

## Development Timeline (Rough Estimate)

### Sequential Implementation
1. **Phase 1**: Setup (copy files, structure) - Foundation
2. **Phase 2**: Static canvas rendering - Verify rendering works
3. **Phase 3**: Camera system - Positioning and clamping logic
4. **Phase 4**: Input handling - Make it interactive
5. **Phase 5**: Tile manager - Lazy loading core
6. **Phase 6**: Integration - Connect all pieces
7. **Phase 7**: Polish - Debug tools and optimization

**Critical Path**: Phase 3 → Phase 4 → Phase 5 (camera + input + loading are interdependent)

---

## Open Questions & Decisions Needed

### Questions to Address Before Implementation

1. **Tile Rendering**: 
   - Use colored squares (simple) or load actual sprites from test_component_1?
   - *Recommendation*: Start with colored squares, add sprites later

2. **Initial Load Strategy**:
   - Load on component mount (before canvas visible)?
   - Show loading screen during initial tile load?
   - *Recommendation*: Pre-load center view immediately, show progress

3. **Debug Mode**:
   - Always on? Toggle with button? Keyboard shortcut?
   - *Recommendation*: Toggle in Settings drawer + keyboard shortcut (D key)

4. **Map Data Storage**:
   - Generate procedurally? Load from JSON file? Hardcoded?
   - *Recommendation*: Procedural generation for testing (predictable patterns)

5. **Zoom Support**:
   - Include in initial implementation or defer?
   - *Recommendation*: Defer to future enhancement (keep scope manageable)

---

## Summary

This implementation will create a **fully interactive isometric canvas** that:
- Integrates seamlessly with the test_ui layout
- Provides smooth pan navigation
- Efficiently loads only necessary tiles
- Demonstrates lazy loading with a large map
- Maintains mobile-first responsive design
- Respects global animation settings

**Key Innovation**: Separation of concerns - rendering layer (canvas) is completely independent of game logic, making it easy to integrate real game data later.

**Next Step**: Review this brainstorm, adjust if needed, then proceed with implementation in phases.
