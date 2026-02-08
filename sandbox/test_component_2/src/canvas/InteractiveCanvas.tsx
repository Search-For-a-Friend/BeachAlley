// Merged canvas: terrain + game state (establishments, groups)

import React, { useRef, useEffect, useState } from 'react';
import { CameraSystem } from '../systems/CameraSystem';
import { TileLoader } from '../systems/TileLoader';
import { InputHandler } from '../systems/InputHandler';
import { CameraState } from '../types/canvas';
import { TerrainMap } from '../types/environment';
import { GameState } from '../types';
import { CANVAS_CONFIG } from './config';

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
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  terrainMap,
  gameState,
  width,
  height,
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

      if (gameState) {
        gameState.establishments.forEach(est => {
          if (!est.gridPosition) return;
          const row = est.gridPosition.y;
          const col = est.gridPosition.x;
          const { worldX, worldY } = cameraSystem.tileToWorld(row, col);
          const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
          ctx.fillStyle = '#8B7355';
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX + scaledW / 2, screenY + scaledH / 2);
          ctx.lineTo(screenX, screenY + scaledH);
          ctx.lineTo(screenX - scaledW / 2, screenY + scaledH / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        gameState.groups.forEach(g => {
          const col = g.position.x;
          const row = g.position.y;
          const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
          const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
          const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);
          ctx.fillStyle = g.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY + scaledH / 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cameraSystem, tileLoader, canvasSize, gameState]);

  useEffect(() => {
    cameraSystem.updateCanvasSize(canvasSize.width, canvasSize.height);
  }, [cameraSystem, canvasSize]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ display: 'block', cursor: 'grab', touchAction: 'none' }}
      />
    </div>
  );
};
