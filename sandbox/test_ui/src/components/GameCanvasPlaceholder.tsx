import React from 'react';

interface GameCanvasPlaceholderProps {
  label?: string;
}

export const GameCanvasPlaceholder: React.FC<GameCanvasPlaceholderProps> = ({
  label = 'Game Canvas',
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {[...Array(5)].map((_, row) =>
          [...Array(5)].map((_, col) => (
            <div
              key={`${row}-${col}`}
              style={{
                ...styles.tile,
                background: (row + col) % 2 === 0 ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 0, 128, 0.1)',
              }}
            />
          ))
        )}
      </div>
      <div style={styles.overlay}>
        <span style={styles.icon}>🏖️</span>
        <span style={styles.label}>{label}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid rgba(255, 107, 157, 0.3)',
  },
  grid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(5, 1fr)',
    transform: 'rotate(45deg) scale(1.5)',
    opacity: 0.3,
  },
  tile: {
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  overlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  icon: {
    fontSize: '3rem',
  },
  label: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#00ffff',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  },
};

export default GameCanvasPlaceholder;
