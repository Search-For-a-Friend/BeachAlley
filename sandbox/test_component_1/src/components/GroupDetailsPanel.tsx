import React from 'react';
import { PeopleGroup } from '../types';

interface GroupDetailsPanelProps {
  group: PeopleGroup | null;
  onClose: () => void;
}

export const GroupDetailsPanel: React.FC<GroupDetailsPanelProps> = ({ group, onClose }) => {
  if (!group) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>👥</div>
        <div style={styles.emptyText}>No Group Selected</div>
        <div style={styles.emptyHint}>Click on a group to view details</div>
      </div>
    );
  }

  const getStateEmoji = (state: string): string => {
    switch (state) {
      case 'spawning': return '🌀';
      case 'idle': return '🧍';
      case 'seeking': return '🔍';
      case 'wandering': return '🚶';
      case 'queuing': return '⏳';
      case 'entering': return '🚪';
      case 'visiting': return '🏖️';
      case 'leaving': return '👋';
      case 'despawned': return '💨';
      default: return '❓';
    }
  };

  const getStateLabel = (state: string): string => {
    switch (state) {
      case 'spawning': return 'Spawning';
      case 'idle': return 'Idle';
      case 'seeking': return 'Seeking Attraction';
      case 'wandering': return 'Wandering';
      case 'queuing': return 'Queuing';
      case 'entering': return 'Entering';
      case 'visiting': return 'Visiting';
      case 'leaving': return 'Leaving';
      case 'despawned': return 'Despawned';
      default: return 'Unknown';
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>👥 Group Details</h3>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div style={styles.content}>
        {/* Group ID & Color */}
        <div style={styles.section}>
          <div style={styles.row}>
            <span style={styles.label}>ID:</span>
            <span style={styles.value}>{group.id.slice(0, 8)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Color:</span>
            <div style={{
              ...styles.colorSwatch,
              backgroundColor: group.color
            }} />
          </div>
        </div>

        {/* Group Composition */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Composition</h4>
          <div style={styles.row}>
            <span style={styles.label}>Size:</span>
            <span style={styles.value}>{group.size} {group.size === 1 ? 'person' : 'people'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Type:</span>
            <span style={styles.value}>{group.type}</span>
          </div>
        </div>

        {/* Current State */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Current State</h4>
          <div style={styles.stateBadge}>
            <span style={styles.stateEmoji}>{getStateEmoji(group.state)}</span>
            <span style={styles.stateLabel}>{getStateLabel(group.state)}</span>
          </div>
        </div>

        {/* Position */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Position</h4>
          <div style={styles.row}>
            <span style={styles.label}>Grid X:</span>
            <span style={styles.value}>{group.position.x.toFixed(2)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Grid Y:</span>
            <span style={styles.value}>{group.position.y.toFixed(2)}</span>
          </div>
          {group.velocity && (
            <>
              <div style={styles.row}>
                <span style={styles.label}>Velocity X:</span>
                <span style={styles.value}>{group.velocity.x.toFixed(3)}</span>
              </div>
              <div style={styles.row}>
                <span style={styles.label}>Velocity Y:</span>
                <span style={styles.value}>{group.velocity.y.toFixed(3)}</span>
              </div>
            </>
          )}
        </div>

        {/* Path Information */}
        {group.path && group.path.length > 0 && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Pathfinding</h4>
            <div style={styles.row}>
              <span style={styles.label}>Waypoints:</span>
              <span style={styles.value}>{group.path.length}</span>
            </div>
            {group.currentWaypoint !== undefined && (
              <div style={styles.row}>
                <span style={styles.label}>Current Waypoint:</span>
                <span style={styles.value}>{group.currentWaypoint + 1} / {group.path.length}</span>
              </div>
            )}
            {group.path.length > 0 && (
              <div style={styles.row}>
                <span style={styles.label}>Next Target:</span>
                <span style={styles.value}>
                  ({group.path[group.currentWaypoint || 0]?.x.toFixed(1)}, {group.path[group.currentWaypoint || 0]?.y.toFixed(1)})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Target Information */}
        {group.targetEstablishmentId && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Target</h4>
            <div style={styles.row}>
              <span style={styles.label}>Establishment ID:</span>
              <span style={styles.value}>{group.targetEstablishmentId.slice(0, 8)}</span>
            </div>
          </div>
        )}

        {/* Timings */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Timings</h4>
          {group.spawnTime !== undefined && (
            <div style={styles.row}>
              <span style={styles.label}>Spawn Time:</span>
              <span style={styles.value}>{(group.spawnTime / 1000).toFixed(1)}s</span>
            </div>
          )}
          {group.visitStartTime !== undefined && (
            <div style={styles.row}>
              <span style={styles.label}>Visit Start:</span>
              <span style={styles.value}>{(group.visitStartTime / 1000).toFixed(1)}s</span>
            </div>
          )}
          {group.visitDuration !== undefined && (
            <div style={styles.row}>
              <span style={styles.label}>Visit Duration:</span>
              <span style={styles.value}>{(group.visitDuration / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: '#1a1a2e',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #00ffff',
    backgroundColor: '#0f0f1e',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    color: '#00ffff',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#ff0080',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 8px',
    lineHeight: 1,
  },
  content: {
    padding: '16px',
    overflowY: 'auto',
    flex: 1,
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    color: '#ff0080',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  label: {
    color: '#aaa',
    fontSize: '12px',
  },
  value: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  colorSwatch: {
    width: '40px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  stateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(0, 255, 255, 0.3)',
  },
  stateEmoji: {
    fontSize: '20px',
  },
  stateLabel: {
    color: '#00ffff',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px 20px',
    backgroundColor: '#1a1a2e',
    border: '2px dashed rgba(0, 255, 255, 0.3)',
    borderRadius: '8px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  emptyText: {
    color: '#00ffff',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  emptyHint: {
    color: '#aaa',
    fontSize: '13px',
    textAlign: 'center',
  },
};
