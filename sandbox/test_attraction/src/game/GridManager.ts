/**
 * Grid Manager - tile-based grid for navigation.
 * Can initialize from TerrainMap: water = not walkable, sand/grass = path (walkable).
 */

import { Tile, TileType, TILE_MOVEMENT_COSTS } from '../types/tiles';
import { TerrainMap } from '../types/environment';
import { tileKey } from '../utils/terrainGeneration';

export class GridManager {
  private grid: Tile[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.initializeEmpty();
  }

  initializeEmpty(): void {
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
   * Build grid from TerrainMap. Grass and sand = walkable path; water = water (not walkable).
   * Grid coordinates: x = col, y = row.
   */
  initializeFromTerrainMap(terrainMap: TerrainMap): void {
    for (let row = 0; row < terrainMap.height; row++) {
      for (let col = 0; col < terrainMap.width; col++) {
        const type = terrainMap.tiles.get(tileKey(row, col)) || 'water';
        const tileType: TileType = type === 'water' ? 'water' : type === 'sand' ? 'sand' : type === 'grass' ? 'grass' : 'path';
        this.setTileType(col, row, tileType);
      }
    }
  }

  getTile(x: number, y: number): Tile | null {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) return null;
    return this.grid[gridY][gridX];
  }

  getGrid(): Tile[][] {
    return this.grid;
  }

  setTileType(x: number, y: number, type: TileType): void {
    const tile = this.getTile(x, y);
    if (tile) {
      tile.type = type;
      tile.walkable = type === 'path' || type === 'spawn' || type === 'entrance';
      tile.movementCost = TILE_MOVEMENT_COSTS[type];
    }
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile ? tile.walkable : false;
  }

  getNeighbors(x: number, y: number): Tile[] {
    const neighbors: Tile[] = [];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];
    for (const { dx, dy } of directions) {
      const tile = this.getTile(x + dx, y + dy);
      if (tile && tile.walkable) neighbors.push(tile);
    }
    return neighbors;
  }

  
  getAllTiles(): Tile[][] {
    return this.grid;
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
