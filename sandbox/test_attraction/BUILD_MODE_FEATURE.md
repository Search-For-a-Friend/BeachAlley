# Build Mode (Viewport-Center Placement)

## Goal
Add a **Build Mode** workflow in the **Build** tab:

- Selecting a building card puts the player in **Build Mode**.
- In Build Mode:
  - The **contextual column** is shown (already implemented).
  - The **tile at the center of the viewport** is highlighted as the **selection tile**.
  - Pressing the contextual **Build** button attempts to place the selected building on the selection tile.
- A dedicated **Try Build** method validates placement and, if valid, converts the selection tile into an **establishment**.

This is designed for smartphone-first play: camera drag moves the world, while placement always targets the screen center.

---

## Definitions

- **Build Mode**: A UI / input state active when a building is selected in the Build tab.
- **Selected building**: The building type chosen from the Build tab cards (e.g. Bar, Restaurant, etc.).
- **Selection tile**: The map tile currently at the center of the viewport (changes as the camera moves).
- **Try Build**: A single entry-point method called when the user confirms placement.

---

## Expected UX

### Entering Build Mode
- User taps a building card in the **Build** tab.
- `selectedBuilding` becomes non-null.
- Contextual column appears (already OK).

### Selecting placement
- The camera can be moved (drag).
- The tile at **viewport center** is continuously computed.
- That tile is visually highlighted.

### Confirm placement
- User taps contextual **🏗️ Build** button.
- The system calls `tryBuildOnSelectionTile()`.

### Successful placement
- The tile becomes an establishment.
- The canvas updates to render the new establishment.
- Optional: keep the building selected to allow fast multi-placement, or clear selection to exit Build Mode (decision).

### Failed placement
- No world change.
- Optional: show a small toast / feedback string indicating why (invalid tile type / already occupied).

---

## Data / State

### UI State (Layout)
- `selectedBuilding: BuildingInfo | null`
  - Non-null means Build Mode is active.

### Camera State
- The camera transform already exists (drag-to-move). The selection tile must be derived from the camera offset + viewport size.

### Terrain / Tile Types
- Terrain map is the authoritative tile grid.
- Tile type must allow checking:
  - **Grass** / buildable tiles
  - Non-buildable tiles (water/sand/road/etc.)

### Establishments / Occupancy
- Establishments must be queryable by tile coordinate:
  - “Is there already an establishment on this tile?”

---

## Selection Tile Computation

### Requirements
- Must always target the tile at the center of the visible viewport.
- Must react to camera movement.

### Inputs
- Viewport dimensions: `canvasWidth`, `canvasHeight`
- Camera offset / transform: e.g. `cameraX`, `cameraY` (or similar)
- Tile size: `tileSize`

### Output
- `selectionTile: { x: number; y: number }` in **tile coordinates**.

### Pseudocode
```ts
function getSelectionTile({
  cameraX,
  cameraY,
  viewportW,
  viewportH,
  tileSize,
}): { x: number; y: number } {
  const worldCenterX = cameraX + viewportW / 2;
  const worldCenterY = cameraY + viewportH / 2;

  return {
    x: Math.floor(worldCenterX / tileSize),
    y: Math.floor(worldCenterY / tileSize),
  };
}
```

Notes:
- If the camera implementation uses inverted signs (common in canvas transforms), adapt accordingly.
- Clamp `{x,y}` to map bounds.

---

## Rendering: Highlighting the Selection Tile

### Requirement
When in Build Mode (`selectedBuilding !== null`), draw a highlight overlay on the selection tile.

### Suggested Visual
- Neon cyan border + translucent fill.
- Must not override existing highlights (hovered paths / special tiles). It should be additive.

### Rendering Hook
Add to the canvas rendering layer responsible for tile highlights:
- Compute `selectionTile` each frame.
- Render a rectangle overlay at the tile’s screen position.

---

## Action: Contextual Build Button

### Requirement
When the contextual **Build** button (🏗️) is pressed:
- Attempt to place the selected building at the selection tile.

### Signature (suggested)
```ts
tryBuildOnTile(tileX: number, tileY: number, building: BuildingInfo): {
  ok: boolean;
  reason?: 'NOT_BUILDABLE_TILE' | 'ALREADY_OCCUPIED' | 'OUT_OF_BOUNDS' | 'NO_BUILDING_SELECTED';
}
```

---

## Try Build Validation Rules

### Rule 1: Bounds
- Tile must be within map bounds.

### Rule 2: Tile is buildable
- Only allow building on **grass** (as requested).

### Rule 3: No existing establishment
- Disallow if there is already an establishment on that tile.

---

## Converting a Tile Into an Establishment

### Requirement
On success, convert the selection tile into a new establishment instance.

### Suggested Implementation Approach
- Add an establishment to the authoritative state (likely `gameState` / engine-managed state).
- Store at least:
  - `type` (from selected building)
  - `tileX`, `tileY`
  - `id`

### Pseudocode
```ts
function placeEstablishment(tileX: number, tileY: number, building: BuildingInfo) {
  // 1) Validate
  // 2) Mutate state: add establishment at tile
  // 3) Trigger re-render
}
```

Important:
- Ensure all systems consuming establishments (pathfinding, rendering, occupancy) see this update.

---

## Integration Points (Suggested)

### Layout layer (`LayoutTabbed.tsx`)
- Build Mode lives in layout state:
  - `selectedBuilding` already exists.
- Contextual build button click calls into a new method:
  - `handleTryBuild()`

### Canvas layer (`InteractiveCanvas.tsx`)
- Provide a prop for Build Mode rendering:
  - `buildModeEnabled: boolean`
  - `selectionTile?: {x,y}` or provide camera data and compute internally
- Render selection-tile highlight.

### Engine / State layer
- Implement the authoritative Try Build + placement mutation:
  - either in a `GridManager` method
  - or in a `GameEngine` method
  - or in a dedicated `BuildSystem`

---

## Edge Cases

- **Camera out of bounds**: selection tile should clamp to valid range.
- **Selection tile on sand/water**: highlight still shows; build fails with feedback.
- **Establishment already present**: build fails.
- **Rapid taps**: Try Build must be idempotent per tile.

---

## Acceptance Criteria

- Selecting a building enters Build Mode.
- A tile highlight is always visible at the viewport center in Build Mode.
- Build button attempts placement on that tile.
- Placement only succeeds if:
  - tile is grass
  - tile has no establishment already
- Successful placement results in a visible establishment rendered on the map.
- The Action Bar / drawer UI remains usable; camera drag still works.
