/**
 * Centralized Game Time Manager
 * 
 * PRINCIPLES:
 * 1. ONLY game time is used throughout the engine and all managers
 * 2. All real-time conversions happen ONLY in TimeManager
 * 3. No other component should reference Date.now() or real time directly
 */

export interface TimeOfDay {
  hour: number;           // 0-23 (game hours)
  minute: number;         // 0-59 (game minutes)
  day: number;            // Day number
  totalMinutes: number;   // Total game minutes since start
}

export interface TideInfo {
  level: number;         // 0-1, tide level
  isRising: boolean;     // Is tide rising or falling
  amplitude: number;      // Number of tiles tide affects
  sealineOffset: number;  // How many tiles from maximum sealine
}

export interface DayCycleConfig {
  dayDurationMinutes: number;  // How long a full day takes in real time
  startTimeHour: number;       // Starting hour (0-23)
  timeSpeed: number;           // Speed multiplier for game time (1x = normal, 24x = fast)
}

export interface TimeConversion {
  /**
   * Convert game time to real time
   * Game time runs at accelerated speed
   */
  gameToRealMs: (gameMinutes: number) => number;
  
  /**
   * Convert real time to game time
   * Real time to game time conversion
   */
  realToGameMinutes: (realMs: number) => number;
}

export class TimeManager {
  private currentTime: TimeOfDay;
  private isPaused: boolean = false;
  private tideAmplitude: number = 4; // Initialize with default value
  private lastTideLevel: number = -1;
  
  // Time conversion constants - calculated once
  public timeConversion: TimeConversion;

  // Time speed control
  private timeSpeed: number = 10; // Default: 1 game day = 5s real time (24h * 60m * 60s / 5s = 17280 seconds)

  constructor(config: DayCycleConfig) {
    this.currentTime = {
      hour: config.startTimeHour,
      minute: 0,
      day: 1,
      totalMinutes: 0
    };
    
    // Initialize time conversion based on day duration and speed
    this.timeConversion = {
      gameToRealMs: (gameMinutes: number) => {
        // With timeSpeed multiplier:
        // 1 real second = timeSpeed game seconds
        // 1 real minute = timeSpeed game minutes  
        // 1 real minute = 60,000ms
        // So 1 game minute = 60,000ms / timeSpeed
        return (gameMinutes * 60000) / this.timeSpeed;
      },
      
      realToGameMinutes: (realMs: number) => {
        // Reverse conversion:
        // realMs / 60000 = real minutes
        // real minutes * timeSpeed = game minutes
        return (realMs / 60000) * this.timeSpeed;
      }
    };
    
    // Initialize tide amplitude for first day
    this.resetTideAmplitude();
  }

  // Core time methods - all work with game time only
  update(deltaTime: number): void {
    if (this.isPaused) return;

    // Convert real deltaTime to game deltaTime
    const gameDeltaTime = this.timeConversion.realToGameMinutes(deltaTime);
    
    this.currentTime.totalMinutes += gameDeltaTime;
    this.updateTimeFromTotalMinutes();
  }

  private updateTimeFromTotalMinutes(): void {
    const totalMinutesInDay = 24 * 60;
    
    this.currentTime.day = Math.floor(this.currentTime.totalMinutes / totalMinutesInDay) + 1;
    const minutesInCurrentDay = Math.floor(this.currentTime.totalMinutes % totalMinutesInDay);
    
    this.currentTime.hour = Math.floor(minutesInCurrentDay / 60);
    this.currentTime.minute = Math.floor(minutesInCurrentDay % 60);
  }

  // Getters - all return game time values
  getTime(): TimeOfDay {
    return { ...this.currentTime };
  }

  getHour(): number {
    return this.currentTime.hour;
  }

  getMinute(): number {
    return this.currentTime.minute;
  }

  getDay(): number {
    return this.currentTime.day;
  }

  // Get current game time (replaces all real-time access)
  getCurrentTime(): number {
    return this.currentTime.totalMinutes;
  }

  // Get formatted time string
  getFormattedTime(): string {
    const hour = this.currentTime.hour.toString().padStart(2, '0');
    const minute = this.currentTime.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }

