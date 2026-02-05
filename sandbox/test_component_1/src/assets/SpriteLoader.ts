/**
 * Sprite Loader
 * 
 * Handles loading sprite manifests and images from the asset folder.
 * Provides caching and loading state management.
 */

import {
  SpriteManifest,
  LoadedSprite,
  AssetLoadingState,
  AssetRegistryEntry,
} from './types';
import { ASSET_REGISTRY } from './registry';

/**
 * Sprite Loader class - manages loading and caching of sprite assets
 */
export class SpriteLoader {
  private sprites: Map<string, LoadedSprite> = new Map();
  private loadingState: AssetLoadingState = {
    status: 'idle',
    progress: 0,
    loaded: 0,
    total: 0,
    errors: [],
  };
  private listeners: Set<(state: AssetLoadingState) => void> = new Set();

  /**
   * Get current loading state
   */
  getLoadingState(): AssetLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Subscribe to loading state changes
   */
  onLoadingStateChange(callback: (state: AssetLoadingState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getLoadingState();
    this.listeners.forEach(cb => cb(state));
  }

  /**
   * Load all registered assets
   */
  async loadAll(): Promise<void> {
    this.loadingState = {
      status: 'loading',
      progress: 0,
      loaded: 0,
      total: ASSET_REGISTRY.length,
      errors: [],
    };
    this.notifyListeners();

    const loadPromises = ASSET_REGISTRY.map(entry => this.loadAsset(entry));
    await Promise.all(loadPromises);

    this.loadingState.status = this.loadingState.errors.length > 0 ? 'error' : 'loaded';
    this.loadingState.progress = 100;
    this.notifyListeners();
  }

  /**
   * Load a single asset
   */
  async loadAsset(entry: AssetRegistryEntry): Promise<LoadedSprite> {
    // Check if already loaded
    const existing = this.sprites.get(entry.id);
    if (existing?.loaded) {
      return existing;
    }

    const sprite: LoadedSprite = {
      id: entry.id,
      manifest: null as unknown as SpriteManifest,
      image: null,
      loaded: false,
    };

    try {
      // Load manifest
      const manifestResponse = await fetch(entry.manifestPath);
      if (!manifestResponse.ok) {
        throw new Error(`Failed to load manifest: ${manifestResponse.status}`);
      }
      sprite.manifest = await manifestResponse.json();

      // Load spritesheet image
      const imagePath = entry.path + sprite.manifest.spritesheet;
      sprite.image = await this.loadImage(imagePath);
      sprite.loaded = true;

    } catch (error) {
      sprite.error = error instanceof Error ? error.message : 'Unknown error';
      this.loadingState.errors.push(`${entry.id}: ${sprite.error}`);
    }

    this.sprites.set(entry.id, sprite);
    
    // Update progress
    this.loadingState.loaded++;
    this.loadingState.progress = Math.round(
      (this.loadingState.loaded / this.loadingState.total) * 100
    );
    this.notifyListeners();

    return sprite;
  }

  /**
   * Load an image and return a promise
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Get a loaded sprite by ID
   */
  getSprite(id: string): LoadedSprite | undefined {
    return this.sprites.get(id);
  }

  /**
   * Check if a sprite is loaded and ready
   */
  isSpriteReady(id: string): boolean {
    const sprite = this.sprites.get(id);
    return sprite?.loaded === true && sprite.image !== null;
  }

  /**
   * Get all loaded sprites
   */
  getAllSprites(): LoadedSprite[] {
    return Array.from(this.sprites.values());
  }

  /**
   * Clear all loaded sprites (useful for hot reloading)
   */
  clear(): void {
    this.sprites.clear();
    this.loadingState = {
      status: 'idle',
      progress: 0,
      loaded: 0,
      total: 0,
      errors: [],
    };
  }
}

// Singleton instance
export const spriteLoader = new SpriteLoader();
