import { TerrainMap } from '../types/environment';
import { TideInfo } from './TimeManager';

export interface SeaLevel {
  id: number;
  waterTiles: Set<string>;
  sandTiles: Set<string>;
  sealineTiles: Set<string>;
}

export interface WetSandTile {
  tileKey: string;
  wetSince: number;
  lastWaterTime: number;
}

export interface TideConfig {
  seaLevelCount: { min: number; max: number };
  dryingTime: number; // 2 hours in game seconds
  updateInterval: number; // Wet sand processing interval (ms)
}

export class TideManager {
  private terrainMap: TerrainMap;
  private seaLevels: SeaLevel[];
  private currentSeaLevelIndex: number = 0;
  private wetSandTiles: Map<string, WetSandTile>;
  private baseSeaLine: Set<string>;
  private onTideChange?: (changedTileKeys: string[]) => void;
  private lastTideLevel: number = -1;
  private config: TideConfig;

  constructor(terrainMap: TerrainMap) {
    this.terrainMap = terrainMap;
    this.config = {
      seaLevelCount: { min: 4, max: 8 },
      dryingTime: 2 * 60 * 60, // 2 hours in game seconds
      updateInterval: 1000 // Process wet sand every second
    };
    
    this.seaLevels = [];
    this.wetSandTiles = new Map();
    this.baseSeaLine = new Set();
    
    this.initializeTideSystem();
  }

  // Initialize the complete tide system
  private initializeTideSystem(): void {
    console.log('[TideManager] Initializing tide system...');
    
    // 1. Find base sea line (highest tide)
    this.baseSeaLine = this.findBaseSeaLine();
    console.log(`[TideManager] Found ${this.baseSeaLine.size} base sea line tiles`);
    
    // 2. Generate pre-computed sea levels
    this.generateSeaLevels();
    console.log(`[TideManager] Generated ${this.seaLevels.length} sea levels`);
    
    // 3. Apply initial sea level (high tide)
    this.applySeaLevel(0);
    
    console.log('[TideManager] Tide system initialization complete');
  }

  // Find base sea line (highest tide - frontier between sand and water)
  private findBaseSeaLine(): Set<string> {
    const seaLine = new Set<string>();
    
    for (const [key, tileType] of this.terrainMap.tiles) {
      if (tileType === 'water') {
        const [x, y] = key.split(',').map(Number);
        
        // Check if adjacent to sand
        const neighbors = [
          [x-1, y], [x+1, y], [x, y-1], [x, y+1]
        ];
        
        for (const [nx, ny] of neighbors) {
          const neighborKey = `${nx},${ny}`;
          if (this.terrainMap.tiles.get(neighborKey) === 'sand') {
            seaLine.add(key);
            break;
          }
        }
      }
    }
    
    return seaLine;
  }

  // Generate pre-computed sea levels
  private generateSeaLevels(): void {
    const levelCount = Math.floor(Math.random() * (this.config.seaLevelCount.max - this.config.seaLevelCount.min + 1)) + this.config.seaLevelCount.min;
    
    console.log(`[TideManager] Generating ${levelCount} sea levels...`);
    
    this.seaLevels = [];
    
    for (let level = 0; level < levelCount; level++) {
      const seaLevel = this.createSeaLevel(level);
      this.seaLevels.push(seaLevel);
      
      console.log(`[TideManager] Sea level ${level}: ${seaLevel.waterTiles.size} water tiles, ${seaLevel.sandTiles.size} sand tiles`);
    }
  }

  // Create a single sea level by shifting sea line back
  private createSeaLevel(levelId: number): SeaLevel {
    const waterTiles = new Set<string>();
    const sandTiles = new Set<string>();
    const sealineTiles = new Set<string>();
    
    // Start with base terrain
    for (const [key, tileType] of this.terrainMap.tiles) {
      if (tileType === 'water') {
        waterTiles.add(key);
      } else if (tileType === 'sand') {
        sandTiles.add(key);
      }
    }
    
    // Shift sea line back by 'level' tiles
    if (levelId > 0) {
      const tilesToConvert = new Set<string>();
      
      // Find water tiles to convert to sand (shift back)
      for (const seaLineKey of this.baseSeaLine) {
        const [x, y] = seaLineKey.split(',').map(Number);
        
        // Convert water tiles in expanding pattern
        for (let dx = -levelId; dx <= levelId; dx++) {
          for (let dy = -levelId; dy <= levelId; dy++) {
            const distance = Math.abs(dx) + Math.abs(dy);
            if (distance <= levelId) {
              const tileKey = `${x + dx},${y + dy}`;
              if (waterTiles.has(tileKey)) {
                tilesToConvert.add(tileKey);
              }
            }
          }
        }
      }
      
      // Apply conversions
      for (const tileKey of tilesToConvert) {
        waterTiles.delete(tileKey);
        sandTiles.add(tileKey);
      }
    }
    
    // Find new sealine for this level
    for (const waterKey of waterTiles) {
      const [x, y] = waterKey.split(',').map(Number);
      
      // Check if adjacent to sand
      const neighbors = [
        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
      ];
      
      for (const [nx, ny] of neighbors) {
        const neighborKey = `${nx},${ny}`;
        if (sandTiles.has(neighborKey)) {
          sealineTiles.add(waterKey);
          break;
        }
      }
    }
    
    return {
      id: levelId,
      waterTiles,
      sandTiles,
      sealineTiles
    };
  }

