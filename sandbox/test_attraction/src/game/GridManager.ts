/**
 * Grid Manager - simplified to use terrain map types directly.
 * No separate tile system - just uses terrain map for all tile logic.
 */

import { TerrainMap } from '../types/environment';
import { tileKey } from '../utils/terrainGeneration';

export class GridManager {
  private width: number;
  private height: number;
  private terrainMap: TerrainMap;

  constructor(width: number, height: number, terrainMap: TerrainMap) {
    this.width = width;
    this.height = height;
    this.terrainMap = terrainMap;
  }

  /**
   * Set the terrain map to use for tile information
   */
  setTerrainMap(terrainMap: TerrainMap): void {
    this.terrainMap = terrainMap;
  }

  /**
   * Get terrain type at position (simplified - just returns terrain map type)
   */
  getTerrainType(x: number, y: number): string | null {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);
    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) return null;
    return this.terrainMap.tiles.get(tileKey(gridY, gridX)) || null;
  }

  /**
   * Check if position is on sand
   */
  isOnSand(x: number, y: number): boolean {
    return this.getTerrainType(x, y) === 'sand';
  }

  /**
   * Check if position is on grass
   */
  isOnGrass(x: number, y: number): boolean {
    return this.getTerrainType(x, y) === 'grass';
  }

  /**
   * Check if position is on water
   */
  isOnWater(x: number, y: number): boolean {
    return this.getTerrainType(x, y) === 'water';
  }

  /**
   * Check if position is walkable (not water)
   */
  isWalkable(x: number, y: number): boolean {
    const type = this.getTerrainType(x, y);
    return type !== null && type !== 'water';
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}
