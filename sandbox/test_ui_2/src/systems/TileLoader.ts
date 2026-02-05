// Tile loader system for lazy loading/unloading tiles

import { Tile, TileCoordinate, VisibleTileRange } from '../types/canvas';
import { CANVAS_CONFIG, MAP_CONFIG, DEBUG_CONFIG } from '../canvas/config';
import { CameraSystem } from './CameraSystem';

export class TileLoader {
  private loadedTiles: Map<string, Tile>;
  private cameraSystem: CameraSystem;

  constructor(cameraSystem: CameraSystem) {
    this.loadedTiles = new Map();
    this.cameraSystem = cameraSystem;
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
        tile.coord.row < visibleRange.minRow ||
        tile.coord.row > visibleRange.maxRow ||
        tile.coord.col < visibleRange.minCol ||
        tile.coord.col > visibleRange.maxCol
      ) {
        tilesToUnload.push(key);
      }
    });

    tilesToUnload.forEach(key => {
      const tile = this.loadedTiles.get(key);
      if (tile && DEBUG_CONFIG.LOG_TILE_LOADING) {
        console.log(`[TileLoader] Unloading tile (${tile.coord.row}, ${tile.coord.col})`);
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
    // Generate pseudo-random terrain type based on position
    const terrainTypes = MAP_CONFIG.TERRAIN_TYPES;
    const terrainIndex = (row * 7 + col * 13) % terrainTypes.length;
    
    return {
      coord: { row, col },
      terrainType: terrainTypes[terrainIndex],
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
