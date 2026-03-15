import React, { useEffect, useRef, useState } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';
import { GameEngine } from '../game/engine';
import { TerrainMap } from '../types/environment';
import { GameState } from '../types';

interface GameScreenProps {
  terrainMap: TerrainMap;
  onBackToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ terrainMap, onBackToMenu }) => {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [spawnTilePosition, setSpawnTilePosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const engine = new GameEngine(
      { canvasWidth: 800, canvasHeight: 600 },
      terrainMap
    );
    engineRef.current = engine;
    setGameState(engine.getState());
    setSpawnTilePosition(engine.getSpawnTile());

    let lastTime = performance.now();
    let rafId: number;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      engine.update(deltaTime);
      setGameState(engine.getState());

      rafId = requestAnimationFrame(gameLoop);
    };

    rafId = requestAnimationFrame(gameLoop);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      engine.destroy();
    };
  }, [terrainMap]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <LayoutTabbed
        onBack={onBackToMenu}
        onChangeLayout={() => {}}
        terrainMap={terrainMap}
        gameState={gameState}
        gridManager={engineRef.current?.getGridManager()}
        spawnTilePosition={spawnTilePosition}
      />
    </div>
  );
};
