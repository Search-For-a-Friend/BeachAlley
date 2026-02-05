import { IRenderer, RendererOptions } from './IRenderer';
import { GameState, Establishment, PeopleGroup } from '../types';
import { getStateColor } from '../game';
import {
  spriteLoader,
  createEstablishmentAnimation,
  createPeopleAnimation,
  setAnimationState,
  setFacingDirection,
  drawSprite,
  getPeopleCategoryFromSize,
  SpriteAnimation,
  FacingDirection,
} from '../assets';

// Track animations by entity ID
const entityAnimations = new Map<string, SpriteAnimation>();

/**
 * Canvas 2D renderer implementation
 */
export class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private options: RendererOptions;
  private spritesLoaded: boolean = false;

  constructor(options: RendererOptions = {}) {
    this.options = {
      showGrid: true,
      showDebugInfo: false,
      backgroundColor: 0x1a1a2e,
      ...options,
    };
  }

  async initialize(container: HTMLElement, width: number, height: number): Promise<void> {
    this.width = width;
    this.height = height;

    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.border = '2px solid rgba(0, 255, 255, 0.3)';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.2)';

    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Load sprites
    await spriteLoader.loadAll();
    this.spritesLoaded = spriteLoader.getLoadingState().status === 'loaded';

    console.log('Canvas renderer initialized');
  }

  render(gameState: GameState, deltaTime: number): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;

    // Clear canvas
    const bgColor = this.hexToRgb(this.options.backgroundColor || 0x1a1a2e);
    ctx.fillStyle = `rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw grid
    if (this.options.showGrid) {
      this.drawGrid(ctx);
    }

    // Draw attraction radius
    for (const establishment of gameState.establishments) {
      this.drawAttractionRadius(ctx, establishment);
    }

    // Draw establishments
    for (const establishment of gameState.establishments) {
      this.drawEstablishment(ctx, establishment, performance.now());
    }

    // Draw people groups
    for (const group of gameState.groups) {
      this.drawPeopleGroup(ctx, group, performance.now());
    }

    // Clean up animations for removed entities
    this.cleanupAnimations(gameState);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  destroy(): void {
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    entityAnimations.clear();
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    // For now, canvas uses screen coordinates directly
    return { x: worldX, y: worldY };
  }

  private hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 0xff,
      g: (hex >> 8) & 0xff,
      b: hex & 0xff,
    };
  }

  private cleanupAnimations(state: GameState): void {
    const activeIds = new Set([
      ...state.establishments.map(e => e.id),
      ...state.groups.map(g => g.id),
    ]);

    for (const id of entityAnimations.keys()) {
      if (!activeIds.has(id)) {
        entityAnimations.delete(id);
      }
    }
  }

  private getEstablishmentAnimation(establishment: Establishment): SpriteAnimation {
    let animation = entityAnimations.get(establishment.id);

    if (!animation) {
      animation = createEstablishmentAnimation('house');
      entityAnimations.set(establishment.id, animation);
    }

    // Update state based on establishment state
    setAnimationState(animation, establishment.state, false);

    return animation;
  }

  private getPeopleAnimation(group: PeopleGroup): SpriteAnimation {
    let animation = entityAnimations.get(group.id);

    if (!animation) {
      const category = getPeopleCategoryFromSize(group.size);
      const variant = Math.floor(Math.random() * 3);
      animation = createPeopleAnimation(category, variant);
      entityAnimations.set(group.id, animation);
    }

    // Update sprite state based on group's facing direction
    const directionToState: Record<string, FacingDirection> = {
      'up': 'look_up',
      'down': 'look_down',
      'left': 'look_side',
      'right': 'look_side',
    };

    const spriteState = directionToState[group.facingDirection] || 'look_down';
    const facingLeft = group.facingDirection === 'left';

    setFacingDirection(animation, spriteState, facingLeft);

    return animation;
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    const gridSize = 50;

    for (let x = 0; x <= this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  private drawAttractionRadius(ctx: CanvasRenderingContext2D, establishment: Establishment): void {
    if (!establishment.isOpen) return;

    const gradient = ctx.createRadialGradient(
      establishment.position.x,
      establishment.position.y,
      0,
      establishment.position.x,
      establishment.position.y,
      establishment.attractionRadius
    );

    const color = getStateColor(establishment.state);
    gradient.addColorStop(0, `${color}15`);
    gradient.addColorStop(0.7, `${color}08`);
    gradient.addColorStop(1, `${color}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      establishment.position.x,
      establishment.position.y,
      establishment.attractionRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw radius border
    ctx.strokeStyle = `${color}30`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(
      establishment.position.x,
      establishment.position.y,
      establishment.attractionRadius,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawEstablishment(
    ctx: CanvasRenderingContext2D,
    establishment: Establishment,
    currentTime: number
  ): void {
    const { x, y } = establishment.position;

    // Try to draw sprite first
    if (this.spritesLoaded) {
      const animation = this.getEstablishmentAnimation(establishment);
      const sprite = spriteLoader.getSprite(animation.spriteId);
      const animSpeed = sprite?.manifest?.animationSpeed ?? 500;
      if (currentTime - animation.lastFrameTime > animSpeed) {
        animation.currentFrame = (animation.currentFrame + 1) % 2;
        animation.lastFrameTime = currentTime;
      }

      const drawn = drawSprite(ctx, animation, x, y, 1);
      if (drawn) {
        this.drawOccupancyBar(ctx, establishment);
        return;
      }
    }

    // Fallback: Draw with canvas primitives
    this.drawEstablishmentFallback(ctx, establishment);
  }

  private drawEstablishmentFallback(ctx: CanvasRenderingContext2D, establishment: Establishment): void {
    const { x, y } = establishment.position;
    const size = 60;
    const color = getStateColor(establishment.state);

    // Building shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x - size / 2 + 5, y - size / 2 + 5, size, size);

    // Building base
    ctx.fillStyle = establishment.isOpen ? color : '#333';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);

    // Building border
    ctx.strokeStyle = establishment.isOpen ? '#fff' : '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);

    // Roof
    ctx.fillStyle = establishment.isOpen ? '#ff6b9d' : '#444';
    ctx.beginPath();
    ctx.moveTo(x - size / 2 - 10, y - size / 2);
    ctx.lineTo(x, y - size / 2 - 25);
    ctx.lineTo(x + size / 2 + 10, y - size / 2);
    ctx.closePath();
    ctx.fill();

    // Door
    const doorWidth = 15;
    const doorHeight = 25;
    ctx.fillStyle = establishment.isOpen ? '#1a1a2e' : '#222';
    ctx.fillRect(x - doorWidth / 2, y + size / 2 - doorHeight, doorWidth, doorHeight);

    // Occupancy bar
    this.drawOccupancyBar(ctx, establishment);
  }

  private drawOccupancyBar(ctx: CanvasRenderingContext2D, establishment: Establishment): void {
    const { x, y } = establishment.position;
    const size = 60;
    const barWidth = 50;
    const barHeight = 6;
    const barY = y + size / 2 + 10;
    const color = getStateColor(establishment.state);

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);

    // Fill
    const fillPercent = establishment.currentOccupancy / establishment.maxCapacity;
    ctx.fillStyle = color;
    ctx.fillRect(x - barWidth / 2, barY, barWidth * fillPercent, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight);

    // Occupancy text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${establishment.currentOccupancy}/${establishment.maxCapacity}`,
      x,
      barY + barHeight + 14
    );
  }

  private drawPeopleGroup(
    ctx: CanvasRenderingContext2D,
    group: PeopleGroup,
    currentTime: number
  ): void {
    const { x, y } = group.position;

    // Don't draw if visiting (they're "inside") or despawned
    if (group.state === 'visiting' || group.state === 'despawned') return;

    // Skip if position is way off screen
    if (x < -50 || x > this.width + 50 || y < -50 || y > this.height + 50) return;

    // Try to draw sprite first
    if (this.spritesLoaded) {
      const animation = this.getPeopleAnimation(group);
      const sprite = spriteLoader.getSprite(animation.spriteId);
      const animSpeed = sprite?.manifest?.animationSpeed ?? 300;
      if (currentTime - animation.lastFrameTime > animSpeed) {
        animation.currentFrame = (animation.currentFrame + 1) % 2;
        animation.lastFrameTime = currentTime;
      }

      const drawn = drawSprite(ctx, animation, x, y, 1);
      if (drawn) {
        this.drawGroupStateIndicator(ctx, group);
        return;
      }
    }

    // Fallback: Draw with canvas primitives
    this.drawPeopleGroupFallback(ctx, group);
  }

  private drawGroupStateIndicator(ctx: CanvasRenderingContext2D, group: PeopleGroup): void {
    const { x, y } = group.position;

    let stateIcon = '';
    let iconColor = '#fff';

    switch (group.state) {
      case 'seeking':
        stateIcon = '🎯';
        iconColor = '#4ade80';
        break;
      case 'wandering':
        stateIcon = '❓';
        iconColor = '#facc15';
        break;
      case 'leaving':
        stateIcon = '👋';
        iconColor = '#f87171';
        break;
      case 'entering':
        stateIcon = '🚪';
        iconColor = '#60a5fa';
        break;
    }

    if (stateIcon) {
      ctx.fillStyle = iconColor;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stateIcon, x, y - 30);
    }
  }

  private drawPeopleGroupFallback(ctx: CanvasRenderingContext2D, group: PeopleGroup): void {
    const { x, y } = group.position;
    const radius = 8 + group.size * 2;

    // Glow effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    gradient.addColorStop(0, `${group.color}40`);
    gradient.addColorStop(1, `${group.color}00`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.fillStyle = group.color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Direction indicator
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let directionArrow = '▼';
    switch (group.facingDirection) {
      case 'up': directionArrow = '▲'; break;
      case 'down': directionArrow = '▼'; break;
      case 'left': directionArrow = '◀'; break;
      case 'right': directionArrow = '▶'; break;
    }
    ctx.fillText(directionArrow, x, y);

    // Size badge
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(group.size.toString(), x, y - radius - 8);

    // Draw movement line if seeking
    if (group.state === 'seeking' && group.targetPosition) {
      ctx.strokeStyle = `${group.color}50`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(group.targetPosition.x, group.targetPosition.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // State indicator
    this.drawGroupStateIndicator(ctx, group);
  }
}
