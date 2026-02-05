import React, { useState } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { MainMenu } from './screens/MainMenu';
import { GameScreen } from './screens/GameScreen';

type Screen = 'splash' | 'menu' | 'game';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');

  const handleSplashComplete = () => {
    setCurrentScreen('menu');
  };

  const handleStartGame = () => {
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  return (
    <div style={styles.app}>
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      {currentScreen === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}
      {currentScreen === 'game' && (
        <GameScreen onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
};

export default App;
