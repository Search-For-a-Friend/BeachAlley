import React, { useState } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';
import { TerrainMap } from '../types/environment';

interface GameScreenProps {
  onBackToMenu: () => void;
  terrainMap: TerrainMap;
  environmentName: string;
}

type LayoutType = 'tabbed';

export const GameScreen: React.FC<GameScreenProps> = ({ 
  onBackToMenu,
  terrainMap,
  environmentName 
}) => {
  const [currentLayout] = useState<LayoutType>('tabbed');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const renderLayout = () => {
    const commonProps = {
      onBack: onBackToMenu,
      onChangeLayout: () => console.log('Change layout'),
      animationsEnabled,
      onToggleAnimations: () => setAnimationsEnabled(!animationsEnabled),
      terrainMap,
    };

    return <LayoutTabbed {...commonProps} />;
  };

  return <div style={styles.container}>{renderLayout()}</div>;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
};

export default GameScreen;
