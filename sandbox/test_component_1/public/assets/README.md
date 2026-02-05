# 🎨 Asset Structure Guide

This document describes the asset organization and naming conventions for Beach Alley.

## 📁 Folder Structure

```
assets/
├── sprites/
│   ├── establishments/
│   │   ├── house/
│   │   │   ├── manifest.json       # Sprite definitions
│   │   │   └── spritesheet.png     # All frames in one image
│   │   ├── beach_bar/
│   │   ├── restaurant/
│   │   └── ...
│   │
│   ├── people/
│   │   ├── individual/
│   │   │   ├── manifest.json
│   │   │   └── spritesheet.png
│   │   ├── small_group/
│   │   ├── big_group/
│   │   └── ...
│   │
│   ├── decorations/
│   ├── effects/
│   └── ui/
│
├── audio/
│   ├── music/
│   └── sfx/
│
└── fonts/
```

## 🖼️ Sprite Sheet Convention

### Naming Pattern
```
{entity_type}/{entity_name}/spritesheet.png
```

### Frame Layout (in spritesheet)
Frames are arranged in a grid:
- **Rows** = States
- **Columns** = Animation frames

Example for Establishment (4 states × 2 frames):
```
┌─────────┬─────────┐
│ closed_0│ closed_1│  Row 0: CLOSED
├─────────┼─────────┤
│ open_0  │ open_1  │  Row 1: OPEN (deserted)
├─────────┼─────────┤
│visited_0│visited_1│  Row 2: VISITED
├─────────┼─────────┤
│crowded_0│crowded_1│  Row 3: CROWDED
└─────────┴─────────┘
```

### Manifest JSON Format
```json
{
  "name": "house",
  "type": "establishment",
  "frameWidth": 64,
  "frameHeight": 64,
  "animationSpeed": 500,
  "states": {
    "closed": { "row": 0, "frames": 2 },
    "deserted": { "row": 1, "frames": 2 },
    "visited": { "row": 2, "frames": 2 },
    "crowded": { "row": 3, "frames": 2 }
  }
}
```

## 👥 People Categories

| Category | Size | Description |
|----------|------|-------------|
| individual | 1 person | Single visitor |
| small_group | 2-5 persons | Small groups, couples, families |
| big_group | 6+ persons | Large groups, tours |

### People Sprite States
- `look_up` - Character facing up/away
- `look_down` - Character facing down/toward camera  
- `look_side` - Character facing left or right

## 🔄 Animation System

- **Frame rate**: 500ms per frame (2 FPS for idle animations)
- **Looping**: All animations loop continuously
- **State transitions**: Instant switch to new state's frame 0

## 🎯 Adding New Assets

1. Create folder: `assets/sprites/{type}/{name}/`
2. Add `manifest.json` with sprite definitions
3. Add `spritesheet.png` with all frames
4. Register in `src/assets/registry.ts`
