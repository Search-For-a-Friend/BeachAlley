// Simplified canvas: terrain + groups only (no establishments)

import React, { useRef, useEffect, useState } from 'react';
import { CameraSystem } from '../systems/CameraSystem';
import { TileLoader } from '../systems/TileLoader';
import { InputHandler } from '../systems/InputHandler';
import { CameraState } from '../types/canvas';
import { CANVAS_CONFIG } from './config';
import { GameEngine } from '../game/engine';
import { GridManager } from '../game/GridManager';
import { GameState } from '../types';
import { TerrainMap } from '../types/environment';
import { GroupBehavior } from '../game/GroupBehavior';
import { IndividualManager } from '../game/Individual';

type SpriteManifest = {
  name: string;
  type: string;
  spritesheet: string;
  frameWidth: number;
  frameHeight: number;
  anchorX: number;
  anchorY: number;
  animationSpeed: number;
  states: Record<string, { row: number; frames: number }>;
  variants?: Array<{ name: string; column: number }>;
  category?: string;
  groupSizeRange?: [number, number];
};

function stableStringHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getPeopleSpriteState(facingDirection: 'up' | 'down' | 'left' | 'right'): string {
  switch (facingDirection) {
    case 'up':
      return 'look_up';
    case 'down':
      return 'look_down';
    case 'left':
    case 'right':
    default:
      return 'look_side';
  }
}

// Add CSS for vertical zoom slider
const zoomSliderStyles = `
  input[type="range"] {
    writing-mode: bt-lr; /* IE */
    -webkit-appearance: slider-vertical; /* WebKit */
    width: 30px;
    height: 120px;
    background: transparent;
    outline: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #00ffff;
    cursor: pointer;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #00ffff;
    cursor: pointer;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  input[type="range"]::-webkit-slider-thumb:hover {
    background: #00cccc;
    transform: scale(1.1);
  }
  
  input[type="range"]::-moz-range-thumb:hover {
    background: #00cccc;
    transform: scale(1.1);
  }
`;

const zoomControlStyles = {
  zoomControl: {
    position: 'absolute' as const,
    top: '20px',
    left: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '10px',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
  },
  zoomLabel: {
    fontSize: '0.9rem',
    color: '#00ffff',
    textAlign: 'center' as const,
  },
  zoomSlider: {
    WebkitAppearance: 'slider-vertical' as const,
    width: '30px',
    height: '120px',
    background: 'transparent',
    outline: 'none',
  },
  zoomValue: {
    fontSize: '0.8rem',
    color: '#fff',
    textAlign: 'center' as const,
    minWidth: '40px',
  },
};

const timeControlStyles = {
  timeControl: {
    position: 'absolute' as const,
    top: '20px',
    left: '80px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '10px',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
  },
  timeLabel: {
    fontSize: '0.9rem',
    color: '#00ffff',
    textAlign: 'center' as const,
  },
  timeSlider: {
    WebkitAppearance: 'slider-vertical' as const,
    width: '30px',
    height: '120px',
    background: 'transparent',
    outline: 'none',
  },
  timeValue: {
    fontSize: '0.8rem',
    color: '#fff',
    textAlign: 'center' as const,
    minWidth: '50px',
    fontFamily: 'monospace',
  },
};

