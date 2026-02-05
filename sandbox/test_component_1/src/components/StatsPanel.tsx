import React from 'react';
import { GameState, Establishment, PeopleGroup } from '../types';
import { getStateEmoji, getStateColor } from '../game';
import { getGroupEmoji, getStateDescription } from '../game/peopleGroup';

interface StatsPanelProps {
  state: GameState;
  onToggleEstablishment: (id: string) => void;
  onForceSpawn: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  state,
  onToggleEstablishment,
  onForceSpawn,
  onTogglePause,
  onReset,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.title}>🎮 Game Controls</h2>
        
        <div style={styles.buttonRow}>
          <button style={styles.button} onClick={onTogglePause}>
            {state.isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button style={styles.button} onClick={onForceSpawn}>
            👥 Spawn Group
          </button>
          <button style={{ ...styles.button, ...styles.dangerButton }} onClick={onReset}>
            🔄 Reset
          </button>
        </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📊 Statistics</h3>
        <div style={styles.statGrid}>
          <StatItem label="Time" value={formatTime(state.time)} />
          <StatItem label="Groups Spawned" value={state.stats.totalGroupsSpawned} />
          <StatItem label="Groups Left" value={state.stats.totalGroupsDespawned} />
          <StatItem label="Total Visits" value={state.stats.totalVisits} />
          <StatItem label="Revenue" value={`$${state.stats.totalRevenue.toFixed(0)}`} />
          <StatItem label="Active Groups" value={state.groups.length} />
        </div>
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🏠 Establishments</h3>
        {state.establishments.map(est => (
          <EstablishmentCard
            key={est.id}
            establishment={est}
            onToggle={() => onToggleEstablishment(est.id)}
          />
        ))}
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>👥 Active Groups ({state.groups.length})</h3>
        <div style={styles.groupList}>
          {state.groups.slice(0, 10).map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
          {state.groups.length > 10 && (
            <div style={styles.moreGroups}>
              +{state.groups.length - 10} more groups...
            </div>
          )}
        </div>
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📖 Legend</h3>
        <div style={styles.legend}>
          <LegendItem emoji="🏚️" label="Deserted" color="#6b7280" />
          <LegendItem emoji="🏠" label="Visited" color="#22c55e" />
          <LegendItem emoji="🏡" label="Busy" color="#f59e0b" />
          <LegendItem emoji="🔥" label="Crowded" color="#ef4444" />
        </div>
      </div>
      </div>
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div style={styles.statItem}>
    <span style={styles.statLabel}>{label}</span>
    <span style={styles.statValue}>{value}</span>
  </div>
);

const EstablishmentCard: React.FC<{
  establishment: Establishment;
  onToggle: () => void;
}> = ({ establishment, onToggle }) => {
  const color = getStateColor(establishment.state);
  const occupancyPercent = Math.round(
    (establishment.currentOccupancy / establishment.maxCapacity) * 100
  );
  
  return (
    <div style={{ ...styles.card, borderColor: color }}>
      <div style={styles.cardHeader}>
        <span style={styles.cardTitle}>
          {getStateEmoji(establishment.state)} House #{establishment.id.slice(0, 4)}
        </span>
        <button
          style={{
            ...styles.smallButton,
            backgroundColor: establishment.isOpen ? '#22c55e' : '#ef4444',
          }}
          onClick={onToggle}
        >
          {establishment.isOpen ? 'Open' : 'Closed'}
        </button>
      </div>
      <div style={styles.cardContent}>
        <div style={styles.cardRow}>
          <span>State:</span>
          <span style={{ color, fontWeight: 'bold', textTransform: 'capitalize' }}>
            {establishment.state}
          </span>
        </div>
        <div style={styles.cardRow}>
          <span>Occupancy:</span>
          <span>{establishment.currentOccupancy}/{establishment.maxCapacity} ({occupancyPercent}%)</span>
        </div>
        <div style={styles.cardRow}>
          <span>Revenue:</span>
          <span style={{ color: '#22c55e' }}>${establishment.totalRevenue.toFixed(0)}</span>
        </div>
        <div style={styles.cardRow}>
          <span>Total Visitors:</span>
          <span>{establishment.totalVisitors}</span>
        </div>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${occupancyPercent}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const GroupCard: React.FC<{ group: PeopleGroup }> = ({ group }) => (
  <div style={{ ...styles.groupCard, borderLeftColor: group.color }}>
    <span style={styles.groupEmoji}>{getGroupEmoji(group.type)}</span>
    <div style={styles.groupInfo}>
      <span style={styles.groupType}>
        {group.type} ({group.size})
      </span>
      <span style={styles.groupState}>{getStateDescription(group.state)}</span>
    </div>
    <div style={styles.groupStats}>
      <span title="Satisfaction">😊 {Math.round(group.satisfaction)}%</span>
      <span title="Money">💰 ${Math.round(group.money)}</span>
    </div>
  </div>
);

const LegendItem: React.FC<{ emoji: string; label: string; color: string }> = ({
  emoji,
  label,
  color,
}) => (
  <div style={styles.legendItem}>
    <span>{emoji}</span>
    <span style={{ color }}>{label}</span>
  </div>
);

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '12px',
    border: '2px solid #ff6b9d',
    boxShadow: '0 0 30px rgba(255, 107, 157, 0.2)',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    minHeight: 0,
  },
  title: {
    margin: '0 0 15px 0',
    color: '#ff6b9d',
    fontSize: '1.3rem',
    textAlign: 'center',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: '80px',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.1s',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    color: '#00ffff',
    fontSize: '1rem',
    borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
    paddingBottom: '5px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.8rem',
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '10px',
    borderLeft: '4px solid',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#fff',
  },
  smallButton: {
    padding: '4px 10px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  cardContent: {
    fontSize: '0.85rem',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBar: {
    marginTop: '8px',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  groupList: {
    maxHeight: '200px',
    overflowY: 'auto',
  },
  groupCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    marginBottom: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    borderLeft: '3px solid',
  },
  groupEmoji: {
    fontSize: '1.2rem',
  },
  groupInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  groupType: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: '0.85rem',
    textTransform: 'capitalize',
  },
  groupState: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.75rem',
  },
  groupStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moreGroups: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.8rem',
    padding: '8px',
  },
  legend: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
  },
};