  // Get time of day category
  getTimeOfDay(): 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' {
    const hour = this.currentTime.hour;
    
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
  }

  // Environment checks
  isDaytime(): boolean {
    const hour = this.currentTime.hour;
    return hour >= 6 && hour < 20; // 6 AM to 8 PM
  }

  isNighttime(): boolean {
    return !this.isDaytime();
  }

  // Pause/resume time
  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  // Set time (for testing/debugging)
  setTime(hour: number, minute: number = 0): void {
    this.currentTime.hour = Math.max(0, Math.min(23, hour));
    this.currentTime.minute = Math.max(0, Math.min(59, minute));
    this.currentTime.totalMinutes = (this.currentTime.day - 1) * 24 * 60 + 
                                   this.currentTime.hour * 60 + 
                                   this.currentTime.minute;
  }

  // Sun position (0-1, where 0.5 is noon)
  getSunPosition(): number {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    return (hour - 6) / 12; // 6 AM = 0, 6 PM = 1
  }

  // Light intensity (0-1)
  getLightIntensity(): number {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    
    if (hour >= 6 && hour <= 18) {
      // Daytime: peak at noon
      const dayProgress = (hour - 6) / 12;
      return Math.sin(dayProgress * Math.PI);
    } else if (hour < 6) {
      // Early morning: ramp up from 0
      return (hour / 6) * 0.3;
    } else {
      // Evening: ramp down to 0
      return Math.max(0, (24 - hour) / 6 * 0.3);
    }
  }

  // Temperature factor (0-1, where 1 is hottest)
  getTemperatureFactor(): number {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    
    // Temperature peaks around 2-3 PM
    if (hour >= 12 && hour <= 15) {
      return 1.0;
    } else if (hour >= 6 && hour < 12) {
      return 0.5 + (hour - 6) / 6 * 0.5; // Ramp up from 0.5 to 1.0
    } else if (hour > 15 && hour <= 20) {
      return 1.0 - (hour - 15) / 5 * 0.5; // Ramp down from 1.0 to 0.5
    } else {
      return 0.2; // Night temperature
    }
  }

  // Tide information - PURE GAME TIME CALCULATIONS
  getTideInfo(): TideInfo {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    
    // Calculate tide level based on game time only
    // 6:00 = max (1.0), 12:00 = min (0.0), 18:00 = max (1.0), 24:00 = min (0.0)
    let tideLevel: number;
    if (hour >= 6 && hour <= 18) {
      // Daytime: falling from max to min to max
      if (hour <= 12) {
        // 6-12: falling from max to min
        tideLevel = 1.0 - ((hour - 6) / 6);
      } else {
        // 12-18: rising from min to max
        tideLevel = (hour - 12) / 6;
      }
    } else {
      // Nighttime: falling from max to min
      if (hour > 18) {
        // 18-24: falling from max to min
        tideLevel = 1.0 - ((hour - 18) / 6);
      } else {
        // 0-6: rising from min to max
        tideLevel = hour / 6;
      }
    }
    
    const currentTideLevel = Math.max(0, Math.min(1, tideLevel));
    const isRising = currentTideLevel > this.lastTideLevel;
    this.lastTideLevel = currentTideLevel;
    
    return {
      level: currentTideLevel,
      isRising,
      amplitude: this.tideAmplitude,
      sealineOffset: Math.round((1 - currentTideLevel) * this.tideAmplitude)
    };
  }

  // Check if enough game time has passed since last update
  hasGameTimePassed(gameMinutes: number, sinceGameTime: number): boolean {
    return this.currentTime.totalMinutes - sinceGameTime >= gameMinutes;
  }

  // Get game time elapsed since a specific game time
  getGameTimeElapsed(sinceGameTime: number): number {
    return this.currentTime.totalMinutes - sinceGameTime;
  }

  // Time speed control methods
  setTimeSpeed(speed: number): void {
    this.timeSpeed = Math.max(1, Math.min(17280, speed)); // Clamp between 1x (real time) and 17280x (1 game day = 5s)
    console.log(`[TimeManager] Time speed set to ${this.timeSpeed}x`);
    
    // Recalculate time conversion with new speed
    this.timeConversion = {
      gameToRealMs: (gameMinutes: number) => {
        return (gameMinutes * 60000) / this.timeSpeed;
      },
      
      realToGameMinutes: (realMs: number) => {
        return (realMs / 60000) * this.timeSpeed;
      }
    };
  }

  getTimeSpeed(): number {
    return this.timeSpeed;
  }

  // Reset tide amplitude for new day
  resetTideAmplitude(): void {
    // Random amplitude between 2-6 tiles
    this.tideAmplitude = Math.floor(Math.random() * 5) + 2;
    console.log(`[TimeManager] New tide amplitude: ${this.tideAmplitude} tiles`);
  }
}
