import React, { useState } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';

type LayoutType = 'tabbed';

export interface GameScreenProps {
  onBackToMenu: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onBackToMenu }) => {
  const [currentLayout] = useState<LayoutType>('tabbed');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const renderLayout = () => {
    const commonProps = {
      onBack: onBackToMenu,
      onChangeLayout: () => console.log('Change layout'),
      animationsEnabled,
      onToggleAnimations: () => setAnimationsEnabled(!animationsEnabled),
    };

    return <LayoutTabbed {...commonProps} />;
  };

  return <>{renderLayout()}</>;
};
