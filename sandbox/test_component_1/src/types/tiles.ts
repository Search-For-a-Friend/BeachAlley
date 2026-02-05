/**
 * Tile System Types
 * Defines the grid-based navigation system
 */

import { Vector2 } from './index';

export type TileType =
  | 'path'        // Normal walkable
  | 'spawn'       // Spawn point (walkable, visually distinct)
  | 'grass'       // Slower walkable
  | 'entrance'    // Establishment entrance
  | 'building'    // Non-walkable (part of establishment)
  | 'water'       // Non-walkable obstacle
  | 'restricted'; // Only certain groups

export interface Tile {
  gridX: number;
  gridY: number;
  type: TileType;
  walkable: boolean;
  movementCost: number;
  occupiedBy?: string;  // Entity ID if occupied
}

export interface Entrance {
  gridX: number;
  gridY: number;
  direction: 'north' | 'south' | 'east' | 'west';
  capacity: number;  // How many can queue
  currentQueue: string[];  // Group IDs waiting
}

// Movement costs for different tile types
export const TILE_MOVEMENT_COSTS: Record<TileType, number> = {
  path: 1.0,
  spawn: 1.0,  // Spawn tiles are walkable like paths
  grass: 1.5,
  entrance: 1.0,
  building: Infinity,
  water: Infinity,
  restricted: 2.0,
};

// Visual colors for tile types
export const TILE_COLORS: Record<TileType, string> = {
  path: 'rgba(180, 200, 140, 0.5)',  // Light greenish-yellow - clearly visible walkable path
  spawn: 'rgba(100, 255, 100, 0.7)',  // Bright green - spawn points
  grass: 'rgba(80, 150, 80, 0.4)',
  entrance: 'rgba(255, 200, 0, 0.7)',  // Bright yellow entrance
  building: 'rgba(100, 100, 120, 0.8)',
  water: 'rgba(50, 100, 200, 0.6)',
  restricted: 'rgba(150, 80, 80, 0.4)',
};
