# Conversation Context Summary – Beach Alley test_environments

**Date**: 2026-02-05  
**Scope**: `BeachAlley/sandbox/test_environments` – procedural terrain generation and UI

---

## 1. Project context

- **Beach Alley**: data-driven beach resort management simulation.
- **test_environments**: sandbox that builds on `test_ui` (full UI flow) and `test_ui_2` (canvas, drag, lazy loading). It adds environment selection and procedural terrain generation.
- **Critical constraints** (from `Reflection_On_Communication_Blocages.md`):
  - **Smartphone-first**: UI must fit small viewports (e.g. 375×667px); primary use case is mobile.
  - **Git**: Never commit or push without explicit user approval.
  - **Version names**: Each iteration gets a unique splash-screen version name; never reuse a name even when reverting.

---

## 2. Terrain generation – systematic algorithm

All environments follow the same pipeline:

1. **Line tracing** – Generate a path (chained array of tile coordinates) from a geometric shape (no noise in base shapes for Seafront/Cove; variations only where specified).
2. **Path rendering** – Mark path tiles and their 8 neighbors (edge + corner) as one terrain type (normally grass; currently **sand** for debugging).
3. **Grass filling** – For each tile still water, set to grass if “inside” the intended region (using the **same** line/circle as tracing).
4. **Sand gradient** – (Commented out in current debug build.) First pass: all water adjacent to grass → sand. Second pass (×2): water adjacent to sand → sand with probability 0.5 then 0.4.
5. **Isolated tiles cleanup** – (Commented out in current debug build.) Sand with no edge-adjacent sand → grass or water; water with no edge-adjacent water → sand. Never convert to grass except via that sand rule.

**Rule**: Water may only touch sand; grass may only touch sand. Sand is the only buffer between water and grass.

---

## 3. Environment-specific logic

| Environment | Line shape | Path generation | Filling (“inside” = grass for filling) |
|-------------|------------|------------------|----------------------------------------|
| **Seafront** | Straight line, random angle | `generateStraightLinePath()` – line through map center, perpendicular sampling, no variation | `isInsideSeafront`: same angle/offset; perpendicular distance from line (math must match line direction). |
| **Lake** | Circle | `generateCirclePath()` – center = map center, radius 0.35×min(size), optional radius noise | `isInsideLake`: inside circle = water → grass **outside** circle. |
| **Island** | Circle | Same as Lake | `isInsideIsland`: inside circle = grass. |
| **Cove** | Full circle intersecting 2 map edges | `generateArcPath()` – circle, center near one random edge, radius ~0.4×min(size), no variation | `isInsideCove`: inside circle = water → grass **outside** circle. Uses same `coveCenter` and `coveOuterRadius` as path. |
| **Peninsula** | Two curved lines (diagonal band) | `generatePeninsulaPath()` – precomputed `leftLinePath` / `rightLinePath` (step → offset), exact `col - row` match per step | `isInsidePeninsula`: between left and right bounds (with prev/next step for continuity). |

**Important**: `isInside*` must use the **exact same** geometry (angle, center, radius, offsets) as the path generation. No duplicate line/circle definition and no extra noise in the filling test, or the filling will appear perpendicular or shifted (e.g. Seafront bug).

---

## 4. Seafront perpendicular-filling bug

- **Symptom**: The filled region (grass) looks perpendicular to the actual traced line (sand in debug).
- **Cause**: The “inside” test used a different or wrong perpendicular-distance formula than the line used for tracing.
- **Fixes attempted**: 
  - Remove noise from `isInsideSeafront` and use same angle/offset as line.
  - Correct perpendicular distance: line direction `(cos θ, sin θ)` → normal component; formula adjusted (e.g. `relCol * sin θ - relRow * cos θ`) so “inside” aligns with the traced line. If still wrong, the angle convention (row/col vs x/y) may need to be inverted so filling and line use the same side.
- **Debug mode**: Line (path + neighbors) drawn as **sand**; only **water** tiles filled as **grass**. This makes it easy to see if the line and the filled region are aligned or perpendicular.

---

## 5. Current code state (as of this summary)

- **Line rendering**: Path + 8 neighbors are set to **sand** (debug).
- **Filling**: Only tiles that are still **water** are considered; those “inside” the region are set to **grass**. Sand (the line) is left unchanged.
- **Sand gradient** and **isolated tile cleanup** steps are **commented out**.
- **Splash screen**: Shows a version name (e.g. “v. Debug Colors”) at the bottom for iteration tracking.
- **Random seed**: `Date.now()` is passed when creating `EnvironmentGenerator` so each run gets different terrain (e.g. peninsula shape, seafront angle).

---

## 6. File and folder roles

- **`BeachAlley/sandbox/test_environments/`** – Main app: Vite + React, port 5174, `host: true` for LAN access (e.g. smartphone).
- **`src/systems/EnvironmentGenerator.ts`** – All terrain logic: path generation, filling (`isInside*`), sand gradient, isolated-tile cleanup.
- **`src/App.tsx`** – Screen flow: splash → menu → environment selection → game. Creates generator with `Date.now()` and passes generated `TerrainMap` into game.
- **`AI/Reflection_On_Communication_Blocages.md`** – Communication and workflow rules (git, smartphone, version names, etc.).

---

## 7. Next steps (from conversation)

1. **Seafront**: Confirm with “sand line + grass fill” debug view that the filled region is parallel to the sand line; if still perpendicular, adjust the perpendicular-distance sign or row/col mapping so `isInsideSeafront` matches the line direction.
2. **Restore normal rendering**: Once correct, set path + neighbors back to **grass** and filling to grass for “inside” (and water elsewhere), then uncomment sand gradient and isolated-tile cleanup.
3. **Re-enable full pipeline**: Uncomment sand gradient and cleanup when line + filling are validated.

---

## 8. Version names (examples from conversation)

Used for tracking which build is on device: Golden Pineapple, Silver Dolphin, Jade Serpent, Copper Wave, Emerald Thread, Amber Ribbon, Sapphire Bridge, Citrine Dawn, Ivory Cascade, Bronze Shield, Pearl Whisper, Obsidian Flow, Twilight Fern, Crystal Horizon, Azure Bloom, etc. Each new change uses a new name (never reuse).
