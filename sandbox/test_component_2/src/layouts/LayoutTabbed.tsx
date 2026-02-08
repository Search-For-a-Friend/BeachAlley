import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { TerrainMap } from '../types/environment';
import { GameState } from '../types';
import { InteractiveCanvas } from '../canvas/InteractiveCanvas';

type Tab = 'game' | 'build' | 'manage';

interface LayoutTabbedProps {
  onBack: () => void;
  onChangeLayout?: () => void;
  animationsEnabled?: boolean;
  onToggleAnimations?: () => void;
  terrainMap: TerrainMap;
  gameState?: GameState | null;
}

const TabButton: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({
  icon,
  label,
  active,
  onClick,
}) => (
  <button
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      padding: '10px 8px',
      background: active ? 'rgba(0, 255, 255, 0.15)' : 'transparent',
      border: 'none',
      borderTop: active ? '3px solid #00ffff' : '3px solid transparent',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: 600,
    }}
    onClick={onClick}
  >
    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
    <span>{label}</span>
  </button>
);

export const LayoutTabbed: React.FC<LayoutTabbedProps> = ({
  onBack,
  terrainMap,
  gameState,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('game');

  return (
    <div style={styles.container}>
      <TopBar onBack={onBack} onSettings={() => {}} />
      <div style={styles.gameView}>
        <InteractiveCanvas terrainMap={terrainMap} gameState={gameState} />
      </div>
      <div style={styles.tabBar}>
        <TabButton icon="🎮" label="Game" active={activeTab === 'game'} onClick={() => setActiveTab('game')} />
        <TabButton icon="🏗️" label="Build" active={activeTab === 'build'} onClick={() => setActiveTab('build')} />
        <TabButton icon="📊" label="Manage" active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '-webkit-fill-available',
    width: '100%',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    overflow: 'hidden',
  },
  gameView: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },
  tabBar: {
    display: 'flex',
    flexDirection: 'row',
    background: 'rgba(26, 26, 46, 0.98)',
    borderTop: '2px solid rgba(0, 255, 255, 0.2)',
    flexShrink: 0,
  },
};
