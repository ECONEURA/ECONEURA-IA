export interface IndexUsage {
    indexName: string;
    tableName: string;
    usageCount: number;
    lastUsed: Date;
    efficiency: number;
    size: number;
}
export interface IndexRecommendation {
    table: string;
    columns: string[];
    type: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
    reason: string;
    expectedImprovement: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface IndexMaintenance {
    indexName: string;
    tableName: string;
    lastVacuum: Date;
    lastReindex: Date;
    bloatRatio: number;
    needsMaintenance: boolean;
}
export declare class IndexManagerService {
    private static instance;
    private indexUsage;
    private indexMaintenance;
    private recommendations;
    private isMonitoring;
    private monitoringInterval;
    private constructor();
    static getInstance(): IndexManagerService;
    analyzeIndexUsage(): Promise<IndexUsage[]>;
    generateIndexRecommendations(): Promise<IndexRecommendation[]>;
    analyzeIndexMaintenance(): Promise<IndexMaintenance[]>;
    performIndexMaintenance(indexName?: string): Promise<boolean>;
    private maintainSpecificIndex;
    createIndexFromRecommendation(recommendation: IndexRecommendation): Promise<boolean>;
    dropUnusedIndex(indexName: string): Promise<boolean>;
    getIndexStats(): {
        totalIndexes: number;
        usedIndexes: number;
        unusedIndexes: number;
        averageEfficiency: number;
        totalSize: number;
        recommendationsCount: number;
        maintenanceNeeded: number;
    };
    private startMonitoring;
    private performMonitoring;
    stop(): void;
}
export declare const indexManagerService: IndexManagerService;
//# sourceMappingURL=index-manager.service.d.ts.map