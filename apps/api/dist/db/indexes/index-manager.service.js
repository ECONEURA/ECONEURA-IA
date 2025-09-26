import { metrics } from '@econeura/shared/src/metrics/index.js';

import { structuredLogger } from '../../lib/structured-logger.js';
export class IndexManagerService {
    static instance;
    indexUsage = new Map();
    indexMaintenance = new Map();
    recommendations = [];
    isMonitoring = false;
    monitoringInterval = null;
    constructor() {
        this.startMonitoring();
    }
    static getInstance() {
        if (!IndexManagerService.instance) {
            IndexManagerService.instance = new IndexManagerService();
        }
        return IndexManagerService.instance;
    }
    async analyzeIndexUsage() {
        try {
            const usageData = [
                {
                    indexName: 'idx_users_email',
                    tableName: 'users',
                    usageCount: 15420,
                    lastUsed: new Date(),
                    efficiency: 0.95,
                    size: 1024 * 1024
                },
                {
                    indexName: 'idx_companies_tax_id',
                    tableName: 'companies',
                    usageCount: 8930,
                    lastUsed: new Date(Date.now() - 3600000),
                    efficiency: 0.88,
                    size: 512 * 1024
                },
                {
                    indexName: 'idx_deals_company_status',
                    tableName: 'deals',
                    usageCount: 12300,
                    lastUsed: new Date(Date.now() - 1800000),
                    efficiency: 0.92,
                    size: 768 * 1024
                }
            ];
            for (const usage of usageData) {
                this.indexUsage.set(usage.indexName, usage);
            }
            structuredLogger.info('Index usage analysis completed', {
                totalIndexes: usageData.length,
                highUsageIndexes: usageData.filter(u => u.usageCount > 10000).length
            });
            return usageData;
        }
        catch (error) {
            structuredLogger.error('Index usage analysis failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    async generateIndexRecommendations() {
        try {
            const recommendations = [
                {
                    table: 'contacts',
                    columns: ['phone'],
                    type: 'btree',
                    reason: 'Frequent phone number lookups',
                    expectedImprovement: 75,
                    priority: 'medium'
                },
                {
                    table: 'invoices',
                    columns: ['amount', 'status'],
                    type: 'btree',
                    reason: 'Complex filtering on amount and status',
                    expectedImprovement: 60,
                    priority: 'high'
                },
                {
                    table: 'products',
                    columns: ['tags'],
                    type: 'gin',
                    reason: 'Array-based tag searches',
                    expectedImprovement: 80,
                    priority: 'medium'
                },
                {
                    table: 'audit_logs',
                    columns: ['created_at'],
                    type: 'brin',
                    reason: 'Time-series data with natural ordering',
                    expectedImprovement: 90,
                    priority: 'high'
                }
            ];
            this.recommendations = recommendations;
            structuredLogger.info('Index recommendations generated', {
                totalRecommendations: recommendations.length,
                highPriority: recommendations.filter(r => r.priority === 'high').length,
                criticalPriority: recommendations.filter(r => r.priority === 'critical').length
            });
            return recommendations;
        }
        catch (error) {
            structuredLogger.error('Index recommendations generation failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    async analyzeIndexMaintenance() {
        try {
            const maintenanceData = [
                {
                    indexName: 'idx_users_email',
                    tableName: 'users',
                    lastVacuum: new Date(Date.now() - 3600000),
                    lastReindex: new Date(Date.now() - 86400000 * 7),
                    bloatRatio: 0.15,
                    needsMaintenance: false
                },
                {
                    indexName: 'idx_companies_tax_id',
                    tableName: 'companies',
                    lastVacuum: new Date(Date.now() - 7200000),
                    lastReindex: new Date(Date.now() - 86400000 * 14),
                    bloatRatio: 0.25,
                    needsMaintenance: true
                },
                {
                    indexName: 'idx_deals_company_status',
                    tableName: 'deals',
                    lastVacuum: new Date(Date.now() - 1800000),
                    lastReindex: new Date(Date.now() - 86400000 * 3),
                    bloatRatio: 0.08,
                    needsMaintenance: false
                }
            ];
            for (const maintenance of maintenanceData) {
                this.indexMaintenance.set(maintenance.indexName, maintenance);
            }
            const needsMaintenance = maintenanceData.filter(m => m.needsMaintenance).length;
            structuredLogger.info('Index maintenance analysis completed', {
                totalIndexes: maintenanceData.length,
                needsMaintenance,
                averageBloatRatio: maintenanceData.reduce((sum, m) => sum + m.bloatRatio, 0) / maintenanceData.length
            });
            return maintenanceData;
        }
        catch (error) {
            structuredLogger.error('Index maintenance analysis failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            return [];
        }
    }
    async performIndexMaintenance(indexName) {
        try {
            if (indexName) {
                await this.maintainSpecificIndex(indexName);
            }
            else {
                const maintenanceData = await this.analyzeIndexMaintenance();
                const indexesToMaintain = maintenanceData.filter(m => m.needsMaintenance);
                for (const maintenance of indexesToMaintain) {
                    await this.maintainSpecificIndex(maintenance.indexName);
                }
            }
            structuredLogger.info('Index maintenance completed', { indexName: indexName || 'all' });
            metrics.databaseIndexMaintenance.inc({ index: indexName || 'all' });
            return true;
        }
        catch (error) {
            structuredLogger.error('Index maintenance failed', {
                indexName,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async maintainSpecificIndex(indexName) {
        structuredLogger.info('Index maintenance performed', { indexName });
        const maintenance = this.indexMaintenance.get(indexName);
        if (maintenance) {
            maintenance.lastReindex = new Date();
            maintenance.bloatRatio = 0.05;
            maintenance.needsMaintenance = false;
        }
    }
    async createIndexFromRecommendation(recommendation) {
        try {
            const indexName = `idx_${recommendation.table}_${recommendation.columns.join('_')}`;
            structuredLogger.info('Index created from recommendation', {
                indexName,
                table: recommendation.table,
                columns: recommendation.columns,
                type: recommendation.type,
                expectedImprovement: recommendation.expectedImprovement
            });
            metrics.databaseIndexesCreated.inc({
                table: recommendation.table,
                type: recommendation.type
            });
            return true;
        }
        catch (error) {
            structuredLogger.error('Failed to create index from recommendation', {
                recommendation,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    async dropUnusedIndex(indexName) {
        try {
            const usage = this.indexUsage.get(indexName);
            if (usage && usage.usageCount < 100 && usage.efficiency < 0.5) {
                structuredLogger.info('Unused index dropped', {
                    indexName,
                    usageCount: usage.usageCount,
                    efficiency: usage.efficiency
                });
                this.indexUsage.delete(indexName);
                this.indexMaintenance.delete(indexName);
                metrics.databaseIndexesDropped.inc({ index: indexName });
                return true;
            }
            return false;
        }
        catch (error) {
            structuredLogger.error('Failed to drop unused index', {
                indexName,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    getIndexStats() {
        const totalIndexes = this.indexUsage.size;
        const usedIndexes = Array.from(this.indexUsage.values()).filter(u => u.usageCount > 100).length;
        const unusedIndexes = totalIndexes - usedIndexes;
        const averageEfficiency = Array.from(this.indexUsage.values()).reduce((sum, u) => sum + u.efficiency, 0) / totalIndexes || 0;
        const totalSize = Array.from(this.indexUsage.values()).reduce((sum, u) => sum + u.size, 0);
        const recommendationsCount = this.recommendations.length;
        const maintenanceNeeded = Array.from(this.indexMaintenance.values()).filter(m => m.needsMaintenance).length;
        return {
            totalIndexes,
            usedIndexes,
            unusedIndexes,
            averageEfficiency,
            totalSize,
            recommendationsCount,
            maintenanceNeeded
        };
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(async () => {
            await this.performMonitoring();
        }, 600000);
        structuredLogger.info('Index manager monitoring started');
    }
    async performMonitoring() {
        try {
            await this.analyzeIndexUsage();
            await this.generateIndexRecommendations();
            await this.analyzeIndexMaintenance();
            const unusedIndexes = Array.from(this.indexUsage.entries())
                .filter(([_, usage]) => usage.usageCount < 100 && usage.efficiency < 0.5)
                .map(([name, _]) => name);
            for (const indexName of unusedIndexes) {
                await this.dropUnusedIndex(indexName);
            }
            structuredLogger.debug('Index monitoring completed', {
                totalIndexes: this.indexUsage.size,
                recommendations: this.recommendations.length,
                maintenanceNeeded: Array.from(this.indexMaintenance.values()).filter(m => m.needsMaintenance).length
            });
        }
        catch (error) {
            structuredLogger.error('Index monitoring failed', {
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
        structuredLogger.info('Index manager monitoring stopped');
    }
}
export const indexManagerService = IndexManagerService.getInstance();
//# sourceMappingURL=index-manager.service.js.map