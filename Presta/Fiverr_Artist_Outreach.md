# 🎨 Beach Alley - Artist Collaboration Templates

## Message Version 1: Quick Introduction / Get in Touch

---

**Subject: Synthwave Pixel Art Collaboration - Beach Management Game**

Hi [Artist Name],

I'm developing **Beach Alley**, an isometric beach resort management game with a synthwave/retrofuturistic pixel art aesthetic (think RollerCoaster Tycoon meets Retrowave 🌴✨).

I'm looking for an artist to create **isometric pixel art assets** for:
- Establishments (beach houses, bars, shops, etc.)
- Path tiles and terrain elements
- People/groups with walking animations

**Artistic Direction:**
- Isometric 2:1 projection (64x64px tiles with visual overlap)
- Vibrant synthwave palette (neon pinks, tropical cyans, sunset oranges)
- Simple 2-frame animations for all sprites (we won't need smooth multi-frame animations)
- Each asset may include variations (Day/night, occupation, walking direction for people...)

I'd like to start with a **discovery set** to test our compatibility:
- 1 establishment illustration (final static art, no animation/variations)
- 1 people/group illustration (final static art, no animation/variations)

If the style fits, Phase 2 would include animations (simple 2-frame cycles) and variations. Phase 3 could be a **complete long-term collaboration** for the entire game's asset library.

**Could you provide a quote for:**
1. Phase 1: Discovery set (static illustrations)?
2. Phase 2: Advanced set with 2-frame animations and variations?

I can share detailed specifications, standardized manifest templates, and examples if you're interested!

Looking forward to hearing from you!

Best regards,
[Your Name]

---

## Message Version 2: Detailed Specification

---

**Subject: Beach Alley - Comprehensive Asset Creation Partnership**

Hi [Artist Name],

I'm developing **Beach Alley**, an isometric beach resort tycoon game with a distinctive synthwave/retrofuturistic pixel art aesthetic (think RollerCoaster Tycoon meets Retrowave 🌴✨). After reviewing your portfolio, I believe you'd be a great fit for this project!

---

## 📋 PROJECT OVERVIEW

**Game Concept:**  
Beach Alley is a management simulation where players build and operate a beach resort. Players place establishments, manage tourists, handle weather events, and develop their paradise into a thriving destination.

**Artistic Direction:**
- **Style**: Isometric pixel art with synthwave/retrofuturistic aesthetic
- **Color Palette**: Vibrant neon colors - sunset orange (#FF6B35), neon pink (#FF0080), tropical cyan (#00FFFF), electric blue (#0080FF), palm purple (#9B4DCA)
- **Atmosphere**: Think RollerCoaster Tycoon meets Retrowave
- **Animations**: Simple 2-frame animations for all sprites (at least not smooth multi-frame animations)
- **Variations**: Each asset may include variations (Day/night, occupation, walking direction for people...)
- **Perspective**: Classic 2:1 isometric projection
- **Tile Size**: 64x64 pixels (visual overlap for depth)

---

## 🎯 ASSET REQUIREMENTS

### 1️⃣ **Discovery Set** (Testing Phase)

This initial set helps us validate our working compatibility and your artistic interpretation:

**Deliverables:**
- **1 Establishment Illustration** (e.g., beach house, small bar, or shop)
  - Isometric view, 64x64px
  - **Final static art** - NO animation, NO variations
  - Polished artwork fitting the synthwave aesthetic
  - Purpose: Test artistic vision and style alignment
  
- **1 People/Group Illustration** (e.g., individual tourist or small group)
  - Isometric view, 64x64px
  - **Final static art** - NO animation, NO variations
  - Character design aligned with beach resort theme
  - Purpose: Test character style and rendering quality

**Important:** This phase is purely about artistic vision and style validation. No sprite sheets, no animations, no variations - just clean, polished final illustrations.

**Purpose:** Quick turnaround test to ensure visual style alignment before committing to the more complex animated/variant asset production.

---

### 2️⃣ **Advanced Set** (Production Phase with Animations & Variations)

If the discovery set is successful, we move to full asset production with animations and variations:

**Establishments** (3-5 types):
- Multiple establishment types (bar, restaurant, shop, rental station, etc.)
- Each with **5 states** based on occupancy:
  - `closed` - Lights off, inactive
  - `deserted` - Open but empty
  - `visited` - Some activity (1-49% capacity)
  - `busy` - High activity (50-89% capacity)
  - `crowded` - Maximum capacity (90-100%)
- Each state has **2 frames only** for simple alternating animation (lights blinking, flags waving, etc.)
- **Note:** Simple 2-frame animations (at least not smooth multi-frame animations)
- Size: 64x64px per frame

**People/Groups** (3-5 categories):
- Individual tourists, small groups (2-3 people), big groups (4-6 people)
- Each category with **3 directional states**:
  - `look_down` - Facing camera/south (**2 frames only** for walking)
  - `look_up` - Facing away/north (**2 frames only**)
  - `look_side` - Facing left/right (**2 frames only**)
- **4 visual variants** per category (different outfits, skin tones, accessories)
- **Note:** Simple 2-frame animations (at least not smooth multi-frame animations)
- Size: 64x64px per frame

**Path Tiles** (5-10 types):
- Walkable paths (sand, boardwalk, concrete)
- Spawn points (beach entrances)
- Special tiles (water edge, restricted areas)
- Size: 64x64px per tile (with visual overlap for depth)
- Corner/junction variations for seamless layouts
- Static tiles - NO animation needed

---

## 🔧 TECHNICAL SPECIFICATIONS

### Sprite Sheet Format
All assets are delivered as **sprite sheets** with accompanying **JSON manifest files**.

**Standardized Format:** All assets follow a unified manifest specification. See example manifests below that demonstrate the exact format used throughout the project.

**Example Manifest Structure:**
```json
{
  "name": "beach_bar",
  "type": "establishment",
  "description": "Tropical beach bar",
  "spritesheet": "spritesheet.png",
  "frameWidth": 64,
  "frameHeight": 64,
  "anchorX": 0.5,
  "anchorY": 0.8,
  "animationSpeed": 750,
  "states": {
    "closed": { "row": 0, "frames": 2 },
    "deserted": { "row": 1, "frames": 2 },
    "visited": { "row": 2, "frames": 2 },
    "busy": { "row": 3, "frames": 2 },
    "crowded": { "row": 4, "frames": 2 }
  }
}
```

**Sprite Sheet Layout:**
- Each **state** occupies one **row**
- Each **frame** occupies one **column** within that row
- Grid-aligned frames for easy parsing
- Transparent background (PNG with alpha channel)

**Deliverables per Asset:**
1. Sprite sheet image (PNG, transparent background)
2. JSON manifest file with metadata (following standardized format)
3. Source files (if using vector tools like Aseprite, Photoshop, etc.)

**Example Manifest Files:**
- See `BeachAlley/sandbox/test_component_1/public/assets/sprites/establishments/house/manifest.json` for establishment format
- See `BeachAlley/sandbox/test_component_1/public/assets/sprites/people/individual/manifest.json` for people format
- These standardized manifests will be provided as templates for your deliverables

---

## 📄 EXAMPLE STANDARDIZED MANIFESTS

### Example 1: Establishment Manifest (House)
```json
{
  "name": "house",
  "type": "establishment",
  "description": "Basic beach house establishment",
  "spritesheet": "spritesheet.svg",
  "frameWidth": 64,
  "frameHeight": 64,
  "anchorX": 0.5,
  "anchorY": 0.8,
  "animationSpeed": 750,
  "states": {
    "closed": {
      "row": 0,
      "frames": 2,
      "description": "Establishment is closed, lights off"
    },
    "deserted": {
      "row": 1,
      "frames": 2,
      "description": "Open but no visitors"
    },
    "visited": {
      "row": 2,
      "frames": 2,
      "description": "Some activity, 1-49% capacity"
    },
    "busy": {
      "row": 3,
      "frames": 2,
      "description": "Lots of activity, 50-89% capacity"
    },
    "crowded": {
      "row": 4,
      "frames": 2,
      "description": "Packed, 90-100% capacity"
    }
  }
}
```

**Sprite Sheet Structure for Establishments:**
```
Row 0: [Frame 1 - closed] [Frame 2 - closed]
Row 1: [Frame 1 - deserted] [Frame 2 - deserted]
Row 2: [Frame 1 - visited] [Frame 2 - visited]
Row 3: [Frame 1 - busy] [Frame 2 - busy]
Row 4: [Frame 1 - crowded] [Frame 2 - crowded]

= 5 rows × 2 frames = 10 total frames per establishment
```

---

### Example 2: People/Group Manifest (Individual Tourist)
```json
{
  "name": "individual",
  "type": "people",
  "category": "individual",
  "description": "Single person visitor",
  "groupSizeRange": [1, 1],
  "spritesheet": "spritesheet.svg",
  "frameWidth": 64,
  "frameHeight": 64,
  "anchorX": 0.5,
  "anchorY": 0.9,
  "animationSpeed": 300,
  "states": {
    "look_down": {
      "row": 0,
      "frames": 2,
      "description": "Facing camera/south"
    },
    "look_up": {
      "row": 1,
      "frames": 2,
      "description": "Facing away/north"
    },
    "look_side": {
      "row": 2,
      "frames": 2,
      "description": "Facing left or right"
    }
  },
  "variants": [
    { "name": "tourist_1", "column": 0 },
    { "name": "tourist_2", "column": 1 },
    { "name": "tourist_3", "column": 2 },
    { "name": "tourist_4", "column": 3 }
  ]
}
```

**Sprite Sheet Structure for People (with Variants):**
```
         Variant 1    Variant 2    Variant 3    Variant 4
         Col 0-1      Col 2-3      Col 4-5      Col 6-7
       ┌───────────┬───────────┬───────────┬───────────┐
Row 0: │ F1 │ F2  │ F1 │ F2  │ F1 │ F2  │ F1 │ F2  │ look_down
Row 1: │ F1 │ F2  │ F1 │ F2  │ F1 │ F2  │ F1 │ F2  │ look_up
Row 2: │ F1 │ F2  │ F1 │ F2  │ F1 │ F2  │ F1 │ F2  │ look_side
       └───────────┴───────────┴───────────┴───────────┘

= 3 rows × 2 frames × 4 variants = 24 total frames per people category
```

---

## 📊 VARIATIONS & ANIMATIONS EXPLAINED

### How Variations Work:
**For People/Groups:**
- Variants are different visual designs sharing the same animation structure
- Example: "Tourist 1" might wear a red shirt, "Tourist 2" wears blue, "Tourist 3" has a hat
- All variants have identical animation frames (look_down, look_up, look_side)
- Variants are laid out as **columns** in the sprite sheet

```
Sprite Sheet Layout Example (Individual Tourist):
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Variant 1  │  Variant 2  │  Variant 3  │  Variant 4  │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Frame 1 | 2 │ Frame 1 | 2 │ Frame 1 | 2 │ Frame 1 | 2 │ ← Row 0: look_down
│ Frame 1 | 2 │ Frame 1 | 2 │ Frame 1 | 2 │ Frame 1 | 2 │ ← Row 1: look_up  
│ Frame 1 | 2 │ Frame 1 | 2 │ Frame 1 | 2 │ Frame 1 | 2 │ ← Row 2: look_side
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### How Animations Work:
**Important:** We use **ONLY 2-frame animations** for all sprites (at least not smooth multi-frame animations). This is simple frame alternation.

**For Establishments:**
- **2 frames ONLY** per state (subtle movements)
- Frame alternation creates simple idle animation (flag flapping, lights pulsing, etc.)
- Animation speed controlled by manifest (typically 750ms per frame)
- Frame 1 ↔ Frame 2 loops continuously

**For People:**
- **2 frames ONLY** per directional state
- Simple walk cycle: Frame 1 ↔ Frame 2
- Simple 2-frame animations (at least not smooth multi-frame animations)
- The game engine handles position interpolation; sprites only provide 2-frame loops

---

## 💼 COLLABORATION STRUCTURE

### Phase 1: Discovery Set (Concept Validation)
- **Deliverables**: 1 establishment + 1 people illustration (final static art, no animation, no variations)
- **Timeline**: Quick turnaround (1-2 weeks)
- **Budget**: [Please provide your quote]
- **Goal**: Validate artistic vision and workflow compatibility

### Phase 2: Advanced Set (Production with Animations & Variations)
- **Deliverables**: 3-5 establishments + 3-5 people categories (with full 2-frame animations and variants)
- **Timeline**: Flexible based on asset count
- **Budget**: [Please provide your quote per asset type or package]
- **Goal**: Build core animated asset library for alpha/beta release

### Phase 3: Complete Collaboration (Long-term Partnership)
If both previous phases are successful and we work well together, this phase covers the **complete asset creation** for the entire project:
- 20-30 establishment types (all with 5 states × 2-frame animations)
- 10-15 people/group categories (all with directional animations and variants)
- Complete tile sets (terrain, decorations, special tiles)
- UI elements and effects
- Seasonal variants (summer, winter themes)
- Special event assets (concerts, festivals)

**This is the full-scale collaboration** with ongoing work as the game expands - potentially a significant long-term project!

---

## 💰 BUDGET REQUEST

Could you please provide quotes for:

1. **Phase 1 - Discovery Set:**
   - 1 establishment illustration (64x64px, final static art, no animation, no variations)
   - 1 people/group illustration (64x64px, final static art, no animation, no variations)
   - Purpose: Style validation only

2. **Phase 2 - Advanced Set (with animations & variations):**
   - Per establishment (5 states × 2 frames each = 10 frames total)
   - Per people category (3 directions × 2 frames × 4 variants = 24 frames total)
   - Per tile pack (5-10 static path tiles, 64x64px each)

**Additional Questions:**
- What's your typical turnaround time per asset?
- Do you work with revision rounds? (e.g., 2-3 rounds included?)
- Can you provide the source files (.aseprite, .psd, etc.)?
- Are you comfortable working with standardized JSON manifest files? (I'll provide templates)
- Have you worked with 2-frame sprite animations before?

---

## 📦 WHAT I'LL PROVIDE

To help you succeed, I'll share:
- ✅ Complete artistic direction document
- ✅ Color palette references and synthwave mood boards
- ✅ **Standardized JSON manifest templates** (exact format used across all project assets)
- ✅ Example manifests from current test components
- ✅ Current placeholder sprites (for context and size reference)
- ✅ Isometric grid guidelines and tile overlap specifications
- ✅ Sprite sheet layout diagrams
- ✅ Clear feedback on each iteration

---

## 🎯 NEXT STEPS

If you're interested:
1. Let me know if this project excites you!
2. Share your quote for the discovery set
3. Ask any questions about the specifications
4. I'll send over the complete reference package

I'm excited to potentially work with you on bringing Beach Alley's vibrant synthwave beach world to life! 🌴✨

Looking forward to your response!

Best regards,
[Your Name]

---

## 🔗 REFERENCE LINKS
- Game Design Document: [Available upon request]
- Current Prototype: [Available upon request]
- Synthwave Reference Board: [Pinterest/Mood board link]

---

*Beach Alley - Transforming pixels into paradise, one tile at a time* 🌊🎮
