/**
 * Tile System Types - grid-based navigation
 * Grass and sand from terrain map are walkable (path); water is not.
 */

export type TileType =
  | 'path'
  | 'spawn'
  | 'grass'
  | 'entrance'
  | 'building'
  | 'water'
  | 'restricted';

export interface Tile {
  gridX: number;
  gridY: number;
  type: TileType;
  walkable: boolean;
  movementCost: number;
  occupiedBy?: string;
}

export const TILE_MOVEMENT_COSTS: Record<TileType, number> = {
  path: 1.0,
  spawn: 1.0,
  grass: 1.5,
  entrance: 1.0,
  building: Infinity,
  water: Infinity,
  restricted: 2.0,
};
