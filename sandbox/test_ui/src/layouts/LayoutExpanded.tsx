import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { GameCanvasPlaceholder } from '../components/GameCanvasPlaceholder';
import { InfoPanel } from '../components/InfoPanel';

interface LayoutExpandedProps {
  onBack: () => void;
  onChangeLayout: () => void;
}

type View = 'game' | 'stats' | 'build' | 'manage';

export const LayoutExpanded: React.FC<LayoutExpandedProps> = ({ onBack, onChangeLayout }) => {
  const [currentView, setCurrentView] = useState<View>('game');

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <TopBar onBack={onBack} />

      {/* Main Content Area - Full Screen Panels */}
      <div style={styles.content}>
        {currentView === 'game' && (
          <div style={styles.fullPanel}>
            <GameCanvasPlaceholder label="Expanded Layout - Game View" />
          </div>
        )}

        {currentView === 'stats' && (
          <div style={styles.fullPanel}>
            <InfoPanel title="Statistics & Analytics" icon="📊">
              <div style={styles.statGrid}>
                <StatCard label="Revenue" value="$1,234" icon="💰" />
                <StatCard label="Visitors" value="456" icon="👥" />
                <StatCard label="Satisfaction" value="89%" icon="⭐" />
                <StatCard label="Buildings" value="12" icon="🏗️" />
              </div>
            </InfoPanel>
          </div>
        )}

        {currentView === 'build' && (
          <div style={styles.fullPanel}>
            <InfoPanel title="Building Menu" icon="🏗️">
              <div style={styles.buildGrid}>
                <BuildCard name="Beach Bar" cost="$500" icon="🍹" />
                <BuildCard name="Sun Lounger" cost="$100" icon="🏖️" />
                <BuildCard name="Restaurant" cost="$1000" icon="🍽️" />
                <BuildCard name="Shop" cost="$750" icon="🛍️" />
              </div>
            </InfoPanel>
          </div>
        )}

        {currentView === 'manage' && (
          <div style={styles.fullPanel}>
            <InfoPanel title="Management" icon="⚙️" />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <NavButton
          icon="🎮"
          label="Game"
          active={currentView === 'game'}
          onClick={() => setCurrentView('game')}
        />
        <NavButton
          icon="📊"
          label="Stats"
          active={currentView === 'stats'}
          onClick={() => setCurrentView('stats')}
        />
        <NavButton
          icon="🏗️"
          label="Build"
          active={currentView === 'build'}
          onClick={() => setCurrentView('build')}
        />
        <NavButton
          icon="⚙️"
          label="Manage"
          active={currentView === 'manage'}
          onClick={() => setCurrentView('manage')}
        />
        <NavButton icon="📐" label="Layout" onClick={onChangeLayout} />
      </div>
    </div>
  );
};

const NavButton: React.FC<{
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    style={{
      ...styles.navButton,
      ...(active ? styles.navButtonActive : {}),
    }}
    onClick={onClick}
  >
    <span style={styles.navIcon}>{icon}</span>
    <span style={styles.navLabel}>{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div style={styles.statCard}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={styles.statValue}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

const BuildCard: React.FC<{ name: string; cost: string; icon: string }> = ({ name, cost, icon }) => (
  <div style={styles.buildCard}>
    <div style={styles.buildIcon}>{icon}</div>
    <div style={styles.buildName}>{name}</div>
    <div style={styles.buildCost}>{cost}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0a0a0f',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  fullPanel: {
    width: '100%',
    height: '100%',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  bottomNav: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderTop: '2px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  navButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  navButtonActive: {
    background: 'rgba(0, 255, 255, 0.15)',
    color: '#00ffff',
  },
  navIcon: {
    fontSize: '1.3rem',
  },
  navLabel: {
    fontSize: '0.65rem',
    fontWeight: '600',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    background: 'rgba(0, 255, 255, 0.1)',
    borderRadius: '12px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
  },
  statIcon: {
    fontSize: '2rem',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#00ffff',
  },
  statLabel: {
    fontSize: '0.8rem',
    opacity: 0.8,
  },
  buildGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  buildCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '15px',
    background: 'rgba(255, 107, 157, 0.1)',
    borderRadius: '12px',
    border: '2px solid rgba(255, 107, 157, 0.3)',
    cursor: 'pointer',
  },
  buildIcon: {
    fontSize: '2.5rem',
  },
  buildName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  buildCost: {
    fontSize: '0.8rem',
    color: '#FFD93D',
  },
};

export default LayoutExpanded;
