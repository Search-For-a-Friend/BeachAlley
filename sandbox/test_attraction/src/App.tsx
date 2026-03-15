import { useState } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { MainMenu } from './screens/MainMenu';
import { EnvironmentSelector } from './screens/EnvironmentSelector';
import { GameScreen } from './screens/GameScreen';
import { EnvironmentType, TerrainMap } from './types/environment';
import { EnvironmentGenerator } from './systems/EnvironmentGenerator';
import { MAP_CONFIG } from './canvas/config';
import Logger from './utils/Logger';

type Screen = 'splash' | 'menu' | 'environmentSelection' | 'game';

function App() {
  // Initialize logging system
  Logger.setEnvironment('development');
  Logger.info('SYS', 'Application starting');
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [terrainMap, setTerrainMap] = useState<TerrainMap | null>(null);
  
  const handleSplashComplete = () => {
    Logger.info('UI', 'Splash screen completed, navigating to menu');
    setCurrentScreen('menu');
  };
  
  const handleStartGame = () => {
    Logger.info('UI', 'Starting game, navigating to environment selection');
    setCurrentScreen('environmentSelection');
  };

  const handleSelectEnvironment = (type: EnvironmentType) => {
    const generator = new EnvironmentGenerator(MAP_CONFIG.ROWS, MAP_CONFIG.COLS, Date.now());
    const generatedTerrain = generator.generate(type);
    setTerrainMap(generatedTerrain);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setTerrainMap(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {currentScreen === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {currentScreen === 'menu' && <MainMenu onStartGame={handleStartGame} />}
      {currentScreen === 'environmentSelection' && (
        <EnvironmentSelector onSelectEnvironment={handleSelectEnvironment} onBack={handleBackToMenu} />
      )}
      {currentScreen === 'game' && terrainMap && (
        <GameScreen
          onBackToMenu={handleBackToMenu}
          terrainMap={terrainMap}
        />
      )}
    </div>
  );
}

export default App;
