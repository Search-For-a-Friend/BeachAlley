import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { TerrainMap } from '../types/environment';
import { GameState, BUILDING_COSTS } from '../types';
import { InteractiveCanvas } from '../canvas/InteractiveCanvas';
import { GroupDetailsPanel } from '../components/GroupDetailsPanel';
import { EstablishmentDetailsPanel } from '../components/EstablishmentDetailsPanel';
import { getBuildingCapacity } from '../game/engine';

interface LayoutTabbedProps {
  onBack: () => void;
  onChangeLayout: () => void;
  animationsEnabled?: boolean;
  onToggleAnimations?: () => void;
  terrainMap: TerrainMap;
  gameState?: GameState | null;
  gridManager?: any;
  onTryBuild?: (row: number, col: number, building: { icon: string; name: string; price: string }, rotation: number) => boolean;
}

type Tab = 'game' | 'build' | 'manage';
type DrawerType = 'statistics' | 'finance' | 'staff' | 'groups' | 'establishments' | 'settings' | 'credits' | null;

interface BuildingInfo {
  icon: string;
  name: string;
  price: string;
}

// Helper function for formatting money
const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const LayoutTabbed: React.FC<LayoutTabbedProps> = ({ 
  onBack, 
  onChangeLayout, 
  animationsEnabled = true,
  onToggleAnimations,
  terrainMap,
  gameState,
  gridManager,
  onTryBuild
}) => {
  const [activeTab, setActiveTab] = useState<Tab | null>('game');
  const [openDrawer, setOpenDrawer] = useState<DrawerType>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [buildingRotation, setBuildingRotation] = useState(0);
  const [isActionBarVisible, setIsActionBarVisible] = useState(true);
  const [displayedTab, setDisplayedTab] = useState<Tab | null>('game');
  const [previousTab, setPreviousTab] = useState<Tab | null>(null);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isContextualVisible, setIsContextualVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState<DrawerType>(null);
  const [previousDrawer, setPreviousDrawer] = useState<DrawerType>(null);
  const [drawerTransitionDirection, setDrawerTransitionDirection] = useState<'left' | 'right' | null>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  // Group interaction state
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Establishment interaction state
  const [hoveredEstablishmentId, setHoveredEstablishmentId] = useState<string | null>(null);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);

  // Build mode state
  const [selectionTile, setSelectionTile] = useState<{ row: number; col: number } | null>(null);

  const tabOrder: Tab[] = ['game', 'build', 'manage'];
  const drawerOrder: DrawerType[] = ['statistics', 'finance', 'staff', 'groups', 'establishments', 'settings', 'credits'];

  const isActionBarCompact = Boolean(openDrawer || selectedBuilding);
  
  const getTabIndex = (tab: Tab | null): number => {
    if (!tab) return -1;
    return tabOrder.indexOf(tab);
  };

  const getDrawerIndex = (drawer: DrawerType | null): number => {
    if (!drawer) return -1;
    return drawerOrder.indexOf(drawer);
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
    if (openDrawer === drawer) {
      // Closing the current drawer
      setOpenDrawer(null);
    } else {
      // Opening a different drawer - determine transition direction
      const currentIndex = getDrawerIndex(openDrawer);
      const newIndex = getDrawerIndex(drawer);
      
      if (openDrawer && currentIndex !== -1 && newIndex !== -1) {
        setPreviousDrawer(openDrawer);
        setDrawerTransitionDirection(newIndex > currentIndex ? 'right' : 'left');
        
        // Clear transition after animation completes
        setTimeout(() => {
          setPreviousDrawer(null);
          setDrawerTransitionDirection(null);
        }, 300);
      }
      
      setOpenDrawer(drawer);
    }
  };

  const handleBuildingSelect = (building: BuildingInfo) => {
    if (selectedBuilding?.name === building.name) {
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(building);
      setBuildingRotation(0); // Reset rotation when selecting a new building
    }
  };

  // Group interaction handlers
  const handleGroupClick = (groupId: string) => {
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    } else {
      setSelectedGroupId(groupId);
      setOpenDrawer('groups'); // Open groups drawer when group is selected
    }
  };

  const handleGroupHover = (groupId: string | null) => {
    setHoveredGroupId(groupId);
  };

  // Establishment interaction handlers
  const handleEstablishmentClick = (establishmentId: string) => {
    if (selectedEstablishmentId === establishmentId) {
      setSelectedEstablishmentId(null);
    } else {
      setSelectedEstablishmentId(establishmentId);
      setOpenDrawer('establishments');
    }
  };

  const handleEstablishmentHover = (establishmentId: string | null) => {
    setHoveredEstablishmentId(establishmentId);
  };

  const toggleDrawerExpansion = () => {
    setIsDrawerExpanded(!isDrawerExpanded);
  };

  const rotateBuilding = () => {
    setBuildingRotation((prev) => (prev + 1) % 4);
  };

  const handleTryBuild = () => {
    if (!selectedBuilding) return;
    if (!selectionTile) return;
    onTryBuild?.(selectionTile.row, selectionTile.col, selectedBuilding, buildingRotation);
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

  // Update drawer visibility
  React.useEffect(() => {
    if (openDrawer) {
      // Opening: set content immediately, then trigger visibility
      setDrawerContent(openDrawer);
      setIsDrawerVisible(true);
    } else {
      // Closing: hide first, then clear content after animation
      setIsDrawerVisible(false);
      setTimeout(() => {
        setDrawerContent(null);
      }, 300); // Match animation duration
    }
  }, [openDrawer]);

  // Update contextual column visibility
  React.useEffect(() => {
    setIsContextualVisible(!!selectedBuilding);
  }, [selectedBuilding]);

  const buildings: BuildingInfo[] = [
    { icon: '🍹', name: 'Beach Bar', price: `$${BUILDING_COSTS['beach bar'].buildCost}` },
    { icon: '🏖️', name: 'Sun Lounger', price: `$${BUILDING_COSTS['sun lounger'].buildCost}` },
    { icon: '🍽️', name: 'Restaurant', price: `$${BUILDING_COSTS['restaurant'].buildCost}` },
    { icon: '🛍️', name: 'Shop', price: `$${BUILDING_COSTS['shop'].buildCost}` },
    { icon: '🏢', name: 'Mall', price: `$${BUILDING_COSTS['mall'].buildCost}` },
    { icon: '🚻', name: 'Toilet', price: '$200' },
    { icon: '🚿', name: 'Shower', price: '$150' },
    { icon: '⛱️', name: 'Parasol', price: '$50' },
    { icon: '🚤', name: 'Jet Ski', price: '$2,000' },
  ];

  const renderTabContent = (tab: Tab) => {
    switch (tab) {
      case 'game':
        return (
          <div style={{ ...styles.actionScroll, ...(isActionBarCompact ? styles.actionScrollCompact : {}) }}>
            <Card icon="💾" compact={isActionBarCompact} />
            <Card icon="⏸️" compact={isActionBarCompact} />
            <Card icon="⏩" compact={isActionBarCompact} />
          </div>
        );
      case 'build':
        return (
          <div style={{ ...styles.actionScroll, ...(isActionBarCompact ? styles.actionScrollCompact : {}) }}>
            {buildings.map((building) => {
              const buildingCosts = BUILDING_COSTS[building.name.toLowerCase()];
              const canAfford = buildingCosts && gameState ? gameState.money >= buildingCosts.buildCost : false;
              
              return (
                <Card
                  key={building.name}
                  icon={building.icon}
                  price={building.price}
                  active={selectedBuilding?.name === building.name}
                  onClick={() => canAfford ? handleBuildingSelect(building) : undefined}
                  compact={isActionBarCompact}
                  disabled={!canAfford}
                  canAfford={canAfford}
                />
              );
            })}
          </div>
        );
      case 'manage':
        return (
          <div style={{ ...styles.actionScroll, ...(isActionBarCompact ? styles.actionScrollCompact : {}) }}>
            <Card 
              icon="📊" 
              active={openDrawer === 'statistics'}
              onClick={() => toggleDrawer('statistics')}
              compact={isActionBarCompact}
            />
            <Card 
              icon="💰" 
              active={openDrawer === 'finance'}
              onClick={() => toggleDrawer('finance')}
              compact={isActionBarCompact}
            />
            <Card 
              icon="💼" 
              active={openDrawer === 'staff'}
              onClick={() => toggleDrawer('staff')}
              compact={isActionBarCompact}
            />
            <Card 
              icon="👥" 
              active={openDrawer === 'groups'}
              onClick={() => toggleDrawer('groups')}
              compact={isActionBarCompact}
            />
            <Card 
              icon="🏠" 
              active={openDrawer === 'establishments'}
              onClick={() => toggleDrawer('establishments')}
              compact={isActionBarCompact}
            />
            <Card 
              icon="⚙️" 
              active={openDrawer === 'settings'}
              onClick={() => toggleDrawer('settings')}
              compact={isActionBarCompact}
            />
            <Card 
              icon="👥" 
              active={openDrawer === 'credits'}
              onClick={() => toggleDrawer('credits')}
              compact={isActionBarCompact}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <TopBar 
        onBack={onBack} 
        onSettings={() => setOpenDrawer('settings')} 
        money={gameState?.money || 0}
        winProgress={gameState ? Math.max(0, Math.min(100, ((gameState.money + 5000) / 55000) * 100)) : 0}
      />
      
      {/* Game View (never rescaled, full space) */}
      <div style={styles.gameView}>
        <InteractiveCanvas 
          terrainMap={terrainMap} 
          gameState={gameState}
          hoveredGroupId={hoveredGroupId}
          selectedGroupId={selectedGroupId}
          onGroupClick={handleGroupClick}
          onGroupHover={handleGroupHover}
          hoveredEstablishmentId={hoveredEstablishmentId}
          selectedEstablishmentId={selectedEstablishmentId}
          onEstablishmentClick={handleEstablishmentClick}
          onEstablishmentHover={handleEstablishmentHover}
          gridManager={gridManager}
          buildModeEnabled={!!selectedBuilding}
          onSelectionTileChange={setSelectionTile}
          buildingRotation={buildingRotation}
          selectedBuilding={selectedBuilding}
        />
        
        {/* Contextual Column (for selected building) */}
        <div style={{
          ...styles.contextualColumn,
          transform: isContextualVisible ? 'translateX(0) translateY(-50%)' : 'translateX(120%) translateY(-50%)',
          opacity: isContextualVisible ? 1 : 0,
          pointerEvents: isContextualVisible ? 'auto' : 'none',
          transition: animationsEnabled ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
        }}>
          {/* Establishment Reminder Icon (not a button, just display) */}
          <div style={styles.reminderIconContainer}>
            <div style={styles.reminderIcon}>
              <span style={styles.reminderIconEmoji}>{selectedBuilding?.icon}</span>
            </div>
            {/* Close button (overlaps top-right of icon) */}
            <button style={styles.contextualCloseButton} onClick={() => setSelectedBuilding(null)}>
              ✕
            </button>
          </div>
          
          {/* Action Buttons */}
          <div style={styles.contextualBody}>
            <button style={styles.contextualButton} onClick={handleTryBuild}>🏗️</button>
            <button style={styles.contextualButton} onClick={rotateBuilding}>🔄</button>
          </div>
          
          {/* Building Info */}
          <div style={styles.buildingInfo}>
            <div style={styles.buildingInfoRow}>
              <span style={styles.buildingInfoLabel}>Size:</span>
              <span style={styles.buildingInfoValue}>{getBuildingCapacity(selectedBuilding?.name || '')}</span>
            </div>
          </div>
          
          {/* Rotation Info */}
          <div style={styles.rotationInfo}>
            <div style={styles.rotationLabel}>Entrance:</div>
            <div style={styles.rotationIndicator}>
              {['⬆️', '⬅️', '⬇️', '➡️'][buildingRotation]}
            </div>
          </div>
        </div>
        
        {/* Action Bar Overlay - Previous tab sliding out */}
        {previousTab && transitionDirection && animationsEnabled && (
          <div style={{
            ...styles.actionBarOverlay,
            ...(isActionBarCompact ? styles.actionBarOverlayCompact : {}),
            animation: 'slideOutTo' + (transitionDirection === 'right' ? 'Left' : 'Right') + ' 0.3s ease-out',
            pointerEvents: 'none',
          }}>
            {renderTabContent(previousTab)}
          </div>
        )}
        
        {/* Action Bar Overlay - Current/new tab sliding in */}
        <div style={{
          ...styles.actionBarOverlay,
          ...(isActionBarCompact ? styles.actionBarOverlayCompact : {}),
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
        
        {/* Drawer Overlay - Previous drawer sliding out */}
        {previousDrawer && drawerTransitionDirection && animationsEnabled && (
          <div style={{
            ...styles.drawerOverlay,
            top: isDrawerExpanded ? '5px' : '40%',
            animation: 'slideOutTo' + (drawerTransitionDirection === 'right' ? 'Left' : 'Right') + ' 0.3s ease-out',
            pointerEvents: 'none',
          }}>
            <DrawerContent 
              type={previousDrawer} 
              onClose={() => setOpenDrawer(null)}
              animationsEnabled={animationsEnabled}
              onToggleAnimations={onToggleAnimations}
              onChangeLayout={onChangeLayout}
              toggleDrawer={toggleDrawer}
              gameState={gameState}
              selectedGroup={selectedGroupId && gameState ? gameState.groups.find(g => g.id === selectedGroupId) || null : null}
              setSelectedGroupId={setSelectedGroupId}
              selectedEstablishment={selectedEstablishmentId && gameState ? gameState.establishments.find(e => e.id === selectedEstablishmentId) || null : null}
              setSelectedEstablishmentId={setSelectedEstablishmentId}
              isDrawerExpanded={isDrawerExpanded}
              toggleDrawerExpansion={toggleDrawerExpansion}
            />
          </div>
        )}
        
        {/* Drawer Overlay - Current/new drawer sliding in */}
        <div style={{
          ...styles.drawerOverlay,
          top: isDrawerExpanded ? '5px' : '40%',
          transform: isDrawerVisible ? 'translateY(0)' : 'translateY(100%)',
          opacity: isDrawerVisible ? 1 : 0,
          pointerEvents: isDrawerVisible ? 'auto' : 'none',
          animation: (animationsEnabled && drawerTransitionDirection)
            ? 'slideInFrom' + (drawerTransitionDirection === 'right' ? 'Right' : 'Left') + ' 0.3s ease-out'
            : 'none',
          transition: animationsEnabled
            ? 'transform 0.3s ease-out, opacity 0.3s ease-out, top 0.3s ease-out'
            : 'none',
        }}>
          {drawerContent && (
            <DrawerContent 
              type={drawerContent} 
              onClose={() => setOpenDrawer(null)}
              animationsEnabled={animationsEnabled}
              onToggleAnimations={onToggleAnimations}
              onChangeLayout={onChangeLayout}
              toggleDrawer={toggleDrawer}
              gameState={gameState}
              selectedGroup={selectedGroupId && gameState ? gameState.groups.find(g => g.id === selectedGroupId) || null : null}
              setSelectedGroupId={setSelectedGroupId}
              selectedEstablishment={selectedEstablishmentId && gameState ? gameState.establishments.find(e => e.id === selectedEstablishmentId) || null : null}
              setSelectedEstablishmentId={setSelectedEstablishmentId}
              isDrawerExpanded={isDrawerExpanded}
              toggleDrawerExpansion={toggleDrawerExpansion}
            />
          )}
        </div>
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

        @keyframes slideDownDrawer {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
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
  compact?: boolean;
  disabled?: boolean;
  canAfford?: boolean;
}> = ({ icon, price, active, onClick, compact, disabled = false, canAfford = true }) => (
  <button
    style={{
      ...styles.card,
      ...(active ? styles.cardActive : {}),
      ...(compact ? styles.cardCompact : {}),
      ...(disabled ? { 
        opacity: 0.5, 
        cursor: 'not-allowed',
        border: '2px solid rgba(255, 255, 255, 0.1)'
      } : {}),
      ...(canAfford ? {} : {
        border: '2px solid #ef4444',
        boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
      }),
    }}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
  >
    <div style={{ ...styles.cardIcon, ...(compact ? styles.cardIconCompact : {}) }}>{icon}</div>
    {price && (
      <div style={{ 
        ...styles.cardPrice, 
        ...(compact ? styles.cardPriceCompact : {}),
        ...(canAfford ? {} : { color: '#ef4444' })
      }}>
        {price}
      </div>
    )}
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
  gameState?: GameState | null;
  selectedGroup?: any;
  setSelectedGroupId?: (id: string | null) => void;
  selectedEstablishment?: any;
  setSelectedEstablishmentId?: (id: string | null) => void;
  isDrawerExpanded?: boolean;
  toggleDrawerExpansion?: () => void;
}> = ({ type, onClose, animationsEnabled = true, onToggleAnimations, onChangeLayout, toggleDrawer, gameState, selectedGroup, setSelectedGroupId, selectedEstablishment, setSelectedEstablishmentId, isDrawerExpanded, toggleDrawerExpansion }) => {
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
              {gameState && (
                <>
                  <FinanceItem label="Cash on Hand" value={formatMoney(gameState.money)} positive={gameState.money >= 0} />
                  <FinanceItem label="Total Revenue" value={formatMoney(gameState.totalRevenue)} positive={gameState.totalRevenue >= 0} />
                  <FinanceItem label="Total Expenses" value={formatMoney(gameState.totalExpenses)} positive={false} />
                  <div style={styles.divider} />
                  <FinanceItem label="Day" value={gameState.dayCount.toString()} positive={true} />
                  <FinanceItem label="Buildings" value={gameState.establishments.length.toString()} positive={true} />
                  <div style={styles.divider} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF0080', marginBottom: '8px' }}>
                    {gameState.isGameOver ? (gameState.gameWon ? '🎉 VICTORY!' : '💸 GAME OVER') : '🎯 Keep Playing!'}
                  </div>
                  {gameState.isGameOver && (
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '5px' }}>
                      {gameState.gameWon ? 'You reached $50,000!' : 'You fell into debt!'}
                    </div>
                  )}
                </>
              )}
            </div>
          ),
        };
      case 'staff':
        return {
          icon: '💼',
          title: 'Staff Management',
          content: (
            <div style={styles.drawerContent}>
              {gameState && (
                <>
                  <div style={styles.financeItem}>
                    <span style={styles.financeLabel}>Total Staff</span>
                    <span style={styles.financeValue}>{gameState.staff.length}</span>
                  </div>
                  <div style={styles.financeItem}>
                    <span style={styles.financeLabel}>Daily Staff Cost</span>
                    <span style={{ ...styles.financeValue, color: '#ef4444' }}>
                      {formatMoney(gameState.staff.reduce((sum: number, staff: any) => sum + staff.dailyCost, 0))}
                    </span>
                  </div>
                  <div style={styles.divider} />
                  {gameState.staff.map((staff: any) => (
                    <div key={staff.id} style={styles.staffMember}>
                      <div style={styles.staffAvatar}>
                        {staff.occupation === 'Bartender' ? '🍹' : 
                         staff.occupation === 'Chef' ? '👨‍🍳' :
                         staff.occupation === 'Waiter' ? '🍽️' :
                         staff.occupation === 'Cashier' ? '💰' :
                         staff.occupation === 'Sales Assistant' ? '🛍️' :
                         staff.occupation === 'Manager' ? '👔' :
                         staff.occupation === 'Security Guard' ? '👮' :
                         staff.occupation === 'Attendant' ? '🏖️' : '👤'}
                      </div>
                      <div style={styles.staffInfo}>
                        <div style={styles.staffName}>{staff.name}</div>
                        <div style={styles.staffRole}>{staff.occupation}</div>
                        <div style={styles.staffSalary}>{formatMoney(staff.dailyCost)}/day</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ),
        };
      case 'groups':
        return {
          icon: '👥',
          title: 'Group Management',
          content: (
            <div style={styles.drawerContent}>
              {selectedGroup && (
                <>
                  <GroupDetailsPanel 
                    group={selectedGroup} 
                    onClose={() => setSelectedGroupId && setSelectedGroupId(null)} 
                  />
                  <div style={styles.divider} />
                </>
              )}
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Active Groups</span>
                <span style={styles.financeValue}>{gameState?.groups.filter((g: any) => g.state !== 'despawned').length || 0}</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Total Visitors</span>
                <span style={styles.financeValue}>{gameState?.groups.reduce((sum: number, g: any) => sum + g.size, 0) || 0}</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Avg. Group Size</span>
                <span style={styles.financeValue}>{gameState?.groups.length ? Math.round(gameState.groups.reduce((sum: number, g: any) => sum + g.size, 0) / gameState.groups.length * 10) / 10 : 0}</span>
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
      case 'establishments':
        return {
          icon: '🏠',
          title: 'Establishment Management',
          content: (
            <div style={styles.drawerContent}>
              {selectedEstablishment && (
                <>
                  <EstablishmentDetailsPanel
                    establishment={selectedEstablishment}
                    onClose={() => setSelectedEstablishmentId && setSelectedEstablishmentId(null)}
                  />
                  <div style={styles.divider} />
                  {/* Show staff for selected establishment */}
                  {gameState && (
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF0080', marginBottom: '8px' }}>
                        👥 Staff Members
                      </div>
                      {gameState.staff
                        .filter((staff: any) => staff.establishmentId === selectedEstablishment.id)
                        .map((staff: any) => (
                          <div key={staff.id} style={styles.staffMember}>
                            <div style={styles.staffAvatar}>
                              {staff.occupation === 'Bartender' ? '🍹' : 
                               staff.occupation === 'Chef' ? '👨‍🍳' :
                               staff.occupation === 'Waiter' ? '🍽️' :
                               staff.occupation === 'Cashier' ? '💰' :
                               staff.occupation === 'Sales Assistant' ? '🛍️' :
                               staff.occupation === 'Manager' ? '👔' :
                               staff.occupation === 'Security Guard' ? '👮' :
                               staff.occupation === 'Attendant' ? '🏖️' : '👤'}
                            </div>
                            <div style={styles.staffInfo}>
                              <div style={styles.staffName}>{staff.name}</div>
                              <div style={styles.staffRole}>{staff.occupation}</div>
                              <div style={styles.staffSalary}>{formatMoney(staff.dailyCost)}/day</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Total Establishments</span>
                <span style={styles.financeValue}>{gameState?.establishments.length || 0}</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Open</span>
                <span style={styles.financeValue}>{gameState?.establishments.filter((e: any) => e.isOpen).length || 0}</span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Total Revenue</span>
                <span style={{ ...styles.financeValue, color: '#22c55e' }}>
                  {formatMoney(gameState?.establishments.reduce((sum: number, e: any) => sum + (e.totalRevenue || 0), 0) || 0)}
                </span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Total Visitors</span>
                <span style={styles.financeValue}>
                  {gameState?.establishments.reduce((sum: number, e: any) => sum + (e.totalVisitors || 0), 0) || 0}
                </span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Avg. Occupancy</span>
                <span style={styles.financeValue}>
                  {gameState && gameState.establishments.length > 0 
                    ? Math.round(gameState.establishments.reduce((sum: number, e: any) => sum + ((e.currentOccupancy / e.maxCapacity) * 100), 0) / gameState.establishments.length) + '%'
                    : '0%'
                  }
                </span>
              </div>
              <div style={styles.financeItem}>
                <span style={styles.financeLabel}>Daily Staff Costs</span>
                <span style={{ ...styles.financeValue, color: '#ef4444' }}>
                  {formatMoney(gameState?.establishments.reduce((sum: number, e: any) => sum + (e.dailyStaffCost || 0), 0) || 0)}
                </span>
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
        <button style={styles.drawerExpand} onClick={toggleDrawerExpansion}>
          {isDrawerExpanded ? '⬇' : '⬆'}
        </button>
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
  detailsPanelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  detailsPanelContainer: {
    width: '90%',
    maxWidth: '400px',
    height: '80%',
    maxHeight: '600px',
  },
  actionBarOverlay: {
    position: 'absolute',
    bottom: 'calc(15px + env(safe-area-inset-bottom, 0px))',
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
  actionBarOverlayCompact: {
    bottom: 'calc(5px + env(safe-area-inset-bottom, 0px))',
    left: '5px',
    right: '5px',
    padding: '6px',
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
  actionScrollCompact: {
    gap: '6px',
  },
  drawerOverlay: {
    position: 'absolute',
    top: '40%',
    bottom: 'calc(75px + env(safe-area-inset-bottom, 0px))',
    left: '15px',
    right: '15px',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: '15px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 -4px 30px rgba(0, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
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
  rotationInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px',
    background: 'rgba(26, 26, 46, 0.8)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 255, 255, 0.2)',
  },
  rotationLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  rotationIndicator: {
    fontSize: '1.5rem',
    lineHeight: 1,
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
  cardCompact: {
    gap: '4px',
    minWidth: '50px',
    width: '50px',
    height: '50px',
    padding: '6px',
  },
  cardActive: {
    background: 'rgba(0, 255, 255, 0.2)',
    border: '2px solid #00ffff',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
  },
  cardIcon: {
    fontSize: '2.5rem',
  },
  cardIconCompact: {
    fontSize: '1.6rem',
  },
  cardPrice: {
    fontSize: '0.75rem',
    color: '#FFD93D',
    fontWeight: 'bold',
  },
  cardPriceCompact: {
    fontSize: '0.6rem',
  },
  tabBar: {
    display: 'flex',
    background: 'rgba(26, 26, 46, 0.95)',
    borderTop: '2px solid rgba(0, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
  drawerExpand: {
    position: 'absolute',
    top: '12px',
    right: '50px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 255, 255, 0.2)',
    border: '2px solid rgba(0, 255, 255, 0.5)',
    borderRadius: '50%',
    color: '#00ffff',
    fontSize: '1rem',
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
    color: '#fff',
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
    color: '#fff',
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
    color: '#fff',
  },
  staffRole: {
    fontSize: '0.7rem',
    opacity: 0.7,
    color: '#fff',
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
