// Interactive canvas component with drag-to-pan and lazy loading

import React, { useRef, useEffect, useState } from 'react';
import { CameraSystem } from '../systems/CameraSystem';
import { TileLoader } from '../systems/TileLoader';
import { InputHandler } from '../systems/InputHandler';
import { CameraState } from '../types/canvas';
import { CANVAS_CONFIG, MAP_CONFIG, DEBUG_CONFIG } from './config';

export interface InteractiveCanvasProps {
  width?: number;
  height?: number;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: width || 800, height: height || 600 });
  const [cameraSystem] = useState<CameraSystem>(() => {
    // Start at bottom-left corner of the map (tile ROWS-1, 0)
    // Calculate world position for tile (ROWS-1, 0)
    const bottomLeftRow = MAP_CONFIG.ROWS - 1;
    const bottomLeftCol = 0;
    const worldX = (bottomLeftCol - bottomLeftRow) * (CANVAS_CONFIG.TILE_WIDTH / 2);
    const worldY = (bottomLeftCol + bottomLeftRow) * (CANVAS_CONFIG.TILE_HEIGHT / 2);
    
    const initialCamera: CameraState = {
      worldX: worldX - 100,  // Small offset for better framing
      worldY: worldY - 200,
      zoom: CANVAS_CONFIG.INITIAL_ZOOM,
    };
    return new CameraSystem(initialCamera, canvasSize.width, canvasSize.height);
  });
  const [tileLoader] = useState<TileLoader>(() => new TileLoader(cameraSystem));
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
        const { worldX, worldY } = cameraSystem.tileToWorld(tile.coord.row, tile.coord.col);
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
          case 'path':
            color = '#A0826D';
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

        // Debug: show tile coordinates
        if (DEBUG_CONFIG.SHOW_TILE_COORDINATES) {
          ctx.fillStyle = '#000000';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${tile.coord.row},${tile.coord.col}`, screenX, screenY + scaledHeight / 2);
        }
      });

      // Debug: show camera position and loaded tile count
      if (DEBUG_CONFIG.SHOW_CAMERA_POSITION) {
        const camera = cameraSystem.getState();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 280, 60);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Camera: (${camera.worldX.toFixed(1)}, ${camera.worldY.toFixed(1)})`, 20, 30);
        ctx.fillText(`Zoom: ${camera.zoom.toFixed(2)}`, 20, 50);
        ctx.fillText(`Loaded tiles: ${tileLoader.getLoadedTileCount()}`, 20, 70);
      }

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
