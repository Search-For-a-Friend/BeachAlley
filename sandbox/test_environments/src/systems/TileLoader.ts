// Tile loader system for lazy loading/unloading tiles with environment terrain

import { VisibleTileRange } from '../types/canvas';
import { TerrainMap, TerrainType } from '../types/environment';
import { CANVAS_CONFIG, MAP_CONFIG, DEBUG_CONFIG } from '../canvas/config';
import { CameraSystem } from './CameraSystem';

export interface Tile {
  row: number;
  col: number;
  terrainType: TerrainType;
  isLoaded: boolean;
}

export class TileLoader {
  private loadedTiles: Map<string, Tile>;
  private cameraSystem: CameraSystem;
  private terrainMap: TerrainMap;

  constructor(cameraSystem: CameraSystem, terrainMap: TerrainMap) {
    this.loadedTiles = new Map();
    this.cameraSystem = cameraSystem;
    this.terrainMap = terrainMap;
  }

  private tileKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  getTile(row: number, col: number): Tile | undefined {
    return this.loadedTiles.get(this.tileKey(row, col));
  }

  getLoadedTiles(): Tile[] {
    return Array.from(this.loadedTiles.values());
  }

  getVisibleTileRange(canvasWidth: number, canvasHeight: number): VisibleTileRange {
    const camera = this.cameraSystem.getState();
    
    // Calculate the four corners of the viewport in world coordinates
    const topLeft = this.cameraSystem.screenToWorld(0, 0);
    const topRight = this.cameraSystem.screenToWorld(canvasWidth, 0);
    const bottomLeft = this.cameraSystem.screenToWorld(0, canvasHeight);
    const bottomRight = this.cameraSystem.screenToWorld(canvasWidth, canvasHeight);

    // Convert corners to tile coordinates
    const tlTile = this.cameraSystem.worldToTile(topLeft.worldX, topLeft.worldY);
    const trTile = this.cameraSystem.worldToTile(topRight.worldX, topRight.worldY);
    const blTile = this.cameraSystem.worldToTile(bottomLeft.worldX, bottomLeft.worldY);
    const brTile = this.cameraSystem.worldToTile(bottomRight.worldX, bottomRight.worldY);

    // Find the min/max tile coordinates
    const minRow = Math.floor(Math.min(tlTile.row, trTile.row, blTile.row, brTile.row));
    const maxRow = Math.ceil(Math.max(tlTile.row, trTile.row, blTile.row, brTile.row));
    const minCol = Math.floor(Math.min(tlTile.col, trTile.col, blTile.col, brTile.col));
    const maxCol = Math.ceil(Math.max(tlTile.col, trTile.col, blTile.col, brTile.col));

    // Add buffer
    const { BUFFER_TILES } = CANVAS_CONFIG;
    return {
      minRow: Math.max(0, minRow - BUFFER_TILES),
      maxRow: Math.min(MAP_CONFIG.ROWS - 1, maxRow + BUFFER_TILES),
      minCol: Math.max(0, minCol - BUFFER_TILES),
      maxCol: Math.min(MAP_CONFIG.COLS - 1, maxCol + BUFFER_TILES),
    };
  }

  update(canvasWidth: number, canvasHeight: number): void {
    const visibleRange = this.getVisibleTileRange(canvasWidth, canvasHeight);
    
    // Unload tiles outside visible range
    const tilesToUnload: string[] = [];
    this.loadedTiles.forEach((tile, key) => {
      if (
        tile.row < visibleRange.minRow ||
        tile.row > visibleRange.maxRow ||
        tile.col < visibleRange.minCol ||
        tile.col > visibleRange.maxCol
      ) {
        tilesToUnload.push(key);
      }
    });

    tilesToUnload.forEach(key => {
      const tile = this.loadedTiles.get(key);
      if (tile && DEBUG_CONFIG.LOG_TILE_LOADING) {
        console.log(`[TileLoader] Unloading tile (${tile.row}, ${tile.col})`);
      }
      this.loadedTiles.delete(key);
    });

    // Load tiles in visible range
    for (let row = visibleRange.minRow; row <= visibleRange.maxRow; row++) {
      for (let col = visibleRange.minCol; col <= visibleRange.maxCol; col++) {
        const key = this.tileKey(row, col);
        if (!this.loadedTiles.has(key)) {
          const tile = this.createTile(row, col);
          this.loadedTiles.set(key, tile);
          if (DEBUG_CONFIG.LOG_TILE_LOADING) {
            console.log(`[TileLoader] Loading tile (${row}, ${col}) - type: ${tile.terrainType}`);
          }
        }
      }
    }
  }

  private createTile(row: number, col: number): Tile {
    // Get terrain type from the generated terrain map
    const terrainType = this.terrainMap.tiles.get(this.tileKey(row, col)) || 'grass';
    
    return {
      row,
      col,
      terrainType,
      isLoaded: true,
    };
  }

  getLoadedTileCount(): number {
    return this.loadedTiles.size;
  }

  clear(): void {
    this.loadedTiles.clear();
  }
}
