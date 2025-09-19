import { z } from 'zod';
export declare const BackupConfigSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["database", "files", "configuration", "full", "incremental"]>;
    source: z.ZodObject<{
        type: z.ZodEnum<["database", "filesystem", "api", "config"]>;
        path: z.ZodOptional<z.ZodString>;
        connectionString: z.ZodOptional<z.ZodString>;
        tables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        includeData: z.ZodDefault<z.ZodBoolean>;
        includeSchema: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path?: string;
        type?: "database" | "config" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
        includeData?: boolean;
        includeSchema?: boolean;
    }, {
        path?: string;
        type?: "database" | "config" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
        includeData?: boolean;
        includeSchema?: boolean;
    }>;
    destination: z.ZodObject<{
        type: z.ZodEnum<["local", "azure_blob", "s3", "ftp", "sftp"]>;
        path: z.ZodString;
        credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        compression: z.ZodDefault<z.ZodBoolean>;
        encryption: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path?: string;
        type?: "local" | "s3" | "ftp" | "sftp" | "azure_blob";
        credentials?: Record<string, string>;
        encryption?: boolean;
        compression?: boolean;
    }, {
        path?: string;
        type?: "local" | "s3" | "ftp" | "sftp" | "azure_blob";
        credentials?: Record<string, string>;
        encryption?: boolean;
        compression?: boolean;
    }>;
    schedule: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        cron: z.ZodOptional<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
        retention: z.ZodObject<{
            days: z.ZodDefault<z.ZodNumber>;
            maxBackups: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            days?: number;
            maxBackups?: number;
        }, {
            days?: number;
            maxBackups?: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
        retention?: {
            days?: number;
            maxBackups?: number;
        };
    }, {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
        retention?: {
            days?: number;
            maxBackups?: number;
        };
    }>;
    filters: z.ZodOptional<z.ZodObject<{
        include: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        exclude: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        maxFileSize: z.ZodOptional<z.ZodNumber>;
        fileTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        maxFileSize?: number;
        include?: string[];
        exclude?: string[];
        fileTypes?: string[];
    }, {
        maxFileSize?: number;
        include?: string[];
        exclude?: string[];
        fileTypes?: string[];
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodString>;
    updatedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "database" | "full" | "incremental" | "files" | "configuration";
    name?: string;
    filters?: {
        maxFileSize?: number;
        include?: string[];
        exclude?: string[];
        fileTypes?: string[];
    };
    id?: string;
    source?: {
        path?: string;
        type?: "database" | "config" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
        includeData?: boolean;
        includeSchema?: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    createdBy?: string;
    updatedBy?: string;
    schedule?: {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
        retention?: {
            days?: number;
            maxBackups?: number;
        };
    };
    destination?: {
        path?: string;
        type?: "local" | "s3" | "ftp" | "sftp" | "azure_blob";
        credentials?: Record<string, string>;
        encryption?: boolean;
        compression?: boolean;
    };
}, {
    type?: "database" | "full" | "incremental" | "files" | "configuration";
    name?: string;
    filters?: {
        maxFileSize?: number;
        include?: string[];
        exclude?: string[];
        fileTypes?: string[];
    };
    id?: string;
    source?: {
        path?: string;
        type?: "database" | "config" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
        includeData?: boolean;
        includeSchema?: boolean;
    };
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    createdBy?: string;
    updatedBy?: string;
    schedule?: {
        enabled?: boolean;
        timezone?: string;
        cron?: string;
        retention?: {
            days?: number;
            maxBackups?: number;
        };
    };
    destination?: {
        path?: string;
        type?: "local" | "s3" | "ftp" | "sftp" | "azure_blob";
        credentials?: Record<string, string>;
        encryption?: boolean;
        compression?: boolean;
    };
}>;
export declare const BackupJobSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    configId: z.ZodString;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    type: z.ZodEnum<["manual", "scheduled", "recovery"]>;
    startTime: z.ZodOptional<z.ZodDate>;
    endTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    size: z.ZodOptional<z.ZodNumber>;
    filesCount: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    type?: "manual" | "scheduled" | "recovery";
    status?: "pending" | "completed" | "failed" | "cancelled" | "running";
    duration?: number;
    metadata?: Record<string, any>;
    id?: string;
    size?: number;
    createdAt?: Date;
    createdBy?: string;
    configId?: string;
    startTime?: Date;
    endTime?: Date;
    filesCount?: number;
}, {
    error?: string;
    type?: "manual" | "scheduled" | "recovery";
    status?: "pending" | "completed" | "failed" | "cancelled" | "running";
    duration?: number;
    metadata?: Record<string, any>;
    id?: string;
    size?: number;
    createdAt?: Date;
    createdBy?: string;
    configId?: string;
    startTime?: Date;
    endTime?: Date;
    filesCount?: number;
}>;
export declare const RecoveryJobSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    backupId: z.ZodString;
    target: z.ZodObject<{
        type: z.ZodEnum<["database", "filesystem", "api"]>;
        path: z.ZodOptional<z.ZodString>;
        connectionString: z.ZodOptional<z.ZodString>;
        tables: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        path?: string;
        type?: "database" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
    }, {
        path?: string;
        type?: "database" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
    }>;
    options: z.ZodObject<{
        overwrite: z.ZodDefault<z.ZodBoolean>;
        verify: z.ZodDefault<z.ZodBoolean>;
        restoreSchema: z.ZodDefault<z.ZodBoolean>;
        restoreData: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        verify?: boolean;
        overwrite?: boolean;
        restoreSchema?: boolean;
        restoreData?: boolean;
    }, {
        verify?: boolean;
        overwrite?: boolean;
        restoreSchema?: boolean;
        restoreData?: boolean;
    }>;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    startTime: z.ZodOptional<z.ZodDate>;
    endTime: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    createdBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error?: string;
    options?: {
        verify?: boolean;
        overwrite?: boolean;
        restoreSchema?: boolean;
        restoreData?: boolean;
    };
    status?: "pending" | "completed" | "failed" | "cancelled" | "running";
    duration?: number;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    createdBy?: string;
    target?: {
        path?: string;
        type?: "database" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
    };
    startTime?: Date;
    endTime?: Date;
    backupId?: string;
}, {
    error?: string;
    options?: {
        verify?: boolean;
        overwrite?: boolean;
        restoreSchema?: boolean;
        restoreData?: boolean;
    };
    status?: "pending" | "completed" | "failed" | "cancelled" | "running";
    duration?: number;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    createdBy?: string;
    target?: {
        path?: string;
        type?: "database" | "api" | "filesystem";
        tables?: string[];
        connectionString?: string;
    };
    startTime?: Date;
    endTime?: Date;
    backupId?: string;
}>;
export type BackupConfig = z.infer<typeof BackupConfigSchema>;
export type BackupJob = z.infer<typeof BackupJobSchema>;
export type RecoveryJob = z.infer<typeof RecoveryJobSchema>;
export interface BackupStats {
    totalBackups: number;
    totalSize: number;
    successfulBackups: number;
    failedBackups: number;
    lastBackupTime: Date | null;
    averageDuration: number;
    backupsByType: Record<string, number>;
    storageUsed: number;
}
export interface RecoveryStats {
    totalRecoveries: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    lastRecoveryTime: Date | null;
    averageRecoveryTime: number;
    recoveriesByType: Record<string, number>;
}
export interface BackupValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedSize: number;
    estimatedDuration: number;
}
export declare class BackupRecoveryService {
    private configs;
    private backupJobs;
    private recoveryJobs;
    private scheduledJobs;
    private encryptionKey;
    constructor();
    private initializeDefaultConfigs;
    getBackupConfigs(): Promise<BackupConfig[]>;
    getBackupConfig(id: string): Promise<BackupConfig | null>;
    createBackupConfig(config: Omit<BackupConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackupConfig>;
    updateBackupConfig(id: string, updates: Partial<BackupConfig>, userId: string): Promise<BackupConfig | null>;
    deleteBackupConfig(id: string, userId: string): Promise<boolean>;
    validateBackupConfig(config: Partial<BackupConfig>): Promise<BackupValidation>;
    executeBackup(configId: string, userId: string, type?: 'manual' | 'scheduled'): Promise<BackupJob>;
    private runBackupJob;
    private backupDatabase;
    private backupFiles;
    private backupConfiguration;
    private shouldIncludeFile;
    getBackupJobs(filters?: {
        configId?: string;
        status?: string;
        type?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<BackupJob[]>;
    getBackupJob(id: string): Promise<BackupJob | null>;
    cancelBackupJob(id: string): Promise<boolean>;
    executeRecovery(backupJobId: string, target: RecoveryJob['target'], options: RecoveryJob['options'], userId: string): Promise<RecoveryJob>;
    private runRecoveryJob;
    getRecoveryJobs(): Promise<RecoveryJob[]>;
    getRecoveryJob(id: string): Promise<RecoveryJob | null>;
    private scheduleBackup;
    private cancelScheduledBackup;
    private parseCronToInterval;
    private cleanupOldBackups;
    private compressData;
    private encryptData;
    getBackupStats(): Promise<BackupStats>;
    getRecoveryStats(): Promise<RecoveryStats>;
}
export declare const backupRecoveryService: BackupRecoveryService;
//# sourceMappingURL=backup-recovery.service.d.ts.map