import React, { useState } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { MainMenu } from './screens/MainMenu';
import { EnvironmentSelector } from './screens/EnvironmentSelector';
import { GameScreen } from './screens/GameScreen';
import { EnvironmentType, TerrainMap } from './types/environment';
import { EnvironmentGenerator } from './systems/EnvironmentGenerator';
import { MAP_CONFIG } from './canvas/config';
import { ENVIRONMENTS } from './data/environments';

type Screen = 'splash' | 'menu' | 'environmentSelection' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [terrainMap, setTerrainMap] = useState<TerrainMap | null>(null);
  const [selectedEnvironmentName, setSelectedEnvironmentName] = useState<string>('');

  const handleSplashComplete = () => {
    setCurrentScreen('menu');
  };

  const handleStartGame = () => {
    setCurrentScreen('environmentSelection');
  };

  const handleSelectEnvironment = (type: EnvironmentType) => {
    console.log(`[App] Generating environment: ${type}`);
    
    // Generate terrain with random seed (Date.now() ensures different terrain each time)
    const generator = new EnvironmentGenerator(MAP_CONFIG.ROWS, MAP_CONFIG.COLS, Date.now());
    const generatedTerrain = generator.generate(type);
    
    console.log(`[App] Generated ${generatedTerrain.tiles.size} tiles`);
    
    // Get environment name
    const env = ENVIRONMENTS.find(e => e.type === type);
    const envName = env ? env.name : 'Beach Alley';
    
    setTerrainMap(generatedTerrain);
    setSelectedEnvironmentName(envName);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setTerrainMap(null);
    setSelectedEnvironmentName('');
  };

  return (
    <div style={styles.app}>
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      {currentScreen === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}
      {currentScreen === 'environmentSelection' && (
        <EnvironmentSelector onSelectEnvironment={handleSelectEnvironment} />
      )}
      {currentScreen === 'game' && terrainMap && (
        <GameScreen 
          onBackToMenu={handleBackToMenu} 
          terrainMap={terrainMap}
          environmentName={selectedEnvironmentName}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
};

export default App;
