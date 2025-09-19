export interface PartitionInfo {
    tableName: string;
    partitionName: string;
    partitionType: 'range' | 'list' | 'hash';
    condition: string;
    size: number;
    rowCount: number;
    lastAccessed: Date;
    isActive: boolean;
}
export interface PartitionStrategy {
    tableName: string;
    partitionKey: string;
    partitionType: 'range' | 'list' | 'hash';
    retentionPeriod: number;
    autoCreate: boolean;
    autoDrop: boolean;
    schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}
export interface PartitionMaintenance {
    partitionName: string;
    tableName: string;
    lastVacuum: Date;
    lastAnalyze: Date;
    bloatRatio: number;
    needsMaintenance: boolean;
    compressionRatio: number;
}
export declare class PartitionManagerService {
    private static instance;
    private partitions;
    private strategies;
    private maintenance;
    private isMonitoring;
    private monitoringInterval;
    private constructor();
    static getInstance(): PartitionManagerService;
    private initializeDefaultStrategies;
    createPartition(tableName: string, partitionName: string, condition: string, partitionType?: 'range' | 'list' | 'hash'): Promise<boolean>;
    dropPartition(tableName: string, partitionName: string): Promise<boolean>;
    createPartitionsAutomatically(): Promise<number>;
    private createPartitionsForStrategy;
    dropExpiredPartitions(): Promise<number>;
    private getExpiredPartitions;
    analyzePartitionMaintenance(): Promise<PartitionMaintenance[]>;
    performPartitionMaintenance(partitionName?: string): Promise<boolean>;
    private maintainSpecificPartition;
    getPartitionStats(): {
        totalPartitions: number;
        activePartitions: number;
        totalSize: number;
        averageSize: number;
        strategiesCount: number;
        maintenanceNeeded: number;
    };
    private startMonitoring;
    private performMonitoring;
    stop(): void;
}
declare global {
    interface Date {
        getWeek(): number;
    }
}
export declare const partitionManagerService: PartitionManagerService;
//# sourceMappingURL=partition-manager.service.d.ts.map