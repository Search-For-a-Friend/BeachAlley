// Merged canvas: terrain + game state (establishments, groups)

import React, { useRef, useEffect, useState } from 'react';
import { CameraSystem } from '../systems/CameraSystem';
import { TileLoader } from '../systems/TileLoader';
import { InputHandler } from '../systems/InputHandler';
import { CameraState } from '../types/canvas';
import { TerrainMap } from '../types/environment';
import { GameState, Establishment } from '../types';
import { CANVAS_CONFIG } from './config';
import { getBuildingCapacity } from '../game/engine';

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

function drawDiamondPath(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  scaledW: number,
  scaledH: number
): void {
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
  ctx.lineTo(screenX, screenY + scaledH);
  ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
  ctx.closePath();
}

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

function drawOccupancyBar(ctx: CanvasRenderingContext2D, establishment: Establishment, x: number, y: number): void {
  const barWidth = 50;
  const barHeight = 6;
  
  // Get color based on establishment state
  const getStateColor = (state: string): string => {
    switch (state) {
      case 'closed': return '#666';
      case 'deserted': return '#f87171';
      case 'visited': return '#fbbf24';
      case 'busy': return '#fb923c';
      case 'crowded': return '#ef4444';
      default: return '#4ade80';
    }
  };
  
  const color = getStateColor(establishment.state);

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

  // Fill
  const fillPercent = establishment.currentOccupancy / establishment.maxCapacity;
  ctx.fillStyle = color;
  ctx.fillRect(x - barWidth / 2, y, barWidth * fillPercent, barHeight);

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);

  // Occupancy text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${establishment.currentOccupancy}/${establishment.maxCapacity}`,
    x,
    y + barHeight + 14
  );
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
  gameState?: GameState | null;
  width?: number;
  height?: number;
  hoveredGroupId?: string | null;
  selectedGroupId?: string | null;
  onGroupClick?: (groupId: string) => void;
  onGroupHover?: (groupId: string | null) => void;
  hoveredEstablishmentId?: string | null;
  selectedEstablishmentId?: string | null;
  onEstablishmentClick?: (establishmentId: string) => void;
  onEstablishmentHover?: (establishmentId: string | null) => void;
  gridManager?: any; // GridManager type from game engine
  buildModeEnabled?: boolean;
  onSelectionTileChange?: (tile: { row: number; col: number } | null) => void;
  buildingRotation?: number;
  selectedBuilding?: { icon: string; name: string; price: string } | null;
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
  hoveredEstablishmentId,
  selectedEstablishmentId,
  onEstablishmentClick,
  onEstablishmentHover,
  gridManager,
  buildModeEnabled,
  onSelectionTileChange,
  buildingRotation = 0,
  selectedBuilding = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSize = { width: width || 800, height: height || 600 };
  const [canvasSize, setCanvasSize] = useState(initialSize);
  const [spritesReady, setSpritesReady] = useState(false);
  const mapDimensions = { rows: terrainMap.height, cols: terrainMap.width };
  const [cameraSystem] = useState<CameraSystem>(() => {
    const zoom = CANVAS_CONFIG.INITIAL_ZOOM;
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
  const [tileLoader] = useState<TileLoader>(() => new TileLoader(cameraSystem, terrainMap));
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSelectionKeyRef = useRef<string | null>(null);

  const peopleSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);
  const smallGroupSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);
  const bigGroupSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);
  const houseSpriteRef = useRef<{ manifest: SpriteManifest; image: HTMLImageElement } | null>(null);

  const groupAnimRef = useRef<Map<string, { frameIndex: number; lastFrameTime: number }>>(new Map());
  const establishmentAnimRef = useRef<Map<string, { frameIndex: number; lastFrameTime: number }>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const individualManifestUrl = new URL('../../assets/sprites/people/individual/manifest.json', import.meta.url);
        const smallGroupManifestUrl = new URL('../../assets/sprites/people/small_group/manifest.json', import.meta.url);
        const bigGroupManifestUrl = new URL('../../assets/sprites/people/big_group/manifest.json', import.meta.url);
        const houseManifestUrl = new URL('../../assets/sprites/establishments/house/manifest.json', import.meta.url);

        const [individualManifest, smallGroupManifest, bigGroupManifest, houseManifest] = await Promise.all([
          loadSpriteManifest(individualManifestUrl),
          loadSpriteManifest(smallGroupManifestUrl),
          loadSpriteManifest(bigGroupManifestUrl),
          loadSpriteManifest(houseManifestUrl),
        ]);

        const individualImageUrl = new URL(`../../assets/sprites/people/individual/${individualManifest.spritesheet}`, import.meta.url);
        const smallGroupImageUrl = new URL(`../../assets/sprites/people/small_group/${smallGroupManifest.spritesheet}`, import.meta.url);
        const bigGroupImageUrl = new URL(`../../assets/sprites/people/big_group/${bigGroupManifest.spritesheet}`, import.meta.url);
        const houseImageUrl = new URL(`../../assets/sprites/establishments/house/${houseManifest.spritesheet}`, import.meta.url);

        const [individualImage, smallGroupImage, bigGroupImage, houseImage] = await Promise.all([
          loadImage(individualImageUrl),
          loadImage(smallGroupImageUrl),
          loadImage(bigGroupImageUrl),
          loadImage(houseImageUrl),
        ]);

        if (cancelled) return;

        peopleSpriteRef.current = { manifest: individualManifest, image: individualImage };
        smallGroupSpriteRef.current = { manifest: smallGroupManifest, image: smallGroupImage };
        bigGroupSpriteRef.current = { manifest: bigGroupManifest, image: bigGroupImage };
        houseSpriteRef.current = { manifest: houseManifest, image: houseImage };
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
    inputHandler.setOnDrag((dx, dy) => cameraSystem.move(dx, dy));
    inputHandlerRef.current = inputHandler;
    return () => inputHandler.destroy();
  }, [cameraSystem]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    tileLoader.update(canvasSize.width, canvasSize.height);

    const render = () => {
      tileLoader.update(canvasSize.width, canvasSize.height);
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
        let color: string;
        switch (tile.terrainType) {
          case 'sand': color = '#F4E4C1'; break;
          case 'water': color = '#4A90E2'; break;
          case 'grass': color = '#7EC850'; break;
          default: color = '#CCCCCC';
        }
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
      });

      // Build mode: compute the selection tile at viewport center and render highlight
      if (buildModeEnabled) {
        const centerScreenX = canvasSize.width / 2;
        const centerScreenY = canvasSize.height / 2;
        const { worldX: centerWorldX, worldY: centerWorldY } = cameraSystem.screenToWorld(centerScreenX, centerScreenY);
        const centerTile = cameraSystem.worldToTile(centerWorldX, centerWorldY);

        // Clamp to map bounds
        const clampedRow = Math.max(0, Math.min(terrainMap.height - 1, centerTile.row));
        const clampedCol = Math.max(0, Math.min(terrainMap.width - 1, centerTile.col));
        const selectionKey = `${clampedRow},${clampedCol}`;

        if (selectionKey !== lastSelectionKeyRef.current) {
          lastSelectionKeyRef.current = selectionKey;
          onSelectionTileChange?.({ row: clampedRow, col: clampedCol });
        }

        // Calculate building size based on selected building
        const buildingSize = selectedBuilding ? getBuildingCapacity(selectedBuilding.name) <= 4 ? 1 : getBuildingCapacity(selectedBuilding.name) <= 8 ? 2 : 3 : 1;

        // Draw full footprint for larger buildings
        const sizeOffset = Math.floor(buildingSize / 2);
        for (let dy = 0; dy < buildingSize; dy++) {
          for (let dx = 0; dx < buildingSize; dx++) {
            const tileRow = clampedRow + dy - sizeOffset;
            const tileCol = clampedCol + dx - sizeOffset;
            
            // Skip if out of bounds
            if (tileRow < 0 || tileRow >= terrainMap.height || tileCol < 0 || tileCol >= terrainMap.width) continue;
            
            const { worldX, worldY } = cameraSystem.tileToWorld(tileRow, tileCol);
            const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

            ctx.save();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.18)';
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
            ctx.lineTo(screenX, screenY + scaledH);
            ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw entrance preview based on rotation (relative to building center)
        const entranceOffsets = [
          { r: -1, c: 0 }, // North
          { r: 0, c: -1 }, // West
          { r: 1, c: 0 }, // South
          { r: 0, c: 1 }, // East
        ];
        const entranceOffset = entranceOffsets[buildingRotation % 4];
        
        // Calculate entrance position relative to building footprint center
        const buildingCenterRow = clampedRow + sizeOffset;
        const buildingCenterCol = clampedCol + sizeOffset;
        const { worldX: entranceWorldX, worldY: entranceWorldY } = cameraSystem.tileToWorld(buildingCenterRow + entranceOffset.r, buildingCenterCol + entranceOffset.c);
        const { screenX: entranceScreenX, screenY: entranceScreenY } = cameraSystem.worldToScreen(entranceWorldX, entranceWorldY);
        
        // Draw entrance preview
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow for entrance
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(entranceScreenX, entranceScreenY);
        ctx.lineTo(entranceScreenX + scaledW / 2, entranceScreenY + scaledH / 2);
        ctx.lineTo(entranceScreenX, entranceScreenY + scaledH);
        ctx.lineTo(entranceScreenX - scaledW / 2, entranceScreenY + scaledH / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw entrance direction indicator
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const directionEmojis = ['⬆️', '⬅️', '⬇️', '➡️'];
        ctx.fillText(directionEmojis[buildingRotation % 4], entranceScreenX, entranceScreenY + scaledH / 2);
        ctx.restore();
      } else {
        if (lastSelectionKeyRef.current !== null) {
          lastSelectionKeyRef.current = null;
          onSelectionTileChange?.(null);
        }
      }

      if (gameState) {
        // Draw special tile highlights first (underneath other elements)
        if (gridManager) {
          // Get all tiles from the grid manager
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
              
              // Highlight entrance tiles
              if (tile.type === 'entrance') {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; // Cyan highlight for entrance
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
                ctx.lineTo(screenX, screenY + scaledH);
                ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              }
            }
          }
        }
        
        // Draw establishments with guest count
        gameState.establishments.forEach(est => {
          if (!est.gridPosition) return;
          const row = est.gridPosition.y;
          const col = est.gridPosition.x;
          
          const isHovered = hoveredEstablishmentId === est.id;
          const isSelected = selectedEstablishmentId === est.id;
          
          // Calculate establishment size based on capacity
          const size = est.maxCapacity <= 4 ? 1 : est.maxCapacity <= 8 ? 2 : 3;
          const sizeOffset = Math.floor(size / 2);
          
          // Draw full footprint for larger establishments
          for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
              const tileRow = row + dy - sizeOffset;
              const tileCol = col + dx - sizeOffset;
              const { worldX, worldY } = cameraSystem.tileToWorld(tileRow, tileCol);
              const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
              
              // Only draw sprite for main tile (center), others get colored tiles
              if (dy === sizeOffset && dx === sizeOffset) {
                // Draw establishment building (sprite if available)
                const houseSprite = houseSpriteRef.current;
                if (spritesReady && houseSprite) {
                  const stateKey = est.isOpen ? (est.state || 'deserted') : 'closed';
                  const stateInfo = houseSprite.manifest.states[stateKey] ?? houseSprite.manifest.states.deserted;

                  const anim = establishmentAnimRef.current.get(est.id) ?? {
                    frameIndex: 0,
                    lastFrameTime: 0,
                  };

                  const animSpeed = houseSprite.manifest.animationSpeed ?? 750;
                  if (now - anim.lastFrameTime > animSpeed) {
                    anim.frameIndex = (anim.frameIndex + 1) % (stateInfo?.frames ?? 2);
                    anim.lastFrameTime = now;
                    establishmentAnimRef.current.set(est.id, anim);
                  }

                  const frameW = houseSprite.manifest.frameWidth;
                  const frameH = houseSprite.manifest.frameHeight;
                  const sx = anim.frameIndex * frameW;
                  const sy = (stateInfo?.row ?? 0) * frameH;

                  const zoom = cameraSystem.getState().zoom;
                  const dw = frameW * zoom;
                  const dh = frameH * zoom;
                  const ax = houseSprite.manifest.anchorX ?? 0.5;
                  const ay = houseSprite.manifest.anchorY ?? 0.8;

                  ctx.drawImage(
                    houseSprite.image,
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
                  ctx.fillStyle = '#8B7355';
                  ctx.beginPath();
                  ctx.moveTo(screenX, screenY);
                  ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
                  ctx.lineTo(screenX, screenY + scaledH);
                  ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
                  ctx.closePath();
                  ctx.fill();
                }
              } else {
                // Draw colored tile for other parts of footprint
                ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
                ctx.lineTo(screenX, screenY + scaledH);
                ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
                ctx.closePath();
                ctx.fill();
              }

              // Outline / selection styling for main tile only
              if (dy === sizeOffset && dx === sizeOffset) {
                if (isSelected) {
                  ctx.strokeStyle = '#00ffff';
                  ctx.lineWidth = 4;
                } else if (isHovered) {
                  ctx.strokeStyle = '#ff0080';
                  ctx.lineWidth = 3;
                } else {
                  ctx.strokeStyle = '#654321';
                  ctx.lineWidth = 2;
                }
                drawDiamondPath(ctx, screenX, screenY, scaledW, scaledH);
                ctx.stroke();
              }
            }
          }

          // Draw guest count on top of main tile
          const centerTileRow = row;
          const centerTileCol = col;
          const { worldX: centerWorldX, worldY: centerWorldY } = cameraSystem.tileToWorld(centerTileRow, centerTileCol);
          const { screenX: centerScreenX, screenY: centerScreenY } = cameraSystem.worldToScreen(centerWorldX, centerWorldY);
          drawOccupancyBar(ctx, est, centerScreenX, centerScreenY - scaledH / 2 - 10);
          
          // Add glow effect for selected/hovered (only once per establishment)
          if (isSelected || isHovered) {
            ctx.save();
            ctx.shadowColor = isSelected ? '#00ffff' : '#ff0080';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.55;
            drawDiamondPath(ctx, centerScreenX, centerScreenY, scaledW, scaledH);
            ctx.stroke();
            ctx.restore();
          }
        });
        
        // Draw people groups
        gameState.groups.forEach(g => {
          const col = g.position.x;
          const row = g.position.y;
          const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
          const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
          const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
          
          const isHovered = hoveredGroupId === g.id;
          const isSelected = selectedGroupId === g.id;
          
          // Draw path ONLY if hovered or selected
          if ((isHovered || isSelected) && g.path && g.path.length > 0) {
            console.log(`Drawing path for group ${g.id}, path length: ${g.path.length}`);
            drawPath(ctx, g.path, g.color, cameraSystem);
          }
          
          // Don't draw if visiting or despawned
          if (g.state === 'visiting' || g.state === 'despawned') return;
          
          const radius = 8 + g.size * 2;

          // People sprite (fallback to circle)
          const peopleSprite = (() => {
            if (g.size <= 1) return peopleSpriteRef.current;
            if (g.size <= 5) return smallGroupSpriteRef.current;
            return bigGroupSpriteRef.current;
          })();

          if (spritesReady && peopleSprite) {
            const spriteState = getPeopleSpriteState(g.facingDirection);
            const stateInfo = peopleSprite.manifest.states[spriteState] ?? peopleSprite.manifest.states.look_down;
            const framesPerState = stateInfo?.frames ?? 2;

            const anim = groupAnimRef.current.get(g.id) ?? {
              frameIndex: 0,
              lastFrameTime: 0,
            };
            const animSpeed = peopleSprite.manifest.animationSpeed ?? 300;
            if (now - anim.lastFrameTime > animSpeed) {
              anim.frameIndex = (anim.frameIndex + 1) % framesPerState;
              anim.lastFrameTime = now;
              groupAnimRef.current.set(g.id, anim);
            }

            const variants = peopleSprite.manifest.variants ?? [];
            const variantIndex = variants.length
              ? stableStringHash(g.id + String(g.type ?? '')) % variants.length
              : 0;
            const variantCol = variants[variantIndex]?.column ?? 0;

            const frameW = peopleSprite.manifest.frameWidth;
            const frameH = peopleSprite.manifest.frameHeight;

            const sx = (variantCol * framesPerState + anim.frameIndex) * frameW;
            const sy = (stateInfo?.row ?? 0) * frameH;

            const zoom = cameraSystem.getState().zoom;
            const dw = frameW * zoom;
            const dh = frameH * zoom;
            const ax = peopleSprite.manifest.anchorX ?? 0.5;
            const ay = peopleSprite.manifest.anchorY ?? 0.9;

            ctx.drawImage(
              peopleSprite.image,
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
    hoveredEstablishmentId,
    selectedEstablishmentId,
    gridManager,
    buildModeEnabled,
    onSelectionTileChange,
    terrainMap,
  ]);

  // Mouse interaction handlers - now handled by InputHandler
  const handleElementClick = (x: number, y: number) => {
    if (!gameState) return;

    // Check if click is over any establishment
    if (onEstablishmentClick) {
      for (const est of gameState.establishments) {
        if (!est.gridPosition) continue;
        const row = est.gridPosition.y;
        const col = est.gridPosition.x;
        const { worldX, worldY } = cameraSystem.tileToWorld(row, col);
        const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

        const zoom = cameraSystem.getState().zoom;
        const scaledW = CANVAS_CONFIG.TILE_WIDTH * zoom;
        const scaledH = CANVAS_CONFIG.TILE_HEIGHT * zoom;

        const dx = x - screenX;
        const dy = y - (screenY + scaledH / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Establishments are drawn as a tile-diamond; approximate with circle radius
        const radius = Math.max(scaledW, scaledH) * 0.5;
        if (distance <= radius) {
          onEstablishmentClick(est.id);
          return;
        }
      }
    }

    // Check if click is over any group
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
    if (!onGroupHover && !onEstablishmentHover) return;

    let hoveredEstablishment: string | null = null;
    if (onEstablishmentHover) {
      for (const est of gameState.establishments) {
        if (!est.gridPosition) continue;
        const row = est.gridPosition.y;
        const col = est.gridPosition.x;
        const { worldX, worldY } = cameraSystem.tileToWorld(row, col);
        const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

        const zoom = cameraSystem.getState().zoom;
        const scaledW = CANVAS_CONFIG.TILE_WIDTH * zoom;
        const scaledH = CANVAS_CONFIG.TILE_HEIGHT * zoom;

        const dx = x - screenX;
        const dy = y - (screenY + scaledH / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        const radius = Math.max(scaledW, scaledH) * 0.5;
        if (distance <= radius) {
          hoveredEstablishment = est.id;
          break;
        }
      }

      onEstablishmentHover(hoveredEstablishment);
    }

    if (!onGroupHover) return;

    let hoveredGroup: string | null = null;
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

  useEffect(() => {
    // Set up InputHandler callbacks for element interaction
    if (inputHandlerRef.current) {
      inputHandlerRef.current.setOnElementClick(handleElementClick);
      inputHandlerRef.current.setOnElementHover(handleElementHover);
    }
  }, [handleElementClick, handleElementHover]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: 'block',
          cursor: hoveredGroupId || hoveredEstablishmentId ? 'pointer' : 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
