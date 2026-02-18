import React from 'react';

interface TopBarProps {
  onBack?: () => void;
  onSettings?: () => void;
  title?: string;
  showStats?: boolean;
  money?: number;
  winProgress?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ onBack, onSettings, title = 'Beach Alley', showStats = true, money = 0, winProgress = 0 }) => {
  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMoneyColor = (amount: number): string => {
    if (amount < 0) return '#ef4444'; // Red for negative
    if (amount < 2000) return '#f59e0b'; // Orange for low
    return '#10b981'; // Green for healthy
  };

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={onBack} aria-label="Back">◀️</button>
      <div style={styles.titleSection}>
        <h2 style={styles.title}>{title}</h2>
        {showStats && (
          <div style={styles.stats}>
            <span style={{ ...styles.stat, color: getMoneyColor(money) }}>💰 {formatMoney(money)}</span>
            <span style={{ ...styles.stat, color: winProgress >= 100 ? '#10b981' : winProgress >= 50 ? '#f59e0b' : '#6b7280' }}>
              🎯 {winProgress.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {onSettings != null ? (
        <button style={styles.button} onClick={onSettings} aria-label="Settings">⚙️</button>
      ) : (
        <div style={styles.buttonPlaceholder} />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 15px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  button: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '10px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  titleSection: { flex: 1, textAlign: 'center', padding: '0 15px' },
  title: { margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 'bold', color: '#00ffff' },
  stats: { display: 'flex', justifyContent: 'center', gap: '15px' },
  stat: { fontSize: '0.8rem', color: '#fff' },
  buttonPlaceholder: { width: '40px', height: '40px', flexShrink: 0 },
};

export default TopBar;
