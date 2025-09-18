// Structured Logger implementation
export interface StructuredLogger {
  level: string;
  info: (message: string, context?: any) => void;
  error: (message: string, context?: any) => void;
  warn: (message: string, context?: any) => void;
  debug: (message: string, context?: any) => void;
}

class StructuredLoggerImpl implements StructuredLogger {
  public level: string = 'info';

  info(message: string, context?: any): void {
    if (this.shouldLog('info')) {
      console.log(JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }));
    }
  }

  error(message: string, context?: any): void {
    if (this.shouldLog('error')) {
      console.error(JSON.stringify({ level: 'error', message, context, timestamp: new Date().toISOString() }));
    }
  }

  warn(message: string, context?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(JSON.stringify({ level: 'warn', message, context, timestamp: new Date().toISOString() }));
    }
  }

  debug(message: string, context?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(JSON.stringify({ level: 'debug', message, context, timestamp: new Date().toISOString() }));
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(this.level);
    const targetLevel = levels.indexOf(level);
    return targetLevel <= currentLevel;
  }
}

export const structuredLogger = new StructuredLoggerImpl();