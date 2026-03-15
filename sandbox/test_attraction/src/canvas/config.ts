// Configuration constants for the canvas and tile system

export const CANVAS_CONFIG = {
  TILE_WIDTH: 64,
  TILE_HEIGHT: 32,
  INITIAL_ZOOM: 1.0,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  BUFFER_TILES: 2,
  RENDER_FPS: 60,
} as const;

export const MAP_CONFIG = {
  ROWS: 80,
  COLS: 80,
} as const;

export const DEBUG_CONFIG = {
  LOG_TILE_LOADING: false,
  SHOW_TILE_COORDINATES: false,
  SHOW_CAMERA_POSITION: false,
} as const;
