import React, { useState } from 'react';
import { GameScreen } from './screens/GameScreen';

function App() {
  const [showGame, setShowGame] = useState(true);

  if (!showGame) {
    return (
      <div style={styles.menu}>
        <h1 style={styles.title}>Beach Alley</h1>
        <button style={styles.menuButton} onClick={() => setShowGame(true)}>
          Start Game
        </button>
      </div>
    );
  }

  return <GameScreen onBackToMenu={() => setShowGame(false)} />;
}

const styles: Record<string, React.CSSProperties> = {
  menu: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  title: {
    fontSize: '3rem',
    marginBottom: '2rem',
    color: '#00ffff',
  },
  menuButton: {
    padding: '15px 30px',
    fontSize: '1.2rem',
    background: 'rgba(0, 255, 255, 0.2)',
    border: '2px solid #00ffff',
    borderRadius: '12px',
    color: '#00ffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default App;
