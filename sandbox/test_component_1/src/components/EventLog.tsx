import React from 'react';
import { GameEvent } from '../types';

interface EventLogProps {
  events: GameEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📜 Event Log</h3>
      <div style={styles.list}>
        {events.length === 0 ? (
          <div style={styles.empty}>No events yet...</div>
        ) : (
          events.map((event, index) => (
            <EventItem key={index} event={event} />
          ))
        )}
      </div>
    </div>
  );
};

const EventItem: React.FC<{ event: GameEvent }> = ({ event }) => {
  const { icon, message, color } = formatEvent(event);
  
  return (
    <div style={{ ...styles.event, borderLeftColor: color }}>
      <span style={styles.icon}>{icon}</span>
      <span style={styles.message}>{message}</span>
    </div>
  );
};

function formatEvent(event: GameEvent): { icon: string; message: string; color: string } {
  switch (event.type) {
    case 'GROUP_SPAWNED':
      return {
        icon: '👥',
        message: `${event.group.type} group (${event.group.size}) arrived`,
        color: '#22c55e',
      };
    case 'GROUP_ENTERED':
      return {
        icon: '🚪',
        message: `Group entered establishment`,
        color: '#3b82f6',
      };
    case 'GROUP_LEFT':
      return {
        icon: '👋',
        message: `Group left: ${event.reason}`,
        color: '#f59e0b',
      };
    case 'GROUP_DESPAWNED':
      return {
        icon: '💨',
        message: `Group departed`,
        color: '#6b7280',
      };
    case 'STATE_CHANGED':
      return {
        icon: '🔄',
        message: `State: ${event.from} → ${event.to}`,
        color: '#ff6b9d',
      };
    default:
      return {
        icon: '❓',
        message: 'Unknown event',
        color: '#fff',
      };
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '12px',
    padding: '15px',
    border: '2px solid #00ffff',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#00ffff',
    fontSize: '1rem',
    flexShrink: 0,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minHeight: 0,
  },
  empty: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    padding: '20px',
    fontSize: '0.85rem',
  },
  event: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    borderLeft: '3px solid',
    fontSize: '0.8rem',
  },
  icon: {
    fontSize: '1rem',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
};
