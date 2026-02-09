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

  const handleTryBuild = (row: number, col: number, building: { icon: string; name: string; price: string }, rotation: number) => {
    const engine = engineRef.current;
    if (!engine) return false;
    const ok = engine.tryBuildEstablishment(row, col, building, rotation);
    setGameState(engine.getState());
    return ok;
  };

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
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        maxHeight: '-webkit-fill-available',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <LayoutTabbed
        onBack={onBackToMenu}
        onChangeLayout={() => {}}
        terrainMap={terrainMap}
        gameState={gameState}
        gridManager={engineRef.current?.getGridManager()}
        onTryBuild={handleTryBuild}
      />
    </div>
  );
};

export default GameScreen;
