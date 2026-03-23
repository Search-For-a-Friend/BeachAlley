import React, { useEffect, useRef, useState } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';
import { GameEngine } from '../game/engine';
import { TerrainMap } from '../types/environment';
import { GameState, GameEvent } from '../types';
import { TimeDisplay } from '../components/TimeDisplay';

interface GameScreenProps {
  terrainMap: TerrainMap;
  onBackToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ terrainMap, onBackToMenu }) => {
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [spawnTilePosition, setSpawnTilePosition] = useState<{ x: number; y: number } | null>(null);
  const cameraSystemRef = useRef<any>(null);
  const eventQueueRef = useRef<GameEvent[]>([]);

  // Function to process queued events
  const processEventQueue = () => {
    while (eventQueueRef.current.length > 0) {
      const event = eventQueueRef.current.shift()!;
      if (event.type === 'CENTER_ON_SPAWN' && cameraSystemRef.current) {
        cameraSystemRef.current.centerOnTile(event.tileX, event.tileY);
      }
    }
  };

  useEffect(() => {
    const engine = new GameEngine(
      { canvasWidth: 800, canvasHeight: 600 },
      terrainMap
    );
    engineRef.current = engine;
    setGameState(engine.getState());
    setSpawnTilePosition(engine.getSpawnTile());

    // Set up event listener for center on spawn
    engine.addEventListener((event: GameEvent) => {
      if (event.type === 'CENTER_ON_SPAWN') {
        if (cameraSystemRef.current) {
          cameraSystemRef.current.centerOnTile(event.tileX, event.tileY);
        } else {
          // Queue event for when camera system is ready
          eventQueueRef.current.push(event);
        }
      }
    });

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
      {engineRef.current && (
        <TimeDisplay timeManager={engineRef.current.getTimeManager()} />
      )}
      <LayoutTabbed
        onBack={onBackToMenu}
        onChangeLayout={() => {}}
        terrainMap={terrainMap}
        gameState={gameState}
        gridManager={engineRef.current?.getGridManager()}
        spawnTilePosition={spawnTilePosition}
        groupBehavior={engineRef.current?.getGroupBehavior()}
        individualManager={engineRef.current?.getIndividualManager()}
        onCameraSystemRef={(cameraSystem) => {
          cameraSystemRef.current = cameraSystem;
          // Process any queued events now that camera system is ready
          processEventQueue();
        }}
      />
    </div>
  );
};
