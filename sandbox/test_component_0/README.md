# 🏠 Test Component 0 - Establishment & People Group Demo

A mini prototype demonstrating the core interaction loop between Establishments and People Groups for the Beach Alley game.

## 🚀 Quick Start

```bash
# Navigate to this folder
cd BeachAlley/sandbox/test_component_0

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will open at `http://localhost:3000`

## 🎮 Features Demonstrated

### Establishment States
- **DESERTED** → No visitors (gray)
- **VISITED** → 1-49% occupancy (green)
- **BUSY** → 50-89% occupancy (orange)
- **CROWDED** → 90-100% occupancy (red)

### People Group Behavior
- **Spawning**: Groups appear at map edges
- **Seeking**: Groups move toward establishments
- **Visiting**: Groups stay and spend money
- **Leaving**: Groups exit when conditions are met

### Attraction System
- Establishments have an attraction radius (dashed circle)
- Groups within range may decide to visit
- Social proof: VISITED state attracts MORE people
- Overcrowding: CROWDED state attracts LESS people

### Leave Conditions
- Time elapsed (service time completed)
- Satisfaction dropped below 20%
- Money depleted
- Patience exhausted
- Random chance

## 🎛️ Controls

| Button | Action |
|--------|--------|
| ⏸️ Pause / ▶️ Resume | Toggle game simulation |
| 👥 Spawn Group | Force spawn a new group |
| 🔄 Reset | Reset the entire simulation |
| Open/Closed button | Toggle establishment state |

## 📁 Project Structure

```
test_component_0/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── game/
│   │   ├── utils.ts          # Math utilities
│   │   ├── establishment.ts  # Establishment logic
│   │   ├── peopleGroup.ts    # People group logic
│   │   ├── engine.ts         # Game loop & phases
│   │   └── index.ts          # Exports
│   ├── components/
│   │   ├── GameCanvas.tsx    # Canvas rendering
│   │   ├── StatsPanel.tsx    # Controls & stats
│   │   ├── EventLog.tsx      # Event display
│   │   └── index.ts          # Exports
│   ├── App.tsx               # Main application
│   └── main.tsx              # Entry point
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🔄 Game Loop Phases

```
1. SPAWN PHASE    → Check conditions, create groups
2. DECISION PHASE → Groups decide where to go
3. MOVEMENT PHASE → Groups move toward targets
4. ENTRY PHASE    → Groups enter establishments
5. VISIT PHASE    → Update satisfaction, spend money
6. LEAVE PHASE    → Check leave conditions
7. CLEANUP PHASE  → Remove despawned groups
8. STATE UPDATE   → Recalculate establishment states
```

## 📊 Key Metrics

- **Occupancy**: Current visitors / Max capacity
- **Satisfaction**: Group happiness (0-100%)
- **Revenue**: Money collected from visitors
- **Total Visits**: Cumulative entry count

## 🎨 Visual Legend

| Icon | Meaning |
|------|---------|
| 🏚️ | Deserted establishment |
| 🏠 | Visited establishment |
| 🏡 | Busy establishment |
| 🔥 | Crowded establishment |
| 🚶 | Solo visitor |
| 💑 | Couple |
| 👨‍👩‍👧 | Family |
| 👥 | Friends group |

---

*Part of Beach Alley game prototype series*
