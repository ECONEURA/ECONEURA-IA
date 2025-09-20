import { EventEmitter } from 'events';
export interface RecoveryStrategy {
    id: string;
    name: string;
    condition: (error: Error) => boolean;
    action: () => Promise<void>;
    maxRetries: number;
    backoffMs: number;
}
export declare class ErrorRecoveryService extends EventEmitter {
    private strategies;
    private retryCounts;
    addStrategy(strategy: RecoveryStrategy): void;
    handleError(error: Error, context?: string): Promise<boolean>;
    private delay;
    resetRetryCount(strategyId: string, context: string): void;
}
export declare const errorRecoveryService: ErrorRecoveryService;
//# sourceMappingURL=error-recovery.service.d.ts.map