  // Apply a sea level configuration
  private applySeaLevel(levelIndex: number): void {
    if (levelIndex < 0 || levelIndex >= this.seaLevels.length) {
      console.error(`[TideManager] Invalid sea level index: ${levelIndex}`);
      return;
    }
    
    const seaLevel = this.seaLevels[levelIndex];
    const changedTiles: string[] = [];
    
    // Apply water tiles
    for (const tileKey of seaLevel.waterTiles) {
      const currentType = this.terrainMap.tiles.get(tileKey);
      if (currentType !== 'water') {
        this.terrainMap.tiles.set(tileKey, 'water');
        changedTiles.push(tileKey);
        
        // Update wet sand tracking - tile is now water
        if (this.wetSandTiles.has(tileKey)) {
          this.wetSandTiles.delete(tileKey);
          console.log(`[TideManager] Tile ${tileKey} became WATER (was wet sand)`);
        }
      }
    }
    
    // Apply sand tiles and track new wet sand
    for (const tileKey of seaLevel.sandTiles) {
      const currentType = this.terrainMap.tiles.get(tileKey);
      if (currentType !== 'sand') {
        this.terrainMap.tiles.set(tileKey, 'sand');
        changedTiles.push(tileKey);
        
        // Check if this tile was water before (becomes wet sand)
        const wasWater = this.currentSeaLevelIndex >= 0 && 
                        this.currentSeaLevelIndex < this.seaLevels.length &&
                        this.seaLevels[this.currentSeaLevelIndex].waterTiles.has(tileKey);
        
        if (wasWater && this.timeManager) {
          // Tile was water, now sand -> becomes wet using game time
          const currentGameTime = this.timeManager.getCurrentTime();
          this.wetSandTiles.set(tileKey, {
            tileKey,
            wetSince: currentGameTime,
            lastWaterTime: currentGameTime
          });
          console.log(`[TideManager] Tile ${tileKey} became WET (was water, now sand)`);
        }
      }
    }
    
    this.currentSeaLevelIndex = levelIndex;
    
    // Trigger callback for visual updates
    if (this.onTideChange && changedTiles.length > 0) {
      console.log(`[TideManager] Applied sea level ${levelIndex}, changed ${changedTiles.length} tiles`);
      this.onTideChange(changedTiles);
    }
  }

  // Update tide based on current time
  updateTide(tideInfo: TideInfo): void {
    if (!this.timeManager) return;
    
    const tideLevel = tideInfo.level;
    
    // Only update if tide level changed significantly
    if (Math.abs(tideLevel - this.lastTideLevel) < 0.01) return;
    
    // Map tide level (0-1) to sea level index
    const seaLevelIndex = Math.floor(tideLevel * (this.seaLevels.length - 1));
    const clampedIndex = Math.max(0, Math.min(seaLevelIndex, this.seaLevels.length - 1));
    
    // Only process and log when sea level actually changes
    if (clampedIndex !== this.currentSeaLevelIndex) {
      console.log(`[TideManager] Sea level CHANGED: ${this.currentSeaLevelIndex} -> ${clampedIndex}/${this.seaLevels.length - 1} (tide: ${tideLevel.toFixed(3)})`);
      
      // Apply new sea level
      this.applySeaLevel(clampedIndex);
      
      // Update wet sand drying - DISABLED
      // this.updateWetSand();
      
      // Check and invalidate wet sand cache every hour - DISABLED  
      // this.updateWetSandCache();
    }
    
    this.lastTideLevel = tideLevel;
  }

  // Update wet sand drying logic - DISABLED
  // Sand stays wet until it becomes water again

  // Add TimeManager reference for time conversions
  private timeManager?: import('./TimeManager').TimeManager;

  // Set TimeManager reference (called from GameEngine)
  setTimeManager(timeManager: import('./TimeManager').TimeManager): void {
    this.timeManager = timeManager;
  }

  // Check and invalidate wet sand cache every hour - DISABLED
  // Sand stays wet until it becomes water again

  // Check if a tile is wet sand
  isTileWet(tileKey: string): boolean {
    const isWet = this.wetSandTiles.has(tileKey);

    // Debug: Log checks for wet sand occasionally
    if (isWet) {
      console.log(`[TideManager] isTileWet(${tileKey}): true (total wet tiles: ${this.wetSandTiles.size})`);
    }
    return isWet;
  }

  // Get wet sand information for debugging
  getWetSandTiles(): Map<string, WetSandTile> {
    return new Map(this.wetSandTiles);
  }

  // Get sea levels for debugging
  getSeaLevels(): SeaLevel[] {
    return [...this.seaLevels];
  }

  // Get current sea level index
  getCurrentSeaLevelIndex(): number {
    return this.currentSeaLevelIndex;
  }

  // Set callback for tide changes
  setOnTideChange(callback: (changedTileKeys: string[]) => void): void {
    this.onTideChange = callback;
  }
}
