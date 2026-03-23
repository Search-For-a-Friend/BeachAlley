export interface TimeOfDay {
  hour: number;           // 0-23
  minute: number;         // 0-59
  day: number;            // Day number
  totalMinutes: number;   // Total minutes since start
}

export interface DayCycleConfig {
  dayDurationMinutes: number;  // How long a full day takes in real time
  startTimeHour: number;       // Starting hour (0-23)
}

export class TimeManager {
  private config: DayCycleConfig;
  private currentTime: TimeOfDay;
  private lastUpdateTime: number;
  private isPaused: boolean = false;

  constructor(config: DayCycleConfig) {
    this.config = config;
    this.currentTime = {
      hour: config.startTimeHour,
      minute: 0,
      day: 1,
      totalMinutes: config.startTimeHour * 60
    };
    this.lastUpdateTime = Date.now();
  }

  // Update time based on real time elapsed
  update(): void {
    if (this.isPaused) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Convert real milliseconds to game minutes
    const realMsPerGameMinute = (this.config.dayDurationMinutes * 60 * 1000) / (24 * 60);
    const gameMinutesElapsed = deltaTime / realMsPerGameMinute;

    this.currentTime.totalMinutes += gameMinutesElapsed;
    this.updateTimeFromTotalMinutes();
  }

  private updateTimeFromTotalMinutes(): void {
    // Calculate days, hours, minutes from total minutes
    const totalMinutesInDay = 24 * 60;
    
    this.currentTime.day = Math.floor(this.currentTime.totalMinutes / totalMinutesInDay) + 1;
    const minutesInCurrentDay = Math.floor(this.currentTime.totalMinutes % totalMinutesInDay);
    
    this.currentTime.hour = Math.floor(minutesInCurrentDay / 60);
    this.currentTime.minute = Math.floor(minutesInCurrentDay % 60);
  }

  // Getters
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

  // Check if it's daytime (for group spawning, etc.)
  isDaytime(): boolean {
    const hour = this.currentTime.hour;
    return hour >= 6 && hour < 20; // 6 AM to 8 PM
  }

  // Check if it's nighttime
  isNighttime(): boolean {
    return !this.isDaytime();
  }

  // Pause/resume time
  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
    this.lastUpdateTime = Date.now();
  }

  // Set time (for testing/debugging)
  setTime(hour: number, minute: number = 0): void {
    this.currentTime.hour = Math.max(0, Math.min(23, hour));
    this.currentTime.minute = Math.max(0, Math.min(59, minute));
    this.currentTime.totalMinutes = (this.currentTime.day - 1) * 24 * 60 + 
                                   this.currentTime.hour * 60 + 
                                   this.currentTime.minute;
    this.lastUpdateTime = Date.now();
  }

  // Get sun position (0-1, where 0.5 is noon)
  getSunPosition(): number {
    const hour = this.currentTime.hour + this.currentTime.minute / 60;
    return (hour - 6) / 12; // 6 AM = 0, 6 PM = 1
  }

  // Get light intensity (0-1)
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

  // Get temperature factor (0-1, where 1 is hottest)
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
}
