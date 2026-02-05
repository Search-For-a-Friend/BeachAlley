// Configuration constants for terrain generation

export const TERRAIN_CONFIG = {
  // Seafront
  SEAFRONT_WATER_ROWS: 3,
  SEAFRONT_SAND_MIN: 2,
  SEAFRONT_SAND_MAX: 5,
  
  // Lake
  LAKE_WATER_RADIUS_PERCENT: 0.22,
  LAKE_SAND_WIDTH_PERCENT: 0.18,
  LAKE_MAP_RADIUS_PERCENT: 0.85,
  
  // Cove
  COVE_ARC_ANGLE: 180, // degrees
  COVE_SAND_WIDTH: 4,
  COVE_RADIUS_PERCENT: 0.6,
  
  // Peninsula
  PENINSULA_WIDTH_PERCENT: 0.30,
  PENINSULA_SAND_EDGE_WIDTH: 2,
  
  // Island
  ISLAND_WATER_DEPTH: 5,
  ISLAND_SAND_WIDTH: 3,
  ISLAND_NOISE_SCALE: 0.1,
  
  // General
  GRADIENT_NOISE_AMPLITUDE: 1.5,
  SEED: 12345, // Default seed for random generation
} as const;
