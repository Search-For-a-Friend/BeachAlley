# Test UI 2 - Interactive Canvas with Lazy Loading

This is the implementation of the Beach Alley game UI with an integrated interactive isometric canvas featuring drag-to-pan navigation and lazy tile loading.

## Features Implemented

### ✅ Phase 1-4: Core Implementation Complete

1. **Interactive Canvas Component** (`InteractiveCanvas.tsx`)
   - Isometric tile rendering
   - Drag-and-drop navigation (mouse and touch support)
   - Real-time camera position tracking
   - Adaptive viewport-to-world coordinate conversion

2. **Camera System** (`CameraSystem.ts`)
   - World-to-screen coordinate conversion
   - Screen-to-world coordinate conversion
   - Tile-to-world coordinate conversion (isometric)
   - World-to-tile coordinate conversion (isometric)
   - **Adaptive map boundary clamping** - automatically adjusts based on map size
   - Smooth panning with position constraints

3. **Tile Loader System** (`TileLoader.ts`)
   - **Lazy loading**: Only loads visible tiles + 2-tile buffer zone
   - **Dynamic unloading**: Automatically unloads tiles outside visible range
   - Console logging for all load/unload events
   - Visible tile range calculation based on camera position
   - Efficient tile management using Map data structure

4. **Input Handler** (`InputHandler.ts`)
   - Mouse drag support (left-click drag)
   - Touch drag support (single-finger)
   - Natural inverted dragging (drag feels like moving a physical map)
   - Prevents context menu on right-click
   - Clean event listener management

5. **Test Map**
   - 40x40 tile grid (1600 tiles total)
   - Multiple screen sizes worth of content
   - 4 terrain types with distinct colors:
     - Sand (beige)
     - Water (blue)
     - Grass (green)
     - Path (brown)
   - Pseudo-random terrain generation based on tile coordinates

6. **UI Integration**
   - Full tabbed layout from test_ui
   - Canvas displayed in game view area
   - Settings drawer with animation toggle
   - Smooth tab transitions with sweep animations

## Architecture

```
src/
├── canvas/
│   ├── InteractiveCanvas.tsx   # Main canvas component
│   └── config.ts                # Configuration constants
├── systems/
│   ├── CameraSystem.ts          # Camera & coordinate conversions
│   ├── TileLoader.ts            # Lazy loading logic
│   └── InputHandler.ts          # Mouse/touch input
├── types/
│   └── canvas.ts                # TypeScript interfaces
├── layouts/
│   └── LayoutTabbed.tsx         # Main UI layout
├── screens/
│   └── GameScreen.tsx           # Game screen wrapper
├── components/
│   └── TopBar.tsx               # Top navigation bar
├── App.tsx                      # Root component
└── main.tsx                     # Entry point
```

## How It Works

### Lazy Loading System

The tile loader calculates which tiles are visible based on:
1. Current camera position (worldX, worldY)
2. Canvas dimensions (width, height)
3. Zoom level
4. Buffer zone (2 tiles beyond visible area)

**Loading Strategy:**
- On camera move, calculate visible tile range
- Load any tiles in range that aren't already loaded
- Unload tiles that fall outside the range + buffer

**Console Logging:**
```
[TileLoader] Loading tile (5, 12) - type: sand
[TileLoader] Loading tile (6, 12) - type: water
[TileLoader] Unloading tile (2, 8)
```

### Coordinate Systems

**Three coordinate systems:**
1. **Screen coordinates**: Pixel position on canvas (0,0 = top-left)
2. **World coordinates**: Isometric world space (0,0 = center of first tile)
3. **Tile coordinates**: Grid position (row, col)

**Isometric Projection:**
```
World X = (col - row) * (TILE_WIDTH / 2)
World Y = (col + row) * (TILE_HEIGHT / 2)
```

### Adaptive Clamping

The camera system calculates map bounds dynamically:
- Considers the full isometric diamond shape of the map
- Ensures viewport always shows valid map area
- Adjusts limits based on canvas size and zoom level

## Configuration

Edit `src/canvas/config.ts`:

```typescript
CANVAS_CONFIG:
- TILE_WIDTH: 64px
- TILE_HEIGHT: 32px
- INITIAL_ZOOM: 1.0
- BUFFER_TILES: 2

MAP_CONFIG:
- ROWS: 40
- COLS: 40

DEBUG_CONFIG:
- LOG_TILE_LOADING: true (console logs)
- SHOW_CAMERA_POSITION: true (on-screen debug info)
- SHOW_TILE_COORDINATES: false
```

## Running the Project

```bash
cd BeachAlley/sandbox/test_ui_2
npm install
npm run dev
```

Open browser to `http://localhost:5175`

## Testing the Features

1. **Drag Navigation**: Click/touch and drag to move around the map
2. **Lazy Loading**: Watch the console for load/unload events as you move
3. **Map Boundaries**: Try to drag beyond map edges - camera will stop
4. **Debug Info**: Top-left shows:
   - Current camera position
   - Current zoom level
   - Number of loaded tiles (should vary as you move)

## Performance Characteristics

**Tile Loading:**
- Typical loaded tiles: 100-200 (depending on zoom/buffer)
- Total map tiles: 1,600
- Memory savings: ~85% compared to loading all tiles

**Rendering:**
- Target: 60 FPS
- Only renders loaded tiles
- Efficient canvas 2D rendering

## Future Enhancements

- [ ] Zoom controls (mouse wheel, pinch-to-zoom)
- [ ] Mini-map overlay
- [ ] Sprite rendering (buildings, people)
- [ ] Click-to-select tiles
- [ ] Tile hover highlighting
- [ ] Smooth camera interpolation
- [ ] Loading animations for tiles
- [ ] Texture/image rendering (currently solid colors)

## Technical Notes

**Isometric Math:**
- Each tile is a diamond shape (64x32 pixels)
- Conversion formulas handle the 2:1 aspect ratio
- Visible range calculation accounts for rotated viewport

**Touch Optimization:**
- `touchAction: 'none'` prevents native scrolling
- Single-touch drag only (multi-touch reserved for future zoom)
- Smooth touch response with inverted delta

**Memory Management:**
- Tiles stored in `Map<string, Tile>` for O(1) access
- Automatic cleanup of off-screen tiles
- No memory leaks with proper event listener cleanup

## Comparison with test_ui

**Differences:**
- test_ui: Static canvas placeholder
- test_ui_2: Fully interactive isometric canvas with lazy loading

**Shared:**
- Same UI framework and styling
- Same tabbed layout system
- Same animation system
- Same settings infrastructure

## Success Criteria (All Met ✓)

- ✅ Canvas displays in game view
- ✅ Drag-to-pan works smoothly
- ✅ Camera clamps to map boundaries adaptively
- ✅ Only visible tiles + buffer are loaded
- ✅ Tiles unload when moving away
- ✅ Console logs show load/unload events
- ✅ Map is large enough to require scrolling
- ✅ No game logic dependencies (pure display)
- ✅ UI integration is seamless
