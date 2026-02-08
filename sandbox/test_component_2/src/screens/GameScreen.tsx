import React, { useState, useEffect, useRef } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';
import { TerrainMap } from '../types/environment';
import { GameEngine } from '../game/engine';
import { GameState } from '../types';

interface GameScreenProps {
  onBackToMenu: () => void;
  terrainMap: TerrainMap;
  environmentName: string;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  onBackToMenu,
  terrainMap,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const engine = new GameEngine(
      { canvasWidth: 800, canvasHeight: 600 },
      terrainMap
    );
    engineRef.current = engine;
    setGameState(engine.getState());

    let lastTime = performance.now();
    let rafId: number;

    const loop = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      lastTime = now;
      engine.update(deltaTime);
      setGameState(engine.getState());
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      engineRef.current = null;
    };
  }, [terrainMap]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <LayoutTabbed
        onBack={onBackToMenu}
        terrainMap={terrainMap}
        gameState={gameState}
      />
    </div>
  );
};

export default GameScreen;
