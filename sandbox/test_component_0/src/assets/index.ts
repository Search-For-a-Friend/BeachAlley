/**
 * Asset System Exports
 * 
 * Main entry point for the asset/sprite system.
 */

// Types
export * from './types';

// Registry
export * from './registry';

// Sprite loader
export { SpriteLoader, spriteLoader } from './SpriteLoader';

// Animation system
export {
  createSpriteAnimation,
  createEstablishmentAnimation,
  createPeopleAnimation,
  updateAnimation,
  setAnimationState,
  setFacingDirection,
  calculateFrame,
  drawSprite,
  updateAnimations,
  SpriteAnimationManager,
  spriteAnimationManager,
} from './SpriteAnimator';

// Placeholder generator (for development)
export {
  generateEstablishmentPlaceholder,
  generatePeoplePlaceholder,
  downloadCanvas,
  generateAllPlaceholders,
} from './generatePlaceholders';
