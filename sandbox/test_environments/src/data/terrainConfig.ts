// Configuration constants for terrain generation

export const TERRAIN_CONFIG = {
  // Seafront
  SEAFRONT_WATER_ROWS: 5,
  SEAFRONT_SAND_MIN: 3,
  SEAFRONT_SAND_MAX: 7,
  
  // Lake (much bigger)
  LAKE_WATER_RADIUS_PERCENT: 0.45,
  LAKE_SAND_WIDTH_PERCENT: 0.20,
  
  // Cove (less water)
  COVE_ARC_ANGLE: 180,
  COVE_SAND_WIDTH: 4,
  COVE_RADIUS_PERCENT: 0.45,
  
  // Peninsula (larger, follows diamond diagonal)
  PENINSULA_WIDTH_PERCENT: 0.50,
  PENINSULA_SAND_EDGE_WIDTH: 3,
  
  // Island (connected, proper gradient)
  ISLAND_WATER_DEPTH: 6,
  ISLAND_SAND_WIDTH: 5,
  ISLAND_NOISE_SCALE: 0.1,
  
  // General
  GRADIENT_NOISE_AMPLITUDE: 1.5,
  SEED: 12345,
} as const;
