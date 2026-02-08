import React from 'react';
import { Establishment } from '../types';

interface EstablishmentDetailsPanelProps {
  establishment: Establishment | null;
  onClose: () => void;
}

export const EstablishmentDetailsPanel: React.FC<EstablishmentDetailsPanelProps> = ({ establishment, onClose }) => {
  if (!establishment) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🏠</div>
        <div style={styles.emptyText}>No Establishment Selected</div>
        <div style={styles.emptyHint}>Click on an establishment to view details</div>
      </div>
    );
  }

  const getStateEmoji = (state: string): string => {
    switch (state) {
      case 'closed': return '🔒';
      case 'deserted': return '🫥';
      case 'visited': return '🙂';
      case 'busy': return '🔥';
      case 'crowded': return '🚨';
      default: return '❓';
    }
  };

  const entrance = establishment.entrance;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🏠 Establishment Details</h3>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <div style={styles.row}>
            <span style={styles.label}>ID:</span>
            <span style={styles.value}>{establishment.id.slice(0, 8)}</span>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Status</h4>
          <div style={styles.stateBadge}>
            <span style={styles.stateEmoji}>{getStateEmoji(establishment.state)}</span>
            <span style={styles.stateLabel}>{establishment.state}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Open:</span>
            <span style={styles.value}>{establishment.isOpen ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Capacity</h4>
          <div style={styles.row}>
            <span style={styles.label}>Occupancy:</span>
            <span style={styles.value}>{establishment.currentOccupancy} / {establishment.maxCapacity}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Service time:</span>
            <span style={styles.value}>{(establishment.serviceTime / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Position</h4>
          <div style={styles.row}>
            <span style={styles.label}>Grid X:</span>
            <span style={styles.value}>{establishment.gridPosition ? establishment.gridPosition.x.toFixed(2) : '—'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Grid Y:</span>
            <span style={styles.value}>{establishment.gridPosition ? establishment.gridPosition.y.toFixed(2) : '—'}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Entrance:</span>
            <span style={styles.value}>
              {entrance ? `(${entrance.x.toFixed(2)}, ${entrance.y.toFixed(2)})` : '—'}
            </span>
          </div>
        </div>

        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>Stats</h4>
          <div style={styles.row}>
            <span style={styles.label}>Total visitors:</span>
            <span style={styles.value}>{establishment.totalVisitors}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Total revenue:</span>
            <span style={styles.value}>${establishment.totalRevenue.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  label: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  value: {
    fontSize: '12px',
    color: '#fff',
    fontFamily: 'monospace',
  },
  stateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 255, 255, 0.12)',
    border: '1px solid rgba(0, 255, 255, 0.25)',
    marginBottom: '10px',
  },
  stateEmoji: {
    fontSize: '16px',
  },
  stateLabel: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 16px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '32px',
    marginBottom: '10px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '6px',
  },
  emptyHint: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
};
