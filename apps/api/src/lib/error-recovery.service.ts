import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface RecoveryStrategy {
  id: string;
  name: string;
  condition: (error: Error) => boolean;
  action: () => Promise<void>;
  maxRetries: number;
  backoffMs: number;
}

export class ErrorRecoveryService extends EventEmitter {
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private retryCounts: Map<string, number> = new Map();

  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  async handleError(error: Error, context: string = 'unknown'): Promise<boolean> {
    for (const [strategyId, strategy] of this.strategies) {
      if (strategy.condition(error)) {
        const retryKey = `${strategyId}_${context}`;
        const retryCount = this.retryCounts.get(retryKey) || 0;

        if (retryCount < strategy.maxRetries) {
          this.retryCounts.set(retryKey, retryCount + 1);
          
          try {
            await this.delay(strategy.backoffMs * Math.pow(2, retryCount));
            await strategy.action();
            
            this.emit('recovery_success', { strategyId, context, retryCount });
            return true;
          } catch (recoveryError) {
            this.emit('recovery_failed', { strategyId, context, retryCount, error: recoveryError });
          }
        }
      }
    }

    this.emit('recovery_exhausted', { error, context });
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resetRetryCount(strategyId: string, context: string): void {
    const retryKey = `${strategyId}_${context}`;
    this.retryCounts.delete(retryKey);
  }
}

export const errorRecoveryService = new ErrorRecoveryService();
