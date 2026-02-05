import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game';
import { GameCanvas, StatsPanel, EventLog, GroupDetailsPanel } from './components';
import { GameState, GameEvent, DEFAULT_CONFIG, PeopleGroup } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Initialize game engine
  useEffect(() => {
    const engine = new GameEngine({
      ...DEFAULT_CONFIG,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    });
    
    engineRef.current = engine;
    
    // Subscribe to events
    const unsubscribe = engine.onEvent((event) => {
      setEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
    });
    
    // Initial state
    setGameState(engine.getState());
    
    return () => {
      unsubscribe();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
  
  // Game loop
  useEffect(() => {
    if (!engineRef.current) return;
    
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Cap delta time to prevent huge jumps
      const cappedDelta = Math.min(deltaTime, 100);
      
      engineRef.current?.update(cappedDelta);
      setGameState(engineRef.current?.getState() ?? null);
      
      rafRef.current = requestAnimationFrame(gameLoop);
    };
    
    rafRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
  
  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);
  
  const handleForceSpawn = useCallback(() => {
    engineRef.current?.forceSpawn();
  }, []);
  
  const handleToggleEstablishment = useCallback((id: string) => {
    engineRef.current?.toggleEstablishment(id);
  }, []);
  
  const handleReset = useCallback(() => {
    engineRef.current?.reset();
    setEvents([]);
    setSelectedGroupId(null);
    setHoveredGroupId(null);
  }, []);
  
  const handleGroupClick = useCallback((groupId: string) => {
    setSelectedGroupId(prev => prev === groupId ? null : groupId);
  }, []);
  
  const handleGroupHover = useCallback((groupId: string | null) => {
    setHoveredGroupId(groupId);
  }, []);
  
  const handleCloseGroupDetails = useCallback(() => {
    setSelectedGroupId(null);
  }, []);
  
  // Get selected group data
  const selectedGroup = selectedGroupId && gameState
    ? gameState.groups.find(g => g.id === selectedGroupId) || null
    : null;
  
  if (!gameState) {
    return (
      <div style={styles.loading}>
        <span>Loading...</span>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          🗺️ Test Component 1
          <span style={styles.subtitle}>Pathfinding & Grid Navigation System</span>
        </h1>
      </header>
      
      <main style={styles.main}>
        {/* Left Sidebar - Stats */}
        <div style={styles.leftSidebar}>
          <StatsPanel
            state={gameState}
            onTogglePause={handleTogglePause}
            onForceSpawn={handleForceSpawn}
            onToggleEstablishment={handleToggleEstablishment}
            onReset={handleReset}
          />
        </div>
        
        {/* Center - Game Area */}
        <div style={styles.centerArea}>
          <GameCanvas
            state={gameState}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            gridManager={engineRef.current?.getGridManager()}
            hoveredGroupId={hoveredGroupId}
            selectedGroupId={selectedGroupId}
            onGroupClick={handleGroupClick}
            onGroupHover={handleGroupHover}
          />
          <div style={styles.instructions}>
            <p>👥 Click or hover groups to see their path</p>
            <p>🏠 Click establishments to toggle open/closed</p>
            <p>🎯 Groups seek nearby establishments when open</p>
            <p>📊 Watch stats and events in the side panels</p>
          </div>
        </div>
        
        {/* Right Sidebar - Group Details (always present) */}
        <div style={styles.rightSidebar}>
          <GroupDetailsPanel 
            group={selectedGroup} 
            onClose={handleCloseGroupDetails} 
          />
        </div>
        
        {/* Bottom Right - Event Log */}
        <div style={styles.eventLogContainer}>
          <EventLog events={events} />
        </div>
      </main>
      
      <footer style={styles.footer}>
        <span>Test Component 1</span>
        <span style={styles.statusBadge}>
          {gameState.isPaused ? '⏸️ Paused' : '▶️ Running'}
        </span>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    margin: '0',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '1.5rem',
    color: '#ff6b9d',
  },
  header: {
    textAlign: 'center',
    padding: '15px 20px',
    flexShrink: 0,
    borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    textShadow: '0 0 20px rgba(255, 107, 157, 0.5)',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#00ffff',
    fontWeight: 'normal',
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '280px 1fr 280px',
    gridTemplateRows: '1fr 200px',
    gap: '15px',
    padding: '15px',
    overflow: 'hidden',
    minHeight: 0,
  },
  leftSidebar: {
    gridColumn: '1',
    gridRow: '1 / 3',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  centerArea: {
    gridColumn: '2',
    gridRow: '1 / 3',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 0,
  },
  rightSidebar: {
    gridColumn: '3',
    gridRow: '1',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  eventLogContainer: {
    gridColumn: '3',
    gridRow: '2',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  gameArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  instructions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderTop: '2px solid rgba(255, 107, 157, 0.3)',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  statusBadge: {
    padding: '5px 12px',
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderRadius: '20px',
    color: '#ff6b9d',
  },
};

export default App;
