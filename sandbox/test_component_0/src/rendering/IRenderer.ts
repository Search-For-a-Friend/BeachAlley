/**
 * Renderer Interface
 * 
 * This abstraction allows the game to be rendered using different
 * implementations (Canvas 2D, Pixi.js 2D, Pixi.js Isometric, Three.js 3D, etc.)
 */

import { GameState } from '../types';

export interface IRenderer {
  /**
   * Initialize the renderer
   */
  initialize(container: HTMLElement, width: number, height: number): Promise<void>;
  
  /**
   * Render the current game state
   */
  render(gameState: GameState, deltaTime: number): void;
  
  /**
   * Clean up resources
   */
  destroy(): void;
  
  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void;
  
  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number };
}

export interface RendererOptions {
  showGrid?: boolean;
  showDebugInfo?: boolean;
  backgroundColor?: number;
}
