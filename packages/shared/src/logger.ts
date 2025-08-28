/**
 * Sistema de registro para el SDK
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
}

export interface LoggerConfig {
  level?: LogLevel;
  format?: 'json' | 'text';
  redactKeys?: string[];
  destination?: 'console' | 'custom';
  customLogger?: Logger;
}

function redactSensitiveData(
  data: Record<string, unknown>,
  keysToRedact: string[]
): Record<string, unknown> {
  const redacted = { ...data };
  
  for (const key of Object.keys(redacted)) {
    if (keysToRedact.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitiveData(
        redacted[key] as Record<string, unknown>,
        keysToRedact
      );
    }
  }
  
  return redacted;
}

export class SDKLogger implements Logger {
  private config: Required<LoggerConfig>;
  private sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'jwt'
  ];

  constructor(config: LoggerConfig = {}) {
    const defaultLogger: Logger = {
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console)
    };

    this.config = {
      level: config.level || LogLevel.INFO,
      format: config.format || 'json',
      redactKeys: [...this.sensitiveKeys, ...(config.redactKeys || [])],
      destination: config.destination || 'console',
      customLogger: config.customLogger || defaultLogger
    };
  }

  private isLevelEnabled(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const configIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= configIndex;
  }

  private formatMessage(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const context = entry.context 
      ? ` | ${JSON.stringify(entry.context)}`
      : '';
      
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${context}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.isLevelEnabled(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context 
        ? redactSensitiveData(context, this.config.redactKeys)
        : undefined
    };

    const formattedMessage = this.formatMessage(entry);

    if (this.config.destination === 'custom' && this.config.customLogger) {
      switch (level) {
        case LogLevel.ERROR:
          this.config.customLogger.error(message, undefined, context);
          break;
        default:
          this.config.customLogger[level](message, context);
      }
      return;
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    
    this.log(LogLevel.ERROR, message, errorContext);
  }
}
