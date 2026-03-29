# Tide System Refactor Design Document

## Overview
This document outlines the complete redesign of the tide system to decouple sea level variation from wet sand logic, creating a more realistic and efficient tide simulation.

## Core Concepts

### 1. Sea Level System
**Pre-computed Sea Levels**: Instead of calculating tide changes in real-time, we pre-compute multiple sea level configurations at environment creation.

#### Sea Level Generation
- **Base Sea Line**: The frontier between sand and water at creation (highest sea level - high tide)
- **Sea Levels Array**: 3-7 pre-computed sea level configurations, each shifting the sea line back by one tile
- **Level Index**: Current active sea level (0 = highest tide, max = lowest tide)

#### Sea Level Data Structure
```typescript
interface SeaLevel {
  id: number;
  waterTiles: Set<string>; // Tile keys that are water at this level
  sandTiles: Set<string>; // Tile keys that are sand at this level
  sealineTiles: Set<string>; // Frontier tiles at this level
}
```

### 2. Wet Sand System
**Time-based Drying**: Wet sand is now an attribute of sand tiles that dries after 2 hours of game time.

#### Wet Sand Data Structure
```typescript
interface WetSandTile {
  tileKey: string;
  wetSince: number; // Game time when tile became wet
  lastWaterTime: number; // Last game time when tile was water
}
```

#### Drying Logic
- Sand becomes wet when transitioning from water to sand
- Wet sand dries after 2 hours of continuous dryness
- If tile becomes water again, drying timer resets

## Algorithm Flow

### 1. Initialization (Environment Creation)
```
1. Generate base terrain (sand/water)
2. Identify base sea line (sand-water frontier)
3. Create 3-7 sea levels by progressively shifting sea line back
4. Initialize wet sand tracking system
5. Set initial sea level (high tide)
```

### 2. Runtime Tide Updates
```
1. Calculate current tide level (0-1) from TimeManager
2. Map tide level to sea level index
3. If sea level changed:
   - Apply new sea level configuration
   - Track newly wet sand tiles
   - Update drying timers
4. Process wet sand drying (2-hour rule)
```

## Data Structures

### TideManager (Refactored)
```typescript
class TideManager {
  private seaLevels: SeaLevel[];           // Pre-computed sea levels
  private currentSeaLevelIndex: number;    // Current active level
  private wetSandTiles: Map<string, WetSandTile>; // Wet sand tracking
  private terrainMap: TerrainMap;          // Reference to terrain
  
  // Core methods
  private generateSeaLevels(): void;       // Create pre-computed levels
  private applySeaLevel(index: number): void; // Apply sea level
  private updateWetSand(): void;           // Process drying logic
  private findBaseSeaLine(): Set<string>;  // Find initial frontier
}
```

### Tile Extensions
```typescript
interface ExtendedTile extends Tile {
  isWet?: boolean;              // Wet sand attribute
  wetSince?: number;            // When it became wet
  lastWaterTime?: number;       // Last time it was water
}
```

## Performance Optimizations

### 1. Pre-computation Benefits
- **No Real-time Calculations**: Sea level transitions are instant lookups
- **Reduced CPU Load**: Only wet sand drying needs continuous processing
- **Predictable Performance**: Consistent regardless of map size

### 2. Efficient Updates
- **Selective Updates**: Only tiles that change between sea levels are updated
- **Incremental Drying**: Process wet sand tiles in batches
- **Minimal Memory**: Store only changed tiles, not full terrain copies

## Visual System

### Rendering Logic
```typescript
// Tile rendering priority
1. Water tiles -> Blue
2. Wet sand tiles -> Dark brown (#8B7355)
3. Dry sand tiles -> Light brown (#F4E4C1)
```

### Wet Sand Visualization
- **Immediate Visual Feedback**: Tiles become wet instantly when water recedes
- **Gradual Drying**: Visual indication of drying progress (optional)
- **Clear Distinction**: Wet vs dry sand clearly visible

## Implementation Phases

### Phase 1: Sea Level System
1. Refactor TideManager to support pre-computed sea levels
2. Generate sea levels at initialization
3. Implement sea level switching logic
4. Update terrain application system

### Phase 2: Wet Sand System
1. Add wet sand attribute system
2. Implement wet-to-dry transition logic
3. Create wet sand tracking data structures
4. Add 2-hour drying timer

### Phase 3: Integration & Optimization
1. Integrate sea level and wet sand systems
2. Optimize tile update mechanisms
3. Add comprehensive logging
4. Performance testing and tuning

## Configuration

### Tide Settings
```typescript
interface TideConfig {
  seaLevelCount: { min: 3, max: 7 };    // Number of pre-computed levels
  dryingTime: 2 * 60 * 60;            // 2 hours in game seconds
  updateInterval: 1000;                // Wet sand processing interval (ms)
}
```

### Visual Settings
```typescript
interface TideVisualConfig {
  waterColor: '#4A90E2';
  wetSandColor: '#8B7355';
  drySandColor: '#F4E4C1';
  transitionDuration: 500;            // Visual transition time (ms)
}
```

## Testing Strategy

### Unit Tests
- Sea level generation accuracy
- Wet sand drying timer correctness
- Tile state transitions
- Performance benchmarks

### Integration Tests
- Full tide cycle simulation
- Visual consistency verification
- Memory usage validation
- Edge case handling

### Performance Tests
- Large map performance
- Rapid tide changes
- Memory leak detection
- Frame rate impact

## Migration Plan

### Backward Compatibility
- Maintain existing TimeManager tide calculations
- Preserve current visual appearance
- Keep existing configuration options
- Ensure smooth transition from old system

### Data Migration
- Convert existing tide tiles to new format
- Preserve current sea level state
- Migrate wet sand state if applicable
- Update configuration files

## Future Enhancements

### Advanced Features
- **Variable Drying Time**: Different drying rates based on weather
- **Tide Pools**: Water pockets that don't follow main tide
- **Wave Effects**: Visual wave animations during tide changes
- **Erosion Simulation**: Long-term terrain changes from tide action

### Performance Enhancements
- **Spatial Indexing**: Optimize wet sand tile lookups
- **Batch Processing**: Process wet sand updates in chunks
- **Memory Pooling**: Reuse tile objects to reduce GC pressure
- **Web Workers**: Offload wet sand calculations to background threads

## Conclusion

This refactored tide system provides:
- **Better Performance**: Pre-computed sea levels eliminate real-time calculations
- **More Realistic Behavior**: Time-based wet sand drying mimics real-world behavior
- **Cleaner Architecture**: Decoupled systems are easier to maintain and extend
- **Scalable Design**: Efficient handling of large maps and complex scenarios

The new system maintains visual fidelity while significantly improving performance and adding more realistic tide behavior.
