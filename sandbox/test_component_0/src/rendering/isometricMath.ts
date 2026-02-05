/**
 * Isometric Math Utilities
 * 
 * Handles conversion between world coordinates (2D plane) and isometric screen coordinates
 * Uses diamond tile perspective (classic isometric projection)
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface IsometricConfig {
  tileWidth: number;   // Width of diamond tile in pixels
  tileHeight: number;  // Height of diamond tile in pixels
  originX: number;     // Screen X origin
  originY: number;     // Screen Y origin
}

/**
 * Convert world coordinates to isometric screen coordinates
 * 
 * World space is a flat 2D plane where entities move
 * Screen space is the diamond-shaped isometric projection
 * 
 * Formula:
 *   screenX = (worldX - worldY) * (tileWidth / 2)
 *   screenY = (worldX + worldY) * (tileHeight / 2)
 */
export function worldToIso(
  worldX: number,
  worldY: number,
  config: IsometricConfig
): Vector2 {
  const screenX = (worldX - worldY) * (config.tileWidth / 2) + config.originX;
  const screenY = (worldX + worldY) * (config.tileHeight / 2) + config.originY;
  
  return { x: screenX, y: screenY };
}

/**
 * Convert isometric screen coordinates to world coordinates
 * 
 * Inverse of worldToIso
 * 
 * Formula:
 *   worldX = (screenX / (tileWidth / 2) + screenY / (tileHeight / 2)) / 2
 *   worldY = (screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2
 */
export function isoToWorld(
  screenX: number,
  screenY: number,
  config: IsometricConfig
): Vector2 {
  const x = screenX - config.originX;
  const y = screenY - config.originY;
  
  const worldX = (x / (config.tileWidth / 2) + y / (config.tileHeight / 2)) / 2;
  const worldY = (y / (config.tileHeight / 2) - x / (config.tileWidth / 2)) / 2;
  
  return { x: worldX, y: worldY };
}

/**
 * Calculate depth sorting value (Y-sort for isometric)
 * Entities with higher values are drawn last (appear in front)
 */
export function calculateDepth(worldX: number, worldY: number): number {
  return worldX + worldY;
}

/**
 * Get tile coordinates from world position
 */
export function worldToTile(worldX: number, worldY: number): { tileX: number; tileY: number } {
  return {
    tileX: Math.floor(worldX),
    tileY: Math.floor(worldY),
  };
}

/**
 * Get world position from tile coordinates (center of tile)
 */
export function tileToWorld(tileX: number, tileY: number): Vector2 {
  return {
    x: tileX + 0.5,
    y: tileY + 0.5,
  };
}

/**
 * Calculate movement speed adjustment for isometric rendering
 * 
 * In isometric view, movement along different axes appears at different speeds.
 * Movement in the Y-axis (up-down in world) appears slower than X-axis movement.
 * 
 * This function returns a multiplier for visual speed based on direction.
 * The actual game logic speed remains constant in world space.
 */
export function getIsometricSpeedMultiplier(
  dx: number,
  dy: number,
  config: IsometricConfig
): number {
  const ratio = config.tileHeight / config.tileWidth;
  const angle = Math.atan2(dy, dx);
  
  // Speed appears constant in world space but varies on screen
  // This is just for visual reference - actual speed is in world space
  const screenDx = (dx - dy) * (config.tileWidth / 2);
  const screenDy = (dx + dy) * (config.tileHeight / 2);
  const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);
  const worldDistance = Math.sqrt(dx * dx + dy * dy);
  
  return worldDistance > 0 ? screenDistance / worldDistance : 1;
}

/**
 * Create a default isometric configuration
 */
export function createIsometricConfig(
  tileWidth: number = 64,
  tileHeight: number = 32,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): IsometricConfig {
  return {
    tileWidth,
    tileHeight,
    originX: canvasWidth / 2,
    originY: canvasHeight / 4,
  };
}

/**
 * Calculate grid lines for rendering
 */
export interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function generateIsometricGrid(
  worldWidth: number,
  worldHeight: number,
  config: IsometricConfig
): { horizontalLines: GridLine[]; verticalLines: GridLine[] } {
  const horizontalLines: GridLine[] = [];
  const verticalLines: GridLine[] = [];
  
  // Horizontal lines (constant worldY)
  for (let y = 0; y <= worldHeight; y++) {
    const start = worldToIso(0, y, config);
    const end = worldToIso(worldWidth, y, config);
    horizontalLines.push({
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    });
  }
  
  // Vertical lines (constant worldX)
  for (let x = 0; x <= worldWidth; x++) {
    const start = worldToIso(x, 0, config);
    const end = worldToIso(x, worldHeight, config);
    verticalLines.push({
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
    });
  }
  
  return { horizontalLines, verticalLines };
}
