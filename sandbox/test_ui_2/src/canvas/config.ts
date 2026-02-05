// Configuration constants for the canvas and tile system

export const CANVAS_CONFIG = {
  // Tile dimensions
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  
  // Camera settings
  INITIAL_ZOOM: 1.0,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  
  // Lazy loading settings
  BUFFER_TILES: 2, // Number of tiles to load beyond visible area
  
  // Performance settings
  RENDER_FPS: 60,
} as const;

export const MAP_CONFIG = {
  // Test map size (large enough to require scrolling)
  ROWS: 80,
  COLS: 80,
  
  // Terrain types for test purposes
  TERRAIN_TYPES: ['sand', 'water', 'grass', 'path'] as const,
} as const;

export const DEBUG_CONFIG = {
  LOG_TILE_LOADING: true,
  SHOW_TILE_COORDINATES: false,
  SHOW_CAMERA_POSITION: false,
} as const;
