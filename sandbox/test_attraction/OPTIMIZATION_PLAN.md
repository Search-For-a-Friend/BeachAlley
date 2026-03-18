# Game Performance Optimization Plan

## Problem Analysis
The game becomes extremely laggy when managing multiple groups simultaneously. This indicates performance bottlenecks in the core game loop, rendering, and group management systems.

## Current Performance Issues
1. **Group Management**: Unlimited spawning without proper culling
2. **Rendering**: Inefficient canvas rendering with no optimization
3. **Update Loop**: Heavy calculations every frame for all groups
4. **Memory Management**: No cleanup of unused resources
5. **Collision Detection**: Expensive distance calculations
6. **State Updates**: Unnecessary state changes and checks

## Optimization Strategy

### Phase 1: Immediate Performance Fixes (Critical)

#### 1.1 Group Population Management
- **Problem**: Unlimited group spawning causes exponential growth
- **Solution**: Implement dynamic population culling
  - Add maximum active groups limit (e.g., 50-100)
  - Implement priority-based spawning (pause spawning when at limit)
  - Add group despawning queue to prevent sudden removals

#### 1.2 Canvas Rendering Optimization
- **Problem**: Redraw entire canvas every frame
- **Solution**: Implement dirty rectangle rendering
  - Track which regions need updates
  - Only redraw changed portions
  - Implement viewport culling (don't render off-screen groups)
  - Use object pooling for frequently created objects

#### 1.3 Update Loop Optimization
- **Problem**: Every group processed every frame
- **Solution**: Implement update frequency throttling
  - Update distant groups less frequently
  - Use spatial partitioning for proximity checks
  - Batch similar operations together

### Phase 2: Algorithm Optimizations (Important)

#### 2.1 Spatial Partitioning System
- **Problem**: O(n²) distance calculations for all groups
- **Solution**: Implement grid-based spatial partitioning
  - Divide map into grid cells
  - Only check nearby cells for proximity
  - Reduce settlement checks from O(n²) to O(n)

#### 2.2 Group Behavior Optimization
- **Problem**: Complex settlement checks every frame
- **Solution**: Cache and optimize behavior calculations
  - Cache settlement eligibility results
  - Only recalculate when group moves
  - Implement settlement attempt cooldowns

#### 2.3 Memory Management
- **Problem**: Memory leaks and inefficient object creation
- **Solution**: Implement object pooling and cleanup
  - Pool Vector2 objects instead of creating new ones
  - Clean up event listeners and timers
  - Implement proper resource disposal

### Phase 3: Advanced Optimizations (Nice to Have)

#### 3.1 Web Workers
- **Problem**: Heavy calculations block main thread
- **Solution**: Move calculations to Web Workers
  - Pathfinding calculations
  - Settlement behavior processing
  - Terrain generation

#### 3.2 Rendering Pipeline
- **Problem**: Inefficient rendering order and batching
- **Solution**: Implement layered rendering
  - Separate static and dynamic layers
  - Batch similar draw calls
  - Implement sprite atlasing

#### 3.3 State Management Optimization
- **Problem**: Unnecessary state updates and re-renders
- **Solution**: Implement state diffing and batching
  - Only update changed state
  - Batch state updates
  - Implement state change debouncing

## Implementation Priority

### Critical (Must Do Now)
1. **Group Population Culling** - Prevent unlimited growth
2. **Viewport Culling** - Don't render off-screen objects
3. **Update Frequency Throttling** - Reduce per-frame calculations
4. **Object Pooling** - Reduce garbage collection

### Important (Do Soon)
1. **Spatial Partitioning** - Optimize proximity checks
2. **Dirty Rectangle Rendering** - Optimize canvas updates
3. **Settlement Behavior Caching** - Reduce repeated calculations
4. **Memory Cleanup** - Prevent leaks

### Nice to Have (Do Later)
1. **Web Workers** - Move heavy calculations off main thread
2. **Advanced Rendering** - Layer-based rendering
3. **State Optimization** - Advanced state management

## Expected Performance Improvements

### Phase 1 Results
- **60-80% reduction** in frame time
- **Stable FPS** with 50+ groups
- **Reduced memory usage** by 30-40%

### Phase 2 Results
- **Additional 40-60% improvement** in performance
- **Scales to 100+ groups** smoothly
- **Memory usage stabilized**

### Phase 3 Results
- **Additional 20-30% improvement**
- **Scales to 200+ groups**
- **Consistent 60 FPS** even with many groups

## Implementation Steps

### Step 1: Group Population Management
```typescript
// Add to GameEngine
private maxActiveGroups = 50;
private groupSpawnCooldown = 0;

private updateSpawning(): void {
  if (this.state.groups.length >= this.maxActiveGroups) return;
  // ... existing logic
}
```

### Step 2: Viewport Culling
```typescript
// Add to InteractiveCanvas
private isGroupInViewport(group: PeopleGroup): boolean {
  const screenPos = cameraSystem.worldToScreen(group.position);
  return screenPos.x >= 0 && screenPos.x <= canvasWidth &&
         screenPos.y >= 0 && screenPos.y <= canvasHeight;
}
```

### Step 3: Update Frequency Throttling
```typescript
// Add to GameEngine
private updateFrequency = 100; // ms between updates for distant groups
private lastGroupUpdate = new Map<string, number>();

private shouldUpdateGroup(group: PeopleGroup, currentTime: number): boolean {
  const lastUpdate = this.lastGroupUpdate.get(group.id) || 0;
  return currentTime - lastUpdate >= this.updateFrequency;
}
```

### Step 4: Spatial Partitioning
```typescript
// Create SpatialGrid class
class SpatialGrid {
  private grid: Map<string, PeopleGroup[]> = new Map();
  private cellSize: number = 10;
  
  addGroup(group: PeopleGroup): void { /* ... */ }
  getNearbyGroups(position: Vector2, radius: number): PeopleGroup[] { /* ... */ }
  removeGroup(group: PeopleGroup): void { /* ... */ }
}
```

## Testing Strategy

### Performance Metrics
- **Frame Rate**: Monitor FPS over time
- **Memory Usage**: Track heap size
- **Group Count**: Measure performance vs group count
- **CPU Usage**: Monitor main thread load

### Load Testing
- Test with 10, 25, 50, 100, 200 groups
- Measure performance degradation
- Identify breaking points

### Profiling
- Use Chrome DevTools Performance tab
- Identify bottlenecks
- Measure optimization impact

## Success Criteria
- **60 FPS** with 50+ active groups
- **Memory usage** stable over time
- **No frame drops** during group spawning/despawning
- **Smooth camera movement** regardless of group count

This plan provides a systematic approach to optimizing the game performance while maintaining gameplay quality and features.
