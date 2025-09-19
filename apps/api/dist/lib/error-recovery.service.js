import { EventEmitter } from 'events';
export class ErrorRecoveryService extends EventEmitter {
    strategies = new Map();
    retryCounts = new Map();
    addStrategy(strategy) {
        this.strategies.set(strategy.id, strategy);
    }
    async handleError(error, context = 'unknown') {
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
                    }
                    catch (recoveryError) {
                        this.emit('recovery_failed', { strategyId, context, retryCount, error: recoveryError });
                    }
                }
            }
        }
        this.emit('recovery_exhausted', { error, context });
        return false;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    resetRetryCount(strategyId, context) {
        const retryKey = `${strategyId}_${context}`;
        this.retryCounts.delete(retryKey);
    }
}
export const errorRecoveryService = new ErrorRecoveryService();
//# sourceMappingURL=error-recovery.service.js.map