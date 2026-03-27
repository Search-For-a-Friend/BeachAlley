import { TerrainMap, TerrainType } from '../types/environment';
import { TideInfo } from './TimeManager';

export interface TideTile {
  x: number;
  y: number;
  originalType: TerrainType;
  currentType: TerrainType;
}

export class TideManager {
  private terrainMap: TerrainMap;
  private originalTerrain: Map<string, TerrainType>;
  private tideTiles: Map<string, TideTile>;
  private sealineTiles: Set<string>;
  private lastTideOffset: number = -1;
  private onTideChange?: (changedTileKeys: string[]) => void; // Callback with specific changed tiles

  constructor(terrainMap: TerrainMap) {
    this.terrainMap = terrainMap;
    this.originalTerrain = new Map();
    this.tideTiles = new Map();
    this.sealineTiles = new Set();
    
    this.initializeOriginalTerrain();
    this.findSealineTiles();
  }

  // Store original terrain state (at 6 AM - maximum tide)
  private initializeOriginalTerrain(): void {
    for (const [key, tileType] of this.terrainMap.tiles) {
      this.originalTerrain.set(key, tileType);
    }
  }

  // Find sealine tiles (water adjacent to sand)
  private findSealineTiles(): void {
    this.sealineTiles.clear();
    
    for (const [key, tileType] of this.terrainMap.tiles) {
      if (tileType === 'water') {
        const [x, y] = key.split(',').map(Number);
        
        // Check if adjacent to sand or wet_sand
        const neighbors = [
          [x-1, y], [x+1, y], [x, y-1], [x, y+1]
        ];
        
        for (const [nx, ny] of neighbors) {
          const neighborKey = `${nx},${ny}`;
          const neighborType = this.terrainMap.tiles.get(neighborKey);
          
          if (neighborType === 'sand' || neighborType === 'wet_sand') {
            this.sealineTiles.add(key);
            break;
          }
        }
      }
    }
    
    console.log('Found sealine tiles:', this.sealineTiles.size);
  }

  // Update terrain based on tide
  updateTide(tideInfo: TideInfo): void {
    const currentOffset = tideInfo.sealineOffset;
    
    // Log tide level evolution
    console.log(`Tide Level: ${tideInfo.level.toFixed(3)} (${(tideInfo.level * 100).toFixed(1)}%) | Offset: ${currentOffset} tiles | Direction: ${tideInfo.isRising ? 'RISING' : 'FALLING'} | Amplitude: ${tideInfo.amplitude}`);
    
    // Only update if tide offset changed
    if (currentOffset === this.lastTideOffset) return;
    
    console.log('Tide terrain update:', {
      offset: currentOffset,
      amplitude: tideInfo.amplitude,
      isRising: tideInfo.isRising
    });

    // Track which tiles actually change
    const changedTiles: string[] = [];

    // Restore all tiles to original state first, tracking changes
    this.restoreOriginalTerrain(changedTiles);

    // Apply tide changes, tracking new changes
    if (currentOffset > 0) {
      this.applyTideChanges(currentOffset, tideInfo.isRising, changedTiles);
    }

    this.lastTideOffset = currentOffset;
    
    // Force reload only changed tiles
    if (this.onTideChange && changedTiles.length > 0) {
      console.log(`Tide changed ${changedTiles.length} tiles:`, changedTiles.slice(0, 10)); // Show first 10 for debugging
      this.onTideChange(changedTiles);
    }
  }

  // Restore terrain to original state
  private restoreOriginalTerrain(changedTiles: string[]): void {
    for (const [key, originalType] of this.originalTerrain) {
      const currentType = this.terrainMap.tiles.get(key);
      if (currentType !== originalType) {
        this.terrainMap.tiles.set(key, originalType);
        changedTiles.push(key);
      }
    }
    this.tideTiles.clear();
  }

  // Apply tide changes to terrain
  private applyTideChanges(offset: number, isRising: boolean, changedTiles: string[]): void {
    const tilesToProcess = this.getTilesToProcess(offset);
    
    for (const tileKey of tilesToProcess) {
      const [x, y] = tileKey.split(',').map(Number);
      const originalType = this.originalTerrain.get(tileKey)!;
      
      if (isRising) {
        // Rising tide: sand -> wet_sand -> water
        if (originalType === 'sand') {
          // Sand about to become water -> dark brown (wet sand)
          this.terrainMap.tiles.set(tileKey, 'wet_sand');
          this.tideTiles.set(tileKey, {
            x, y,
            originalType,
            currentType: 'wet_sand'
          });
          changedTiles.push(tileKey);
        } else if (originalType === 'wet_sand') {
          // Wet sand about to become water -> lighter blue
          this.terrainMap.tiles.set(tileKey, 'water');
          this.tideTiles.set(tileKey, {
            x, y,
            originalType,
            currentType: 'water'
          });
          changedTiles.push(tileKey);
        }
      } else {
        // Ebb tide: water -> wet_sand -> sand
        if (originalType === 'sand') {
          // Wet sand returning to sand
          this.terrainMap.tiles.set(tileKey, 'wet_sand');
          this.tideTiles.set(tileKey, {
            x, y,
            originalType,
            currentType: 'wet_sand'
          });
          changedTiles.push(tileKey);
        } else if (originalType === 'wet_sand') {
          // Water returning to wet sand -> lighter blue
          this.terrainMap.tiles.set(tileKey, 'water');
          this.tideTiles.set(tileKey, {
            x, y,
            originalType,
            currentType: 'water'
          });
          changedTiles.push(tileKey);
        }
      }
    }
  }

  // Get tiles that should be affected by tide
  private getTilesToProcess(offset: number): Set<string> {
    const affectedTiles = new Set<string>();
    
    for (const sealineKey of this.sealineTiles) {
      const [x, y] = sealineKey.split(',').map(Number);
      
      // Apply tide offset in all directions from sealine
      for (let dx = -offset; dx <= offset; dx++) {
        for (let dy = -offset; dy <= offset; dy++) {
          const tileKey = `${x + dx},${y + dy}`;
          
          // Only process if within bounds and is water/sand
          if (this.terrainMap.tiles.has(tileKey)) {
            const tileType = this.terrainMap.tiles.get(tileKey);
            if (tileType === 'water' || tileType === 'sand' || tileType === 'wet_sand') {
              affectedTiles.add(tileKey);
            }
          }
        }
      }
    }
    
    return affectedTiles;
  }

  // Check if tile is affected by tide
  isTideAffected(x: number, y: number): boolean {
    const key = `${x},${y}`;
    return this.tideTiles.has(key);
  }

  // Get current terrain type (considering tide)
  getTerrainType(x: number, y: number): TerrainType {
    const key = `${x},${y}`;
    const tideTile = this.tideTiles.get(key);
    return tideTile ? tideTile.currentType : this.terrainMap.tiles.get(key)!;
  }

  // Get sealine tiles for debugging
  getSealineTiles(): Set<string> {
    return new Set(this.sealineTiles);
  }

  // Get tide-affected tiles for debugging
  getTideTiles(): Map<string, TideTile> {
    return new Map(this.tideTiles);
  }

  // Set callback for tide changes
  setOnTideChange(callback: (changedTileKeys: string[]) => void): void {
    this.onTideChange = callback;
  }
}
