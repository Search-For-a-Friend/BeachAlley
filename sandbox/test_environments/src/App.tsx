import React, { useState } from 'react';
import { EnvironmentSelector } from './screens/EnvironmentSelector';
import { GameScreen } from './screens/GameScreen';
import { EnvironmentType, TerrainMap } from './types/environment';
import { EnvironmentGenerator } from './systems/EnvironmentGenerator';
import { MAP_CONFIG } from './canvas/config';
import { ENVIRONMENTS } from './data/environments';

type GameState = 'menu' | 'game';

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [terrainMap, setTerrainMap] = useState<TerrainMap | null>(null);
  const [selectedEnvironmentName, setSelectedEnvironmentName] = useState<string>('');

  const handleSelectEnvironment = (type: EnvironmentType) => {
    console.log(`[App] Generating environment: ${type}`);
    
    // Generate terrain for selected environment
    const generator = new EnvironmentGenerator(MAP_CONFIG.ROWS, MAP_CONFIG.COLS);
    const generatedTerrain = generator.generate(type);
    
    console.log(`[App] Generated ${generatedTerrain.tiles.size} tiles`);
    
    // Get environment name
    const env = ENVIRONMENTS.find(e => e.type === type);
    const envName = env ? env.name : 'Beach Alley';
    
    setTerrainMap(generatedTerrain);
    setSelectedEnvironmentName(envName);
    setGameState('game');
  };

  const handleBackToMenu = () => {
    setGameState('menu');
    setTerrainMap(null);
    setSelectedEnvironmentName('');
  };

  if (gameState === 'menu') {
    return <EnvironmentSelector onSelectEnvironment={handleSelectEnvironment} />;
  }

  if (gameState === 'game' && terrainMap) {
    return (
      <GameScreen
        terrainMap={terrainMap}
        environmentName={selectedEnvironmentName}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return null;
}

export default App;
