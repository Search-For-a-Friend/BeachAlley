# Test Component 1: Pathfinding & Entrance System

Extends test_component_0 with:
- Tile-based navigation system
- A* pathfinding
- Establishment entrances
- Obstacle avoidance
- Walkable/non-walkable tiles

See `pathfinding_design.md` for full design specification.

## Running

```bash
pnpm install
pnpm run dev
```

## Key Differences from Component 0

- Groups navigate through valid path tiles only
- Establishments have designated entrance tiles
- A* pathfinding computes routes around obstacles
- Visual path rendering shows planned routes
- Different tile types with movement costs
