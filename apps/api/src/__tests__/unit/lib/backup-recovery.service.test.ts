import { describe, it, expect, beforeEach } from 'vitest';
import {
  BackupRecoveryService,
  BackupConfig,
  BackupJob,
  RecoveryJob
} from '../../../lib/backup-recovery.service.js';

describe('BackupRecoveryService', () => {
  let service: BackupRecoveryService;

  beforeEach(() => {
    service = new BackupRecoveryService();
  });

  describe('Service Initialization', () => {
    it('should initialize with default backup configurations', async () => {
      const configs = await service.getBackupConfigs();
      expect(configs.length).toBeGreaterThan(0);

      const dbBackup = configs.find(c => c.name === 'Database Full Backup');
      expect(dbBackup).toBeDefined();
      expect(dbBackup?.type).toBe('database');
      expect(dbBackup?.schedule.enabled).toBe(true);
    });

    it('should have default configurations for different types', async () => {
      const configs = await service.getBackupConfigs();

      const types = configs.map(c => c.type);
      expect(types).toContain('database');
      expect(types).toContain('files');
      expect(types).toContain('configuration');
    });
  });

  describe('Backup Configuration Management', () => {
    it('should create a new backup configuration', async () => {
      const configData = {
        name: 'Test Backup Config',
        description: 'Test backup configuration',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          connectionString: 'postgresql://test:test@localhost:5432/test',
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './test-backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 7,
            maxBackups: 10
          }
        },
        isActive: true,
        createdBy: 'test-user'
      };

      const config = await service.createBackupConfig(configData);

      expect(config.id).toBeDefined();
      expect(config.name).toBe('Test Backup Config');
      expect(config.type).toBe('database');
      expect(config.createdAt).toBeDefined();
    });

    it('should retrieve backup configuration by ID', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      const retrieved = await service.getBackupConfig(firstConfig.id!);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstConfig.id);
      expect(retrieved?.name).toBe(firstConfig.name);
    });

    it('should update backup configuration', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      // Only update fields that don't require validation
      const updated = await service.updateBackupConfig(firstConfig.id!, {
        name: 'Updated Backup Config',
        updatedBy: 'test-user'
      }, 'test-user');

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Backup Config');
      expect(updated?.updatedBy).toBe('test-user');
    });

    it('should delete backup configuration', async () => {
      const configData = {
        name: 'Delete Test Config',
        description: 'Config to delete',
        type: 'files' as const,
        source: {
          type: 'filesystem' as const,
          path: './test-files',
          includeData: true,
          includeSchema: false
        },
        destination: {
          type: 'local' as const,
          path: './test-backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 7,
            maxBackups: 10
          }
        },
        isActive: true,
        createdBy: 'test-user'
      };

      const config = await service.createBackupConfig(configData);
      const deleted = await service.deleteBackupConfig(config.id!, 'test-user');

      expect(deleted).toBe(true);

      const retrieved = await service.getBackupConfig(config.id!);
      expect(retrieved).toBeNull();
    });
  });

  describe('Backup Configuration Validation', () => {
    it('should validate backup configuration successfully', async () => {
      const config = {
        name: 'Valid Config',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          connectionString: 'postgresql://test:test@localhost:5432/test',
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 30,
            maxBackups: 100
          }
        }
      };

      const validation = await service.validateBackupConfig(config);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', async () => {
      const config = {
        name: '',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 30,
            maxBackups: 100
          }
        }
      };

      const validation = await service.validateBackupConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('name is required'))).toBe(true);
    });

    it('should fail validation for database backup without connection string', async () => {
      const config = {
        name: 'Invalid DB Config',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 30,
            maxBackups: 100
          }
        }
      };

      const validation = await service.validateBackupConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('connection string is required'))).toBe(true);
    });

    it('should fail validation for filesystem backup without path', async () => {
      const config = {
        name: 'Invalid FS Config',
        type: 'files' as const,
        source: {
          type: 'filesystem' as const,
          includeData: true,
          includeSchema: false
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 30,
            maxBackups: 100
          }
        }
      };

      const validation = await service.validateBackupConfig(config);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('path is required'))).toBe(true);
    });

    it('should provide estimated size and duration', async () => {
      const config = {
        name: 'Test Config',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          connectionString: 'postgresql://test:test@localhost:5432/test',
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 30,
            maxBackups: 100
          }
        }
      };

      const validation = await service.validateBackupConfig(config);
      expect(validation.estimatedSize).toBeGreaterThan(0);
      expect(validation.estimatedDuration).toBeGreaterThan(0);
    });
  });

  describe('Backup Execution', () => {
    it('should execute manual backup', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      const job = await service.executeBackup(firstConfig.id!, 'test-user', 'manual');

      expect(job.id).toBeDefined();
      expect(job.configId).toBe(firstConfig.id);
      expect(job.type).toBe('manual');
      expect(['pending', 'running']).toContain(job.status);
      expect(job.createdBy).toBe('test-user');
    });

    it('should execute scheduled backup', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      const job = await service.executeBackup(firstConfig.id!, 'system', 'scheduled');

      expect(job.id).toBeDefined();
      expect(job.configId).toBe(firstConfig.id);
      expect(job.type).toBe('scheduled');
      expect(['pending', 'running']).toContain(job.status);
      expect(job.createdBy).toBe('system');
    });

    it('should fail to execute backup for non-existent config', async () => {
      await expect(service.executeBackup('non-existent-id', 'test-user')).rejects.toThrow();
    });
  });

  describe('Backup Job Management', () => {
    it('should retrieve backup jobs', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      // Execute a backup to create a job
      await service.executeBackup(firstConfig.id!, 'test-user');

      const jobs = await service.getBackupJobs();
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should retrieve backup job by ID', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      const job = await service.executeBackup(firstConfig.id!, 'test-user');
      const retrieved = await service.getBackupJob(job.id!);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(job.id);
      expect(retrieved?.configId).toBe(firstConfig.id);
    });

    it('should filter backup jobs by config ID', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      await service.executeBackup(firstConfig.id!, 'test-user');

      const jobs = await service.getBackupJobs({ configId: firstConfig.id });
      expect(jobs.every(j => j.configId === firstConfig.id)).toBe(true);
    });

    it('should filter backup jobs by status', async () => {
      const jobs = await service.getBackupJobs({ status: 'pending' });
      expect(jobs.every(j => j.status === 'pending')).toBe(true);
    });

    it('should filter backup jobs by type', async () => {
      const jobs = await service.getBackupJobs({ type: 'manual' });
      expect(jobs.every(j => j.type === 'manual')).toBe(true);
    });

    it('should cancel running backup job', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      const job = await service.executeBackup(firstConfig.id!, 'test-user');

      // Simulate job running
      const retrievedJob = await service.getBackupJob(job.id!);
      if (retrievedJob) {
        retrievedJob.status = 'running';
      }

      const cancelled = await service.cancelBackupJob(job.id!);
      expect(cancelled).toBe(true);
    });

    it('should not cancel non-existent backup job', async () => {
      const cancelled = await service.cancelBackupJob('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  describe('Recovery Operations', () => {
    it('should execute recovery from completed backup', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      // Execute a backup
      const backupJob = await service.executeBackup(firstConfig.id!, 'test-user');

      // Simulate completed backup
      const retrievedJob = await service.getBackupJob(backupJob.id!);
      if (retrievedJob) {
        retrievedJob.status = 'completed';
        retrievedJob.size = 1024 * 1024; // 1MB
        retrievedJob.filesCount = 1;
      }

      const target = {
        type: 'database' as const,
        connectionString: 'postgresql://test:test@localhost:5432/test'
      };

      const options = {
        overwrite: false,
        verify: true,
        restoreSchema: true,
        restoreData: true
      };

      const recoveryJob = await service.executeRecovery(
        backupJob.id!,
        target,
        options,
        'test-user'
      );

      expect(recoveryJob.id).toBeDefined();
      expect(recoveryJob.backupId).toBe(backupJob.id);
      expect(['pending', 'running']).toContain(recoveryJob.status);
      expect(recoveryJob.createdBy).toBe('test-user');
    });

    it('should fail to recover from non-existent backup', async () => {
      const target = {
        type: 'database' as const,
        connectionString: 'postgresql://test:test@localhost:5432/test'
      };

      const options = {
        overwrite: false,
        verify: true,
        restoreSchema: true,
        restoreData: true
      };

      await expect(service.executeRecovery('non-existent-id', target, options, 'test-user')).rejects.toThrow();
    });

    it('should fail to recover from incomplete backup', async () => {
      const configs = await service.getBackupConfigs();
      const firstConfig = configs[0];

      const backupJob = await service.executeBackup(firstConfig.id!, 'test-user');

      const target = {
        type: 'database' as const,
        connectionString: 'postgresql://test:test@localhost:5432/test'
      };

      const options = {
        overwrite: false,
        verify: true,
        restoreSchema: true,
        restoreData: true
      };

      await expect(service.executeRecovery(backupJob.id!, target, options, 'test-user')).rejects.toThrow();
    });

    it('should retrieve recovery jobs', async () => {
      const recoveryJobs = await service.getRecoveryJobs();
      expect(Array.isArray(recoveryJobs)).toBe(true);
    });

    it('should retrieve recovery job by ID', async () => {
      const recoveryJobs = await service.getRecoveryJobs();
      if (recoveryJobs.length > 0) {
        const firstJob = recoveryJobs[0];
        const retrieved = await service.getRecoveryJob(firstJob.id!);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(firstJob.id);
      }
    });
  });

  describe('Statistics', () => {
    it('should retrieve backup statistics', async () => {
      const stats = await service.getBackupStats();

      expect(stats.totalBackups).toBeGreaterThanOrEqual(0);
      expect(stats.successfulBackups).toBeGreaterThanOrEqual(0);
      expect(stats.failedBackups).toBeGreaterThanOrEqual(0);
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
      expect(stats.backupsByType).toBeDefined();
      expect(stats.storageUsed).toBeGreaterThanOrEqual(0);
    });

    it('should retrieve recovery statistics', async () => {
      const stats = await service.getRecoveryStats();

      expect(stats.totalRecoveries).toBeGreaterThanOrEqual(0);
      expect(stats.successfulRecoveries).toBeGreaterThanOrEqual(0);
      expect(stats.failedRecoveries).toBeGreaterThanOrEqual(0);
      expect(stats.averageRecoveryTime).toBeGreaterThanOrEqual(0);
      expect(stats.recoveriesByType).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent backup configuration', async () => {
      const config = await service.getBackupConfig('non-existent-id');
      expect(config).toBeNull();
    });

    it('should handle non-existent backup job', async () => {
      const job = await service.getBackupJob('non-existent-id');
      expect(job).toBeNull();
    });

    it('should handle non-existent recovery job', async () => {
      const job = await service.getRecoveryJob('non-existent-id');
      expect(job).toBeNull();
    });

    it('should handle update of non-existent backup configuration', async () => {
      const updated = await service.updateBackupConfig('non-existent-id', { name: 'Updated' }, 'test-user');
      expect(updated).toBeNull();
    });

    it('should handle delete of non-existent backup configuration', async () => {
      const deleted = await service.deleteBackupConfig('non-existent-id', 'test-user');
      expect(deleted).toBe(false);
    });

    it('should handle backup configuration with invalid schedule', async () => {
      const configData = {
        name: 'Invalid Schedule Config',
        description: 'Config with invalid schedule',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          connectionString: 'postgresql://test:test@localhost:5432/test',
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: true,
          // Missing cron expression
          timezone: 'UTC',
          retention: {
            days: 30,
            maxBackups: 100
          }
        },
        isActive: true,
        createdBy: 'test-user'
      };

      await expect(service.createBackupConfig(configData)).rejects.toThrow();
    });

    it('should handle backup configuration with invalid retention', async () => {
      const configData = {
        name: 'Invalid Retention Config',
        description: 'Config with invalid retention',
        type: 'database' as const,
        source: {
          type: 'database' as const,
          connectionString: 'postgresql://test:test@localhost:5432/test',
          includeData: true,
          includeSchema: true
        },
        destination: {
          type: 'local' as const,
          path: './backups',
          compression: true,
          encryption: true
        },
        schedule: {
          enabled: false,
          timezone: 'UTC',
          retention: {
            days: 0, // Invalid: must be >= 1
            maxBackups: 100
          }
        },
        isActive: true,
        createdBy: 'test-user'
      };

      await expect(service.createBackupConfig(configData)).rejects.toThrow();
    });
  });
});
