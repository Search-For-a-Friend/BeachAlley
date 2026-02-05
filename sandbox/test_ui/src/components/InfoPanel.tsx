import React from 'react';

interface InfoPanelProps {
  title: string;
  icon?: string;
  children?: React.ReactNode;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ title, icon, children }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <h3 style={styles.title}>{title}</h3>
      </div>
      <div style={styles.content}>{children || <PlaceholderContent />}</div>
    </div>
  );
};

const PlaceholderContent: React.FC = () => (
  <div style={styles.placeholder}>
    {[...Array(3)].map((_, i) => (
      <div key={i} style={styles.item}>
        <div style={styles.itemIcon}>•</div>
        <div style={styles.itemText}>
          <div style={styles.itemTitle}>Item {i + 1}</div>
          <div style={styles.itemValue}>Value</div>
        </div>
      </div>
    ))}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(26, 26, 46, 0.95)',
    borderRadius: '12px',
    border: '2px solid rgba(0, 255, 255, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 15px',
    background: 'rgba(0, 255, 255, 0.1)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
  },
  icon: {
    fontSize: '1.2rem',
  },
  title: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 'bold',
    color: '#00ffff',
  },
  content: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    minHeight: 0,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  itemIcon: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 255, 255, 0.2)',
    borderRadius: '6px',
    fontSize: '1.2rem',
    color: '#00ffff',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '2px',
  },
  itemValue: {
    fontSize: '0.75rem',
    opacity: 0.7,
  },
};

export default InfoPanel;
