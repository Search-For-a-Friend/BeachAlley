// Camera system for managing viewport position and bounds

import { CameraState, ViewportBounds, TileCoordinate } from '../types/canvas';
import { CANVAS_CONFIG, MAP_CONFIG } from '../canvas/config';

export class CameraSystem {
  private camera: CameraState;
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(initialCamera: CameraState, canvasWidth: number, canvasHeight: number) {
    this.camera = { ...initialCamera };
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  getState(): CameraState {
    return { ...this.camera };
  }

  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  move(deltaX: number, deltaY: number): void {
    this.camera.worldX += deltaX;
    this.camera.worldY += deltaY;
    this.clampToMapBounds();
  }

  setPosition(worldX: number, worldY: number): void {
    this.camera.worldX = worldX;
    this.camera.worldY = worldY;
    this.clampToMapBounds();
  }

  private clampToMapBounds(): void {
    const bounds = this.getMapBounds();
    
    // Add margins so edge tiles can be centered in viewport
    const halfViewportWidth = (this.canvasWidth / this.camera.zoom) / 2;
    const halfViewportHeight = (this.canvasHeight / this.camera.zoom) / 2;
    
    // Clamp camera position with margins
    const minCameraX = bounds.minWorldX - halfViewportWidth;
    const maxCameraX = bounds.maxWorldX - halfViewportWidth;
    const minCameraY = bounds.minWorldY - halfViewportHeight;
    const maxCameraY = bounds.maxWorldY - halfViewportHeight;

    this.camera.worldX = Math.max(minCameraX, Math.min(maxCameraX, this.camera.worldX));
    this.camera.worldY = Math.max(minCameraY, Math.min(maxCameraY, this.camera.worldY));
  }

  private getMapBounds(): ViewportBounds {
    // Calculate the world bounds of the entire map
    // In isometric: top tile is at (0,0), tiles extend down and right
    
    // For simplicity, we'll calculate a bounding box
    // The map spans from (0,0) to (ROWS-1, COLS-1) in tile coordinates
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    const { ROWS, COLS } = MAP_CONFIG;

    // Isometric mapping: world coordinates of tile corners
    // Top corner (row=0, col=0): worldX = 0, worldY = 0
    // Right corner (row=0, col=COLS-1): worldX = COLS * TILE_WIDTH/2, worldY = COLS * TILE_HEIGHT/2
    // Bottom corner (row=ROWS-1, col=COLS-1): worldX = (COLS - ROWS) * TILE_WIDTH/2, worldY = (ROWS + COLS) * TILE_HEIGHT/2
    // Left corner (row=ROWS-1, col=0): worldX = -ROWS * TILE_WIDTH/2, worldY = ROWS * TILE_HEIGHT/2

    const minWorldX = -(ROWS * TILE_WIDTH / 2);
    const maxWorldX = (COLS * TILE_WIDTH / 2);
    const minWorldY = 0;
    const maxWorldY = ((ROWS + COLS) * TILE_HEIGHT / 2);

    return { minWorldX, maxWorldX, minWorldY, maxWorldY };
  }

  worldToScreen(worldX: number, worldY: number): { screenX: number; screenY: number } {
    const screenX = (worldX - this.camera.worldX) * this.camera.zoom;
    const screenY = (worldY - this.camera.worldY) * this.camera.zoom;
    return { screenX, screenY };
  }

  screenToWorld(screenX: number, screenY: number): { worldX: number; worldY: number } {
    const worldX = screenX / this.camera.zoom + this.camera.worldX;
    const worldY = screenY / this.camera.zoom + this.camera.worldY;
    return { worldX, worldY };
  }

  tileToWorld(row: number, col: number): { worldX: number; worldY: number } {
    // Isometric tile-to-world conversion
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    const worldX = (col - row) * (TILE_WIDTH / 2);
    const worldY = (col + row) * (TILE_HEIGHT / 2);
    return { worldX, worldY };
  }

  worldToTile(worldX: number, worldY: number): TileCoordinate {
    // Isometric world-to-tile conversion
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    
    const col = (worldX / (TILE_WIDTH / 2) + worldY / (TILE_HEIGHT / 2)) / 2;
    const row = (worldY / (TILE_HEIGHT / 2) - worldX / (TILE_WIDTH / 2)) / 2;
    
    return {
      row: Math.floor(row),
      col: Math.floor(col),
    };
  }
}
