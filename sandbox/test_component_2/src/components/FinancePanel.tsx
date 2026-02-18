import React from 'react';

interface FinancePanelProps {
  money: number;
  totalRevenue: number;
  totalExpenses: number;
  dayCount: number;
  isGameOver: boolean;
  gameWon: boolean;
}

export const FinancePanel: React.FC<FinancePanelProps> = ({
  money,
  totalRevenue,
  totalExpenses,
  dayCount,
  isGameOver,
  gameWon,
}) => {
  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMoneyColor = (): string => {
    if (money < 0) return '#ef4444'; // Red for negative
    if (money < 2000) return '#f59e0b'; // Orange for low
    return '#10b981'; // Green for healthy
  };

  const getProgressColor = (): string => {
    if (gameWon) return '#10b981'; // Green for win
    if (isGameOver) return '#ef4444'; // Red for lose
    return '#6b7280'; // Gray for neutral
  };

  const winProgress = Math.max(0, Math.min(100, ((money + 5000) / 55000) * 100));
  const loseProgress = Math.max(0, Math.min(100, ((5000 - money) / 5000) * 100));

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '14px',
      minWidth: '200px',
      zIndex: 1000,
    }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
          FINANCE PANEL
        </div>
        
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: getMoneyColor() }}>
          {formatMoney(money)}
        </div>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '10px' }}>
        <div>Day: {dayCount}</div>
        <div>Revenue: {formatMoney(totalRevenue)}</div>
        <div>Expenses: {formatMoney(totalExpenses)}</div>
      </div>

      {/* Win/Lose Progress */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
          VICTORY PROGRESS
        </div>
        
        {/* Win Progress */}
        <div style={{ marginBottom: '5px' }}>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            Win ($50,000): {winProgress.toFixed(1)}%
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${winProgress}%`,
              height: '100%',
              backgroundColor: gameWon ? '#10b981' : '#6b7280',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Lose Progress */}
        <div>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            Debt (-$5,000): {loseProgress.toFixed(1)}%
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${loseProgress}%`,
              height: '100%',
              backgroundColor: isGameOver ? '#ef4444' : '#6b7280',
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Game Over Status */}
      {(isGameOver || gameWon) && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: getProgressColor(),
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          {gameWon ? '🎉 VICTORY!' : '💸 GAME OVER'}
        </div>
      )}
    </div>
  );
};
