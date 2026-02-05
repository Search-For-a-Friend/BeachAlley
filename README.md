# Beach Alley

A modern beach resort management simulation game inspired by RollerCoaster Tycoon, featuring isometric pixel art graphics and a synthwave aesthetic.

## Project Intent

Beach Alley is a web-based tycoon game where players manage a tourist beach resort. Players must:
- Manage establishments (restaurants, bars, activities)
- Forecast tourist affluence based on weather and seasonal events
- Attract VIPs and build their reputation
- Handle staff, resources, and supply chains
- Respond to social media trends and influencer activity

The game features a data-driven design with interconnected systems for realistic beach management simulation.

## Repository Structure

```
BeachAlley/
├── spec/                           # Game specifications and design documents
│   ├── GameDesignDocument.md       # Complete game design overview
│   ├── TechnicalDesignDocument.md  # Technical architecture and implementation
│   ├── GameSpec.md                 # Data model documentation
│   ├── GameSpec.json               # Structured data models for game entities
│   └── npc_review_systems_tycoon.md # Review and reputation system design
│
├── sandbox/                        # Prototype components and experiments
│   ├── test_component_0/           # Basic establishment & people group demo
│   └── test_component_1/           # Pathfinding & grid system demo
│
└── README.md                       # This file
```

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI**: shadcn/ui components
- **State Management**: Redux Toolkit
- **Rendering**: HTML5 Canvas (isometric diamond tile system)
- **Future Backend**: Go with database integration

## Getting Started

### Test Components

Navigate to any test component and run:

```bash
cd sandbox/test_component_0  # or test_component_1
pnpm install
pnpm run dev
```

## Development Status

🚧 **Early Prototype Phase** - Currently building core gameplay mechanics and testing isometric rendering systems.

### Completed
- ✅ Basic establishment and people group systems
- ✅ Isometric diamond tile rendering
- ✅ A* pathfinding with grid-based movement
- ✅ Tile-centered coordinate system
- ✅ Entrance/exit mechanics for establishments

### In Progress
- 🔄 Sprite animation system
- 🔄 Resource and supply chain mechanics
- 🔄 Staff management system

### Planned
- 📋 Weather and seasonal events
- 📋 Social media and influencer system
- 📋 VIP attraction mechanics
- 📋 Full establishment type implementations
- 📋 Save/load system with backend

## License

[To be determined]
