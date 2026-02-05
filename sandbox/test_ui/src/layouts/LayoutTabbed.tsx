import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { GameCanvasPlaceholder } from '../components/GameCanvasPlaceholder';

interface LayoutTabbedProps {
  onBack: () => void;
  onChangeLayout: () => void;
  animationsEnabled?: boolean;
  onToggleAnimations?: () => void;
}

type Tab = 'game' | 'build' | 'manage';
type DrawerType = 'statistics' | 'finance' | 'staff' | 'groups' | 'settings' | 'credits' | null;

interface BuildingInfo {
  icon: string;
  name: string;
  price: string;
}

export const LayoutTabbed: React.FC<LayoutTabbedProps> = ({ 
  onBack, 
  onChangeLayout, 
  animationsEnabled = true,
  onToggleAnimations 
}) => {
  const [activeTab, setActiveTab] = useState<Tab | null>('game');
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
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
    // Toggle: if clicking the same tab, close it
    if (activeTab === tab) {
      setActiveTab(null);
      setOpenDrawer(null);
      setSelectedBuilding(null);
    } else {
      // Determine transition direction
      const currentIndex = getTabIndex(activeTab);
      const newIndex = getTabIndex(tab);
      
      if (activeTab && currentIndex !== -1 && newIndex !== -1) {
        setPreviousTab(activeTab);
        setTransitionDirection(newIndex > currentIndex ? 'right' : 'left');
        
        // Update displayed tab after a brief moment for animation
        setTimeout(() => {
          setDisplayedTab(tab);
          // Clear transition after animation completes
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
      setSelectedBuilding(null);
    }
  };

  const toggleDrawer = (drawer: DrawerType) => {
    setOpenDrawer(openDrawer === drawer ? null : drawer);
  };

  const handleBuildingSelect = (building: BuildingInfo) => {
    if (selectedBuilding?.name === building.name) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(building);
    }
  };

  // Update action bar visibility based on both activeTab and selectedBuilding
  React.useEffect(() => {
    const shouldBeVisible = activeTab !== null && !selectedBuilding;
    setIsActionBarVisible(shouldBeVisible);
    
    // Keep the displayed tab content visible during hide animation
    if (shouldBeVisible && activeTab) {
      setDisplayedTab(activeTab);
    }
    // Don't update displayedTab when hiding - keep showing last tab during animation
  }, [activeTab, selectedBuilding]);

  const buildings: BuildingInfo[] = [
    { icon: '🍹', name: 'Beach Bar', price: '$500' },
    { icon: '🏖️', name: 'Sun Lounger', price: '$100' },
    { icon: '🍽️', name: 'Restaurant', price: '$1,000' },
    { icon: '🛍️', name: 'Shop', price: '$750' },
    { icon: '🚻', name: 'Toilet', price: '$200' },
    { icon: '🚿', name: 'Shower', price: '$150' },
    { icon: '⛱️', name: 'Parasol', price: '$50' },
    { icon: '🚤', name: 'Jet Ski', price: '$2,000' },
  ];

  const renderTabContent = (tab: Tab) => {
    switch (tab) {
      case 'game':
        return (
          <div style={styles.actionScroll}>
            <Card icon="💾" />
            <Card icon="⏸️" />
            <Card icon="⏩" />
            <Card icon="⏭️" />
          </div>
        );
      case 'build':
        return (
          <div style={styles.actionScroll}>
            {buildings.map((building) => (
              <Card
                key={building.name}
                icon={building.icon}
                price={building.price}
                active={selectedBuilding?.name === building.name}
                onClick={() => handleBuildingSelect(building)}
              />
            ))}
          </div>
        );
      case 'manage':
        return (
          <div style={styles.actionScroll}>
            <Card 
              icon="📊" 
              active={openDrawer === 'statistics'}
              onClick={() => toggleDrawer('statistics')} 
            />
            <Card 
              icon="💰" 
              active={openDrawer === 'finance'}
              onClick={() => toggleDrawer('finance')} 
            />
            <Card 
              icon="💼" 
              active={openDrawer === 'staff'}
              onClick={() => toggleDrawer('staff')} 
            />
            <Card 
              icon="👥" 
              active={openDrawer === 'groups'}
              onClick={() => toggleDrawer('groups')} 
            />
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <TopBar onBack={onBack} onSettings={() => setOpenDrawer('settings')} />

      {/* Game View (never rescaled, full space) */}
      <div style={styles.gameView}>
        <GameCanvasPlaceholder label="Beach Alley" />
        
        {/* Contextual Column (for selected building) */}
        {selectedBuilding && (
          <div style={{
            ...styles.contextualColumn,
            animation: animationsEnabled ? 'slideInRight 0.3s ease-out' : 'none',
          }}>
            {/* Establishment Reminder Icon (not a button, just display) */}
            <div style={styles.reminderIconContainer}>
              <div style={styles.reminderIcon}>
                <span style={styles.reminderIconEmoji}>{selectedBuilding.icon}</span>
              </div>
              {/* Close button (overlaps top-right of icon) */}
              <button style={styles.contextualCloseButton} onClick={() => setSelectedBuilding(null)}>
                ✕
              </button>
            </div>
            
            {/* Action Buttons */}
            <div style={styles.contextualBody}>
              <button style={styles.contextualButton}>🏗️</button>
              <button style={styles.contextualButton}>🔄</button>
              <button style={styles.contextualButton}>🎨</button>
            </div>
          </div>
        )}
        
        {/* Action Bar Overlay - Previous tab sliding out */}
        {previousTab && transitionDirection && animationsEnabled && (
          <div style={{
            ...styles.actionBarOverlay,
            animation: 'slideOutTo' + (transitionDirection === 'right' ? 'Left' : 'Right') + ' 0.3s ease-out',
            pointerEvents: 'none',
          }}>
            {renderTabContent(previousTab)}
          </div>
        )}
        
        {/* Action Bar Overlay - Current/new tab sliding in */}
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
        
        {/* Drawer Overlay (appears above action bar) */}
        {openDrawer && (
          <div style={{
            ...styles.drawerOverlay,
            animation: animationsEnabled ? 'slideUpDrawer 0.3s ease-out' : 'none',
          }}>
            <DrawerContent 
              type={openDrawer} 
              onClose={() => setOpenDrawer(null)}
              animationsEnabled={animationsEnabled}
              onToggleAnimations={onToggleAnimations}
              onChangeLayout={onChangeLayout}
              toggleDrawer={toggleDrawer}
            />
          </div>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <div style={styles.tabBar}>
        <TabButton
          icon="🎮"
          label="Game"
          active={activeTab === 'game'}
          onClick={() => handleTabChange('game')}
        />
        <TabButton
          icon="🏗️"
          label="Build"
          active={activeTab === 'build'}
          onClick={() => handleTabChange('build')}
        />
        <TabButton
          icon="📊"
          label="Manage"
          active={activeTab === 'manage'}
          onClick={() => handleTabChange('manage')}
        />
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUpBar {
          from {
            transform: translateY(150%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDownBar {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(150%);
            opacity: 0;
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

        @keyframes slideInRight {
          from {
            transform: translateX(100%) translateY(-50%);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(-50%);
            opacity: 1;
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Hide scrollbars but keep functionality */
        *::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    style={{
      ...styles.tab,
      ...(active ? styles.tabActive : {}),
    }}
    onClick={onClick}
  >
    <span style={styles.tabIcon}>{icon}</span>
    <span style={styles.tabLabel}>{label}</span>
    {active && <div style={styles.tabIndicator} />}
  </button>
);

// Unified Card Component (used for all tabs)
const Card: React.FC<{ 
  icon: string; 
  price?: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ icon, price, active, onClick }) => (
  <button
    style={{
      ...styles.card,
      ...(active ? styles.cardActive : {}),
    }}
    onClick={onClick}
  >
    <div style={styles.cardIcon}>{icon}</div>
    {price && <div style={styles.cardPrice}>{price}</div>}
  </button>
);

// Drawer Content Component
const DrawerContent: React.FC<{ 
  type: DrawerType; 
  onClose: () => void;
  animationsEnabled?: boolean;
  onToggleAnimations?: () => void;
  onChangeLayout?: () => void;
  toggleDrawer?: (drawer: DrawerType) => void;
}> = ({ type, onClose, animationsEnabled = true, onToggleAnimations, onChangeLayout, toggleDrawer }) => {
  const getContent = () => {
    switch (type) {
      case 'statistics':
        return {
          icon: '📊',
          title: 'Statistics',
          content: (
            <div style={styles.drawerGrid}>
              <StatCard label="Total Revenue" value="$12,450" icon="💰" trend="+15%" />
              <StatCard label="Visitors Today" value="456" icon="👥" trend="+8%" />
              <StatCard label="Satisfaction" value="89%" icon="⭐" trend="+3%" />
              <StatCard label="Buildings" value="12" icon="🏗️" trend="+2" />
              <StatCard label="Staff" value="8" icon="👔" trend="0" />
              <StatCard label="Expenses" value="$3,200" icon="💸" trend="-5%" />
            </div>
          ),
        };
      case 'finance':
        return {
          icon: '💰',
          title: 'Finance',
          content: (
            <div style={styles.drawerContent}>
              <FinanceItem label="Cash on Hand" value="$5,230" positive />
              <FinanceItem label="Daily Income" value="$1,240" positive />
              <FinanceItem label="Daily Expenses" value="$320" />
              <FinanceItem label="Net Profit" value="$920" positive />
              <div style={styles.divider} />
              <FinanceItem label="Loan Balance" value="$10,000" />
              <FinanceItem label="Interest Rate" value="5.2%" />
            </div>
          ),
        };
      case 'staff':
        return {
          icon: '💼',
          title: 'Staff Management',
          content: (
            <div style={styles.drawerContent}>
              <StaffMember name="John Doe" role="Bartender" salary="$800" />
              <StaffMember name="Jane Smith" role="Lifeguard" salary="$600" />
              <StaffMember name="Bob Wilson" role="Cleaner" salary="$400" />
              <button style={styles.hireButton}>+ Hire New Staff</button>
            </div>
          ),
        };
      case 'groups':
        return {
          icon: '👥',
          title: 'Group Management',
          content: (
            <div style={styles.drawerContent}>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Active Groups</span>
                <span style={styles.financeValue}>12</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Total Visitors</span>
                <span style={styles.financeValue}>45</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Avg. Group Size</span>
                <span style={styles.financeValue}>3.8</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Satisfaction</span>
                <span style={{ ...styles.financeValue, color: '#22c55e' }}>89%</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Time on Beach</span>
                <span style={styles.financeValue}>2.5h</span>
              </div>
            </div>
          ),
        };
      case 'settings':
        return {
          icon: '⚙️',
          title: 'Settings',
          content: (
            <div style={styles.drawerContent}>
              <SettingToggle 
                label="Animations" 
                enabled={animationsEnabled ?? true}
                onToggle={onToggleAnimations}
              />
              <div style={styles.divider} />
              <SettingToggle label="Sound Effects" enabled={false} disabled />
              <SettingToggle label="Music" enabled={false} disabled />
              <SettingToggle label="Notifications" enabled={false} disabled />
              <div style={styles.divider} />
              <button style={styles.settingButton} onClick={onChangeLayout}>
                📐 Change Layout
              </button>
              <button style={styles.settingButton} onClick={() => {
                if (toggleDrawer) {
                  onClose();
                  setTimeout(() => toggleDrawer('credits'), 100);
                }
              }}>
                👥 Credits
              </button>
              <button style={styles.settingButton}>🐛 Report Bug</button>
            </div>
          ),
        };
      case 'credits':
        return {
          icon: '👥',
          title: 'Credits',
          content: (
            <div style={styles.drawerContent}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏖️</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00ffff', marginBottom: '5px' }}>
                  Beach Alley
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  Version 0.1.0 Alpha
                </div>
              </div>
              
              <div style={styles.divider} />
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF0080', marginBottom: '8px' }}>
                  🎮 Game Design & Development
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, paddingLeft: '10px' }}>
                  Your Name Here
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF0080', marginBottom: '8px' }}>
                  🎨 UI/UX Design
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, paddingLeft: '10px' }}>
                  Claude (Anthropic AI)
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF0080', marginBottom: '8px' }}>
                  🎵 Audio & Assets
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, paddingLeft: '10px' }}>
                  To Be Announced
                </div>
              </div>
              
              <div style={styles.divider} />
              
              <div style={{ fontSize: '0.75rem', textAlign: 'center', opacity: 0.6, marginTop: '15px' }}>
                Built with React, TypeScript & ❤️
              </div>
              <div style={{ fontSize: '0.75rem', textAlign: 'center', opacity: 0.6, marginTop: '5px' }}>
                © 2026 Beach Alley. All rights reserved.
              </div>
            </div>
          ),
        };
      default:
        return { icon: '', title: '', content: null };
    }
  };

  const { icon, title, content } = getContent();

  return (
    <>
      <div style={styles.drawerHeader}>
        <div style={styles.drawerTitle}>
          <span style={styles.drawerIcon}>{icon}</span>
          <span>{title}</span>
        </div>
        <button style={styles.drawerClose} onClick={onClose}>
          ✕
        </button>
      </div>
      <div style={styles.drawerBody}>{content}</div>
    </>
  );
};

// Helper Components for Drawer Content
const StatCard: React.FC<{ label: string; value: string; icon: string; trend: string }> = ({
  label,
  value,
  icon,
  trend,
}) => (
  <div style={styles.statCard}>
    <div style={styles.statCardIcon}>{icon}</div>
    <div style={styles.statCardValue}>{value}</div>
    <div style={styles.statCardLabel}>{label}</div>
    <div style={{ ...styles.statCardTrend, color: trend.includes('+') ? '#22c55e' : '#aaa' }}>
      {trend}
    </div>
  </div>
);

const FinanceItem: React.FC<{ label: string; value: string; positive?: boolean }> = ({
  label,
  value,
  positive,
}) => (
  <div style={styles.financeItem}>
    <span style={styles.financeLabel}>{label}</span>
    <span style={{ ...styles.financeValue, color: positive ? '#22c55e' : '#fff' }}>{value}</span>
  </div>
);

const StaffMember: React.FC<{ name: string; role: string; salary: string }> = ({ name, role, salary }) => (
  <div style={styles.staffMember}>
    <div style={styles.staffAvatar}>👤</div>
    <div style={styles.staffInfo}>
      <div style={styles.staffName}>{name}</div>
      <div style={styles.staffRole}>{role}</div>
    </div>
    <div style={styles.staffSalary}>{salary}/day</div>
  </div>
);

const SettingToggle: React.FC<{ 
  label: string; 
  enabled?: boolean; 
  onToggle?: () => void;
  disabled?: boolean;
}> = ({ 
  label, 
  enabled: controlledEnabled, 
  onToggle,
  disabled = false
}) => {
  const [internalEnabled, setInternalEnabled] = React.useState(true);
  const enabled = controlledEnabled !== undefined ? controlledEnabled : internalEnabled;
  
  const handleToggle = () => {
    if (disabled) return;
    if (onToggle) {
      onToggle();
    } else {
      setInternalEnabled(!internalEnabled);
    }
  };
  
  return (
    <div style={{
      ...styles.settingToggle,
      opacity: disabled ? 0.5 : 1,
    }}>
      <span style={styles.settingLabel}>{label}</span>
      <button
        style={{
          ...styles.toggle,
          background: enabled ? 'linear-gradient(135deg, #FF0080, #00ffff)' : 'rgba(255,255,255,0.2)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={handleToggle}
        disabled={disabled}
      >
        <div
          style={{
            ...styles.toggleKnob,
            transform: enabled ? 'translateX(24px)' : 'translateX(2px)',
          }}
        />
      </button>
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
  gameView: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 0,
  },
  actionBarOverlay: {
    position: 'absolute',
    bottom: '15px',
    left: '15px',
    right: '15px',
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '15px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    padding: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    zIndex: 13,
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    overflow: 'hidden',
  },
  tabContentContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  tabContent: {
    width: '100%',
    height: '100%',
  },
  tabContentAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionScroll: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  drawerOverlay: {
    position: 'absolute',
    bottom: '130px',
    left: '15px',
    right: '15px',
    height: '55%',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: '15px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 -4px 30px rgba(0, 255, 255, 0.3)',
    zIndex: 12,
  },
  contextualColumn: {
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
    zIndex: 11,
  },
  reminderIconContainer: {
    position: 'relative',
    width: '80px',
    height: '80px',
  },
  reminderIcon: {
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
  },
  contextualCloseButton: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 0, 128, 0.2)',
    border: '2px solid rgba(255, 0, 128, 0.6)',
    borderRadius: '50%',
    color: '#FF0080',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 10,
  },
  reminderIconEmoji: {
    fontSize: '3rem',
  },
  reminderIconRotate: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    fontSize: '1rem',
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0, 255, 255, 0.3)',
  },
  contextualHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '2px solid rgba(255, 107, 157, 0.3)',
    gap: '8px',
  },
  contextualTitle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  contextualIcon: {
    fontSize: '3rem',
  },
  contextualName: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  contextualPrice: {
    fontSize: '0.9rem',
    color: '#FFD93D',
    fontWeight: 'bold',
  },
  contextualClose: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 0, 128, 0.2)',
    border: '2px solid rgba(255, 0, 128, 0.5)',
    borderRadius: '50%',
    color: '#FF0080',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  contextualBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  contextualButton: {
    width: '80px',
    height: '80px',
    background: 'rgba(26, 26, 46, 0.95)',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '2rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardActive: {
    background: 'rgba(0, 255, 255, 0.2)',
    border: '2px solid #00ffff',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
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
  drawerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  drawerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '15px',
    background: 'rgba(0, 255, 255, 0.1)',
    borderRadius: '12px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
  },
  statCardIcon: {
    fontSize: '1.8rem',
  },
  statCardValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#00ffff',
  },
  statCardLabel: {
    fontSize: '0.7rem',
    opacity: 0.8,
    textAlign: 'center',
  },
  statCardTrend: {
    fontSize: '0.65rem',
    fontWeight: 'bold',
  },
  financeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  financeLabel: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  financeValue: {
    fontSize: '0.95rem',
    fontWeight: 'bold',
  },
  staffMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  staffAvatar: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 255, 255, 0.2)',
    borderRadius: '50%',
    fontSize: '1.3rem',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  staffRole: {
    fontSize: '0.7rem',
    opacity: 0.7,
  },
  staffSalary: {
    fontSize: '0.75rem',
    color: '#FFD93D',
    fontWeight: 'bold',
  },
  hireButton: {
    padding: '12px',
    background: 'linear-gradient(135deg, #FF0080, #00ffff)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  settingToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
  },
  settingLabel: {
    fontSize: '0.85rem',
    color: '#fff',
  },
  toggle: {
    position: 'relative',
    width: '50px',
    height: '26px',
    borderRadius: '13px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  toggleKnob: {
    width: '22px',
    height: '22px',
    background: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  settingButton: {
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  divider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '6px 0',
  },
};

export default LayoutTabbed;
