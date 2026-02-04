/**
 * Asset System Type Definitions
 * 
 * This module defines the types for the sprite/asset management system.
 * It's designed to be generic and reusable across different game entities.
 */

// ============================================
// BASE TYPES
// ============================================

/**
 * Supported asset entity types
 */
export type AssetType = 'establishment' | 'people' | 'decoration' | 'effect' | 'ui';

/**
 * People category based on group size
 */
export type PeopleCategory = 'individual' | 'small_group' | 'big_group';

/**
 * Direction/facing states for animated entities
 */
export type FacingDirection = 'look_down' | 'look_up' | 'look_side';

// ============================================
// MANIFEST TYPES (from JSON files)
// ============================================

/**
 * Definition of a single animation state
 */
export interface SpriteStateDefinition {
  row: number;
  frames: number;
  description?: string;
}

/**
 * Variant definition for entities with multiple visual variants
 */
export interface SpriteVariant {
  name: string;
  column: number;
}

/**
 * Base manifest structure shared by all sprite types
 */
export interface BaseSpriteManifest {
  name: string;
  type: AssetType;
  description?: string;
  spritesheet: string;
  frameWidth: number;
  frameHeight: number;
  anchorX: number;
  anchorY: number;
  animationSpeed: number; // milliseconds per frame
  states: Record<string, SpriteStateDefinition>;
}

/**
 * Establishment-specific manifest
 */
export interface EstablishmentSpriteManifest extends BaseSpriteManifest {
  type: 'establishment';
  states: {
    closed: SpriteStateDefinition;
    deserted: SpriteStateDefinition;
    visited: SpriteStateDefinition;
    busy: SpriteStateDefinition;
    crowded: SpriteStateDefinition;
  };
}

/**
 * People-specific manifest
 */
export interface PeopleSpriteManifest extends BaseSpriteManifest {
  type: 'people';
  category: PeopleCategory;
  groupSizeRange: [number, number];
  states: {
    look_down: SpriteStateDefinition;
    look_up: SpriteStateDefinition;
    look_side: SpriteStateDefinition;
  };
  variants: SpriteVariant[];
}

/**
 * Union type for all manifest types
 */
export type SpriteManifest = EstablishmentSpriteManifest | PeopleSpriteManifest;

// ============================================
// RUNTIME TYPES
// ============================================

/**
 * A single frame's source rectangle in a spritesheet
 */
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Loaded sprite asset ready for rendering
 */
export interface LoadedSprite {
  id: string;
  manifest: SpriteManifest;
  image: HTMLImageElement | null;
  loaded: boolean;
  error?: string;
}

/**
 * Animation instance for a specific entity
 */
export interface SpriteAnimation {
  spriteId: string;
  currentState: string;
  currentFrame: number;
  variant?: number;
  lastFrameTime: number;
  flipX: boolean;
}

/**
 * Frame calculation result
 */
export interface CalculatedFrame {
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

// ============================================
// REGISTRY TYPES
// ============================================

/**
 * Asset registry entry
 */
export interface AssetRegistryEntry {
  id: string;
  type: AssetType;
  path: string;
  manifestPath: string;
}

/**
 * Asset loading status
 */
export type LoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Asset loading state
 */
export interface AssetLoadingState {
  status: LoadingStatus;
  progress: number; // 0-100
  loaded: number;
  total: number;
  errors: string[];
}

// ============================================
// HELPER TYPES
// ============================================

/**
 * Get people category from group size
 */
export function getPeopleCategoryFromSize(size: number): PeopleCategory {
  if (size <= 1) return 'individual';
  if (size <= 5) return 'small_group';
  return 'big_group';
}

/**
 * Get facing direction from movement delta
 */
export function getFacingFromDelta(dx: number, dy: number): FacingDirection {
  if (Math.abs(dx) > Math.abs(dy)) {
    return 'look_side';
  }
  return dy > 0 ? 'look_down' : 'look_up';
}
