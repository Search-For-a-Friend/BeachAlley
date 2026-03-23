import React from 'react';
import { TimeManager } from '../systems/TimeManager';

interface TimeDisplayProps {
  timeManager: TimeManager;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ timeManager }) => {
  const time = timeManager.getTime();
  const timeOfDay = timeManager.getTimeOfDay();
  const lightIntensity = timeManager.getLightIntensity();
  const temperatureFactor = timeManager.getTemperatureFactor();

  // Get time of day display info
  const getTimeOfDayInfo = () => {
    switch (timeOfDay) {
      case 'dawn':
        return { icon: '🌅', label: 'Dawn', color: '#ff9500' };
      case 'morning':
        return { icon: '☀️', label: 'Morning', color: '#ffcc00' };
      case 'noon':
        return { icon: '🌞', label: 'Noon', color: '#ffeb3b' };
      case 'afternoon':
        return { icon: '🌤️', label: 'Afternoon', color: '#ffc107' };
      case 'evening':
        return { icon: '🌇', label: 'Evening', color: '#ff6b35' };
      case 'night':
        return { icon: '🌙', label: 'Night', color: '#4a5568' };
      default:
        return { icon: '🕐', label: 'Unknown', color: '#666' };
    }
  };

  const timeInfo = getTimeOfDayInfo();

  const styles = {
    container: {
      position: 'fixed' as const,
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      fontFamily: 'monospace',
      fontSize: '14px',
      fontWeight: 'bold',
      backdropFilter: 'blur(10px)',
      border: `2px solid ${timeInfo.color}40`,
      boxShadow: `0 4px 15px ${timeInfo.color}30`,
      zIndex: 1000,
      transition: 'all 0.3s ease',
    },
    timeIcon: {
      fontSize: '20px',
      filter: `drop-shadow(0 0 8px ${timeInfo.color})`,
    },
    timeText: {
      fontSize: '18px',
      color: '#fff',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
    },
    dayText: {
      fontSize: '12px',
      color: timeInfo.color,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      opacity: 0.9,
    },
    indicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: timeInfo.color,
      boxShadow: `0 0 10px ${timeInfo.color}`,
      animation: 'pulse 2s infinite',
    },
    infoContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '2px',
    },
    environmentalInfo: {
      display: 'flex',
      gap: '10px',
      fontSize: '10px',
      opacity: 0.7,
    },
    envBar: {
      width: '30px',
      height: '3px',
      backgroundColor: '#333',
      borderRadius: '2px',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    envFill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'all 0.5s ease',
    },
    lightFill: {
      width: `${lightIntensity * 100}%`,
      backgroundColor: '#ffeb3b',
    },
    tempFill: {
      width: `${temperatureFactor * 100}%`,
      backgroundColor: '#ff5722',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.timeIcon}>{timeInfo.icon}</div>
      
      <div style={styles.infoContainer}>
        <div style={styles.timeText}>
          {timeManager.getFormattedTime()}
        </div>
        <div style={styles.dayText}>
          Day {time.day} • {timeInfo.label}
        </div>
      </div>

      <div style={styles.indicator}></div>

      <div style={styles.environmentalInfo}>
        <div title="Light Intensity">
          <div style={styles.envBar}>
            <div style={{ ...styles.envFill, ...styles.lightFill }}></div>
          </div>
        </div>
        <div title="Temperature">
          <div style={styles.envBar}>
            <div style={{ ...styles.envFill, ...styles.tempFill }}></div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};
