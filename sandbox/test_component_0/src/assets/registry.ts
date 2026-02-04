/**
 * Asset Registry
 * 
 * Central registry of all game assets. Add new assets here to make them
 * available to the sprite system.
 */

import { AssetRegistryEntry, AssetType } from './types';

/**
 * Registry of all available assets
 */
export const ASSET_REGISTRY: AssetRegistryEntry[] = [
  // ============================================
  // ESTABLISHMENTS
  // ============================================
  {
    id: 'establishment_house',
    type: 'establishment',
    path: '/assets/sprites/establishments/house/',
    manifestPath: '/assets/sprites/establishments/house/manifest.json',
  },
  // Future establishments:
  // { id: 'establishment_beach_bar', type: 'establishment', ... },
  // { id: 'establishment_restaurant', type: 'establishment', ... },
  
  // ============================================
  // PEOPLE
  // ============================================
  {
    id: 'people_individual',
    type: 'people',
    path: '/assets/sprites/people/individual/',
    manifestPath: '/assets/sprites/people/individual/manifest.json',
  },
  {
    id: 'people_small_group',
    type: 'people',
    path: '/assets/sprites/people/small_group/',
    manifestPath: '/assets/sprites/people/small_group/manifest.json',
  },
  {
    id: 'people_big_group',
    type: 'people',
    path: '/assets/sprites/people/big_group/',
    manifestPath: '/assets/sprites/people/big_group/manifest.json',
  },
  
  // ============================================
  // DECORATIONS (future)
  // ============================================
  // { id: 'decoration_palm_tree', type: 'decoration', ... },
  // { id: 'decoration_umbrella', type: 'decoration', ... },
  
  // ============================================
  // EFFECTS (future)
  // ============================================
  // { id: 'effect_sparkle', type: 'effect', ... },
  // { id: 'effect_splash', type: 'effect', ... },
];

/**
 * Get all assets of a specific type
 */
export function getAssetsByType(type: AssetType): AssetRegistryEntry[] {
  return ASSET_REGISTRY.filter(entry => entry.type === type);
}

/**
 * Get asset entry by ID
 */
export function getAssetById(id: string): AssetRegistryEntry | undefined {
  return ASSET_REGISTRY.find(entry => entry.id === id);
}

/**
 * Get asset ID for people based on category
 */
export function getPeopleAssetId(category: 'individual' | 'small_group' | 'big_group'): string {
  return `people_${category}`;
}

/**
 * Get asset ID for establishment
 */
export function getEstablishmentAssetId(establishmentType: string): string {
  return `establishment_${establishmentType}`;
}
