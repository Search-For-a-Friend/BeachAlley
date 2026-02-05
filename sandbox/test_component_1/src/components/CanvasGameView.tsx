import React, { useEffect, useRef, useState } from 'react';
import { GameState } from '../types';
import { CanvasRenderer } from '../rendering/CanvasRenderer';

interface CanvasGameViewProps {
  gameState: GameState;
  width: number;
  height: number;
  showGrid?: boolean;
}

export const CanvasGameView: React.FC<CanvasGameViewProps> = ({
  gameState,
  width,
  height,
  showGrid = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const renderer = new CanvasRenderer({
      showGrid,
      showDebugInfo: false,
      backgroundColor: 0x1a1a2e,
    });

    // Async initialization
    renderer.initialize(containerRef.current, width, height).then(() => {
      if (mounted) {
        rendererRef.current = renderer;
        setIsInitialized(true);
      }
    }).catch((error) => {
      console.error('Failed to initialize Canvas renderer:', error);
    });

    return () => {
      mounted = false;
      setIsInitialized(false);
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [width, height, showGrid]);

  // Render loop - starts only after initialization
  useEffect(() => {
    if (!isInitialized || !rendererRef.current) return;

    let running = true;

    const animate = (timestamp: number) => {
      if (!running || !rendererRef.current) return;

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      rendererRef.current.render(gameState, deltaTime);

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [gameState, isInitialized]);

  // Handle resize
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
};
