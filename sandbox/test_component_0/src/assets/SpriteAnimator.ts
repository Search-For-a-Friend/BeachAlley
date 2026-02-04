/**
 * Sprite Animator
 * 
 * Manages sprite animations for game entities. Handles frame timing,
 * state transitions, and provides frame data for rendering.
 */

import {
  SpriteAnimation,
  CalculatedFrame,
  SpriteManifest,
  LoadedSprite,
  FacingDirection,
  PeopleCategory,
} from './types';
import { spriteLoader } from './SpriteLoader';
import { getPeopleAssetId } from './registry';

/**
 * Create a new sprite animation instance
 */
export function createSpriteAnimation(
  spriteId: string,
  initialState: string,
  variant: number = 0
): SpriteAnimation {
  return {
    spriteId,
    currentState: initialState,
    currentFrame: 0,
    variant,
    lastFrameTime: 0,
    flipX: false,
  };
}

/**
 * Create animation for an establishment
 */
export function createEstablishmentAnimation(
  establishmentType: string = 'house'
): SpriteAnimation {
  return createSpriteAnimation(
    `establishment_${establishmentType}`,
    'deserted',
    0
  );
}

/**
 * Create animation for a people group
 */
export function createPeopleAnimation(
  category: PeopleCategory,
  variant: number = 0
): SpriteAnimation {
  return createSpriteAnimation(
    getPeopleAssetId(category),
    'look_down',
    variant
  );
}

/**
 * Update animation state (call this each frame)
 */
export function updateAnimation(
  animation: SpriteAnimation,
  currentTime: number
): void {
  const sprite = spriteLoader.getSprite(animation.spriteId);
  if (!sprite?.loaded || !sprite.manifest) return;

  const manifest = sprite.manifest;
  const stateConfig = manifest.states[animation.currentState];
  if (!stateConfig) return;

  // Check if it's time to advance frame
  const timeSinceLastFrame = currentTime - animation.lastFrameTime;
  if (timeSinceLastFrame >= manifest.animationSpeed) {
    animation.currentFrame = (animation.currentFrame + 1) % stateConfig.frames;
    animation.lastFrameTime = currentTime;
  }
}

/**
 * Change animation state
 */
export function setAnimationState(
  animation: SpriteAnimation,
  newState: string,
  resetFrame: boolean = true
): void {
  if (animation.currentState === newState) return;
  
  animation.currentState = newState;
  if (resetFrame) {
    animation.currentFrame = 0;
  }
}

/**
 * Set facing direction for people sprites
 */
export function setFacingDirection(
  animation: SpriteAnimation,
  direction: FacingDirection,
  facingLeft: boolean = false
): void {
  setAnimationState(animation, direction);
  animation.flipX = facingLeft;
}

/**
 * Calculate the source rectangle for the current frame
 */
export function calculateFrame(
  animation: SpriteAnimation
): CalculatedFrame | null {
  const sprite = spriteLoader.getSprite(animation.spriteId);
  if (!sprite?.loaded || !sprite.manifest) return null;

  const manifest = sprite.manifest;
  const stateConfig = manifest.states[animation.currentState];
  if (!stateConfig) return null;

  // Calculate position in spritesheet
  // Layout: columns are animation frames (or variants), rows are states
  const frameX = animation.currentFrame;
  const frameY = stateConfig.row;

  // For people with variants, offset by variant
  let variantOffset = 0;
  if ('variants' in manifest && animation.variant !== undefined) {
    // Each variant takes up 'frames' columns
    variantOffset = (animation.variant ?? 0) * stateConfig.frames;
  }

  return {
    sourceX: (frameX + variantOffset) * manifest.frameWidth,
    sourceY: frameY * manifest.frameHeight,
    width: manifest.frameWidth,
    height: manifest.frameHeight,
    anchorX: manifest.anchorX,
    anchorY: manifest.anchorY,
  };
}

/**
 * Draw a sprite animation to a canvas context
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  animation: SpriteAnimation,
  x: number,
  y: number,
  scale: number = 1
): boolean {
  const sprite = spriteLoader.getSprite(animation.spriteId);
  if (!sprite?.loaded || !sprite.image) return false;

  const frame = calculateFrame(animation);
  if (!frame) return false;

  const drawWidth = frame.width * scale;
  const drawHeight = frame.height * scale;
  const drawX = x - drawWidth * frame.anchorX;
  const drawY = y - drawHeight * frame.anchorY;

  ctx.save();

  // Handle horizontal flip
  if (animation.flipX) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }

  ctx.drawImage(
    sprite.image,
    frame.sourceX,
    frame.sourceY,
    frame.width,
    frame.height,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );

  ctx.restore();
  return true;
}

/**
 * Batch animation update for multiple animations
 */
export function updateAnimations(
  animations: SpriteAnimation[],
  currentTime: number
): void {
  for (const animation of animations) {
    updateAnimation(animation, currentTime);
  }
}

/**
 * Sprite Animation Manager class for managing entity animations
 */
export class SpriteAnimationManager {
  private animations: Map<string, SpriteAnimation> = new Map();

  /**
   * Register an animation for an entity
   */
  register(entityId: string, animation: SpriteAnimation): void {
    this.animations.set(entityId, animation);
  }

  /**
   * Get animation for an entity
   */
  get(entityId: string): SpriteAnimation | undefined {
    return this.animations.get(entityId);
  }

  /**
   * Remove animation for an entity
   */
  remove(entityId: string): void {
    this.animations.delete(entityId);
  }

  /**
   * Update all animations
   */
  updateAll(currentTime: number): void {
    for (const animation of this.animations.values()) {
      updateAnimation(animation, currentTime);
    }
  }

  /**
   * Clear all animations
   */
  clear(): void {
    this.animations.clear();
  }
}

// Singleton instance
export const spriteAnimationManager = new SpriteAnimationManager();
