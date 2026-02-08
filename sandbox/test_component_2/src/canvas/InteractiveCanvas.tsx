// Merged canvas: terrain + game state (establishments, groups)

import React, { useRef, useEffect, useState } from 'react';
import { CameraSystem } from '../systems/CameraSystem';
import { TileLoader } from '../systems/TileLoader';
import { InputHandler } from '../systems/InputHandler';
import { CameraState } from '../types/canvas';
import { TerrainMap } from '../types/environment';
import { GameState, Establishment } from '../types';
import { CANVAS_CONFIG } from './config';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSize = { width: width || 800, height: height || 600 };
  const [canvasSize, setCanvasSize] = useState(initialSize);
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

        const { worldX, worldY } = cameraSystem.tileToWorld(clampedRow, clampedCol);
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
          const { worldX, worldY } = cameraSystem.tileToWorld(row, col);
          const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

          const isHovered = hoveredEstablishmentId === est.id;
          const isSelected = selectedEstablishmentId === est.id;
          
          // Draw establishment building
          ctx.fillStyle = '#8B7355';
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
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
          ctx.lineTo(screenX, screenY + scaledH);
          ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Add glow effect for selected/hovered
          if (isSelected || isHovered) {
            ctx.save();
            ctx.shadowColor = isSelected ? '#00ffff' : '#ff0080';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
            ctx.lineTo(screenX, screenY + scaledH);
            ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
          }
          
          // Draw guest count on top
          drawOccupancyBar(ctx, est, screenX, screenY - scaledH / 2 - 10);
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
          
          // Main circle
          ctx.fillStyle = g.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY + scaledH / 2, radius, 0, Math.PI * 2);
          ctx.fill();
          
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
