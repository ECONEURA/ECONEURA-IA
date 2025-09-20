export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  source?: string;
}

/**
 * Logger avanzado para ECONEURA-IA con capacidades de análisis y métricas
 */
export class Logger {
  private source: string;
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;

  constructor(source: string, level: LogLevel = LogLevel.INFO) {
    this.source = source;
    this.level = level;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: any, context?: Record<string, any>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorContext = {
      ...context,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    };
    this.log(LogLevel.ERROR, message, errorContext);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      source: this.source
    };

    // Agregar a logs en memoria
    this.logs.push(entry);

    // Mantener límite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs / 2);
    }

    // Output a consola con colores
    const coloredMessage = this.formatColoredMessage(entry);
    console.log(coloredMessage);

    // Emitir evento para análisis en tiempo real
    this.emitLogEvent(entry);
  }

  private formatColoredMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const source = entry.source || 'UNKNOWN';

    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m'  // Red
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level] || reset;

    let message = `${color}[${timestamp}] ${levelStr} [${source}] ${entry.message}${reset}`;

    if (entry.context) {
      message += ` ${JSON.stringify(entry.context)}`;
    }

    return message;
  }

  private emitLogEvent(entry: LogEntry): void {
    // Aquí se podría integrar con un sistema de eventos
    // Por ahora, solo mantenemos en memoria para análisis
  }

  /**
   * Obtiene logs filtrados por criterios
   */
  getLogs(options: {
    level?: LogLevel;
    source?: string;
    since?: Date;
    limit?: number;
  } = {}): LogEntry[] {
    let filtered = this.logs;

    if (options.level !== undefined) {
      filtered = filtered.filter(log => log.level >= options.level!);
    }

    if (options.source) {
      filtered = filtered.filter(log => log.source === options.source);
    }

    if (options.since) {
      filtered = filtered.filter(log => log.timestamp >= options.since!);
    }

    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Obtiene métricas de logging
   */
  getMetrics(): Record<string, any> {
    const totalLogs = this.logs.length;
    const errorCount = this.logs.filter(log => log.level === LogLevel.ERROR).length;
    const warnCount = this.logs.filter(log => log.level === LogLevel.WARN).length;

    const logsBySource = this.logs.reduce((acc, log) => {
      acc[log.source || 'UNKNOWN'] = (acc[log.source || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      errorCount,
      warnCount,
      errorRate: totalLogs > 0 ? errorCount / totalLogs : 0,
      logsBySource,
      memoryUsage: this.logs.length * 1000 // Estimación aproximada
    };
  }

  /**
   * Limpia logs antiguos
   */
  clearLogs(olderThan?: Date): void {
    if (olderThan) {
      this.logs = this.logs.filter(log => log.timestamp >= olderThan);
    } else {
      this.logs = [];
    }
  }

  /**
   * Configura el nivel de logging
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Configura el límite máximo de logs
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max;
  }
}
