import React, { useState, useEffect } from 'react';

interface TimeSpeedSliderProps {
  gameEngine: any;
  className?: string;
}

export const TimeSpeedSlider: React.FC<TimeSpeedSliderProps> = ({ gameEngine, className = '' }) => {
  const [timeSpeed, setTimeSpeed] = useState(24);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (gameEngine && !isInitialized) {
      const currentSpeed = gameEngine.getTimeSpeed();
      setTimeSpeed(currentSpeed);
      setIsInitialized(true);
    }
  }, [gameEngine, isInitialized]);

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setTimeSpeed(newSpeed);
    if (gameEngine) {
      gameEngine.setTimeSpeed(newSpeed);
    }
  };

  const formatSpeedDisplay = (speed: number): string => {
    if (speed === 1) {
      return 'Real Time';
    } else if (speed === 17280) {
      return 'Max (5s/day)';
    } else {
      return `${speed}x faster`;
    }
  };

  return (
    <div className={`time-speed-slider ${className}`}>
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">
            Game Time Speed
          </label>
          <span className="text-sm font-semibold text-blue-600">
            {formatSpeedDisplay(timeSpeed)}
          </span>
        </div>
        
        <input
          type="range"
          min="1"
          max="17280"
          step="1"
          value={timeSpeed}
          onChange={handleSpeedChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>1x (Real)</span>
          <span>4320x</span>
          <span>8640x</span>
          <span>17280x (5s/day)</span>
        </div>
        
        <div className="text-xs text-gray-600 mt-1">
          {timeSpeed === 1 && 'Game runs at real time speed'}
          {timeSpeed === 17280 && 'Game runs at maximum speed (1 day = 5s)'}
          {timeSpeed > 1 && timeSpeed < 17280 && `Game runs ${timeSpeed}x faster than real time`}
        </div>
      </div>
    </div>
  );
};