async function loadSpriteManifest(url: URL): Promise<SpriteManifest> {
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to load manifest: ${url.toString()}`);
  }
  return (await res.json()) as SpriteManifest;
}

async function loadImage(url: URL): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url.toString();
  });
}

function drawPath(ctx: CanvasRenderingContext2D, path: any[], color: string, cameraSystem: CameraSystem): void {
  if (path.length < 2) return;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.globalAlpha = 0.6;
  
  ctx.beginPath();
  const startWorldPos = {
    x: (path[0].x - path[0].y) * (CANVAS_CONFIG.TILE_WIDTH / 2),
    y: (path[0].x + path[0].y) * (CANVAS_CONFIG.TILE_HEIGHT / 2)
  };
  const startScreenPos = cameraSystem.worldToScreen(startWorldPos.x, startWorldPos.y);
  ctx.moveTo(startScreenPos.screenX, startScreenPos.screenY);
  
  for (let i = 1; i < path.length; i++) {
    const worldPos = {
      x: (path[i].x - path[i].y) * (CANVAS_CONFIG.TILE_WIDTH / 2),
      y: (path[i].x + path[i].y) * (CANVAS_CONFIG.TILE_HEIGHT / 2)
    };
    const screenPos = cameraSystem.worldToScreen(worldPos.x, worldPos.y);
    ctx.lineTo(screenPos.screenX, screenPos.screenY);
  }
  
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawTargetHighlight(ctx: CanvasRenderingContext2D, target: any, color: string, cameraSystem: CameraSystem): void {
  const worldPos = {
    x: (target.x - target.y) * (CANVAS_CONFIG.TILE_WIDTH / 2),
    y: (target.x + target.y) * (CANVAS_CONFIG.TILE_HEIGHT / 2)
  };
  const screenPos = cameraSystem.worldToScreen(worldPos.x, worldPos.y);
  
  // Draw pulsing circle at target
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  
  ctx.beginPath();
  ctx.arc(screenPos.screenX, screenPos.screenY, 15, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner circle
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(screenPos.screenX, screenPos.screenY, 8, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(screenPos.screenX, screenPos.screenY, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGroupStateIndicator(ctx: CanvasRenderingContext2D, group: any, x: number, y: number): void {
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
    case 'settled':
      stateIcon = '🏖️';
      iconColor = '#06b6d4';
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
    ctx.textBaseline = 'middle';
    ctx.fillText(stateIcon, x, y - 26);
  }
}

function findSandTileForCenter(terrainMap: TerrainMap): { row: number; col: number } | null {
  const centerRow = terrainMap.height / 2;
  const centerCol = terrainMap.width / 2;
  let best: { row: number; col: number } | null = null;
  let bestDist = Infinity;
  terrainMap.tiles.forEach((type, key) => {
    if (type !== 'sand') return;
    const [row, col] = key.split(',').map(Number);
    const dist = (row - centerRow) ** 2 + (col - centerCol) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = { row, col };
    }
  });
  return best;
}

export interface InteractiveCanvasProps {
  terrainMap: TerrainMap;
  gameState: GameState | null;
  width: number;
  height: number;
  hoveredGroupId?: string | null;
  selectedGroupId?: string | null;
  onGroupClick?: (groupId: string) => void;
  onGroupHover?: (groupId: string | undefined) => void;
  gridManager?: GridManager;
  spawnTilePosition?: { x: number; y: number } | null;
  zoomLevel?: number;
  onZoomChange?: (zoomLevel: number) => void;
  onCameraSystemRef?: (cameraSystem: any) => void;
  groupBehavior?: GroupBehavior; // Add groupBehavior for settlement area access
  individualManager?: IndividualManager; // Add individualManager for individual rendering
  engineRef?: React.MutableRefObject<GameEngine | null>; // Add engine reference for tide callback
  tideManager?: import('../systems/TideManager').TideManager; // Add tide manager for wet sand rendering
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  terrainMap,
  gameState,
  width,
  height,
  hoveredGroupId,
  selectedGroupId,
  onGroupClick,
  onGroupHover,
  gridManager,
  spawnTilePosition,
  zoomLevel = 100,
  onZoomChange,
  onCameraSystemRef,
  groupBehavior,
  individualManager,
  engineRef,
  tideManager,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSize = { width: width || 800, height: height || 600 };
  const [canvasSize, setCanvasSize] = useState(initialSize);
  const [spritesReady, setSpritesReady] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(24);
  const [timeSliderValue, setTimeSliderValue] = useState(50);
  const mapDimensions = { rows: terrainMap.height, cols: terrainMap.width };
  const [cameraSystem] = useState<CameraSystem>(() => {
    const zoom = (zoomLevel / 100) * CANVAS_CONFIG.INITIAL_ZOOM;
    const w = initialSize.width;
    const h = initialSize.height;
    const sandTile = findSandTileForCenter(terrainMap);
    const row = sandTile?.row ?? terrainMap.height / 2;
    const col = sandTile?.col ?? terrainMap.width / 2;
    const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
    const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
    const initialCamera: CameraState = {
      worldX: worldX - w / (2 * zoom),
      worldY: worldY - h / (2 * zoom),
      zoom,
    };
    return new CameraSystem(initialCamera, w, h, mapDimensions);
  });

  useEffect(() => {
    onCameraSystemRef?.(cameraSystem);
  }, [cameraSystem, onCameraSystemRef]);

  const [tileLoader] = useState<TileLoader>(() => new TileLoader(cameraSystem, terrainMap));

  // Set up tide change callback to force tile reload and cache invalidation
  useEffect(() => {
    if (engineRef?.current && tileLoader) {
      engineRef.current.setupTideTileReload((changedTileKeys: string[]) => {
        tileLoader.forceReloadTiles(changedTileKeys);
        // Invalidate cache for changed tiles
        changedTileKeys.forEach(tileKey => {
          tileCacheRef.current.delete(tileKey);
        });
        lastCacheInvalidationRef.current = performance.now();
        lastTideChangeRef.current = performance.now();
      });
    }
  }, [engineRef?.current, tileLoader]);
  const inputHandlerRef = useRef<InputHandler>();
  const animationFrameRef = useRef<number>();

  // Tile caching system - cache computed values to avoid expensive recalculations
  const tileCacheRef = useRef<Map<string, { 
    color: string; 
    lastUpdate: number; 
    isWetSand: boolean;
    isSettledTile: boolean;
  }>>(new Map());
  const cameraStateRef = useRef<{ worldX: number; worldY: number; zoom: number }>({ worldX: 0, worldY: 0, zoom: 1 });
  const lastCacheInvalidationRef = useRef<number>(0);
  const lastTideChangeRef = useRef<number>(0); // Track when tide last changed

  const peopleSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);
  const singleGroupSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);
  const smallGroupSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);
  const bigGroupSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);

  const groupAnimRef = useRef<Map<string, { frameIndex: number; lastFrameTime: number }>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const individualManifestUrl = new URL('../../assets/sprites/people/individual/manifest.json', import.meta.url);
        const singleGroupManifestUrl = new URL('../../assets/sprites/people/group/single_group/manifest.json', import.meta.url);
        const smallGroupManifestUrl = new URL('../../assets/sprites/people/group/small_group/manifest.json', import.meta.url);
        const bigGroupManifestUrl = new URL('../../assets/sprites/people/group/big_group/manifest.json', import.meta.url);

        const [individualManifest, singleGroupManifest, smallGroupManifest, bigGroupManifest] = await Promise.all([
          loadSpriteManifest(individualManifestUrl),
          loadSpriteManifest(singleGroupManifestUrl),
          loadSpriteManifest(smallGroupManifestUrl),
          loadSpriteManifest(bigGroupManifestUrl),
        ]);

        const individualImageUrl = new URL(`../../assets/sprites/people/individual/${individualManifest.spritesheet}`, import.meta.url);
        const singleGroupImageUrl = new URL(`../../assets/sprites/people/group/single_group/${singleGroupManifest.spritesheet}`, import.meta.url);
        const smallGroupImageUrl = new URL(`../../assets/sprites/people/group/small_group/${smallGroupManifest.spritesheet}`, import.meta.url);
        const bigGroupImageUrl = new URL(`../../assets/sprites/people/group/big_group/${bigGroupManifest.spritesheet}`, import.meta.url);

        const [individualImage, singleGroupImage, smallGroupImage, bigGroupImage] = await Promise.all([
          loadImage(individualImageUrl),
          loadImage(singleGroupImageUrl),
          loadImage(smallGroupImageUrl),
          loadImage(bigGroupImageUrl),
        ]);

        if (cancelled) return;

        // For individual system (visual representation of individuals)
        peopleSpriteRef.current = { manifest: individualManifest, image: individualImage };
        console.log('Individual sprite loaded:', { 
          manifest: individualManifest.name, 
          imageLoaded: !!individualImage,
          imageSize: individualImage?.width + 'x' + individualImage?.height 
        });
        // For group rendering
        singleGroupSpriteRef.current = { manifest: singleGroupManifest, image: singleGroupImage };
        smallGroupSpriteRef.current = { manifest: smallGroupManifest, image: smallGroupImage };
        bigGroupSpriteRef.current = { manifest: bigGroupManifest, image: bigGroupImage };
        setSpritesReady(true);
      } catch {
        if (!cancelled) {
          setSpritesReady(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setCanvasSize({ width: w, height: h });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const inputHandler = new InputHandler(canvasRef.current);
    inputHandler.setOnDrag((dx: number, dy: number) => cameraSystem.move(dx, dy));
    inputHandlerRef.current = inputHandler;
    return () => inputHandler.destroy();
  }, [cameraSystem]);

  useEffect(() => {
    if (engineRef?.current && engineRef.current.getTimeSpeed) {
      const currentSpeed = engineRef.current.getTimeSpeed();
      setTimeSpeed(currentSpeed);
      // Convert current speed back to slider value (0-100)
      const logValue = (Math.log(currentSpeed) / Math.log(17280)) * 100;
      setTimeSliderValue(Math.max(0, Math.min(100, logValue)));
    }
  }, [engineRef]);

  const handleTimeSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSliderValue = parseFloat(e.target.value);
    setTimeSliderValue(newSliderValue);
    // Convert linear slider (0-100) to logarithmic scale (1-17280)
    const logSpeed = Math.exp((newSliderValue / 100) * Math.log(17280));
    const newSpeed = Math.max(1, Math.min(17280, logSpeed));
    setTimeSpeed(newSpeed);
    if (engineRef?.current && engineRef.current.setTimeSpeed) {
      engineRef.current.setTimeSpeed(newSpeed);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    tileLoader.update(canvasSize.width, canvasSize.height);

    const render = () => {
      tileLoader.update(canvasSize.width, canvasSize.height);
      
      // Check if cache needs to be invalidated
      const currentCameraState = cameraSystem.getState();
      const cameraChanged = currentCameraState.worldX !== cameraStateRef.current.worldX ||
                           currentCameraState.worldY !== cameraStateRef.current.worldY ||
                           currentCameraState.zoom !== cameraStateRef.current.zoom;
      
      // Invalidate cache if camera moved significantly
      if (cameraChanged) {
        const cameraMovement = Math.sqrt(
          Math.pow(currentCameraState.worldX - cameraStateRef.current.worldX, 2) +
          Math.pow(currentCameraState.worldY - cameraStateRef.current.worldY, 2)
        );
        
        // Only clear cache if camera moved more than 1 tile or zoom changed
        if (cameraMovement > CANVAS_CONFIG.TILE_WIDTH || currentCameraState.zoom !== cameraStateRef.current.zoom) {
          tileCacheRef.current.clear();
          lastCacheInvalidationRef.current = performance.now();
        }
        
        cameraStateRef.current = { worldX: currentCameraState.worldX, worldY: currentCameraState.worldY, zoom: currentCameraState.zoom };
      }
      
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      const now = performance.now();

      const tiles = tileLoader.getLoadedTiles();
      
      const zoom = cameraSystem.getState().zoom;
      const scaledW = CANVAS_CONFIG.TILE_WIDTH * zoom;
      const scaledH = CANVAS_CONFIG.TILE_HEIGHT * zoom;

      tiles.forEach(tile => {
        const { worldX, worldY } = cameraSystem.tileToWorld(tile.row, tile.col);
        const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
        
        const tileKey = `${tile.col},${tile.row}`;
        const cached = tileCacheRef.current.get(tileKey);
        
        // Check if we need to recompute values for this tile
        let isWetSand: boolean;
        let isSettledTile: boolean;
        let color: string;
        
        if (cached && cached.lastUpdate >= lastCacheInvalidationRef.current) {
          // Use cached values - no expensive computations!
          isWetSand = cached.isWetSand;
          isSettledTile = cached.isSettledTile;
          color = cached.color;
        } else {
          // Need to compute values - this is expensive, so we cache the result
          isSettledTile = groupBehavior?.getAllSettledTiles().has(tileKey) || false;
          
          // Calculate tile color
          switch (tile.terrainType) {
            case 'sand': 
              // EXPENSIVE: Check if sand tile is wet - this is what we want to cache!
              isWetSand = tideManager?.isTileWet(tileKey) || false;
              if (isWetSand) {
                color = '#8B7355'; // Darker brown for wet sand
              } else {
                color = isSettledTile ? '#FFA500' : '#F4E4C1'; // Orange for settled sand tiles
              }
              break;
            case 'water': color = '#4A90E2'; isWetSand = false; break;
            case 'grass': color = '#7EC850'; isWetSand = false; break;
            case 'spawn': color = '#FFD700'; isWetSand = false; break;
            default: color = '#CCCCCC'; isWetSand = false;
          }
          
          // Cache the computed values
          tileCacheRef.current.set(tileKey, { 
            color, 
            lastUpdate: now, 
            isWetSand, 
            isSettledTile 
          });
        }
        
        // Debug: Log first few tiles being computed
        if (tile.col < 3 && tile.row < 3) {
          console.log(`[Canvas] Computing tile ${tileKey}: color=${color}, isWet=${isWetSand}`);
        }
        
        if (true) {
          // Draw tile
          ctx.fillStyle = color;
          ctx.strokeStyle = '#666666';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
          ctx.lineTo(screenX, screenY + scaledH);
          ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      if (gameState) {
        // Draw special tile highlights first (underneath other elements)
        if (gridManager) {
          // Get all tiles from grid manager
          const gridDimensions = gridManager.getDimensions();
          
          for (let row = 0; row < gridDimensions.height; row++) {
            for (let col = 0; col < gridDimensions.width; col++) {
              const tile = gridManager.getTile(col, row);
              if (!tile) continue;
              
              const { worldX, worldY } = cameraSystem.tileToWorld(row, col);
              const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
              
              // Highlight spawn tiles
              if (tile.type === 'spawn') {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Gold highlight for spawn
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
                ctx.lineTo(screenX, screenY + scaledH);
                ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Add spawn icon
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🚪', screenX, screenY + scaledH / 2);
              }
            }
          }
        }
        
        // Draw people groups with viewport culling
        gameState.groups.forEach(g => {
          const col = g.position.x;
          const row = g.position.y;
          const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
          const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
          const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
          
          // Viewport culling - don't render off-screen groups
          const cullMargin = 50; // Extra margin for smooth appearance
          if (screenX < -cullMargin || screenX > canvasSize.width + cullMargin ||
              screenY < -cullMargin || screenY > canvasSize.height + cullMargin) {
            return; // Skip rendering this group
          }
          
          const isHovered = hoveredGroupId === g.id;
          const isSelected = selectedGroupId === g.id;
          
          // Draw path and target if selected
          if (isSelected && g.targetPosition) {
            // Create a simple path from current position to target
            const simplePath = [g.position, g.targetPosition];
            drawPath(ctx, simplePath, g.color, cameraSystem);
            
            // Draw target highlight
            drawTargetHighlight(ctx, g.targetPosition, g.color, cameraSystem);
          }
          
          // Don't draw if visiting or despawned
          if (g.state === 'visiting' || g.state === 'despawned') return;
          
          const radius = 8 + g.size * 2;

          // Group sprite (fallback to circle)
          const groupSprite = (() => {
            if (g.size === 1) return singleGroupSpriteRef.current; // 1 person = single_group sprite
            if (g.size <= 3) return smallGroupSpriteRef.current; // 2-3 people = small_group sprite
            return bigGroupSpriteRef.current; // 4+ people = big_group sprite
          })();

          if (spritesReady && groupSprite) {
            const spriteState = getPeopleSpriteState(g.facingDirection);
            const stateInfo = groupSprite.manifest.states[spriteState] ?? groupSprite.manifest.states.look_down;
            const framesPerState = stateInfo?.frames ?? 2;

            const anim = groupAnimRef.current.get(g.id) ?? {
              frameIndex: 0,
              lastFrameTime: 0,
            };
            const animSpeed = groupSprite.manifest.animationSpeed ?? 300;
            if (now - anim.lastFrameTime > animSpeed) {
              anim.frameIndex = (anim.frameIndex + 1) % framesPerState;
              anim.lastFrameTime = now;
              groupAnimRef.current.set(g.id, anim);
            }

            const variants = groupSprite.manifest.variants ?? [];
            const variantIndex = variants.length
              ? stableStringHash(g.id + String(g.type ?? '')) % variants.length
              : 0;
            const variantCol = variants[variantIndex]?.column ?? 0;

            const frameW = groupSprite.manifest.frameWidth;
            const frameH = groupSprite.manifest.frameHeight;

            const sx = (variantCol * framesPerState + anim.frameIndex) * frameW;
            const sy = (stateInfo?.row ?? 0) * frameH;

            const zoom = cameraSystem.getState().zoom;
            const dw = frameW * zoom;
            const dh = frameH * zoom;
            const ax = groupSprite.manifest.anchorX ?? 0.5;
            const ay = groupSprite.manifest.anchorY ?? 0.9;

            ctx.drawImage(
              groupSprite.image,
              sx,
              sy,
              frameW,
              frameH,
              screenX - dw * ax,
              screenY + scaledH / 2 - dh * ay,
              dw,
              dh
            );
          } else {
            // Fallback: circle
            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.arc(screenX, screenY + scaledH / 2, radius, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Border - highlight if hovered or selected
          if (isSelected) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 4;
          } else if (isHovered) {
            ctx.strokeStyle = '#ff0080';
            ctx.lineWidth = 3;
          } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
          }
          ctx.beginPath();
          ctx.arc(screenX, screenY + scaledH / 2, radius, 0, Math.PI * 2);
          ctx.stroke();
          
          // Add glow effect for selected/hovered
          if (isSelected || isHovered) {
            ctx.save();
            ctx.shadowColor = isSelected ? '#00ffff' : '#ff0080';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(screenX, screenY + scaledH / 2, radius + 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          
          // Direction indicator
          ctx.fillStyle = '#1a1a2e';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          let directionArrow = '▼';
          switch (g.facingDirection) {
            case 'up': directionArrow = '▲'; break;
            case 'down': directionArrow = '▼'; break;
            case 'left': directionArrow = '◀'; break;
            case 'right': directionArrow = '▶'; break;
          }
          ctx.fillText(directionArrow, screenX, screenY + scaledH / 2);

          // Size badge
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(g.size.toString(), screenX, screenY + scaledH / 2 - radius - 8);

          if (isSelected) {
            drawGroupStateIndicator(ctx, g, screenX, screenY + scaledH / 2);
          }
        });

        // Draw individuals with viewport culling (only those not in group)
        if (individualManager) {
          const allIndividuals = individualManager.getAllIndividuals();
          const activeIndividuals = allIndividuals.filter(individual => individual.state !== 'in_group');
          //console.log('Rendering individuals:', activeIndividuals.length, 'Total:', allIndividuals.length, 'Sprites ready:', spritesReady);
          activeIndividuals.forEach(individual => {
            const col = individual.position.x;
            const row = individual.position.y;
            const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
            const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
            const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
            
            // Viewport culling - don't render off-screen individuals
            const cullMargin = 50; // Extra margin for smooth appearance
            if (screenX < -cullMargin || screenX > canvasSize.width + cullMargin ||
                screenY < -cullMargin || screenY > canvasSize.height + cullMargin) {
              return; // Skip rendering this individual
            }
            
            // Draw individual using individual sprites
            const individualSprite = peopleSpriteRef.current;
            
            if (spritesReady && individualSprite) {
              // Calculate individual facing direction based on movement
              let facingDirection: 'up' | 'down' | 'left' | 'right' = 'down';
              if (individual.targetPosition) {
                const dx = individual.targetPosition.x - individual.position.x;
                const dy = individual.targetPosition.y - individual.position.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                  facingDirection = dx > 0 ? 'right' : 'left';
                } else {
                  facingDirection = dy > 0 ? 'down' : 'up';
                }
              }
              
              const spriteState = getPeopleSpriteState(facingDirection);
              const stateInfo = individualSprite.manifest.states[spriteState] ?? individualSprite.manifest.states.look_down;
              const framesPerState = stateInfo?.frames ?? 2;

              // Simple animation for individuals
              const animSpeed = individualSprite.manifest.animationSpeed ?? 300;
              const frameIndex = Math.floor((now / animSpeed) % framesPerState);

              const frameW = individualSprite.manifest.frameWidth;
              const frameH = individualSprite.manifest.frameHeight;

              const sx = frameIndex * frameW;
              const sy = (stateInfo?.row ?? 0) * frameH;

              const zoom = cameraSystem.getState().zoom;
              const dw = frameW * zoom * 0.5; // Make individuals smaller than groups
              const dh = frameH * zoom * 0.5;
              const ax = individualSprite.manifest.anchorX ?? 0.5;
              const ay = individualSprite.manifest.anchorY ?? 0.9;

              ctx.drawImage(
                individualSprite.image,
                sx,
                sy,
                frameW,
                frameH,
                screenX - dw * ax,
                screenY - dh * ay,
                dw,
                dh
              );
              
              // Draw small indicator for enjoying state
              if (individual.state === 'enjoying') {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('😊', screenX, screenY - dh * 0.5);
              }
              
              // Draw target line if seeking
              if (individual.state === 'seeking' && individual.targetPosition) {
                const targetCol = individual.targetPosition.x;
                const targetRow = individual.targetPosition.y;
                const targetWorldX = (targetCol - targetRow) * (CANVAS_CONFIG.TILE_WIDTH / 2);
                const targetWorldY = (targetCol + targetRow) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
                const { screenX: targetScreenX, screenY: targetScreenY } = cameraSystem.worldToScreen(targetWorldX, targetWorldY);
                
                ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)'; // Orange with transparency
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(targetScreenX, targetScreenY);
                ctx.stroke();
                ctx.setLineDash([]);
              }
            } else {
              // Fallback: Draw individual as small circle with state-based color
              const radius = 4; // Smaller than groups
              
              // State-based colors
              let color = '#FFD700'; // Default gold
              switch (individual.state) {
                case 'seeking': color = '#FFA500'; break;       // Orange
                case 'enjoying': color = '#00FF00'; break;      // Green
                case 'returning': color = '#87CEEB'; break;     // Sky blue
                case 'inactive': color = '#808080'; break;      // Gray
              }
              
              ctx.fillStyle = color;
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    cameraSystem,
    tileLoader,
    canvasSize,
    gameState,
    hoveredGroupId,
    selectedGroupId,
    gridManager,
    terrainMap,
  ]);

  // Mouse interaction handlers - now handled by InputHandler
  const handleElementClick = (x: number, y: number) => {
    if (!gameState) return;
    if (!onGroupClick) return;

    for (const group of gameState.groups) {
      if (group.state === 'visiting' || group.state === 'despawned') continue;

      const col = group.position.x;
      const row = group.position.y;
      const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
      const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
      const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

      const radius = 8 + group.size * 2;
      const zoom = cameraSystem.getState().zoom;
      const scaledH = CANVAS_CONFIG.TILE_HEIGHT * zoom;

      const dx = x - screenX;
      const dy = y - (screenY + scaledH / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius + 5) {
        onGroupClick(group.id);
        return;
      }
    }
  };

  const handleElementHover = (x: number, y: number) => {
    if (!gameState) return;
    if (!onGroupHover) return;

    let hoveredGroup: string | undefined = undefined;
    for (const group of gameState.groups) {
      if (group.state === 'visiting' || group.state === 'despawned') continue;

      const col = group.position.x;
      const row = group.position.y;
      const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
      const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
      const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

      const radius = 8 + group.size * 2;
      const zoom = cameraSystem.getState().zoom;
      const scaledH = CANVAS_CONFIG.TILE_HEIGHT * zoom;

      const dx = x - screenX;
      const dy = y - (screenY + scaledH / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius + 5) {
        hoveredGroup = group.id;
        break;
      }
    }

    onGroupHover(hoveredGroup);
  };

  useEffect(() => {
    cameraSystem.updateCanvasSize(canvasSize.width, canvasSize.height);
  }, [cameraSystem, canvasSize]);

  // Update zoom level when zoomLevel prop changes
  useEffect(() => {
    const newZoom = (zoomLevel / 100) * CANVAS_CONFIG.INITIAL_ZOOM;
    cameraSystem.setZoom(newZoom);
  }, [cameraSystem, zoomLevel]);

  useEffect(() => {
    // Set up InputHandler callbacks for element interaction
    if (inputHandlerRef.current) {
      inputHandlerRef.current.setOnElementClick(handleElementClick);
      inputHandlerRef.current.setOnElementHover(handleElementHover);
    }
  }, [handleElementClick, handleElementHover]);

  return (
    <>
      <style>{zoomSliderStyles}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Vertical Zoom Slider */}
        <div style={zoomControlStyles.zoomControl}>
          <div style={zoomControlStyles.zoomLabel}>🔍</div>
          <input
            type="range"
            min="10"
            max="200"
            value={zoomLevel}
            onChange={(e) => {
              const newZoom = Number(e.target.value);
              onZoomChange?.(newZoom);
            }}
            style={zoomControlStyles.zoomSlider}
            aria-label="Zoom level"
          />
          <div style={zoomControlStyles.zoomValue}>{zoomLevel}%</div>
        </div>

        {/* Vertical Time Speed Slider */}
        <div style={timeControlStyles.timeControl}>
          <div style={timeControlStyles.timeLabel}>🕐</div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={timeSliderValue}
            onChange={handleTimeSpeedChange}
            style={timeControlStyles.timeSlider}
            aria-label="Time speed"
          />
          <div style={timeControlStyles.timeValue}>{Math.round(timeSpeed)}x</div>
        </div>

        {/* Center on Spawn Button */}
        <div style={{
          position: 'absolute' as const,
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '8px',
          padding: '10px',
          background: 'rgba(26, 26, 46, 0.95)',
          borderRadius: '10px',
          border: '1px solid rgba(0, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
        }}>
          <button
            onClick={() => {
              if (spawnTilePosition) {
                cameraSystem.centerOnTile(spawnTilePosition.x, spawnTilePosition.y);
              }
            }}
            style={{
              background: 'rgba(0, 255, 255, 0.2)',
              border: '1px solid rgba(0, 255, 255, 0.5)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#00ffff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Center on spawn tile"
          >
            🏠 Center Spawn
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            border: '2px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: hoveredGroupId ? 'pointer' : 'grab',
            background: 'rgba(0, 0, 0, 0.8)',
          }}
        />
      </div>
    </>
  );
};
