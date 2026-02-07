// Interactive canvas component with drag-to-pan and lazy loading

import React, { useRef, useEffect, useState } from 'react';
import { CameraSystem } from '../systems/CameraSystem';
import { TileLoader } from '../systems/TileLoader';
import { InputHandler } from '../systems/InputHandler';
import { CameraState } from '../types/canvas';
import { TerrainMap } from '../types/environment';
import { CANVAS_CONFIG, MAP_CONFIG } from './config';

/** Find a sand tile to center the view on; prefer one closest to map center. */
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
  width?: number;
  height?: number;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  terrainMap,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSize = { width: width || 800, height: height || 600 };
  const [canvasSize, setCanvasSize] = useState(initialSize);
  const [cameraSystem] = useState<CameraSystem>(() => {
    const zoom = CANVAS_CONFIG.INITIAL_ZOOM;
    const w = initialSize.width;
    const h = initialSize.height;

    const sandTile = findSandTileForCenter(terrainMap);
    const row = sandTile?.row ?? MAP_CONFIG.ROWS / 2;
    const col = sandTile?.col ?? MAP_CONFIG.COLS / 2;

    const worldX = (col - row) * (CANVAS_CONFIG.TILE_WIDTH / 2);
    const worldY = (col + row) * (CANVAS_CONFIG.TILE_HEIGHT / 2);

    const initialCamera: CameraState = {
      worldX: worldX - w / (2 * zoom),
      worldY: worldY - h / (2 * zoom),
      zoom,
    };
    return new CameraSystem(initialCamera, w, h);
  });
  const [tileLoader] = useState<TileLoader>(() => new TileLoader(cameraSystem, terrainMap));
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setCanvasSize({ width: w, height: h });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Initialize input handler
  useEffect(() => {
    if (!canvasRef.current) return;

    const inputHandler = new InputHandler(canvasRef.current);
    inputHandler.setOnDrag((deltaX, deltaY) => {
      cameraSystem.move(deltaX, deltaY);
    });
    inputHandlerRef.current = inputHandler;

    return () => {
      inputHandler.destroy();
    };
  }, [cameraSystem]);

  // Update tile loader and render loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initial tile load
    tileLoader.update(canvasSize.width, canvasSize.height);

    const render = () => {
      // Update tile loader
      tileLoader.update(canvasSize.width, canvasSize.height);

      // Clear canvas
      ctx.fillStyle = '#87CEEB'; // Sky blue background
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      // Render tiles
      const tiles = tileLoader.getLoadedTiles();
      tiles.forEach(tile => {
        const { worldX, worldY } = cameraSystem.tileToWorld(tile.row, tile.col);
        const { screenX, screenY } = cameraSystem.worldToScreen(worldX, worldY);

        // Get tile color based on terrain type
        let color: string;
        switch (tile.terrainType) {
          case 'sand':
            color = '#F4E4C1';
            break;
          case 'water':
            color = '#4A90E2';
            break;
          case 'grass':
            color = '#7EC850';
            break;
          default:
            color = '#CCCCCC';
        }

        // Draw isometric tile
        const { TILE_WIDTH, TILE_HEIGHT } = CANVAS_CONFIG;
        const zoom = cameraSystem.getState().zoom;
        const scaledWidth = TILE_WIDTH * zoom;
        const scaledHeight = TILE_HEIGHT * zoom;

        ctx.fillStyle = color;
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + scaledWidth / 2, screenY + scaledHeight / 2);
        ctx.lineTo(screenX, screenY + scaledHeight);
        ctx.lineTo(screenX - scaledWidth / 2, screenY + scaledHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraSystem, tileLoader, canvasSize]);

  // Update camera system when canvas size changes
  useEffect(() => {
    cameraSystem.updateCanvasSize(canvasSize.width, canvasSize.height);
  }, [cameraSystem, canvasSize]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          display: 'block',
          cursor: 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
};
