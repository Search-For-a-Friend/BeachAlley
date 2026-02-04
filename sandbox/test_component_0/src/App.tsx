import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game';
import { GameCanvas, StatsPanel, EventLog } from './components';
import { GameState, GameEvent, DEFAULT_CONFIG } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const App: React.FC = () => {
  const engineRef = useRef<GameEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  
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
  }, []);
  
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
          🏠 Test Component 0
          <span style={styles.subtitle}>Establishment & People Group Demo</span>
        </h1>
      </header>
      
      <main style={styles.main}>
        <div style={styles.sidebar}>
          <StatsPanel
            state={gameState}
            onTogglePause={handleTogglePause}
            onForceSpawn={handleForceSpawn}
            onToggleEstablishment={handleToggleEstablishment}
            onReset={handleReset}
          />
        </div>
        
        <div style={styles.gameArea}>
          <GameCanvas
            state={gameState}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
          />
          <div style={styles.instructions}>
            <p>👥 Groups spawn automatically and seek the establishment</p>
            <p>🏠 Watch the establishment state change based on occupancy</p>
            <p>📊 Groups leave when satisfied, out of money, or impatient</p>
          </div>
        </div>
        
        <div style={styles.sidebar}>
          <EventLog events={events} />
        </div>
      </main>
      
      <footer style={styles.footer}>
        <span>Beach Alley - Prototype v0.1</span>
        <span style={styles.statusBadge}>
          {gameState.isPaused ? '⏸️ Paused' : '▶️ Running'}
        </span>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    gap: '20px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem',
    color: '#ff6b9d',
  },
  header: {
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    textShadow: '0 0 20px rgba(255, 107, 157, 0.5)',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#00ffff',
    fontWeight: 'normal',
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  gameArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  instructions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.85rem',
  },
  statusBadge: {
    padding: '5px 12px',
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderRadius: '20px',
    color: '#ff6b9d',
  },
};

export default App;
