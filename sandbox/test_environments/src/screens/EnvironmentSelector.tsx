// Environment Selector screen - choose environment before starting game

import React, { useState } from 'react';
import { EnvironmentType } from '../types/environment';
import { ENVIRONMENTS } from '../data/environments';

interface EnvironmentSelectorProps {
  onSelectEnvironment: (type: EnvironmentType) => void;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  onSelectEnvironment,
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

      <div style={styles.content}>
        <h1 style={styles.title}>Choose Your Paradise 🌅</h1>
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
              onMouseEnter={(e) => {
                if (selectedEnvironment !== env.type) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedEnvironment !== env.type) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                }
              }}
            >
              <div style={styles.cardIcon}>{env.icon}</div>
              <div style={styles.cardName}>{env.name}</div>
              <div style={styles.cardDescription}>{env.description}</div>
              {selectedEnvironment === env.type && (
                <div style={styles.checkmark}>✓</div>
              )}
            </button>
          ))}
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
    </div>
  );
};

const keyframes = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
    50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.8); }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    backgroundSize: '200% 200%',
    animation: 'gradientShift 10s ease infinite',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'auto',
    padding: '20px',
  },
  content: {
    maxWidth: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '30px',
  },
  title: {
    fontSize: 'clamp(2rem, 8vw, 3rem)',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(90deg, #FF0080, #00ffff, #FF0080)',
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 3s ease infinite',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 'clamp(1rem, 4vw, 1.2rem)',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: 0,
    textAlign: 'center',
    padding: '0 20px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '500px',
    padding: '0 10px',
  },
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    background: 'rgba(26, 26, 46, 0.8)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '140px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  cardSelected: {
    background: 'rgba(0, 255, 255, 0.15)',
    border: '3px solid #00ffff',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
    transform: 'scale(1.05)',
  },
  cardIcon: {
    fontSize: '3rem',
    marginBottom: '4px',
  },
  cardName: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  checkmark: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#00ffff',
    color: '#1a1a2e',
    borderRadius: '50%',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    animation: 'pulse 1s ease infinite',
  },
  startButton: {
    padding: '14px 40px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    width: '100%',
    maxWidth: '300px',
  },
  startButtonEnabled: {
    background: 'linear-gradient(90deg, #FF0080, #00ffff)',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(0, 255, 255, 0.4)',
  },
  startButtonDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
    cursor: 'not-allowed',
  },
};
