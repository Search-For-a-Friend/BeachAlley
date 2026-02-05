import React from 'react';

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = 'secondary',
}) => {
  return (
    <button
      style={{
        ...styles.button,
        ...(variant === 'primary' ? styles.primary : styles.secondary),
      }}
      onClick={onClick}
    >
      <span style={styles.icon}>{icon}</span>
      <span style={styles.label}>{label}</span>
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  button: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '70px',
  },
  primary: {
    background: 'linear-gradient(135deg, #FF6B35, #FF0080)',
    boxShadow: '0 4px 15px rgba(255, 0, 128, 0.3)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  icon: {
    fontSize: '1.5rem',
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#fff',
  },
};

export default ActionButton;
