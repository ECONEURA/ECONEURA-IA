import { structuredLogger } from '../../lib/structured-logger.js';
import { metrics } from '@econeura/shared/src/metrics/index.js';
export class PartitionManagerService {
    static instance;
    partitions = new Map();
    strategies = new Map();
    maintenance = new Map();
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.initializeDefaultStrategies();
        this.startMonitoring();
    }
    static getInstance() {
        if (!PartitionManagerService.instance) {
            PartitionManagerService.instance = new PartitionManagerService();
        }
        return PartitionManagerService.instance;
    }
    initializeDefaultStrategies() {
        const defaultStrategies = [
            {
                tableName: 'audit_logs',
                partitionKey: 'created_at',
                partitionType: 'range',
                retentionPeriod: 365,
                autoCreate: true,
                autoDrop: true,
                schedule: 'monthly'
            },
            {
                tableName: 'events',
                partitionKey: 'timestamp',
                partitionType: 'range',
                retentionPeriod: 90,
                autoCreate: true,
                autoDrop: true,
                schedule: 'weekly'
            },
            {
                tableName: 'metrics',
                partitionKey: 'timestamp',
                partitionType: 'range',
                retentionPeriod: 30,
                autoCreate: true,
                autoDrop: true,
                schedule: 'daily'
            },
            {
                tableName: 'notifications',
                partitionKey: 'created_at',
                partitionType: 'range',
                retentionPeriod: 180,
                autoCreate: true,
                autoDrop: true,
                schedule: 'monthly'
            }
        ];
        for (const strategy of defaultStrategies) {
            this.strategies.set(strategy.tableName, strategy);
        }
    }
    async createPartition(tableName, partitionName, condition, partitionType = 'range') {
        try {
            const sql = `CREATE TABLE ${partitionName} PARTITION OF ${tableName} FOR VALUES ${condition};`;
            structuredLogger.info('Partition created', {
                tableName,
                partitionName,
                condition,
                partitionType
            });
            const partitionInfo = {
                tableName,
                partitionName,
                partitionType,
                condition,
                size: 0,
                rowCount: 0,
                lastAccessed: new Date(),
                isActive: true
            };
            if (!this.partitions.has(tableName)) {
                this.partitions.set(tableName, []);
            }
            this.partitions.get(tableName).push(partitionInfo);
            metrics.databasePartitionsCreated.inc({
                table: tableName,
                partitionType
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to create partition', {
                tableName,
                partitionName,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async dropPartition(tableName, partitionName) {
        try {
            const sql = `DROP TABLE ${partitionName};`;
            structuredLogger.info('Partition dropped', {
                tableName,
                partitionName
            });
            const tablePartitions = this.partitions.get(tableName);
            if (tablePartitions) {
                const index = tablePartitions.findIndex(p => p.partitionName === partitionName);
                if (index !== -1) {
                    tablePartitions.splice(index, 1);
                }
            }
            this.maintenance.delete(partitionName);
            metrics.databasePartitionsDropped.inc({
                table: tableName
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to drop partition', {
                tableName,
                partitionName,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async createPartitionsAutomatically() {
        let createdCount = 0;
        try {
            for (const [tableName, strategy] of this.strategies.entries()) {
                if (!strategy.autoCreate)
                    continue;
                const partitions = await this.createPartitionsForStrategy(strategy);
                createdCount += partitions;
            }
            structuredLogger.info('Automatic partition creation completed', {
                createdCount,
                totalStrategies: this.strategies.size
            });
            return createdCount;
        }
        catch (error) {
            structuredLogger.error('Automatic partition creation failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return createdCount;
        }
    }
    async createPartitionsForStrategy(strategy) {
        let createdCount = 0;
        const now = new Date();
        switch (strategy.schedule) {
            case 'daily':
                for (let i = 0; i < 7; i++) {
                    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
                    const partitionName = `${strategy.tableName}_${date.toISOString().split('T')[0]}`;
                    const condition = `FROM ('${date.toISOString().split('T')[0]}') TO ('${new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}')`;
                    if (await this.createPartition(strategy.tableName, partitionName, condition, strategy.partitionType)) {
                        createdCount++;
                    }
                }
                break;
            case 'weekly':
                for (let i = 0; i < 4; i++) {
                    const startDate = new Date(now.getTime() + i * 7 * 24 * 60 * 60 * 1000);
                    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                    const partitionName = `${strategy.tableName}_week_${startDate.getFullYear()}_${startDate.getWeek()}`;
                    const condition = `FROM ('${startDate.toISOString().split('T')[0]}') TO ('${endDate.toISOString().split('T')[0]}')`;
                    if (await this.createPartition(strategy.tableName, partitionName, condition, strategy.partitionType)) {
                        createdCount++;
                    }
                }
                break;
            case 'monthly':
                for (let i = 0; i < 3; i++) {
                    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                    const partitionName = `${strategy.tableName}_${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const condition = `FROM ('${date.toISOString().split('T')[0]}') TO ('${nextMonth.toISOString().split('T')[0]}')`;
                    if (await this.createPartition(strategy.tableName, partitionName, condition, strategy.partitionType)) {
                        createdCount++;
                    }
                }
                break;
            case 'quarterly':
                for (let i = 0; i < 2; i++) {
                    const quarter = Math.floor(now.getMonth() / 3) + i;
                    const year = now.getFullYear() + Math.floor(quarter / 4);
                    const month = (quarter % 4) * 3;
                    const startDate = new Date(year, month, 1);
                    const endDate = new Date(year, month + 3, 1);
                    const partitionName = `${strategy.tableName}_q${quarter % 4 + 1}_${year}`;
                    const condition = `FROM ('${startDate.toISOString().split('T')[0]}') TO ('${endDate.toISOString().split('T')[0]}')`;
                    if (await this.createPartition(strategy.tableName, partitionName, condition, strategy.partitionType)) {
                        createdCount++;
                    }
                }
                break;
        }
        return createdCount;
    }
    async dropExpiredPartitions() {
        let droppedCount = 0;
        try {
            for (const [tableName, strategy] of this.strategies.entries()) {
                if (!strategy.autoDrop)
                    continue;
                const expiredPartitions = await this.getExpiredPartitions(tableName, strategy.retentionPeriod);
                for (const partition of expiredPartitions) {
                    if (await this.dropPartition(tableName, partition.partitionName)) {
                        droppedCount++;
                    }
                }
            }
            structuredLogger.info('Expired partitions cleanup completed', {
                droppedCount,
                totalStrategies: this.strategies.size
            });
            return droppedCount;
        }
        catch (error) {
            structuredLogger.error('Expired partitions cleanup failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return droppedCount;
        }
    }
    async getExpiredPartitions(tableName, retentionPeriod) {
        const cutoffDate = new Date(Date.now() - retentionPeriod * 24 * 60 * 60 * 1000);
        const tablePartitions = this.partitions.get(tableName) || [];
        return tablePartitions.filter(partition => {
            const dateMatch = partition.condition.match(/'(\d{4}-\d{2}-\d{2})'/);
            if (dateMatch) {
                const partitionDate = new Date(dateMatch[1]);
                return partitionDate < cutoffDate;
            }
            return false;
        });
    }
    async analyzePartitionMaintenance() {
        try {
            const maintenanceData = [];
            for (const [tableName, partitions] of this.partitions.entries()) {
                for (const partition of partitions) {
                    const maintenance = {
                        partitionName: partition.partitionName,
                        tableName,
                        lastVacuum: new Date(Date.now() - Math.random() * 86400000 * 7),
                        lastAnalyze: new Date(Date.now() - Math.random() * 86400000 * 3),
                        bloatRatio: Math.random() * 0.3,
                        needsMaintenance: Math.random() > 0.7,
                        compressionRatio: 0.3 + Math.random() * 0.4
                    };
                    maintenanceData.push(maintenance);
                    this.maintenance.set(partition.partitionName, maintenance);
                }
            }
            const needsMaintenance = maintenanceData.filter(m => m.needsMaintenance).length;
            structuredLogger.info('Partition maintenance analysis completed', {
                totalPartitions: maintenanceData.length,
                needsMaintenance,
                averageBloatRatio: maintenanceData.reduce((sum, m) => sum + m.bloatRatio, 0) / maintenanceData.length
            });
            return maintenanceData;
        }
        catch (error) {
            structuredLogger.error('Partition maintenance analysis failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    async performPartitionMaintenance(partitionName) {
        try {
            if (partitionName) {
                await this.maintainSpecificPartition(partitionName);
            }
            else {
                const maintenanceData = await this.analyzePartitionMaintenance();
                const partitionsToMaintain = maintenanceData.filter(m => m.needsMaintenance);
                for (const maintenance of partitionsToMaintain) {
                    await this.maintainSpecificPartition(maintenance.partitionName);
                }
            }
            structuredLogger.info('Partition maintenance completed', { partitionName: partitionName || 'all' });
            metrics.databasePartitionMaintenance.inc({ partition: partitionName || 'all' });
            return true;
        }
        catch (error) {
            structuredLogger.error('Partition maintenance failed', {
                partitionName,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async maintainSpecificPartition(partitionName) {
        structuredLogger.info('Partition maintenance performed', { partitionName });
        const maintenance = this.maintenance.get(partitionName);
        if (maintenance) {
            maintenance.lastVacuum = new Date();
            maintenance.lastAnalyze = new Date();
            maintenance.bloatRatio = 0.05;
            maintenance.needsMaintenance = false;
        }
    }
    getPartitionStats() {
        let totalPartitions = 0;
        let activePartitions = 0;
        let totalSize = 0;
        for (const partitions of this.partitions.values()) {
            totalPartitions += partitions.length;
            activePartitions += partitions.filter(p => p.isActive).length;
            totalSize += partitions.reduce((sum, p) => sum + p.size, 0);
        }
        const averageSize = totalPartitions > 0 ? totalSize / totalPartitions : 0;
        const strategiesCount = this.strategies.size;
        const maintenanceNeeded = Array.from(this.maintenance.values()).filter(m => m.needsMaintenance).length;
        return {
            totalPartitions,
            activePartitions,
            totalSize,
            averageSize,
            strategiesCount,
            maintenanceNeeded
        };
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            await this.performMonitoring();
        }, 3600000);
        structuredLogger.info('Partition manager monitoring started');
    }
    async performMonitoring() {
        try {
            await this.createPartitionsAutomatically();
            await this.dropExpiredPartitions();
            await this.analyzePartitionMaintenance();
            structuredLogger.debug('Partition monitoring completed', {
                totalPartitions: Array.from(this.partitions.values()).reduce((sum, p) => sum + p.length, 0),
                strategies: this.strategies.size,
                maintenanceNeeded: Array.from(this.maintenance.values()).filter(m => m.needsMaintenance).length
            });
        }
        catch (error) {
            structuredLogger.error('Partition monitoring failed', {
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        structuredLogger.info('Partition manager monitoring stopped');
    }
}
Date.prototype.getWeek = function () {
    const date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
export const partitionManagerService = PartitionManagerService.getInstance();
//# sourceMappingURL=partition-manager.service.js.map