import React, { useState } from 'react';
import { LayoutTabbed } from '../layouts/LayoutTabbed';
import { TerrainMap } from '../types/environment';

interface GameScreenProps {
  onBackToMenu: () => void;
  terrainMap: TerrainMap;
  environmentName: string;
}

type LayoutType = 'tabbed' | 'compact' | 'expanded' | 'minimal';

export const GameScreen: React.FC<GameScreenProps> = ({ 
  onBackToMenu,
  terrainMap,
  environmentName 
}) => {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('tabbed');
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const renderLayout = () => {
    const commonProps = {
      onBack: onBackToMenu,
      onChangeLayout: () => setShowLayoutSelector(true),
      animationsEnabled,
      onToggleAnimations: () => setAnimationsEnabled(!animationsEnabled),
      terrainMap,
    };

    switch (currentLayout) {
      case 'tabbed':
        return <LayoutTabbed {...commonProps} />;
      case 'compact':
        return <div style={styles.placeholder}>Compact Layout (Coming Soon)</div>;
      case 'expanded':
        return <div style={styles.placeholder}>Expanded Layout (Coming Soon)</div>;
      case 'minimal':
        return <div style={styles.placeholder}>Minimal Layout (Coming Soon)</div>;
      default:
        return <LayoutTabbed {...commonProps} />;
    }
  };

  return (
    <div style={styles.container}>
      {renderLayout()}
      
      {showLayoutSelector && (
        <div style={styles.overlay} onClick={() => setShowLayoutSelector(false)}>
          <div style={styles.selector} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.selectorTitle}>Choose Layout</h3>
            <div style={styles.layoutGrid}>
              <button
                style={{
                  ...styles.layoutOption,
                  ...(currentLayout === 'tabbed' ? styles.layoutOptionActive : {}),
                }}
                onClick={() => {
                  setCurrentLayout('tabbed');
                  setShowLayoutSelector(false);
                }}
              >
                <div style={styles.layoutPreview}>📑</div>
                <span style={styles.layoutName}>Tabbed</span>
                <span style={styles.layoutDesc}>Primary layout</span>
              </button>
              
              <button
                style={{
                  ...styles.layoutOption,
                  ...(currentLayout === 'compact' ? styles.layoutOptionActive : {}),
                }}
                onClick={() => {
                  setCurrentLayout('compact');
                  setShowLayoutSelector(false);
                }}
              >
                <div style={styles.layoutPreview}>📱</div>
                <span style={styles.layoutName}>Compact</span>
                <span style={styles.layoutDesc}>Floating panels</span>
              </button>
              
              <button
                style={{
                  ...styles.layoutOption,
                  ...(currentLayout === 'expanded' ? styles.layoutOptionActive : {}),
                }}
                onClick={() => {
                  setCurrentLayout('expanded');
                  setShowLayoutSelector(false);
                }}
              >
                <div style={styles.layoutPreview}>📋</div>
                <span style={styles.layoutName}>Expanded</span>
                <span style={styles.layoutDesc}>Fullscreen panels</span>
              </button>
              
              <button
                style={{
                  ...styles.layoutOption,
                  ...(currentLayout === 'minimal' ? styles.layoutOptionActive : {}),
                }}
                onClick={() => {
                  setCurrentLayout('minimal');
                  setShowLayoutSelector(false);
                }}
              >
                <div style={styles.layoutPreview}>🎮</div>
                <span style={styles.layoutName}>Minimal</span>
                <span style={styles.layoutDesc}>Game-focused</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.3s ease-out',
  },
  selector: {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: '20px',
    padding: '25px',
    maxWidth: '500px',
    width: '100%',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
  },
  selectorTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.3rem',
    textAlign: 'center',
    color: '#00ffff',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
  },
  layoutOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px 15px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#fff',
  },
  layoutOptionActive: {
    background: 'rgba(0, 255, 255, 0.15)',
    border: '2px solid #00ffff',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
  },
  layoutPreview: {
    fontSize: '2.5rem',
    marginBottom: '5px',
  },
  layoutName: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  layoutDesc: {
    fontSize: '0.75rem',
    opacity: 0.7,
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '1.5rem',
    color: '#00ffff',
    opacity: 0.7,
  },
};

export default GameScreen;
