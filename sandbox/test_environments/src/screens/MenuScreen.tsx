// Main menu screen with New Game option

import React from 'react';

interface MenuScreenProps {
  onNewGame: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onNewGame }) => {
  return (
    <div style={styles.container}>
      <style>{keyframes}</style>

      <div style={styles.content}>
        <h1 style={styles.title}>Beach Alley</h1>
        <p style={styles.subtitle}>Build Your Dream Resort</p>

        <div style={styles.buttonContainer}>
          <button style={styles.button} onClick={onNewGame}>
            <span style={styles.buttonIcon}>🏖️</span>
            <span style={styles.buttonText}>New Game</span>
          </button>

          <button style={styles.buttonDisabled} disabled>
            <span style={styles.buttonIcon}>💾</span>
            <span style={styles.buttonText}>Load Game</span>
          </button>

          <button style={styles.buttonDisabled} disabled>
            <span style={styles.buttonIcon}>⚙️</span>
            <span style={styles.buttonText}>Settings</span>
          </button>
        </div>
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

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
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
    padding: '20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: 'clamp(2.5rem, 10vw, 4rem)',
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
    fontSize: 'clamp(1rem, 4vw, 1.3rem)',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '-20px 0 0 0',
    textAlign: 'center',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '18px 24px',
    background: 'linear-gradient(90deg, #FF0080, #00ffff)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(0, 255, 255, 0.4)',
  },
  buttonDisabled: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '18px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: '12px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'not-allowed',
  },
  buttonIcon: {
    fontSize: '1.5rem',
  },
  buttonText: {
    fontSize: '1.1rem',
  },
};
