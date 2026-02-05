import React, { useState } from 'react';
import { GameCanvasPlaceholder } from '../components/GameCanvasPlaceholder';
import { ActionButton } from '../components/ActionButton';

interface LayoutMinimalProps {
  onBack: () => void;
  onChangeLayout: () => void;
}

export const LayoutMinimal: React.FC<LayoutMinimalProps> = ({ onBack, onChangeLayout }) => {
  const [showUI, setShowUI] = useState(true);

  return (
    <div style={styles.container}>
      {/* Minimal Top Bar */}
      {showUI && (
        <div style={styles.topBar}>
          <button style={styles.iconButton} onClick={onBack}>
            ◀️
          </button>
          <div style={styles.quickStats}>
            <span>💰 1,234</span>
            <span>👥 456</span>
          </div>
          <button style={styles.iconButton} onClick={() => setShowUI(false)}>
            👁️
          </button>
        </div>
      )}

      {/* Full Screen Game Area */}
      <div style={styles.gameArea}>
        <GameCanvasPlaceholder label="Minimal Layout - Game Focused" />
        
        {/* Floating Quick Actions */}
        {showUI && (
          <div style={styles.floatingActions}>
            <div style={styles.actionCircle}>
              <ActionButton icon="🏗️" label="" variant="primary" />
            </div>
          </div>
        )}

        {/* Toggle UI Button */}
        {!showUI && (
          <button style={styles.toggleButton} onClick={() => setShowUI(true)}>
            👁️
          </button>
        )}
      </div>

      {/* Minimal Bottom Controls */}
      {showUI && (
        <div style={styles.bottomBar}>
          <button style={styles.toolButton}>⏸️</button>
          <button style={styles.toolButton}>⏩</button>
          <button style={styles.toolButton} onClick={onChangeLayout}>
            📐
          </button>
          <button style={styles.toolButton}>💾</button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#000',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
  },
  iconButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  quickStats: {
    display: 'flex',
    gap: '15px',
    fontSize: '0.85rem',
    color: '#fff',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 0,
  },
  floatingActions: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
  },
  actionCircle: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(255, 0, 128, 0.5)',
  },
  toggleButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    fontSize: '1.2rem',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
  },
  toolButton: {
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    fontSize: '1.3rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default LayoutMinimal;
