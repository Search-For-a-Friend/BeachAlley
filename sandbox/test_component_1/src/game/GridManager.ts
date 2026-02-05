/**
 * Grid Manager
 * Manages the tile-based grid system for navigation
 */

import { Tile, TileType, TILE_MOVEMENT_COSTS } from '../types/tiles';
import { Vector2, Establishment } from '../types';

export class GridManager {
  private grid: Tile[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.initialize();
  }

  /**
   * Initialize grid with all PATH tiles
   */
  private initialize(): void {
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          gridX: x,
          gridY: y,
          type: 'path',
          walkable: true,
          movementCost: TILE_MOVEMENT_COSTS.path,
        };
      }
    }
  }

  /**
   * Get tile at position
   */
  getTile(x: number, y: number): Tile | null {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return null;
    }
    
    return this.grid[gridY][gridX];
  }

  /**
   * Set tile type
   * IMPORTANT: Only PATH, SPAWN, and ENTRANCE tiles are walkable
   */
  setTileType(x: number, y: number, type: TileType): void {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.type = type;
      // RULE: Groups can ONLY walk on path/spawn tiles (and entrance as destination)
      tile.walkable = type === 'path' || type === 'spawn' || type === 'entrance';
      tile.movementCost = TILE_MOVEMENT_COSTS[type];
    }
  }

  /**
   * Check if tile is walkable
   */
  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable : false;
  }

  /**
   * Get neighbors (4-directional ONLY for grid movement)
   * NO diagonals - forces movement through tile centers
   */
  getNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    
    // ONLY 4 cardinal directions - NO diagonals
    const directions = [
      { dx: 0, dy: -1 },  // North
      { dx: 1, dy: 0 },   // East
      { dx: 0, dy: 1 },   // South
      { dx: -1, dy: 0 },  // West
      // NO DIAGONALS: This forces paths to go tile-by-tile through centers
    ];

    for (const { dx, dy } of directions) {
      const tile = this.getTile(x + dx, y + dy);
      if (tile && tile.walkable) {
        neighbors.push(tile);
      }
    }

    return neighbors;
  }

  /**
   * Mark establishment footprint on grid
   */
  markEstablishmentFootprint(
    establishment: Establishment,
    entrancePos: Vector2
  ): void {
    if (!establishment.gridPosition) return;

    const centerX = Math.floor(establishment.gridPosition.x);
    const centerY = Math.floor(establishment.gridPosition.y);
    const size = establishment.maxCapacity <= 4 ? 1 : establishment.maxCapacity <= 8 ? 2 : 3;

    // Mark all tiles as building
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const tileX = centerX + dx - Math.floor(size / 2);
        const tileY = centerY + dy - Math.floor(size / 2);
        this.setTileType(tileX, tileY, 'building');
      }
    }

    // Mark entrance tile
    this.setTileType(Math.floor(entrancePos.x), Math.floor(entrancePos.y), 'entrance');
  }

  /**
   * Create obstacles (water, etc.)
   */
  createObstacles(positions: Vector2[], type: TileType = 'water'): void {
    for (const pos of positions) {
      this.setTileType(Math.floor(pos.x), Math.floor(pos.y), type);
    }
  }

  /**
   * Get all tiles
   */
  getAllTiles(): Tile[][] {
    return this.grid;
  }

  /**
   * Get grid dimensions
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
