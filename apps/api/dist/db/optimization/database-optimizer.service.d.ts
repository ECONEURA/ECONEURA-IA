export interface IndexDefinition {
    name: string;
    table: string;
    columns: string[];
    type: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
    unique: boolean;
    partial?: string;
    include?: string[];
    concurrent: boolean;
}
export interface PartitionConfig {
    table: string;
    partitionKey: string;
    partitionType: 'range' | 'list' | 'hash';
    partitions: PartitionDefinition[];
}
export interface PartitionDefinition {
    name: string;
    condition: string;
    tablespace?: string;
}
export interface QueryOptimization {
    query: string;
    originalPlan: any;
    optimizedPlan: any;
    improvement: number;
    recommendations: string[];
    executionTime: number;
}
export interface DatabaseStats {
    totalTables: number;
    totalIndexes: number;
    totalSize: number;
    indexSize: number;
    tableSize: number;
    connectionCount: number;
    activeQueries: number;
    slowQueries: number;
    cacheHitRatio: number;
    lastVacuum: Date;
    lastAnalyze: Date;
}
export interface OptimizationConfig {
    autoIndex: boolean;
    autoVacuum: boolean;
    autoAnalyze: boolean;
    slowQueryThreshold: number;
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    enablePartitioning: boolean;
    enableCompression: boolean;
}
export declare class DatabaseOptimizerService {
    private static instance;
    private config;
    private indexes;
    private partitions;
    private queryCache;
    private slowQueries;
    private isOptimizing;
    private optimizationInterval;
    private constructor();
    static getInstance(): DatabaseOptimizerService;
    private getDefaultConfig;
    private initializeDefaultIndexes;
    private initializeDefaultPartitions;
    private startOptimization;
    optimizeQuery(query: string, params?: any[]): Promise<QueryOptimization>;
    createIndex(indexDef: IndexDefinition): Promise<boolean>;
    createPartitions(partitionConfig: PartitionConfig): Promise<boolean>;
    performVacuum(table?: string): Promise<boolean>;
    performAnalyze(table?: string): Promise<boolean>;
    getDatabaseStats(): Promise<DatabaseStats>;
    private analyzeQuery;
    private generateRecommendations;
    private optimizeQueryString;
    private calculateImprovement;
    private generateQueryCacheKey;
    private isQueryCacheValid;
    private generateCreateIndexSQL;
    private generateCreatePartitionSQL;
    private recordSlowQuery;
    private recordQueryOptimizationMetrics;
    private performAutomaticOptimizations;
    private cleanupExpiredQueryCache;
    private analyzeSlowQueries;
    updateConfig(newConfig: Partial<OptimizationConfig>): void;
    stop(): void;
}
export declare const databaseOptimizerService: DatabaseOptimizerService;
//# sourceMappingURL=database-optimizer.service.d.ts.map