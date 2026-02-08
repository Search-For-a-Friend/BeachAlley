import React from 'react';

interface MainMenuProps {
  onStartGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.logo}>🌴</div>
          <h1 style={styles.title}>Beach Alley</h1>
        </div>
        <div style={styles.menu}>
          <button style={styles.primaryButton} onClick={onStartGame}>
            <span style={styles.buttonIcon}>▶️</span>
            <span>New Game</span>
          </button>
          <button style={styles.secondaryButton} disabled>
            <span style={styles.buttonIcon}>💾</span>
            <span>Continue</span>
          </button>
          <button style={styles.secondaryButton}>
            <span style={styles.buttonIcon}>⚙️</span>
            <span>Settings</span>
          </button>
        </div>
        <div style={styles.footer}>
          <p style={styles.version}>v. Merged Shores</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  content: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 20px 20px',
    zIndex: 1,
  },
  header: { textAlign: 'center', marginBottom: '40px' },
  logo: { fontSize: '60px', marginBottom: '10px' },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: 0,
    background: 'linear-gradient(135deg, #FF6B35, #FF0080, #00FFFF)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  menu: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto', width: '100%' },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    padding: '18px 30px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #FF6B35, #FF0080)',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255, 0, 128, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    padding: '15px 30px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s',
  },
  buttonIcon: { fontSize: '1.2rem' },
  footer: { textAlign: 'center', opacity: 0.5 },
  version: { fontSize: '0.75rem', margin: 0 },
};

export default MainMenu;
