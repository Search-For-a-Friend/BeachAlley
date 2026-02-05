/**
 * PixiGameView
 * 
 * React component that wraps the Pixi.js isometric renderer
 * Separates rendering concerns from game logic
 */

import React, { useEffect, useRef } from 'react';
import { GameState } from '../types';
import { PixiIsometricRenderer } from '../rendering';

interface PixiGameViewProps {
  gameState: GameState;
  width: number;
  height: number;
  showGrid?: boolean;
}

export const PixiGameView: React.FC<PixiGameViewProps> = ({
  gameState,
  width,
  height,
  showGrid = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PixiIsometricRenderer | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Initialize renderer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const renderer = new PixiIsometricRenderer({
      showGrid,
      showDebugInfo: false,
      backgroundColor: 0x1a1a2e,
    });
    
    // Async initialization
    renderer.initialize(containerRef.current, width, height).then(() => {
      rendererRef.current = renderer;
    }).catch((error) => {
      console.error('Failed to initialize renderer:', error);
    });
    
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [width, height, showGrid]);
  
  // Render loop
  useEffect(() => {
    if (!rendererRef.current) return;
    
    const animate = (timestamp: number) => {
      if (!rendererRef.current) return;
      
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      rendererRef.current.render(gameState, deltaTime);
      
      requestAnimationFrame(animate);
    };
    
    const rafId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [gameState]);
  
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
        border: '2px solid rgba(0, 255, 255, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
      }}
    />
  );
};
