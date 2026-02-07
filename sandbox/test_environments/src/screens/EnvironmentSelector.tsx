// Environment Selector screen - choose environment before starting game

import React, { useState } from 'react';
import { EnvironmentType } from '../types/environment';
import { ENVIRONMENTS } from '../data/environments';
import { TopBar } from '../components/TopBar';

interface EnvironmentSelectorProps {
  onSelectEnvironment: (type: EnvironmentType) => void;
  onBack: () => void;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  onSelectEnvironment,
  onBack,
}) => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentType | null>(null);

  const handleSelect = (type: EnvironmentType) => {
    setSelectedEnvironment(type);
  };

  const handleStart = () => {
    if (selectedEnvironment) {
      onSelectEnvironment(selectedEnvironment);
    }
  };

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>

      <TopBar
        title="Choose Your Paradise"
        onBack={onBack}
        showStats={false}
      />

      <div style={styles.contentWrapper}>
        <div style={styles.contentBlock}>
          <p style={styles.subtitle}>Select an environment to begin your beach resort adventure</p>

          <div style={styles.grid}>
            {ENVIRONMENTS.map((env) => (
              <button
                key={env.type}
                style={{
                  ...styles.card,
                  ...(selectedEnvironment === env.type ? styles.cardSelected : {}),
                }}
                onClick={() => handleSelect(env.type)}
              >
                <div style={styles.cardIcon}>{env.icon}</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardName}>{env.name}</div>
                  <div style={styles.cardDescription}>{env.description}</div>
                </div>
                {selectedEnvironment === env.type && (
                  <div style={styles.checkmark}>✓</div>
                )}
              </button>
            ))}
          </div>

        </div>
      </div>
      <button
        style={{
          ...styles.startButton,
          ...(selectedEnvironment ? styles.startButtonEnabled : styles.startButtonDisabled),
        }}
        onClick={handleStart}
        disabled={!selectedEnvironment}
      >
        Start Game
      </button>
    </div>
  );
};

const keyframes = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxHeight: '-webkit-fill-available',
    width: '100vw',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
  },
  contentWrapper: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
  },
  contentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 'clamp(0.7rem, 2.5vw, 0.85rem)',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: 0,
    textAlign: 'center',
    flexShrink: 0,
    lineHeight: 1.3,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '2px',
    maxHeight: '55vh',
    WebkitOverflowScrolling: 'touch',
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    background: 'rgba(26, 26, 46, 0.8)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
  },
  cardSelected: {
    background: 'rgba(0, 255, 255, 0.15)',
    border: '2px solid #00ffff',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
  },
  cardIcon: {
    fontSize: 'clamp(2rem, 8vw, 2.5rem)',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  cardName: {
    fontSize: 'clamp(0.9rem, 3.5vw, 1rem)',
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: '1.2',
  },
  checkmark: {
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#00ffff',
    color: '#1a1a2e',
    borderRadius: '50%',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  startButton: {
    margin: '12px',
    padding: '12px',
    fontSize: 'clamp(0.95rem, 3.5vw, 1rem)',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    minHeight: '44px',
    touchAction: 'manipulation',
  },
  startButtonEnabled: {
    background: 'linear-gradient(135deg, #FF6B35, #FF0080)',
    color: '#fff',
    boxShadow: '0 4px 15px rgba(255, 0, 128, 0.4)',
  },
  startButtonDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
    cursor: 'not-allowed',
  },
};
