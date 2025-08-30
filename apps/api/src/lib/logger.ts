interface LogContext {
  org?: string;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  tokens?: number;
  cost?: number;
}

class AdvancedLogger {
  private logLevel = process.env.LOG_LEVEL || 'info';

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Logging específico para IA
  aiRequest(model: string, provider: string, tokens: number, cost: number, context?: LogContext): void {
    this.info(`AI Request: ${model} (${provider}) | Tokens: ${tokens} | Cost: €${cost.toFixed(4)}`, {
      ...context,
      tokens,
      cost
    });
  }

  aiError(error: string, model: string, context?: LogContext): void {
    this.error(`AI Error: ${error} | Model: ${model}`, context);
  }

  budgetWarning(org: string, current: number, limit: number): void {
    this.warn(`Budget Warning: ${org} | Current: €${current.toFixed(2)} | Limit: €${limit.toFixed(2)}`, {
      org,
      current,
      limit
    });
  }
}

export const logger = new AdvancedLogger();
