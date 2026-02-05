# 🌴 BEACH ALLEY 🌴
## Game Design Document
### Version 1.0 | February 2026

---

# 📋 TABLE OF CONTENTS

1. [Game Overview](#game-overview)
2. [Visual Identity](#visual-identity)
3. [Core Gameplay](#core-gameplay)
4. [Game Systems](#game-systems)
5. [Economy & Progression](#economy--progression)
6. [Content & Features](#content--features)
7. [User Interface](#user-interface)
8. [Audio Design](#audio-design)
9. [Technical Specifications](#technical-specifications)

---

# 🎮 GAME OVERVIEW

## High Concept
**Beach Alley** is an isometric management simulation game where players take on the role of a coastal entrepreneur tasked with transforming a modest seaside strip into the ultimate luxury beach destination. Combining the addictive tycoon gameplay of classics like *RollerCoaster Tycoon* with a striking synthwave pixel art aesthetic, players must balance weather forecasting, seasonal tourism, facility management, and VIP relations to build their beach empire.

## Genre
- **Primary**: Tycoon / Management Simulation
- **Secondary**: City Builder / Economic Strategy

## Platform
- **Primary**: Web Browser (Chrome, Firefox, Safari, Edge)
- **Secondary**: Desktop via Electron (Windows, Mac, Linux)
- **Future**: Mobile PWA, Native Apps

## Target Audience
- Fans of classic tycoon games (RollerCoaster Tycoon, Theme Park, SimCity)
- Players aged 12+ who enjoy strategic planning and economic management
- Pixel art and synthwave aesthetic enthusiasts
- Casual gamers looking for relaxing yet engaging gameplay

## Unique Selling Points
1. **Synthwave Pixel Art**: A distinctive neon-soaked 80s retrofuturistic visual style rarely seen in management games
2. **Dynamic Weather System**: Real-time weather forecasting affects tourist behavior and revenue
3. **VIP Attraction System**: Court wealthy personalities to build luxury villas and boost prestige
4. **Seasonal Event Management**: Plan around festivals, holidays, and special occasions
5. **Day/Night Cycle**: Transform your beach from family-friendly daytime destination to vibrant nightlife hotspot

---

# 🎨 VISUAL IDENTITY

## Art Direction: "Sunset Paradise"

### Isometric Perspective
- **Camera Angle**: Classic 2:1 isometric projection (approx. 26.57°)
- **Tile Size**: 64x32 pixels base grid
- **Rotation**: 4-way rotation (90° increments) for full beach exploration
- **Zoom Levels**: 3 levels (Close-up, Standard, Overview)

### Pixel Art Style
- **Resolution**: Native 480p, scaled to display resolution
- **Sprite Detail**: High-detail pixel art with 32-color limited palette per element
- **Animation**: Smooth 12-24 FPS sprite animations for characters and effects
- **Dithering**: Strategic use of dithering for gradient effects (sunsets, water reflections)

### Synthwave Aesthetic

#### Color Palette
```
PRIMARY PALETTE:
┌─────────────────────────────────────────────────────────┐
│  SUNSET ORANGE    #FF6B35  │  NEON PINK      #FF0080   │
│  TROPICAL CYAN    #00FFFF  │  ELECTRIC BLUE  #0080FF   │
│  PALM PURPLE      #9B4DCA  │  MAGENTA BURST  #FF00FF   │
│  GOLDEN SAND      #FFD93D  │  DEEP OCEAN     #1A1A2E   │
│  MIAMI CORAL      #FF6F91  │  CHROME SILVER  #C0C0C0   │
└─────────────────────────────────────────────────────────┘

TIME-OF-DAY VARIATIONS:
• DAWN:     Soft pinks, pale oranges, lavender sky
• MIDDAY:   Bright cyans, warm yellows, vivid greens
• SUNSET:   Iconic orange-pink-purple gradient sky
• NIGHT:    Deep purples, neon accents, starfield
```

#### Visual Elements
- **Sky Gradients**: Dynamic gradient backgrounds shifting through day/night cycle
- **Neon Lighting**: Glowing signs, illuminated pathways, LED decorations at night
- **Sun Effects**: Dramatic lens flares and god rays during golden hour
- **Water Shaders**: Animated pixel water with reflective shimmer effects
- **Palm Trees**: Silhouetted palms as iconic visual anchors
- **Grid Lines**: Subtle neon grid overlay option for retrofuturistic feel

### Character Design
- **Tourist Sprites**: 16x24 pixel characters with distinct visual archetypes
- **VIP Characters**: Larger, more detailed sprites (24x32) with unique designs
- **Staff Members**: Color-coded uniforms matching facility themes
- **Animation Sets**: Idle, Walking, Using Facility, Swimming, Dancing, Sunbathing

---

# 🕹️ CORE GAMEPLAY

## Game Loop

```
┌──────────────────────────────────────────────────────────────┐
│                     DAILY CYCLE                               │
│                                                               │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│   │ MORNING │───▶│ MIDDAY  │───▶│ EVENING │───▶│  NIGHT  │  │
│   │ Planning│    │Operating│    │Peak Time│    │Nightlife│  │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│        │              │              │              │         │
│        ▼              ▼              ▼              ▼         │
│   Check Weather  Manage Staff   Handle Events  Count Revenue │
│   Set Prices     Restock Items  VIP Arrivals   Plan Tomorrow │
│   Open Facilities Monitor Guests Special Shows  Maintenance  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Player Role
The player assumes the dual identity of:
- **Mayor of Beach Alley**: Responsible for zoning, permits, public facilities, and town reputation
- **Entertainment Mogul**: Owner of commercial ventures, event organizer, and VIP host

## Primary Objectives
1. **Build & Expand**: Develop the beach from a small strip to a sprawling resort destination
2. **Maximize Revenue**: Balance pricing, capacity, and guest satisfaction for profit
3. **Attract VIPs**: Court wealthy personalities to establish permanent residences
4. **Manage Seasons**: Navigate the challenges of off-peak periods and capitalize on peak seasons
5. **Weather Mastery**: Use forecasting to optimize daily operations

## Controls & Interaction

### Mouse/Controller Input
| Action | Mouse | Controller |
|--------|-------|------------|
| Select | Left Click | A Button |
| Context Menu | Right Click | X Button |
| Pan Camera | Middle Drag / Edge Scroll | Left Stick |
| Rotate View | Q/E Keys | Bumpers |
| Zoom | Scroll Wheel | Triggers |
| Open Build Menu | B Key | Y Button |
| Speed Control | 1-3 Keys | D-Pad |

### Game Speed
- **Pause**: Full stop for planning and building
- **Normal**: 1 in-game hour = 2 real minutes
- **Fast**: 1 in-game hour = 30 real seconds
- **Ultra**: 1 in-game hour = 10 real seconds

---

# ⚙️ GAME SYSTEMS

## 1. Weather System

### Weather Types
| Weather | Icon | Tourist Impact | Duration |
|---------|------|----------------|----------|
| ☀️ Sunny | Clear skies | +50% attendance | 1-5 days |
| ⛅ Partly Cloudy | Mixed | Normal attendance | 1-3 days |
| 🌧️ Rainy | Showers | -60% attendance | 1-2 days |
| ⛈️ Thunderstorm | Severe | -90% attendance, damage risk | 4-12 hours |
| 🌡️ Heatwave | Extreme sun | +30% attendance, +health risks | 2-4 days |
| 🌊 High Winds | Coastal winds | -40% attendance, water sports boost | 1-2 days |

### Forecasting Mechanics
- **3-Day Forecast**: 90% accuracy, visible by default
- **7-Day Forecast**: 70% accuracy, unlockable upgrade
- **14-Day Forecast**: 50% accuracy, premium upgrade
- **Weather Station**: Building that improves forecast accuracy by 15%

### Weather Preparation
- Stock appropriate inventory before weather changes
- Schedule staff based on expected attendance
- Plan events around favorable weather windows
- Install weather-resistant upgrades for facilities

## 2. Seasonal Calendar System

### Seasons & Tourism Patterns
```
         TOURIST AFFLUENCE CALENDAR
         
   JAN  FEB  MAR  APR  MAY  JUN  JUL  AUG  SEP  OCT  NOV  DEC
    │    │    │    │    │    │    │    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
   ░░░  ░░░  ▒▒▒  ▓▓▓  ███  ███  ███  ███  ▓▓▓  ▒▒▒  ░░░  ░░░
   LOW  LOW  MED  HIGH PEAK PEAK PEAK PEAK HIGH MED  LOW  LOW
   
   Legend: ░ = 20-40% │ ▒ = 40-60% │ ▓ = 60-80% │ █ = 80-100%
```

### Seasonal Events
| Season | Events | Special Mechanics |
|--------|--------|-------------------|
| **Spring** | Easter Festival, Spring Break | Student tourists, family activities |
| **Summer** | Beach Olympics, Music Festivals | Peak attendance, premium pricing |
| **Autumn** | Harvest Fair, Off-Season Sales | Reduced costs, renovation time |
| **Winter** | Holiday Markets, New Year's Eve | Special decorations, VIP parties |

### Monthly Special Events
- **January**: New Year Recovery, Winter Sport Tourists
- **February**: Valentine's Week (couples-focused amenities)
- **March**: Spring Break Invasion (youth tourists)
- **April**: Easter Egg Hunt, Surf Competition
- **May**: Beach Opening Ceremony
- **June**: Summer Solstice Festival
- **July**: Independence Fireworks, Peak Season
- **August**: Sand Sculpture Contest, Music Festival
- **September**: Labor Day Finale, Couples Retreat
- **October**: Halloween Beach Party, Surfing Championship
- **November**: Thanksgiving Getaway, Loyalty Rewards Month
- **December**: Holiday Lights, New Year's Countdown

## 3. Tourist System

### Tourist Types
| Type | Budget | Preferences | Peak Times |
|------|--------|-------------|------------|
| 👨‍👩‍👧‍👦 **Families** | Medium | Safety, Kids Areas, Food Courts | Summer, Holidays |
| 🎓 **Students** | Low | Cheap Food, Nightlife, Activities | Spring Break |
| 💑 **Couples** | Medium-High | Romantic Spots, Fine Dining | Weekends, Valentine's |
| 🧳 **Business** | High | WiFi, Quiet Areas, Premium Service | Off-Peak |
| 👴 **Retirees** | Medium | Accessibility, Calm Areas, Health | Off-Season |
| 🌟 **Influencers** | Variable | Aesthetic Spots, Unique Experiences | Year-round |
| 💎 **VIPs** | Unlimited | Exclusivity, Luxury, Privacy | Special Events |

### Tourist Needs
```
NEED HIERARCHY (Priority Order):
┌─────────────────────────────────┐
│ 1. BASIC NEEDS                  │
│    • Restrooms     🚻           │
│    • Hydration     💧           │
│    • Shade/Shelter ⛱️           │
├─────────────────────────────────┤
│ 2. COMFORT NEEDS                │
│    • Seating       🪑           │
│    • Food          🍔           │
│    • Cleanliness   🧹           │
├─────────────────────────────────┤
│ 3. ENTERTAINMENT NEEDS          │
│    • Activities    🏄           │
│    • Shopping      🛍️           │
│    • Social Areas  🎉           │
├─────────────────────────────────┤
│ 4. LUXURY NEEDS                 │
│    • Premium Food  🦞           │
│    • VIP Lounges   🛋️           │
│    • Exclusive Access 🎫        │
└─────────────────────────────────┘
```

### Satisfaction Metrics
- **Comfort Score**: Physical needs met (0-100)
- **Entertainment Score**: Fun and activities (0-100)
- **Value Score**: Price vs. quality perception (0-100)
- **Overall Rating**: Weighted average, affects reviews and return visits

## 4. VIP Attraction System

### VIP Categories
| Category | Wealth | Benefit | Attraction Method |
|----------|--------|---------|-------------------|
| 🎬 **Movie Stars** | $$$$ | Fame boost, tourist draw | Luxury amenities, paparazzi-free zones |
| 💼 **Tech Moguls** | $$$$$ | Innovation grants, smart upgrades | High-tech facilities, WiFi excellence |
| 👑 **Old Money** | $$$$ | Prestige, exclusive events | Classical elegance, private beaches |
| 🎵 **Musicians** | $$$ | Concert events, nightlife boost | Music venues, recording studios |
| ⚽ **Athletes** | $$$ | Sports facility boost, competitions | Training facilities, sports bars |
| 🎨 **Artists** | $$ | Aesthetic upgrades, cultural events | Galleries, creative spaces |

### Villa System
- VIPs purchase plots in the "Golden Shore" district
- Each villa generates passive income and prestige
- VIPs host exclusive events that attract more tourists
- Villa aesthetics can be customized to match VIP personality
- Maintain VIP satisfaction or they may sell and leave

### VIP Relationship Mechanics
```
VIP RELATIONSHIP LEVELS:

[░░░░░░░░░░] UNKNOWN     - VIP unaware of your beach
[▓░░░░░░░░░] CURIOUS     - VIP has heard positive rumors
[▓▓▓░░░░░░░] INTERESTED  - VIP requests a visit
[▓▓▓▓▓░░░░░] IMPRESSED   - VIP considers investing
[▓▓▓▓▓▓▓░░░] COMMITTED   - VIP purchases villa plot
[▓▓▓▓▓▓▓▓▓▓] DEVOTED     - VIP becomes ambassador
```

## 5. Facility Management

### Facility Categories

#### 🏖️ Beach Essentials
| Facility | Cost | Capacity | Revenue/Day |
|----------|------|----------|-------------|
| Umbrella Rental | $500 | 20 | $100-300 |
| Lounge Chair Setup | $800 | 30 | $150-400 |
| Lifeguard Tower | $2,000 | - | Safety req. |
| Shower Station | $1,500 | 15/hr | $50-100 |
| Changing Rooms | $3,000 | 10/hr | $75-150 |
| Beach Towel Kiosk | $1,000 | 50/day | $200-500 |

#### 🍦 Food & Beverage
| Facility | Cost | Staff Req. | Revenue/Day |
|----------|------|------------|-------------|
| Ice Cream Stand | $3,000 | 1 | $300-800 |
| Snack Bar | $8,000 | 2 | $500-1,500 |
| Beach Café | $25,000 | 4 | $1,000-3,000 |
| Cocktail Lounge | $40,000 | 3 | $2,000-5,000 |
| Fine Dining Restaurant | $100,000 | 8 | $5,000-15,000 |
| Food Truck Zone | $5,000 | 0* | $1,000-2,500 |

*Food trucks are rented, not staffed by player

#### 🎢 Entertainment
| Facility | Cost | Maintenance | Appeal |
|----------|------|-------------|--------|
| Beach Volleyball Court | $5,000 | $50/day | ⭐⭐ |
| Surfboard Rental | $10,000 | $100/day | ⭐⭐⭐ |
| Jet Ski Station | $50,000 | $300/day | ⭐⭐⭐⭐ |
| Mini Golf Course | $35,000 | $150/day | ⭐⭐⭐ |
| Arcade Pavilion | $60,000 | $200/day | ⭐⭐⭐ |
| Water Park | $500,000 | $2,000/day | ⭐⭐⭐⭐⭐ |
| Concert Stage | $80,000 | Event-based | ⭐⭐⭐⭐ |

#### 🛍️ Retail & Services
| Facility | Cost | Revenue/Day |
|----------|------|-------------|
| Souvenir Shop | $15,000 | $400-1,200 |
| Sunscreen & Supplies | $8,000 | $200-600 |
| Surf Shop | $25,000 | $600-1,800 |
| Beach Photography | $12,000 | $300-900 |
| Spa & Massage | $45,000 | $1,500-4,000 |
| Boutique Hotel | $200,000 | $3,000-10,000 |

#### 🌙 Nightlife (Unlocked at Beach Level 5)
| Facility | Cost | Peak Revenue | Prestige |
|----------|------|--------------|----------|
| Beach Bar | $30,000 | $3,000/night | ⭐⭐ |
| Dance Floor | $20,000 | $1,500/night | ⭐⭐ |
| DJ Booth | $15,000 | Enhances venues | ⭐⭐⭐ |
| VIP Club | $150,000 | $10,000/night | ⭐⭐⭐⭐⭐ |
| Casino | $500,000 | $25,000/night | ⭐⭐⭐⭐⭐ |
| Fireworks Station | $25,000 | Event-based | ⭐⭐⭐⭐ |

### Facility Upgrades
Each facility has 3 upgrade tiers:
- **Bronze**: Base functionality, standard appearance
- **Silver**: +25% capacity, improved aesthetics, minor bonuses
- **Gold**: +50% capacity, premium aesthetics, special features

### Staff Management
| Role | Wage/Day | Facilities Covered |
|------|----------|-------------------|
| Vendor | $80 | Food stands, retail |
| Lifeguard | $120 | Beach areas, pools |
| Entertainer | $100 | Activities, events |
| Janitor | $70 | All facilities |
| Manager | $200 | Supervises 5 staff |
| Security | $150 | Night venues, VIP areas |

---

# 💰 ECONOMY & PROGRESSION

## Currency System
- **Sand Dollars ($)**: Primary currency for construction and operations
- **Prestige Points (★)**: Earned through achievements, used for exclusive unlocks
- **VIP Tokens (♦)**: Special currency from VIP relationships

## Revenue Streams
```
INCOME SOURCES:
├── Entry Fees (optional gated areas)
├── Facility Revenue
│   ├── Food & Beverage (35-45% of income)
│   ├── Rentals (20-30%)
│   ├── Entertainment (15-25%)
│   └── Retail (10-15%)
├── Event Ticket Sales
├── VIP Villa Rent
├── Sponsorship Deals
└── Government Tourism Grants
```

## Expenses
```
COST BREAKDOWN:
├── Staff Wages (30-40% of expenses)
├── Facility Maintenance (15-25%)
├── Inventory & Supplies (10-20%)
├── Marketing & Advertising (5-10%)
├── Utilities (5-10%)
├── Insurance (5%)
├── Loan Repayments (variable)
└── Emergency Repairs (variable)
```

## Progression System

### Beach Levels
| Level | Name | Unlocks | Requirements |
|-------|------|---------|--------------|
| 1 | Sandy Start | Basic facilities | Tutorial |
| 2 | Shore Thing | Food venues, volleyball | $10,000 earned |
| 3 | Wave Maker | Water sports, small events | $50,000 earned, 100 rep |
| 4 | Beach Boss | Nightlife, hotel | $150,000 earned, 300 rep |
| 5 | Coastal King | VIP district, casino | $500,000 earned, 750 rep |
| 6 | Paradise Mogul | Mega attractions, unlimited | $1,500,000 earned, 1500 rep |

### Reputation System
```
REPUTATION SCALE:
                                                           
  0 ──────────────────────────────────────────────── 2000
  │                                                     │
  UNKNOWN ─▶ KNOWN ─▶ POPULAR ─▶ FAMOUS ─▶ LEGENDARY   
  0-200      200-500   500-1000   1000-1500  1500+      
```

Reputation affects:
- Tourist attraction rate
- VIP interest level
- Loan interest rates
- Event success chances
- Unlockable content

### Achievement System
| Achievement | Description | Reward |
|-------------|-------------|--------|
| First Dollar | Earn your first revenue | 50 ★ |
| Summer Rush | Serve 1,000 tourists in one day | 200 ★ |
| Storm Survivor | Operate profitably through a storm | 150 ★ |
| VIP Treatment | Attract your first VIP resident | 500 ★ |
| Nightlife King | Generate $50,000 in one night | 300 ★ |
| Weather Wizard | Correctly predict 30 days straight | 250 ★ |
| Five Star Beach | Achieve maximum rating | 1000 ★ |

---

# 📦 CONTENT & FEATURES

## Game Modes

### 🎯 Campaign Mode
A narrative-driven experience across 5 chapters:

**Chapter 1: "Humble Beginnings"**
- Inherit a run-down beach from eccentric uncle
- Learn basic management mechanics
- Goal: Achieve profitability

**Chapter 2: "Rising Tide"**
- Compete with neighboring beach resort
- Introduce weather and seasonal mechanics
- Goal: Become the #1 local destination

**Chapter 3: "Star Power"**
- First VIP visits the region
- Learn VIP attraction and relationship mechanics
- Goal: Secure first permanent VIP resident

**Chapter 4: "Paradise Lost"**
- Major hurricane threatens everything
- Crisis management and recovery mechanics
- Goal: Rebuild better than before

**Chapter 5: "Legendary Shores"**
- Become the world's premier beach destination
- Global events and ultimate challenges
- Goal: Achieve legendary status

### 🏝️ Sandbox Mode
- Unlimited funds option
- All content unlocked
- Customizable difficulty sliders
- No fail conditions
- Creative building focus

### 🏆 Challenge Mode
- Weekly rotating challenges
- Global leaderboards
- Specific objectives and constraints
- Exclusive cosmetic rewards

### 🎭 Scenario Mode
- Pre-built challenging situations
- "What if" scenarios
- Historical beach management
- Community-created scenarios

## Customization Features

### Beach Theming
| Theme | Visual Style | Unlocked |
|-------|--------------|----------|
| Classic Synthwave | Neon pink/blue, palm silhouettes | Default |
| Tropical Paradise | Lush greens, flower accents | Level 2 |
| Mediterranean | White/blue, terracotta | Level 3 |
| Tiki Island | Bamboo, torches, volcanic | Level 4 |
| Futuristic | Chrome, holograms, minimalist | Level 5 |
| Vintage 50s | Pastel colors, retro signage | Achievement |

### Decorations
- Palm tree varieties (15 types)
- Rock formations and tide pools
- Flower gardens and hedges
- Pathways (sand, wood, stone, neon)
- Lighting (torches, neon signs, string lights)
- Water features (fountains, waterfalls)
- Art installations
- Seasonal decorations

---

# 🖥️ USER INTERFACE

## HUD Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [$125,430]  [★ 847]  [♦ 12]  │  ☀️ 28°C  │  📅 Jul 15  │ ⏸️▶️⏩ │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                                                                │
│                      GAME VIEW                                 │
│                    (Isometric Beach)                           │
│                                                                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ [🔨Build] [👥Staff] [📊Stats] [📅Events] [⭐VIP] [⚙️Settings]   │
└────────────────────────────────────────────────────────────────┘
```

## Key UI Panels

### Build Menu
- Category tabs with icon navigation
- Grid preview with placement ghost
- Cost and stats display
- Rotation controls
- Upgrade paths preview

### Weather Dashboard
```
┌─────────────── WEATHER CENTER ───────────────┐
│                                              │
│  TODAY        TOMORROW      3-DAY OUTLOOK    │
│  ┌────┐       ┌────┐        ┌────┬────┬────┐ │
│  │ ☀️  │       │ ⛅ │        │ 🌧️ │ ☀️  │ ☀️  │ │
│  │28°C│       │24°C│        │20°│26°│27°│ │
│  │90% │       │75% │        │40%│85%│90%│ │
│  └────┘       └────┘        └────┴────┴────┘ │
│                                              │
│  FORECAST ACCURACY: 87%  [UPGRADE STATION]   │
│                                              │
└──────────────────────────────────────────────┘
```

### Financial Overview
- Real-time revenue/expense tracking
- Daily/weekly/monthly graphs
- Breakdown by category
- Loan management
- Tax and fee schedule

### VIP Relations Panel
- VIP portraits and relationship meters
- Current location on beach (if visiting)
- Preference indicators
- Villa status and customization
- Event history

## Notification System
- **Green**: Positive events (VIP arrival, record revenue)
- **Yellow**: Attention needed (low supplies, staff shortage)
- **Red**: Critical issues (facility breakdown, storm warning)
- **Purple**: VIP-related notifications
- **Blue**: Achievement unlocked

---

# 🎵 AUDIO DESIGN

## Music Direction

### Synthwave Soundtrack
The musical identity blends:
- **Synthwave**: Pulsing synths, arpeggiated melodies
- **Chillwave**: Relaxed, dreamy atmospheres
- **Tropical House**: Beach-appropriate upbeat elements

### Dynamic Music System
| Time of Day | Musical Style | Tempo |
|-------------|---------------|-------|
| Dawn (5-8 AM) | Ambient synthwave, soft pads | 70-80 BPM |
| Morning (8-12 PM) | Upbeat chillwave, melodic | 90-110 BPM |
| Afternoon (12-6 PM) | Tropical synthwave, energetic | 110-125 BPM |
| Sunset (6-9 PM) | Classic synthwave, nostalgic | 100-115 BPM |
| Night (9 PM-12 AM) | Darkwave, clubby | 120-130 BPM |
| Late Night (12-5 AM) | Lo-fi synthwave, calm | 80-95 BPM |

### Seasonal Variations
- **Summer**: Full, layered arrangements
- **Spring/Autumn**: Medium intensity, transitional
- **Winter**: Stripped back, melancholic undertones

## Sound Effects

### Ambient Layer
- Ocean waves (intensity varies with weather)
- Seagull calls
- Wind through palm trees
- Distant crowd chatter (scales with attendance)
- Beach sports sounds

### Interactive Sounds
- UI clicks and confirmations (synthwave-styled)
- Construction completion fanfares
- Cash register "cha-ching" for sales
- Weather transition effects
- VIP arrival jingle

### Facility-Specific Audio
- Each facility type has unique ambient sounds
- Audio blends based on camera position
- Volume scales with zoom level

---

# 💻 TECHNICAL SPECIFICATIONS

## Platform Strategy
- **Primary Platform**: Web Browser (Desktop-first responsive)
- **Secondary Platform**: Desktop Apps via Electron (future)
- **Mobile**: Progressive Web App (PWA) support planned

## Technology Stack

### Frontend Framework
| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool & Dev Server | 5.x |
| **shadcn/ui** | UI Component Library | Latest |
| **Redux Toolkit** | State Management | 2.x |
| **Tailwind CSS** | Styling | 3.x |

### Game-Specific Libraries
| Library | Purpose |
|---------|---------|
| **PixiJS** | 2D WebGL Rendering (Isometric map) |
| **Howler.js** | Audio playback & management |
| **Zustand** | Local UI state (complement Redux) |
| **Immer** | Immutable state updates |
| **date-fns** | Date/time calculations |

### Architecture Pattern
- **Redux Architecture**: Centralized event-driven state management
- **Feature-Sliced Design**: Modular code organization
- **ECS-Inspired**: Entity-Component pattern for game objects

## Browser Requirements
| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Performance Targets
| Metric | Target |
|--------|--------|
| Initial Load | < 3 seconds |
| Frame Rate | 60 FPS (30 FPS minimum) |
| Memory Usage | < 512 MB |
| Bundle Size | < 5 MB (gzipped) |

## Save System (Phase 1 - Local)
- **LocalStorage**: Quick settings and preferences
- **IndexedDB**: Full game state persistence
- Auto-save every 5 minutes (configurable)
- Multiple save slots (10)
- Export/Import JSON saves

## Save System (Phase 2 - Online)
- **Backend**: Go (Golang) REST API
- **Database**: PostgreSQL
- **Authentication**: JWT-based auth
- Cloud save synchronization
- Cross-device play support

## Accessibility Features
- Colorblind modes (Deuteranopia, Protanopia, Tritanopia)
- Scalable UI (75%-200%)
- Screen reader support for menus
- Keyboard-only navigation option
- Reduced motion option
- Custom keybindings

## Localization
- i18n framework: react-i18next
- Planned languages: English (Primary), French, German, Spanish, Portuguese, Japanese, Korean, Simplified Chinese

## Related Documentation
- 📄 **Technical Design Document**: `TechnicalDesignDocument.md` - Detailed architecture and implementation specifications

---

# 📅 DEVELOPMENT ROADMAP

## Phase 1: Pre-Production (3 months)
- [x] Core concept documentation
- [ ] Art style prototypes
- [ ] Technical architecture
- [ ] Core loop prototype

## Phase 2: Production (12 months)
- [ ] Core systems implementation
- [ ] Full art asset creation
- [ ] Sound design and music
- [ ] Campaign mode development
- [ ] UI/UX implementation

## Phase 3: Polish (3 months)
- [ ] Playtesting and balancing
- [ ] Bug fixing
- [ ] Performance optimization
- [ ] Localization

## Phase 4: Launch
- [ ] Marketing campaign
- [ ] Press kit distribution
- [ ] Launch on primary platforms

## Post-Launch Content
- Seasonal content updates
- New VIP characters
- Additional scenarios
- Community workshop support
- Expansion: "Beach Alley: Winter Resort"

---

# 📎 APPENDIX

## Inspirations
- **RollerCoaster Tycoon** (1999): Core management loop, isometric perspective
- **Theme Park** (1994): Facility variety, guest simulation
- **SimCity** (Series): City management, zoning systems
- **Stardew Valley**: Pixel art excellence, seasonal systems
- **Two Point Hospital**: Humor, visual charm, accessible management

## Reference Material
- 1980s Miami Beach photography
- Synthwave album artwork (FM-84, The Midnight, Timecop1983)
- Isometric pixel art communities
- Beach resort management documentation
- Tourism industry seasonal patterns

---

*Document prepared for Beach Alley development team*
*Last updated: February 2026*

```
    ╔══════════════════════════════════════════╗
    ║                                          ║
    ║   🌴  B E A C H   A L L E Y  🌴          ║
    ║                                          ║
    ║   "Where Every Sunset Pays Dividends"    ║
    ║                                          ║
    ╚══════════════════════════════════════════╝
```
