/**
 * Pixi.js Isometric Renderer
 * 
 * Renders the game using Pixi.js with isometric (diamond tile) perspective
 */

// WIP: Pixi.js isometric renderer - currently not in use, work in progress
// TODO: Fix Pixi.js v8 API compatibility issues and complete isometric implementation

import * as PIXI from 'pixi.js';
import { IRenderer, RendererOptions } from './IRenderer';
import { GameState, Establishment, PeopleGroup } from '../types';
import {
  worldToIso,
  isoToWorld,
  calculateDepth,
  generateIsometricGrid,
  createIsometricConfig,
  IsometricConfig,
} from './isometricMath';

export class PixiIsometricRenderer implements IRenderer {
  private app: PIXI.Application | null = null;
  private isoConfig: IsometricConfig;
  private options: RendererOptions;
  
  // Containers for different layers
  private gridContainer: PIXI.Container | null = null;
  private worldContainer: PIXI.Container | null = null;
  private uiContainer: PIXI.Container | null = null;
  
  // Entity sprites mapped by ID
  private establishmentSprites: Map<string, PIXI.Graphics> = new Map();
  private groupSprites: Map<string, PIXI.Graphics> = new Map();
  
  // Grid graphics
  private gridGraphics: PIXI.Graphics | null = null;
  
  constructor(options: RendererOptions = {}) {
    this.options = {
      showGrid: true,
      showDebugInfo: false,
      backgroundColor: 0x2a2a2a,
      ...options,
    };
    
    // Default isometric config (will be updated in initialize)
    this.isoConfig = createIsometricConfig();
  }
  
