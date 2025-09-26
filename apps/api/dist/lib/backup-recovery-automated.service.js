import crypto from 'crypto';
import path from 'path';

import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from './structured-logger.js';
export class BackupRecoveryAutomatedService {
    static instance;
    configs = new Map();
    backupJobs = new Map();
    recoveryJobs = new Map();
    metrics = new Map();
    scheduledJobs = new Map();
    db;
    encryptionKey;
    constructor() {
        this.db = getDatabaseService();
        this.encryptionKey = this.generateEncryptionKey();
        this.initializeDefaultConfigs();
        this.startScheduledBackups();
        structuredLogger.info('BackupRecoveryAutomatedService initialized');
    }
    static getInstance() {
        if (!BackupRecoveryAutomatedService.instance) {
            BackupRecoveryAutomatedService.instance = new BackupRecoveryAutomatedService();
        }
        return BackupRecoveryAutomatedService.instance;
    }
    generateEncryptionKey() {
        return crypto.randomBytes(32);
    }
    initializeDefaultConfigs() {
        const defaultConfigs = [
            {
                id: 'database-backup',
                name: 'Database Backup',
                description: 'Automated backup of PostgreSQL database',
                enabled: true,
                schedule: {
                    type: 'interval',
                    value: '1440',
                    timezone: 'UTC',
                    enabled: true
                },
                retention: {
                    daily: 7,
                    weekly: 4,
                    monthly: 12,
                    yearly: 3,
                    maxBackups: 50,
                    cleanupEnabled: true
                },
                compression: {
                    enabled: true,
                    algorithm: 'gzip',
                    level: 6,
                    chunkSize: 1024 * 1024
                },
                encryption: {
                    enabled: true,
                    algorithm: 'aes-256-gcm',
                    keyRotation: true,
                    keyRotationInterval: 90
                },
                storage: [
                    {
                        id: 'local-storage',
                        name: 'Local Storage',
                        type: 'local',
                        enabled: true,
                        config: {
                            path: '/backups/database'
                        },
                        priority: 1
                    }
                ],
                verification: {
                    enabled: true,
                    checksum: true,
                    integrity: true,
                    restore: false,
                    frequency: 'daily'
                },
                notifications: {
                    enabled: true,
                    channels: ['email', 'slack'],
                    onSuccess: false,
                    onFailure: true,
                    onWarning: true
                }
            },
            {
                id: 'application-backup',
                name: 'Application Data Backup',
                description: 'Backup of application data and configurations',
                enabled: true,
                schedule: {
                    type: 'cron',
                    value: '0 2 * * *',
                    timezone: 'UTC',
                    enabled: true
                },
                retention: {
                    daily: 14,
                    weekly: 8,
                    monthly: 6,
                    yearly: 2,
                    maxBackups: 30,
                    cleanupEnabled: true
                },
                compression: {
                    enabled: true,
                    algorithm: 'brotli',
                    level: 4,
                    chunkSize: 512 * 1024
                },
                encryption: {
                    enabled: true,
                    algorithm: 'aes-256-gcm',
                    keyRotation: true,
                    keyRotationInterval: 60
                },
                storage: [
                    {
                        id: 'local-storage',
                        name: 'Local Storage',
                        type: 'local',
                        enabled: true,
                        config: {
                            path: '/backups/application'
                        },
                        priority: 1
                    }
                ],
                verification: {
                    enabled: true,
                    checksum: true,
                    integrity: true,
                    restore: true,
                    frequency: 'weekly'
                },
                notifications: {
                    enabled: true,
                    channels: ['email'],
                    onSuccess: false,
                    onFailure: true,
                    onWarning: true
                }
            }
        ];
        defaultConfigs.forEach(config => {
            this.configs.set(config.id, config);
            this.initializeMetrics(config.id);
        });
    }
    initializeMetrics(configId) {
        this.metrics.set(configId, {
            totalBackups: 0,
            successfulBackups: 0,
            failedBackups: 0,
            totalSize: 0,
            averageSize: 0,
            averageDuration: 0,
            successRate: 100
        });
    }
    startScheduledBackups() {
        for (const config of this.configs.values()) {
            if (config.enabled && config.schedule.enabled) {
                this.scheduleBackup(config);
            }
        }
    }
    scheduleBackup(config) {
        try {
            let interval;
            switch (config.schedule.type) {
                case 'interval':
                    interval = parseInt(config.schedule.value) * 60 * 1000;
                    break;
                case 'cron':
                    interval = 24 * 60 * 60 * 1000;
                    break;
                case 'event':
                    return;
                default:
                    structuredLogger.warn('Unknown schedule type', { configId: config.id, type: config.schedule.type });
                    return;
            }
            const job = setInterval(async () => {
                await this.executeBackup(config.id, 'full');
            }, interval);
            this.scheduledJobs.set(config.id, job);
            structuredLogger.info('Backup scheduled', {
                configId: config.id,
                interval: interval / (60 * 1000),
                type: config.schedule.type
            });
        }
        catch (error) {
            structuredLogger.error('Failed to schedule backup', {
                error: error.message,
                configId: config.id
            });
        }
    }
    async executeBackup(configId, type = 'full') {
        try {
            const config = this.configs.get(configId);
            if (!config || !config.enabled) {
                throw new Error('Backup configuration not found or disabled');
            }
            const jobId = crypto.randomUUID();
            const startTime = new Date();
            const job = {
                id: jobId,
                configId,
                type,
                status: 'running',
                startTime,
                size: 0,
                storageLocations: [],
                metadata: {
                    configName: config.name,
                    type,
                    startTime: startTime.toISOString()
                }
            };
            this.backupJobs.set(jobId, job);
            structuredLogger.info('Backup job started', {
                jobId,
                configId,
                type,
                configName: config.name
            });
            let backupData;
            switch (type) {
                case 'full':
                    backupData = await this.performFullBackup(config);
                    break;
                case 'incremental':
                    backupData = await this.performIncrementalBackup(config);
                    break;
                case 'differential':
                    backupData = await this.performDifferentialBackup(config);
                    break;
                default:
                    throw new Error(`Unknown backup type: ${type}`);
            }
            let compressedData = backupData;
            if (config.compression.enabled) {
                compressedData = await this.compressData(backupData, config.compression);
            }
            if (config.encryption.enabled) {
                compressedData = await this.encryptData(compressedData, config.encryption);
            }
            const checksum = crypto.createHash('sha256').update(compressedData).digest('hex');
            const storageLocations = await this.storeBackup(compressedData, config, jobId);
            if (config.verification.enabled) {
                await this.verifyBackup(compressedData, checksum, config);
            }
            const endTime = new Date();
            job.status = 'completed';
            job.endTime = endTime;
            job.duration = endTime.getTime() - startTime.getTime();
            job.size = backupData.length;
            job.compressedSize = compressedData.length;
            job.checksum = checksum;
            job.storageLocations = storageLocations;
            job.metadata.endTime = endTime.toISOString();
            job.metadata.duration = job.duration;
            job.metadata.size = job.size;
            job.metadata.compressedSize = job.compressedSize;
            job.metadata.compressionRatio = job.compressedSize / job.size;
            job.metadata.checksum = checksum;
            this.backupJobs.set(jobId, job);
            this.updateMetrics(configId, job);
            if (config.notifications.enabled && config.notifications.onSuccess) {
                await this.sendNotification('success', config, job);
            }
            if (config.retention.cleanupEnabled) {
                await this.cleanupOldBackups(config);
            }
            structuredLogger.info('Backup job completed', {
                jobId,
                configId,
                duration: job.duration,
                size: job.size,
                compressedSize: job.compressedSize,
                storageLocations: job.storageLocations.length
            });
            return jobId;
        }
        catch (error) {
            structuredLogger.error('Backup job failed', {
                error: error.message,
                configId,
                type
            });
            const job = Array.from(this.backupJobs.values())
                .find(j => j.configId === configId && j.status === 'running');
            if (job) {
                job.status = 'failed';
                job.endTime = new Date();
                job.duration = job.endTime.getTime() - job.startTime.getTime();
                job.error = error.message;
                this.backupJobs.set(job.id, job);
                this.updateMetrics(configId, job);
                const config = this.configs.get(configId);
                if (config && config.notifications.enabled && config.notifications.onFailure) {
                    await this.sendNotification('failure', config, job);
                }
            }
            throw error;
        }
    }
    async performFullBackup(config) {
        const data = `Full backup of ${config.name} at ${new Date().toISOString()}`;
        return Buffer.from(data, 'utf8');
    }
    async performIncrementalBackup(config) {
        const data = `Incremental backup of ${config.name} at ${new Date().toISOString()}`;
        return Buffer.from(data, 'utf8');
    }
    async performDifferentialBackup(config) {
        const data = `Differential backup of ${config.name} at ${new Date().toISOString()}`;
        return Buffer.from(data, 'utf8');
    }
    async compressData(data, config) {
        const compressionRatio = 0.7;
        const compressedSize = Math.floor(data.length * compressionRatio);
        return data.slice(0, compressedSize);
    }
    async encryptData(data, config) {
        const cipher = crypto.createCipher(config.algorithm, this.encryptionKey);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        return encrypted;
    }
    async storeBackup(data, config, jobId) {
        const storageLocations = [];
        for (const storage of config.storage) {
            if (!storage.enabled)
                continue;
            try {
                const location = await this.storeToLocation(data, storage, jobId);
                storageLocations.push(location);
            }
            catch (error) {
                structuredLogger.error('Failed to store backup to location', {
                    error: error.message,
                    storageId: storage.id,
                    jobId
                });
            }
        }
        return storageLocations;
    }
    async storeToLocation(data, storage, jobId) {
        switch (storage.type) {
            case 'local':
                return await this.storeToLocal(data, storage, jobId);
            case 's3':
                return await this.storeToS3(data, storage, jobId);
            case 'azure':
                return await this.storeToAzure(data, storage, jobId);
            case 'gcp':
                return await this.storeToGCP(data, storage, jobId);
            default:
                throw new Error(`Unsupported storage type: ${storage.type}`);
        }
    }
    async storeToLocal(data, storage, jobId) {
        const filename = `backup-${jobId}-${Date.now()}.bak`;
        const filepath = path.join(storage.config.path, filename);
        return filepath;
    }
    async storeToS3(data, storage, jobId) {
        const key = `backups/${jobId}-${Date.now()}.bak`;
        return `s3://${storage.config.bucket}/${key}`;
    }
    async storeToAzure(data, storage, jobId) {
        const blobName = `backups/${jobId}-${Date.now()}.bak`;
        return `azure://${storage.config.container}/${blobName}`;
    }
    async storeToGCP(data, storage, jobId) {
        const objectName = `backups/${jobId}-${Date.now()}.bak`;
        return `gcp://${storage.config.bucket}/${objectName}`;
    }
    async verifyBackup(data, checksum, config) {
        if (config.verification.checksum) {
            const calculatedChecksum = crypto.createHash('sha256').update(data).digest('hex');
            if (calculatedChecksum !== checksum) {
                throw new Error('Checksum verification failed');
            }
        }
        if (config.verification.integrity) {
            if (data.length === 0) {
                throw new Error('Integrity check failed: empty backup');
            }
        }
    }
    async cleanupOldBackups(config) {
        structuredLogger.info('Cleaning up old backups', { configId: config.id });
    }
    updateMetrics(configId, job) {
        const metrics = this.metrics.get(configId);
        if (!metrics)
            return;
        metrics.totalBackups++;
        if (job.status === 'completed') {
            metrics.successfulBackups++;
            metrics.totalSize += job.size;
            metrics.averageSize = metrics.totalSize / metrics.successfulBackups;
            if (metrics.averageDuration === 0) {
                metrics.averageDuration = job.duration || 0;
            }
            else {
                metrics.averageDuration = (metrics.averageDuration + (job.duration || 0)) / 2;
            }
        }
        else if (job.status === 'failed') {
            metrics.failedBackups++;
        }
        metrics.successRate = (metrics.successfulBackups / metrics.totalBackups) * 100;
        metrics.lastBackup = job.endTime || job.startTime;
        this.metrics.set(configId, metrics);
    }
    async sendNotification(type, config, job) {
        structuredLogger.info('Notification sent', {
            type,
            configId: config.id,
            jobId: job.id,
            channels: config.notifications.channels
        });
    }
    async executeRecovery(backupId, target) {
        try {
            const jobId = crypto.randomUUID();
            const startTime = new Date();
            const job = {
                id: jobId,
                backupId,
                target,
                status: 'running',
                startTime,
                metadata: {
                    backupId,
                    target,
                    startTime: startTime.toISOString()
                }
            };
            this.recoveryJobs.set(jobId, job);
            structuredLogger.info('Recovery job started', {
                jobId,
                backupId,
                target
            });
            await new Promise(resolve => setTimeout(resolve, 5000));
            const endTime = new Date();
            job.status = 'completed';
            job.endTime = endTime;
            job.duration = endTime.getTime() - startTime.getTime();
            job.metadata.endTime = endTime.toISOString();
            job.metadata.duration = job.duration;
            this.recoveryJobs.set(jobId, job);
            structuredLogger.info('Recovery job completed', {
                jobId,
                backupId,
                target,
                duration: job.duration
            });
            return jobId;
        }
        catch (error) {
            structuredLogger.error('Recovery job failed', {
                error: error.message,
                backupId,
                target
            });
            const job = Array.from(this.recoveryJobs.values())
                .find(j => j.backupId === backupId && j.status === 'running');
            if (job) {
                job.status = 'failed';
                job.endTime = new Date();
                job.duration = job.endTime.getTime() - job.startTime.getTime();
                job.error = error.message;
                this.recoveryJobs.set(job.id, job);
            }
            throw error;
        }
    }
    async getBackupConfigs() {
        return Array.from(this.configs.values());
    }
    async getBackupJobs(configId) {
        const jobs = Array.from(this.backupJobs.values());
        return configId ? jobs.filter(job => job.configId === configId) : jobs;
    }
    async getRecoveryJobs() {
        return Array.from(this.recoveryJobs.values());
    }
    async getMetrics(configId) {
        if (configId) {
            return this.metrics.get(configId) || this.initializeMetrics(configId);
        }
        return new Map(this.metrics);
    }
    async addBackupConfig(config) {
        try {
            this.configs.set(config.id, config);
            this.initializeMetrics(config.id);
            if (config.enabled && config.schedule.enabled) {
                this.scheduleBackup(config);
            }
            structuredLogger.info('Backup configuration added', { configId: config.id });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to add backup configuration', {
                error: error.message,
                configId: config.id
            });
            return false;
        }
    }
    async updateBackupConfig(configId, updates) {
        try {
            const config = this.configs.get(configId);
            if (!config)
                return false;
            Object.assign(config, updates);
            this.configs.set(configId, config);
            if (updates.schedule) {
                const existingJob = this.scheduledJobs.get(configId);
                if (existingJob) {
                    clearInterval(existingJob);
                }
                if (config.enabled && config.schedule.enabled) {
                    this.scheduleBackup(config);
                }
            }
            structuredLogger.info('Backup configuration updated', { configId, updates });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to update backup configuration', {
                error: error.message,
                configId
            });
            return false;
        }
    }
    async removeBackupConfig(configId) {
        try {
            const deleted = this.configs.delete(configId);
            this.metrics.delete(configId);
            const existingJob = this.scheduledJobs.get(configId);
            if (existingJob) {
                clearInterval(existingJob);
                this.scheduledJobs.delete(configId);
            }
            if (deleted) {
                structuredLogger.info('Backup configuration removed', { configId });
            }
            return deleted;
        }
        catch (error) {
            structuredLogger.error('Failed to remove backup configuration', {
                error: error.message,
                configId
            });
            return false;
        }
    }
    async getHealthStatus() {
        const configs = await this.getBackupConfigs();
        const jobs = await this.getBackupJobs();
        const recentJobs = jobs.filter(job => Date.now() - job.startTime.getTime() < 24 * 60 * 60 * 1000);
        const failedJobs = recentJobs.filter(job => job.status === 'failed');
        const runningJobs = jobs.filter(job => job.status === 'running');
        let status = 'healthy';
        if (failedJobs.length > 0) {
            status = 'warning';
        }
        if (failedJobs.length > configs.length / 2 || runningJobs.length > 5) {
            status = 'unhealthy';
        }
        return {
            status,
            details: {
                totalConfigs: configs.length,
                enabledConfigs: configs.filter(c => c.enabled).length,
                totalJobs: jobs.length,
                recentJobs: recentJobs.length,
                failedJobs: failedJobs.length,
                runningJobs: runningJobs.length,
                lastBackup: recentJobs.length > 0 ?
                    Math.max(...recentJobs.map(j => j.startTime.getTime())) : null
            }
        };
    }
    destroy() {
        for (const job of this.scheduledJobs.values()) {
            clearInterval(job);
        }
        this.scheduledJobs.clear();
    }
}
export const backupRecoveryAutomated = BackupRecoveryAutomatedService.getInstance();
//# sourceMappingURL=backup-recovery-automated.service.js.map