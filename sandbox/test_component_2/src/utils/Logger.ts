/**
 * Comprehensive Logging System for Beach Alley
 * Based on logging strategy specification
 */

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type LogCategory = 'SYS' | 'GAME' | 'UI' | 'PERF' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  sessionId?: string;
  gameId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  categories: LogCategory[];
  console: boolean;
  file: boolean;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

const LOG_CONFIGS: Record<string, LoggerConfig> = {
  development: {
    level: 'DEBUG',
    categories: ['SYS', 'GAME', 'UI', 'PERF', 'ERROR', 'DEBUG'],
    console: true,
    file: false,
  },
  production: {
    level: 'WARN',
    categories: ['ERROR'],
    console: false,
    file: true,
  },
  testing: {
    level: 'ERROR',
    categories: ['ERROR'],
    console: true,
    file: false,
  },
};

class Logger {
  private static config: LoggerConfig = LOG_CONFIGS['development'];
  private static sessionId: string = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  private static gameId: string = 'game_default';
  private static logBuffer: LogEntry[] = [];
  private static maxBufferSize = 1000;

  static setGameId(gameId: string): void {
    this.gameId = gameId;
  }

  static setEnvironment(env: 'development' | 'production' | 'testing'): void {
    this.config = LOG_CONFIGS[env];
  }

  static configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private static shouldLog(level: LogLevel, category: LogCategory): boolean {
    const levelPriority = LOG_LEVEL_PRIORITY[level];
    const configPriority = LOG_LEVEL_PRIORITY[this.config.level];
    
    return (
      levelPriority >= configPriority &&
      this.config.categories.includes(category)
    );
  }

  private static formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
    return `[${timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${dataStr}`;
  }

  private static output(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);

    if (this.config.console) {
      switch (entry.level) {
        case 'TRACE':
        case 'DEBUG':
          console.debug(formattedMessage);
          break;
        case 'INFO':
          console.info(formattedMessage);
          break;
        case 'WARN':
          console.warn(formattedMessage);
          break;
        case 'ERROR':
        case 'FATAL':
          console.error(formattedMessage);
          break;
      }
    }

    // Add to buffer for potential file logging
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  static trace(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog('TRACE', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'TRACE',
      category,
      message,
      data,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  static debug(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog('DEBUG', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      category,
      message,
      data,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  static info(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog('INFO', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      category,
      message,
      data,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  static warn(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog('WARN', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category,
      message,
      data,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  static error(category: LogCategory, message: string, error?: Error | any): void {
    if (!this.shouldLog('ERROR', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      category,
      message,
      data: error,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  static fatal(category: LogCategory, message: string, error?: Error | any): void {
    if (!this.shouldLog('FATAL', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'FATAL',
      category,
      message,
      data: error,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  // Performance logging
  static perf(category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog('DEBUG', category)) return;
    
    this.output({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      category: 'PERF',
      message,
      data,
      sessionId: this.sessionId,
      gameId: this.gameId,
    });
  }

  // Memory monitoring
  static memory(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.perf('PERF', 'Memory usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      });
    }
  }

  // Timing operations
  static time(category: LogCategory, operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.perf(category, `${operation} completed`, {
        duration,
        operation,
      });
    };
  }

  // Get log buffer for debugging
  static getLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  // Clear log buffer
  static clearLogs(): void {
    this.logBuffer = [];
  }
}

export default Logger;
