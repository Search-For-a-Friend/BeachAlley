import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { InteractiveCanvas } from '../canvas/InteractiveCanvas';
import { TerrainMap } from '../types/environment';

interface LayoutTabbedProps {
  onBack: () => void;
  onChangeLayout: () => void;
  animationsEnabled?: boolean;
  onToggleAnimations?: () => void;
  terrainMap: TerrainMap;
}

type Tab = 'game' | 'build' | 'manage';
type DrawerType = 'settings' | null;

export const LayoutTabbed: React.FC<LayoutTabbedProps> = ({ 
  onBack, 
  onChangeLayout, 
  animationsEnabled = true,
  onToggleAnimations,
  terrainMap,
}) => {
  const [activeTab, setActiveTab] = useState<Tab | null>('game');
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
  const [isActionBarVisible, setIsActionBarVisible] = useState(true);
  const [displayedTab, setDisplayedTab] = useState<Tab | null>('game');
  const [previousTab, setPreviousTab] = useState<Tab | null>(null);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);

  const tabOrder: Tab[] = ['game', 'build', 'manage'];
  
  const getTabIndex = (tab: Tab | null): number => {
    if (!tab) return -1;
    return tabOrder.indexOf(tab);
  };

  const handleTabChange = (tab: Tab) => {
    if (activeTab === tab) {
      setActiveTab(null);
      setOpenDrawer(null);
    } else {
      const currentIndex = getTabIndex(activeTab);
      const newIndex = getTabIndex(tab);
      
      if (activeTab && currentIndex !== -1 && newIndex !== -1) {
        setPreviousTab(activeTab);
        setTransitionDirection(newIndex > currentIndex ? 'right' : 'left');
        
        setTimeout(() => {
          setDisplayedTab(tab);
          setTimeout(() => {
            setPreviousTab(null);
            setTransitionDirection(null);
          }, 300);
        }, 10);
      } else {
        setDisplayedTab(tab);
      }
      
      setActiveTab(tab);
      setOpenDrawer(null);
    }
  };

  const toggleDrawer = (drawer: DrawerType) => {
    setOpenDrawer(openDrawer === drawer ? null : drawer);
  };

  React.useEffect(() => {
    const shouldBeVisible = activeTab !== null;
    setIsActionBarVisible(shouldBeVisible);
    
    if (shouldBeVisible && activeTab) {
      setDisplayedTab(activeTab);
    }
  }, [activeTab]);

  const renderTabContent = (tab: Tab) => {
    switch (tab) {
      case 'game':
        return (
          <>
            <button style={styles.card} onClick={() => console.log('Save')}>
              <span style={styles.cardIcon}>💾</span>
            </button>
            <button style={styles.card} onClick={() => console.log('Pause')}>
              <span style={styles.cardIcon}>⏸️</span>
            </button>
            <button style={styles.card} onClick={() => console.log('Speed x2')}>
              <span style={styles.cardIcon}>⏩</span>
            </button>
            <button style={styles.card} onClick={() => console.log('Speed x4')}>
              <span style={styles.cardIcon}>⏭️</span>
            </button>
          </>
        );
      case 'build':
        return (
          <>
            <button style={styles.card}>
              <span style={styles.cardIcon}>🏖️</span>
              <span style={styles.cardPrice}>$500</span>
            </button>
            <button style={styles.card}>
              <span style={styles.cardIcon}>☂️</span>
              <span style={styles.cardPrice}>$100</span>
            </button>
            <button style={styles.card}>
              <span style={styles.cardIcon}>🏠</span>
              <span style={styles.cardPrice}>$2000</span>
            </button>
          </>
        );
      case 'manage':
        return (
          <>
            <button style={styles.card} onClick={() => toggleDrawer('settings')}>
              <span style={styles.cardIcon}>📊</span>
            </button>
            <button style={styles.card}>
              <span style={styles.cardIcon}>💰</span>
            </button>
            <button style={styles.card}>
              <span style={styles.cardIcon}>💼</span>
            </button>
          </>
        );
      default:
        return null;
    }
  };

  const renderDrawer = () => {
    if (!openDrawer) return null;

    return (
      <div style={{
        ...styles.drawerOverlay,
        animation: animationsEnabled ? 'slideUpDrawer 0.3s ease-out' : 'none',
      }}>
        <div style={styles.drawer}>
          <div style={styles.drawerHeader}>
            <div style={styles.drawerTitle}>
              <span style={styles.drawerIcon}>⚙️</span>
              <span>Settings</span>
            </div>
            <button style={styles.drawerClose} onClick={() => setOpenDrawer(null)}>
              ✕
            </button>
          </div>
          <div style={styles.drawerBody}>
            <div style={styles.drawerContent}>
              <button style={styles.settingButton} onClick={onChangeLayout}>
                🎨 Change Layout
              </button>
              <div style={styles.settingToggle}>
                <span>🎬 Animations</span>
                <button 
                  style={{
                    ...styles.toggleButton,
                    background: animationsEnabled ? '#00ffff' : 'rgba(255, 255, 255, 0.2)',
                  }}
                  onClick={onToggleAnimations}
                >
                  {animationsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      
      <TopBar onBack={onBack} onSettings={() => toggleDrawer('settings')} />
      
      <div style={styles.gameView}>
        <InteractiveCanvas terrainMap={terrainMap} />
      </div>

      {renderDrawer()}

      {previousTab && transitionDirection && animationsEnabled && (
        <div style={{
          ...styles.actionBarOverlay,
          animation: 'slideOutTo' + (transitionDirection === 'right' ? 'Left' : 'Right') + ' 0.3s ease-out',
          pointerEvents: 'none',
        }}>
          {renderTabContent(previousTab)}
        </div>
      )}

      <div style={{
        ...styles.actionBarOverlay,
        transform: isActionBarVisible ? 'translateY(0)' : 'translateY(150%)',
        opacity: isActionBarVisible ? 1 : 0,
        pointerEvents: isActionBarVisible ? 'auto' : 'none',
        animation: (animationsEnabled && transitionDirection)
          ? 'slideInFrom' + (transitionDirection === 'right' ? 'Right' : 'Left') + ' 0.3s ease-out'
          : 'none',
        transition: animationsEnabled ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
      }}>
        {displayedTab && renderTabContent(displayedTab)}
      </div>

      <div style={styles.tabBar}>
        <button 
          style={{...styles.tab, ...(activeTab === 'game' ? styles.tabActive : {})}}
          onClick={() => handleTabChange('game')}
        >
          {activeTab === 'game' && <div style={styles.tabIndicator} />}
          <span style={styles.tabIcon}>🎮</span>
          <span style={styles.tabLabel}>Game</span>
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'build' ? styles.tabActive : {})}}
          onClick={() => handleTabChange('build')}
        >
          {activeTab === 'build' && <div style={styles.tabIndicator} />}
          <span style={styles.tabIcon}>🏗️</span>
          <span style={styles.tabLabel}>Build</span>
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'manage' ? styles.tabActive : {})}}
          onClick={() => handleTabChange('manage')}
        >
          {activeTab === 'manage' && <div style={styles.tabIndicator} />}
          <span style={styles.tabIcon}>📈</span>
          <span style={styles.tabLabel}>Manage</span>
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

  @keyframes slideUpDrawer {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }

  @keyframes slideOutToRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  gameView: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  drawerOverlay: {
    position: 'absolute',
    bottom: '140px',
    left: 0,
    right: 0,
    top: '60px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 12,
    pointerEvents: 'auto',
  },
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(26, 26, 46, 0.98)',
    backdropFilter: 'blur(10px)',
    borderTop: '2px solid rgba(0, 255, 255, 0.3)',
    maxHeight: '100%',
    overflow: 'hidden',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
    flexShrink: 0,
  },
  drawerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#00ffff',
  },
  drawerIcon: {
    fontSize: '1.3rem',
  },
  drawerClose: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 0, 128, 0.2)',
    border: '2px solid rgba(255, 0, 128, 0.5)',
    borderRadius: '50%',
    color: '#FF0080',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px 20px',
    minHeight: 0,
  },
  drawerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  settingButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    background: 'rgba(0, 255, 255, 0.1)',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  settingToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
  },
  toggleButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#000',
  },
  actionBarOverlay: {
    position: 'absolute',
    bottom: '60px',
    left: 0,
    right: 0,
    display: 'flex',
    gap: '12px',
    padding: '15px',
    overflowX: 'auto',
    background: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '2px solid rgba(0, 255, 255, 0.3)',
    zIndex: 13,
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '85px',
    width: '85px',
    height: '85px',
    padding: '12px',
    background: 'rgba(26, 26, 46, 0.95)',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flexShrink: 0,
    color: '#fff',
  },
  cardIcon: {
    fontSize: '2.5rem',
  },
  cardPrice: {
    fontSize: '0.75rem',
    color: '#FFD93D',
    fontWeight: 'bold',
  },
  tabBar: {
    display: 'flex',
    background: 'rgba(26, 26, 46, 0.95)',
    borderTop: '2px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
    zIndex: 14,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 10px 12px 10px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s ease',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabActive: {
    color: '#00ffff',
  },
  tabIcon: {
    fontSize: '1.5rem',
    transition: 'transform 0.3s ease',
  },
  tabLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: '3px',
    background: 'linear-gradient(90deg, #FF0080, #00ffff)',
    backgroundSize: '200% 100%',
    borderRadius: '0 0 3px 3px',
    animation: 'gradientShift 3s ease infinite',
  },
};
