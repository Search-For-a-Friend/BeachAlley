// Camera system for managing viewport position and bounds

import { CameraState, ViewportBounds, TileCoordinate } from '../types/canvas';
import { CANVAS_CONFIG } from '../canvas/config';

export interface MapDimensions {
  rows: number;
  cols: number;
}

export class CameraSystem {
  private camera: CameraState;
  private canvasWidth: number;
  private canvasHeight: number;
  private mapDimensions: MapDimensions;

  constructor(
    initialCamera: CameraState,
    canvasWidth: number,
    canvasHeight: number,
    mapDimensions: MapDimensions
  ) {
    this.camera = { ...initialCamera };
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.mapDimensions = mapDimensions;
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
    const halfViewportWidth = (this.canvasWidth / this.camera.zoom) / 2;
    const halfViewportHeight = (this.canvasHeight / this.camera.zoom) / 2;
    const minCameraX = bounds.minWorldX - halfViewportWidth;
    const maxCameraX = bounds.maxWorldX - halfViewportWidth;
    const minCameraY = bounds.minWorldY - halfViewportHeight;
    const maxCameraY = bounds.maxWorldY - halfViewportHeight;
    this.camera.worldX = Math.max(minCameraX, Math.min(maxCameraX, this.camera.worldX));
    this.camera.worldY = Math.max(minCameraY, Math.min(maxCameraY, this.camera.worldY));
  }

  private getMapBounds(): ViewportBounds {
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    const { rows: ROWS, cols: COLS } = this.mapDimensions;
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
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    const worldX = (col - row) * (TILE_WIDTH / 2);
    const worldY = (col + row) * (TILE_HEIGHT / 2);
    return { worldX, worldY };
  }

  worldToTile(worldX: number, worldY: number): TileCoordinate {
    const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
    const col = (worldX / (TILE_WIDTH / 2) + worldY / (TILE_HEIGHT / 2)) / 2;
    const row = (worldY / (TILE_HEIGHT / 2) - worldX / (TILE_WIDTH / 2)) / 2;
    return { row: Math.floor(row), col: Math.floor(col) };
  }
}
