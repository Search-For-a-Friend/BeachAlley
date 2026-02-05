import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { GameCanvasPlaceholder } from '../components/GameCanvasPlaceholder';
import { InfoPanel } from '../components/InfoPanel';
import { ActionButton } from '../components/ActionButton';

interface LayoutCompactProps {
  onBack: () => void;
  onChangeLayout: () => void;
}

export const LayoutCompact: React.FC<LayoutCompactProps> = ({ onBack, onChangeLayout }) => {
  const [showPanel, setShowPanel] = useState<'stats' | 'buildings' | null>(null);

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <TopBar onBack={onBack} />

      {/* Main Game Area */}
      <div style={styles.gameArea}>
        <GameCanvasPlaceholder label="Compact Layout" />
        
        {/* Floating Action Bar */}
        <div style={styles.actionBar}>
          <ActionButton icon="🏗️" label="Build" onClick={() => setShowPanel('buildings')} />
          <ActionButton icon="📊" label="Stats" onClick={() => setShowPanel('stats')} variant="primary" />
          <ActionButton icon="👥" label="Guests" />
          <ActionButton icon="💰" label="Economy" />
        </div>
      </div>

      {/* Bottom Action Panel */}
      <div style={styles.bottomPanel}>
        <ActionButton icon="📐" label="Layout" onClick={onChangeLayout} />
        <ActionButton icon="⏸️" label="Pause" />
        <ActionButton icon="⏩" label="Speed" />
        <ActionButton icon="💾" label="Save" />
      </div>

      {/* Sliding Panel */}
      {showPanel && (
        <>
          <div style={styles.overlay} onClick={() => setShowPanel(null)} />
          <div style={styles.slidingPanel}>
            <InfoPanel
              title={showPanel === 'stats' ? 'Statistics' : 'Buildings'}
              icon={showPanel === 'stats' ? '📊' : '🏗️'}
            />
            <button style={styles.closeButton} onClick={() => setShowPanel(null)}>
              Close
            </button>
          </div>
        </>
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
    background: '#0a0a0f',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 0,
  },
  actionBar: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '15px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  bottomPanel: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '10px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderTop: '2px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    zIndex: 100,
  },
  slidingPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    background: '#1a1a2e',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    zIndex: 101,
    animation: 'slideUp 0.3s ease-out',
  },
  closeButton: {
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default LayoutCompact;