  async initialize(container: HTMLElement, width: number, height: number): Promise<void> {
    // Create Pixi application
    this.app = new PIXI.Application();
    await this.app.init({
      width,
      height,
      backgroundColor: this.options.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    container.appendChild(this.app.canvas as HTMLCanvasElement);
    
    // Update isometric config with actual canvas size
    this.isoConfig = createIsometricConfig(64, 32, width, height);
    
    // Create layer containers
    this.gridContainer = new PIXI.Container();
    this.worldContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    
    this.app.stage.addChild(this.gridContainer);
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // Create grid if enabled
    if (this.options.showGrid) {
      this.createGrid();
    }
  }
  
  private createGrid(): void {
    if (!this.gridContainer || !this.app) return;
    
    this.gridGraphics = new PIXI.Graphics();
    this.gridContainer.addChild(this.gridGraphics);
    
    // Generate grid for 20x20 world
    const { horizontalLines, verticalLines } = generateIsometricGrid(
      20,
      20,
      this.isoConfig
    );
    
    this.gridGraphics.lineStyle(1, 0x444444, 0.3);
    
    // Draw horizontal lines
    for (const line of horizontalLines) {
      this.gridGraphics.moveTo(line.x1, line.y1);
      this.gridGraphics.lineTo(line.x2, line.y2);
    }
    
    // Draw vertical lines
    for (const line of verticalLines) {
      this.gridGraphics.moveTo(line.x1, line.y1);
      this.gridGraphics.lineTo(line.x2, line.y2);
    }
  }
  
  render(gameState: GameState, deltaTime: number): void {
    if (!this.app || !this.worldContainer) return;
    
    // Update establishments
    for (const establishment of gameState.establishments) {
      this.renderEstablishment(establishment);
    }
    
    // Update people groups
    for (const group of gameState.groups) {
      if (group.state !== 'visiting' && group.state !== 'despawned') {
        this.renderPeopleGroup(group);
      }
    }
    
    // Remove sprites for entities that no longer exist
    this.cleanupSprites(gameState);
    
    // Sort sprites by depth (Y-sort for isometric)
    this.sortByDepth();
  }
  
  private renderEstablishment(establishment: Establishment): void {
    let sprite = this.establishmentSprites.get(establishment.id);
    
    if (!sprite && this.worldContainer) {
      // Create new sprite
      sprite = new PIXI.Graphics();
      this.worldContainer.addChild(sprite);
      this.establishmentSprites.set(establishment.id, sprite);
    }
    
    if (!sprite) return;
    
    // Clear and redraw
    sprite.clear();
    
    // Convert world position to isometric screen position
    const screenPos = worldToIso(
      establishment.position.x,
      establishment.position.y,
      this.isoConfig
    );
    
    // Draw diamond shape (isometric tile)
    const tileW = this.isoConfig.tileWidth;
    const tileH = this.isoConfig.tileHeight;
    
    // Color based on state
    let fillColor = 0x666666;
    let alpha = 1;
    
    switch (establishment.state) {
      case 'closed':
        fillColor = 0x333333;
        alpha = 0.5;
        break;
      case 'deserted':
        fillColor = 0x4488ff;
        break;
      case 'visited':
        fillColor = 0x44ff88;
        break;
      case 'busy':
        fillColor = 0xffaa44;
        break;
      case 'crowded':
        fillColor = 0xff4444;
        break;
    }
    
    // Draw diamond tile
    sprite.position.set(screenPos.x, screenPos.y);
    
    // Set fill style then draw polygon
    sprite.beginFill(fillColor, alpha);
    sprite.drawPolygon([
      0, -tileH / 2,     // Top
      tileW / 2, 0,      // Right
      0, tileH / 2,      // Bottom
      -tileW / 2, 0,     // Left
    ]);
    sprite.endFill();
    
    // Draw border
    sprite.lineStyle(2, 0xffffff, 0.8);
    sprite.drawPolygon([
      0, -tileH / 2,
      tileW / 2, 0,
      0, tileH / 2,
      -tileW / 2, 0,
      0, -tileH / 2,
    ]);
    
    // Draw capacity bar
    const barWidth = tileW * 0.6;
    const barHeight = 4;
    const occupancyPercent = establishment.currentOccupancy / establishment.maxCapacity;
    
    // Draw capacity bar background
    sprite.beginFill(0x222222);
    sprite.drawRect(
      -barWidth / 2,
      tileH / 2 + 5,
      barWidth,
      barHeight
    );
    sprite.endFill();
    
    // Draw capacity bar foreground
    sprite.beginFill(0x44ff44);
    sprite.drawRect(
      -barWidth / 2,
      tileH / 2 + 5,
      barWidth * occupancyPercent,
      barHeight
    );
    sprite.endFill();
    
    // Store depth for sorting
    (sprite as any).depth = calculateDepth(
      establishment.position.x,
      establishment.position.y
    );
  }
  
  private renderPeopleGroup(group: PeopleGroup): void {
    let sprite = this.groupSprites.get(group.id);
    
    if (!sprite && this.worldContainer) {
      // Create new sprite
      sprite = new PIXI.Graphics();
      this.worldContainer.addChild(sprite);
      this.groupSprites.set(group.id, sprite);
    }
    
    if (!sprite) return;
    
    // Clear and redraw
    sprite.clear();
    
    // Convert world position to isometric screen position
    const screenPos = worldToIso(
      group.position.x,
      group.position.y,
      this.isoConfig
    );
    
    // Draw as circle (will be replaced with sprites later)
    const radius = 8 + group.size * 2;
    let fillColor = 0x88ccff;
    
    switch (group.state) {
      case 'spawning':
        fillColor = 0xaaaaaa;
        break;
      case 'idle':
        fillColor = 0xffffff;
        break;
      case 'seeking':
        fillColor = 0x44ff44;
        break;
      case 'wandering':
        fillColor = 0xffaa44;
        break;
      case 'queuing':
        fillColor = 0xff8844;
        break;
      case 'leaving':
        fillColor = 0xff4444;
        break;
    }
    
    sprite.position.set(screenPos.x, screenPos.y);
    
    // Draw circle
    sprite.beginFill(fillColor);
    sprite.lineStyle(2, 0x000000, 0.5);
    sprite.drawCircle(0, 0, radius);
    sprite.endFill();
    
    // Draw direction indicator
    if (group.facingDirection) {
      const indicatorLength = radius + 4;
      let angle = 0;
      
      switch (group.facingDirection) {
        case 'up':
          angle = -Math.PI / 2;
          break;
        case 'down':
          angle = Math.PI / 2;
          break;
        case 'left':
          angle = Math.PI;
          break;
        case 'right':
          angle = 0;
          break;
      }
      
      const endX = Math.cos(angle) * indicatorLength;
      const endY = Math.sin(angle) * indicatorLength;
      
      sprite.lineStyle(2, 0x000000);
      sprite.moveTo(0, 0);
      sprite.lineTo(endX, endY);
    }
    
    // Store depth for sorting
    (sprite as any).depth = calculateDepth(group.position.x, group.position.y);
  }
  
  private cleanupSprites(gameState: GameState): void {
    // Remove establishment sprites that no longer exist
    const establishmentIds = new Set(gameState.establishments.map(e => e.id));
    for (const [id, sprite] of this.establishmentSprites.entries()) {
      if (!establishmentIds.has(id)) {
        sprite.destroy();
        this.establishmentSprites.delete(id);
      }
    }
    
    // Remove group sprites that no longer exist
    const groupIds = new Set(gameState.groups.map(g => g.id));
    for (const [id, sprite] of this.groupSprites.entries()) {
      if (!groupIds.has(id)) {
        sprite.destroy();
        this.groupSprites.delete(id);
      }
    }
  }
  
  private sortByDepth(): void {
    if (!this.worldContainer) return;
    
    // Sort children by depth (Y-sort for isometric rendering)
    this.worldContainer.children.sort((a, b) => {
      const depthA = (a as any).depth || 0;
      const depthB = (b as any).depth || 0;
      return depthA - depthB;
    });
  }
  
  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    
    this.establishmentSprites.clear();
    this.groupSprites.clear();
  }
  
  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
      this.isoConfig = createIsometricConfig(64, 32, width, height);
      
      // Recreate grid with new dimensions
      if (this.options.showGrid) {
        this.gridGraphics?.destroy();
        this.createGrid();
      }
    }
  }
  
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return isoToWorld(screenX, screenY, this.isoConfig);
  }
  
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return worldToIso(worldX, worldY, this.isoConfig);
  }
  
  /**
   * Toggle grid visibility
   */
  setGridVisible(visible: boolean): void {
    if (this.gridContainer) {
      this.gridContainer.visible = visible;
    }
  }
}
