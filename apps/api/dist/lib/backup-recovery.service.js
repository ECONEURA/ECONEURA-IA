import { z } from 'zod';
import { logger } from './logger.js';
import fs from 'fs/promises.js';
import path from 'path';
import { createHash } from 'crypto';
export const BackupConfigSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: z.enum(['database', 'files', 'configuration', 'full', 'incremental']),
    source: z.object({
        type: z.enum(['database', 'filesystem', 'api', 'config']),
        path: z.string().optional(),
        connectionString: z.string().optional(),
        tables: z.array(z.string()).optional(),
        includeData: z.boolean().default(true),
        includeSchema: z.boolean().default(true)
    }),
    destination: z.object({
        type: z.enum(['local', 'azure_blob', 's3', 'ftp', 'sftp']),
        path: z.string(),
        credentials: z.record(z.string(), z.string()).optional(),
        compression: z.boolean().default(true),
        encryption: z.boolean().default(true)
    }),
    schedule: z.object({
        enabled: z.boolean().default(false),
        cron: z.string().optional(),
        timezone: z.string().default('UTC'),
        retention: z.object({
            days: z.number().min(1).max(365).default(30),
            maxBackups: z.number().min(1).max(1000).default(100)
        })
    }),
    filters: z.object({
        include: z.array(z.string()).default([]),
        exclude: z.array(z.string()).default([]),
        maxFileSize: z.number().optional(),
        fileTypes: z.array(z.string()).optional()
    }).optional(),
    isActive: z.boolean().default(true),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional()
});
export const BackupJobSchema = z.object({
    id: z.string().uuid().optional(),
    configId: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
    type: z.enum(['manual', 'scheduled', 'recovery']),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    duration: z.number().optional(),
    size: z.number().optional(),
    filesCount: z.number().optional(),
    error: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.date().optional(),
    createdBy: z.string().optional()
});
export const RecoveryJobSchema = z.object({
    id: z.string().uuid().optional(),
    backupId: z.string(),
    target: z.object({
        type: z.enum(['database', 'filesystem', 'api']),
        path: z.string().optional(),
        connectionString: z.string().optional(),
        tables: z.array(z.string()).optional()
    }),
    options: z.object({
        overwrite: z.boolean().default(false),
        verify: z.boolean().default(true),
        restoreSchema: z.boolean().default(true),
        restoreData: z.boolean().default(true)
    }),
    status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    createdAt: z.date().optional(),
    createdBy: z.string().optional()
});
export class BackupRecoveryService {
    configs = new Map();
    backupJobs = new Map();
    recoveryJobs = new Map();
    scheduledJobs = new Map();
    encryptionKey;
    constructor() {
        this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || 'default-encryption-key-32-chars';
        this.initializeDefaultConfigs();
    }
    initializeDefaultConfigs() {
        const defaultConfigs = [
            {
                id: 'backup_config_1',
                name: 'Database Full Backup',
                description: 'Complete database backup including schema and data',
                type: 'database',
                source: {
                    type: 'database',
                    connectionString: process.env.DATABASE_URL || '',
                    includeData: true,
                    includeSchema: true
                },
                destination: {
                    type: 'local',
                    path: './backups/database',
                    compression: true,
                    encryption: true
                },
                schedule: {
                    enabled: true,
                    cron: '0 2 * * *',
                    timezone: 'UTC',
                    retention: {
                        days: 30,
                        maxBackups: 30
                    }
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system'
            },
            {
                id: 'backup_config_2',
                name: 'Application Files Backup',
                description: 'Backup of application files and uploads',
                type: 'files',
                source: {
                    type: 'filesystem',
                    path: './uploads',
                    includeData: true,
                    includeSchema: false
                },
                destination: {
                    type: 'local',
                    path: './backups/files',
                    compression: true,
                    encryption: true
                },
                schedule: {
                    enabled: true,
                    cron: '0 3 * * *',
                    timezone: 'UTC',
                    retention: {
                        days: 14,
                        maxBackups: 14
                    }
                },
                filters: {
                    include: ['*.jpg', '*.png', '*.pdf', '*.doc', '*.docx'],
                    exclude: ['*.tmp', '*.log'],
                    maxFileSize: 100 * 1024 * 1024
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system'
            },
            {
                id: 'backup_config_3',
                name: 'Configuration Backup',
                description: 'Backup of application configuration and settings',
                type: 'configuration',
                source: {
                    type: 'config',
                    includeData: true,
                    includeSchema: true
                },
                destination: {
                    type: 'local',
                    path: './backups/config',
                    compression: true,
                    encryption: true
                },
                schedule: {
                    enabled: true,
                    cron: '0 1 * * *',
                    timezone: 'UTC',
                    retention: {
                        days: 90,
                        maxBackups: 90
                    }
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'system'
            }
        ];
        defaultConfigs.forEach(config => {
            this.configs.set(config.id, config);
        });
    }
    async getBackupConfigs() {
        return Array.from(this.configs.values());
    }
    async getBackupConfig(id) {
        return this.configs.get(id) || null;
    }
    async createBackupConfig(config) {
        const validation = await this.validateBackupConfig(config);
        if (!validation.isValid) {
            throw new Error(`Backup configuration validation failed: ${validation.errors.join(', ')}`);
        }
        const newConfig = {
            ...config,
            id: `backup_config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.configs.set(newConfig.id, newConfig);
        if (newConfig.schedule.enabled && newConfig.schedule.cron) {
            this.scheduleBackup(newConfig.id);
        }
        logger.info('Backup configuration created', {
            configId: newConfig.id,
            name: newConfig.name,
            type: newConfig.type
        });
        return newConfig;
    }
    async updateBackupConfig(id, updates, userId) {
        const existing = this.configs.get(id);
        if (!existing)
            return null;
        const criticalFields = ['source', 'destination', 'schedule'];
        const hasCriticalUpdates = criticalFields.some(field => updates[field] !== undefined);
        if (hasCriticalUpdates) {
            const updatedConfig = { ...existing, ...updates };
            const validation = await this.validateBackupConfig(updatedConfig);
            if (!validation.isValid) {
                throw new Error(`Backup configuration validation failed: ${validation.errors.join(', ')}`);
            }
        }
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
            updatedBy: userId
        };
        this.configs.set(id, updated);
        if (updates.schedule) {
            this.cancelScheduledBackup(id);
            if (updated.schedule.enabled && updated.schedule.cron) {
                this.scheduleBackup(id);
            }
        }
        logger.info('Backup configuration updated', {
            configId: id,
            name: updated.name,
            userId
        });
        return updated;
    }
    async deleteBackupConfig(id, userId) {
        const existing = this.configs.get(id);
        if (!existing)
            return false;
        this.cancelScheduledBackup(id);
        this.configs.delete(id);
        logger.info('Backup configuration deleted', {
            configId: id,
            name: existing.name,
            userId
        });
        return true;
    }
    async validateBackupConfig(config) {
        const errors = [];
        const warnings = [];
        let estimatedSize = 0;
        let estimatedDuration = 0;
        if (!config.name || config.name.length === 0) {
            errors.push('Backup name is required');
        }
        if (!config.type) {
            errors.push('Backup type is required');
        }
        if (!config.source) {
            errors.push('Source configuration is required');
        }
        else {
            if (!config.source.type) {
                errors.push('Source type is required');
            }
            if (config.source.type === 'database' && !config.source.connectionString) {
                errors.push('Database connection string is required for database backups');
            }
            if (config.source.type === 'filesystem' && !config.source.path) {
                errors.push('Source path is required for filesystem backups');
            }
        }
        if (!config.destination) {
            errors.push('Destination configuration is required');
        }
        else {
            if (!config.destination.type) {
                errors.push('Destination type is required');
            }
            if (!config.destination.path) {
                errors.push('Destination path is required');
            }
        }
        if (config.schedule?.enabled && !config.schedule.cron) {
            errors.push('Cron expression is required when schedule is enabled');
        }
        if (config.schedule?.retention) {
            if (config.schedule.retention.days < 1 || config.schedule.retention.days > 365) {
                errors.push('Retention days must be between 1 and 365');
            }
            if (config.schedule.retention.maxBackups < 1 || config.schedule.retention.maxBackups > 1000) {
                errors.push('Max backups must be between 1 and 1000');
            }
        }
        if (config.type === 'database') {
            estimatedSize = 100 * 1024 * 1024;
            estimatedDuration = 300;
        }
        else if (config.type === 'files') {
            estimatedSize = 50 * 1024 * 1024;
            estimatedDuration = 120;
        }
        else if (config.type === 'configuration') {
            estimatedSize = 10 * 1024 * 1024;
            estimatedDuration = 30;
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            estimatedSize,
            estimatedDuration
        };
    }
    async executeBackup(configId, userId, type = 'manual') {
        const config = this.configs.get(configId);
        if (!config) {
            throw new Error(`Backup configuration not found: ${configId}`);
        }
        const job = {
            id: `backup_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            configId,
            status: 'pending',
            type,
            startTime: new Date(),
            createdAt: new Date(),
            createdBy: userId
        };
        this.backupJobs.set(job.id, job);
        this.runBackupJob(job.id, config).catch(error => {
            logger.error('Backup job failed', {
                jobId: job.id,
                configId,
                error: error.message
            });
        });
        logger.info('Backup job started', {
            jobId: job.id,
            configId,
            type,
            userId
        });
        return job;
    }
    async runBackupJob(jobId, config) {
        const job = this.backupJobs.get(jobId);
        if (!job)
            return;
        try {
            job.status = 'running';
            job.startTime = new Date();
            let result;
            switch (config.type) {
                case 'database':
                    result = await this.backupDatabase(config);
                    break;
                case 'files':
                    result = await this.backupFiles(config);
                    break;
                case 'configuration':
                    result = await this.backupConfiguration(config);
                    break;
                default:
                    throw new Error(`Unsupported backup type: ${config.type}`);
            }
            job.status = 'completed';
            job.endTime = new Date();
            job.duration = job.endTime.getTime() - job.startTime.getTime();
            job.size = result.size;
            job.filesCount = result.filesCount;
            job.metadata = result.metadata;
            await this.cleanupOldBackups(config);
            logger.info('Backup job completed', {
                jobId,
                configId: config.id,
                duration: job.duration,
                size: job.size,
                filesCount: job.filesCount
            });
        }
        catch (error) {
            job.status = 'failed';
            job.endTime = new Date();
            job.duration = job.endTime.getTime() - job.startTime.getTime();
            job.error = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Backup job failed', {
                jobId,
                configId: config.id,
                error: job.error,
                duration: job.duration
            });
        }
    }
    async backupDatabase(config) {
        const backupPath = path.join(config.destination.path, `db_backup_${Date.now()}.sql`);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        const mockData = `-- Database backup created at ${new Date().toISOString()}
-- Tables: users, companies, products, orders
-- Records: 1000+ records
SELECT 'Backup completed successfully' as status;`;
        let data = mockData;
        if (config.destination.compression) {
            data = this.compressData(data);
        }
        if (config.destination.encryption) {
            data = this.encryptData(data);
        }
        await fs.writeFile(backupPath, data);
        return {
            size: Buffer.byteLength(data),
            filesCount: 1,
            metadata: {
                backupPath,
                tables: config.source.tables || ['all'],
                compression: config.destination.compression,
                encryption: config.destination.encryption
            }
        };
    }
    async backupFiles(config) {
        const backupPath = path.join(config.destination.path, `files_backup_${Date.now()}.tar.gz`);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        const mockFiles = [
            'uploads/user1/avatar.jpg',
            'uploads/user2/document.pdf',
            'uploads/user3/image.png'
        ];
        let totalSize = 0;
        let filesCount = 0;
        for (const file of mockFiles) {
            if (this.shouldIncludeFile(file, config.filters)) {
                totalSize += 1024 * 1024;
                filesCount++;
            }
        }
        const mockData = `Files backup created at ${new Date().toISOString()}
Files included: ${filesCount}
Total size: ${totalSize} bytes`;
        let data = mockData;
        if (config.destination.compression) {
            data = this.compressData(data);
        }
        if (config.destination.encryption) {
            data = this.encryptData(data);
        }
        await fs.writeFile(backupPath, data);
        return {
            size: Buffer.byteLength(data),
            filesCount,
            metadata: {
                backupPath,
                sourcePath: config.source.path,
                filesIncluded: filesCount,
                compression: config.destination.compression,
                encryption: config.destination.encryption
            }
        };
    }
    async backupConfiguration(config) {
        const backupPath = path.join(config.destination.path, `config_backup_${Date.now()}.json`);
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        const mockConfig = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                url: process.env.DATABASE_URL ? '***masked***' : 'not_set',
                poolSize: 10
            },
            redis: {
                url: process.env.REDIS_URL ? '***masked***' : 'not_set'
            },
            features: {
                aiEnabled: true,
                analyticsEnabled: true,
                notificationsEnabled: true
            }
        };
        let data = JSON.stringify(mockConfig, null, 2);
        if (config.destination.compression) {
            data = this.compressData(data);
        }
        if (config.destination.encryption) {
            data = this.encryptData(data);
        }
        await fs.writeFile(backupPath, data);
        return {
            size: Buffer.byteLength(data),
            filesCount: 1,
            metadata: {
                backupPath,
                environment: mockConfig.environment,
                compression: config.destination.compression,
                encryption: config.destination.encryption
            }
        };
    }
    shouldIncludeFile(filePath, filters) {
        if (!filters)
            return true;
        if (filters.exclude) {
            for (const pattern of filters.exclude) {
                if (filePath.includes(pattern.replace('*', ''))) {
                    return false;
                }
            }
        }
        if (filters.include && filters.include.length > 0) {
            for (const pattern of filters.include) {
                if (filePath.includes(pattern.replace('*', ''))) {
                    return true;
                }
            }
            return false;
        }
        return true;
    }
    async getBackupJobs(filters) {
        let jobs = Array.from(this.backupJobs.values());
        if (filters) {
            if (filters.configId) {
                jobs = jobs.filter(j => j.configId === filters.configId);
            }
            if (filters.status) {
                jobs = jobs.filter(j => j.status === filters.status);
            }
            if (filters.type) {
                jobs = jobs.filter(j => j.type === filters.type);
            }
            if (filters.startDate) {
                jobs = jobs.filter(j => j.createdAt && j.createdAt >= filters.startDate);
            }
            if (filters.endDate) {
                jobs = jobs.filter(j => j.createdAt && j.createdAt <= filters.endDate);
            }
        }
        return jobs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }
    async getBackupJob(id) {
        return this.backupJobs.get(id) || null;
    }
    async cancelBackupJob(id) {
        const job = this.backupJobs.get(id);
        if (!job)
            return false;
        if (job.status === 'running') {
            job.status = 'cancelled';
            job.endTime = new Date();
            job.duration = job.endTime.getTime() - (job.startTime?.getTime() || 0);
            logger.info('Backup job cancelled', {
                jobId: id,
                configId: job.configId
            });
            return true;
        }
        return false;
    }
    async executeRecovery(backupJobId, target, options, userId) {
        const backupJob = this.backupJobs.get(backupJobId);
        if (!backupJob) {
            throw new Error(`Backup job not found: ${backupJobId}`);
        }
        if (backupJob.status !== 'completed') {
            throw new Error(`Cannot recover from backup job with status: ${backupJob.status}`);
        }
        const recoveryJob = {
            id: `recovery_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            backupId: backupJobId,
            target,
            options,
            status: 'pending',
            startTime: new Date(),
            createdAt: new Date(),
            createdBy: userId
        };
        this.recoveryJobs.set(recoveryJob.id, recoveryJob);
        this.runRecoveryJob(recoveryJob.id, backupJob, target, options).catch(error => {
            logger.error('Recovery job failed', {
                jobId: recoveryJob.id,
                backupJobId,
                error: error.message
            });
        });
        logger.info('Recovery job started', {
            jobId: recoveryJob.id,
            backupJobId,
            userId
        });
        return recoveryJob;
    }
    async runRecoveryJob(jobId, backupJob, target, options) {
        const job = this.recoveryJobs.get(jobId);
        if (!job)
            return;
        try {
            job.status = 'running';
            job.startTime = new Date();
            await new Promise(resolve => setTimeout(resolve, 2000));
            job.status = 'completed';
            job.endTime = new Date();
            job.duration = job.endTime.getTime() - job.startTime.getTime();
            job.metadata = {
                target,
                options,
                backupSize: backupJob.size,
                filesRestored: backupJob.filesCount
            };
            logger.info('Recovery job completed', {
                jobId,
                backupJobId: backupJob.id,
                duration: job.duration
            });
        }
        catch (error) {
            job.status = 'failed';
            job.endTime = new Date();
            job.duration = job.endTime.getTime() - job.startTime.getTime();
            job.error = error instanceof Error ? error.message : 'Unknown error';
            logger.error('Recovery job failed', {
                jobId,
                backupJobId: backupJob.id,
                error: job.error,
                duration: job.duration
            });
        }
    }
    async getRecoveryJobs() {
        return Array.from(this.recoveryJobs.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }
    async getRecoveryJob(id) {
        return this.recoveryJobs.get(id) || null;
    }
    scheduleBackup(configId) {
        const config = this.configs.get(configId);
        if (!config || !config.schedule.enabled || !config.schedule.cron)
            return;
        this.cancelScheduledBackup(configId);
        const interval = this.parseCronToInterval(config.schedule.cron);
        if (interval > 0) {
            const timeout = setTimeout(() => {
                this.executeBackup(configId, 'system', 'scheduled');
                this.scheduleBackup(configId);
            }, interval);
            this.scheduledJobs.set(configId, timeout);
        }
    }
    cancelScheduledBackup(configId) {
        const timeout = this.scheduledJobs.get(configId);
        if (timeout) {
            clearTimeout(timeout);
            this.scheduledJobs.delete(configId);
        }
    }
    parseCronToInterval(cron) {
        return 60 * 60 * 1000;
    }
    async cleanupOldBackups(config) {
        if (!config.schedule.retention)
            return;
        const backupPath = config.destination.path;
        try {
            const files = await fs.readdir(backupPath);
            const backupFiles = files.filter(file => file.includes('backup'));
            const fileStats = await Promise.all(backupFiles.map(async (file) => ({
                name: file,
                path: path.join(backupPath, file),
                mtime: (await fs.stat(path.join(backupPath, file))).mtime
            })));
            fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            const cutoffDate = new Date(Date.now() - config.schedule.retention.days * 24 * 60 * 60 * 1000);
            const filesToDelete = fileStats.slice(config.schedule.retention.maxBackups);
            for (const file of filesToDelete) {
                if (file.mtime < cutoffDate) {
                    await fs.unlink(file.path);
                    logger.info('Old backup file deleted', {
                        file: file.name,
                        configId: config.id
                    });
                }
            }
        }
        catch (error) {
            logger.error('Failed to cleanup old backups', {
                configId: config.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    compressData(data) {
        return `COMPRESSED:${data}`;
    }
    encryptData(data) {
        const hash = createHash('sha256').update(data).digest('hex');
        return `ENCRYPTED:${hash}:${data}`;
    }
    async getBackupStats() {
        const jobs = Array.from(this.backupJobs.values());
        const successfulJobs = jobs.filter(j => j.status === 'completed');
        const failedJobs = jobs.filter(j => j.status === 'failed');
        const totalSize = successfulJobs.reduce((sum, job) => sum + (job.size || 0), 0);
        const totalDuration = successfulJobs.reduce((sum, job) => sum + (job.duration || 0), 0);
        const backupsByType = {};
        jobs.forEach(job => {
            const config = this.configs.get(job.configId);
            if (config) {
                backupsByType[config.type] = (backupsByType[config.type] || 0) + 1;
            }
        });
        return {
            totalBackups: jobs.length,
            totalSize,
            successfulBackups: successfulJobs.length,
            failedBackups: failedJobs.length,
            lastBackupTime: successfulJobs.length > 0 ?
                new Date(Math.max(...successfulJobs.map(j => j.endTime?.getTime() || 0))) : null,
            averageDuration: successfulJobs.length > 0 ? totalDuration / successfulJobs.length : 0,
            backupsByType,
            storageUsed: totalSize
        };
    }
    async getRecoveryStats() {
        const jobs = Array.from(this.recoveryJobs.values());
        const successfulJobs = jobs.filter(j => j.status === 'completed');
        const failedJobs = jobs.filter(j => j.status === 'failed');
        const totalDuration = successfulJobs.reduce((sum, job) => sum + (job.duration || 0), 0);
        const recoveriesByType = {};
        jobs.forEach(job => {
            recoveriesByType[job.target.type] = (recoveriesByType[job.target.type] || 0) + 1;
        });
        return {
            totalRecoveries: jobs.length,
            successfulRecoveries: successfulJobs.length,
            failedRecoveries: failedJobs.length,
            lastRecoveryTime: successfulJobs.length > 0 ?
                new Date(Math.max(...successfulJobs.map(j => j.endTime?.getTime() || 0))) : null,
            averageRecoveryTime: successfulJobs.length > 0 ? totalDuration / successfulJobs.length : 0,
            recoveriesByType
        };
    }
}
export const backupRecoveryService = new BackupRecoveryService();
//# sourceMappingURL=backup-recovery.service.js.map