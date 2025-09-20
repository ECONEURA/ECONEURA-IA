export interface BackupConfig {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    schedule: BackupSchedule;
    retention: RetentionPolicy;
    compression: CompressionConfig;
    encryption: EncryptionConfig;
    storage: StorageConfig[];
    verification: VerificationConfig;
    notifications: NotificationConfig;
}
export interface BackupSchedule {
    type: 'interval' | 'cron' | 'event';
    value: string;
    timezone: string;
    enabled: boolean;
}
export interface RetentionPolicy {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    maxBackups: number;
    cleanupEnabled: boolean;
}
export interface CompressionConfig {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli' | 'lz4';
    level: number;
    chunkSize: number;
}
export interface EncryptionConfig {
    enabled: boolean;
    algorithm: 'aes-256-gcm' | 'aes-256-cbc';
    keyRotation: boolean;
    keyRotationInterval: number;
}
export interface StorageConfig {
    id: string;
    name: string;
    type: 'local' | 's3' | 'azure' | 'gcp' | 'ftp' | 'sftp';
    enabled: boolean;
    config: Record<string, any>;
    priority: number;
}
export interface VerificationConfig {
    enabled: boolean;
    checksum: boolean;
    integrity: boolean;
    restore: boolean;
    frequency: 'every' | 'daily' | 'weekly' | 'monthly';
    interval?: number;
}
export interface NotificationConfig {
    enabled: boolean;
    channels: string[];
    onSuccess: boolean;
    onFailure: boolean;
    onWarning: boolean;
}
export interface BackupJob {
    id: string;
    configId: string;
    type: 'full' | 'incremental' | 'differential';
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    size: number;
    compressedSize?: number;
    checksum?: string;
    storageLocations: string[];
    error?: string;
    metadata: Record<string, any>;
}
export interface RecoveryJob {
    id: string;
    backupId: string;
    target: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    error?: string;
    metadata: Record<string, any>;
}
export interface BackupMetrics {
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    totalSize: number;
    averageSize: number;
    averageDuration: number;
    successRate: number;
    lastBackup?: Date;
    nextBackup?: Date;
}
export declare class BackupRecoveryAutomatedService {
    private static instance;
    private configs;
    private backupJobs;
    private recoveryJobs;
    private metrics;
    private scheduledJobs;
    private db;
    private encryptionKey;
    constructor();
    static getInstance(): BackupRecoveryAutomatedService;
    private generateEncryptionKey;
    private initializeDefaultConfigs;
    private initializeMetrics;
    private startScheduledBackups;
    private scheduleBackup;
    executeBackup(configId: string, type?: 'full' | 'incremental' | 'differential'): Promise<string>;
    private performFullBackup;
    private performIncrementalBackup;
    private performDifferentialBackup;
    private compressData;
    private encryptData;
    private storeBackup;
    private storeToLocation;
    private storeToLocal;
    private storeToS3;
    private storeToAzure;
    private storeToGCP;
    private verifyBackup;
    private cleanupOldBackups;
    private updateMetrics;
    private sendNotification;
    executeRecovery(backupId: string, target: string): Promise<string>;
    getBackupConfigs(): Promise<BackupConfig[]>;
    getBackupJobs(configId?: string): Promise<BackupJob[]>;
    getRecoveryJobs(): Promise<RecoveryJob[]>;
    getMetrics(configId?: string): Promise<BackupMetrics | Map<string, BackupMetrics>>;
    addBackupConfig(config: BackupConfig): Promise<boolean>;
    updateBackupConfig(configId: string, updates: Partial<BackupConfig>): Promise<boolean>;
    removeBackupConfig(configId: string): Promise<boolean>;
    getHealthStatus(): Promise<{
        status: string;
        details: any;
    }>;
    destroy(): void;
}
export declare const backupRecoveryAutomated: BackupRecoveryAutomatedService;
//# sourceMappingURL=backup-recovery-automated.service.d.ts.map