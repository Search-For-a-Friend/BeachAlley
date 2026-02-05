// Core type definitions for the game canvas

export interface Vector2D {
  x: number;
  y: number;
}

export interface TileCoordinate {
  row: number;
  col: number;
}

export interface Tile {
  coord: TileCoordinate;
  terrainType: string;
  isLoaded: boolean;
}

export interface CameraState {
  worldX: number; // World position in pixels
  worldY: number;
  zoom: number;
}

export interface ViewportBounds {
  minWorldX: number;
  maxWorldX: number;
  minWorldY: number;
  maxWorldY: number;
}

export interface VisibleTileRange {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
}
