// Type definitions for environment system

export type EnvironmentType = 'seafront' | 'lake' | 'cove' | 'peninsula' | 'island';

export type TerrainType = 'water' | 'sand' | 'grass';

export interface EnvironmentConfig {
  type: EnvironmentType;
  name: string;
  description: string;
  icon: string;
}

export interface TileCoordinate {
  row: number;
  col: number;
}

export interface TerrainMap {
  tiles: Map<string, TerrainType>;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}
