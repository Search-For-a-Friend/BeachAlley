// Simple game screen that displays the canvas with terrain

import React from 'react';
import { TopBar } from '../components/TopBar';
import { InteractiveCanvas } from '../canvas/InteractiveCanvas';
import { TerrainMap } from '../types/environment';

interface GameScreenProps {
  terrainMap: TerrainMap;
  environmentName: string;
  onBackToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  terrainMap,
  environmentName,
  onBackToMenu,
}) => {
  return (
    <div style={styles.container}>
      <TopBar onBack={onBackToMenu} title={environmentName} />
      
      <div style={styles.gameView}>
        <InteractiveCanvas terrainMap={terrainMap} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  gameView: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
};
