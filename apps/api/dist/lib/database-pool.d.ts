export interface PoolConfig {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
    propagateCreateError: boolean;
}
export interface QueryOptions {
    timeout?: number;
    retries?: number;
    cache?: boolean;
    cacheTtl?: number;
    transaction?: boolean;
    isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}
export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
    fields: Array<{
        name: string;
        type: string;
    }>;
    duration: number;
    cached: boolean;
}
export interface Transaction {
    id: string;
    startTime: Date;
    queries: Array<{
        sql: string;
        params: any[];
        duration: number;
    }>;
    rollback: () => Promise<void>;
    commit: () => Promise<void>;
}
export declare class DatabasePool {
    private static instance;
    private connections;
    private availableConnections;
    private config;
    private stats;
    constructor(config?: Partial<PoolConfig>);
    static getInstance(config?: Partial<PoolConfig>): DatabasePool;
    private initializePool;
    private createConnection;
    private acquireConnection;
    private releaseConnection;
    private startMaintenance;
    private cleanupIdleConnections;
    query<T = any>(sql: string, params?: any[], options?: QueryOptions): Promise<QueryResult<T>>;
    transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
    batch<T = any>(queries: Array<{
        sql: string;
        params: any[];
    }>, options?: QueryOptions): Promise<QueryResult<T>[]>;
    private preparedStatements;
    prepare(name: string, sql: string): void;
    executePrepared<T = any>(name: string, params?: any[], options?: QueryOptions): Promise<QueryResult<T>>;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy' | 'degraded';
        connections: {
            total: number;
            active: number;
            idle: number;
            max: number;
        };
        performance: {
            totalQueries: number;
            failedQueries: number;
            averageQueryTime: number;
            errorRate: number;
        };
    }>;
    getStats(): {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        totalQueries: number;
        failedQueries: number;
        averageQueryTime: number;
        cacheHits: number;
        cacheMisses: number;
    };
    getConfig(): {
        min: number;
        max: number;
        acquireTimeoutMillis: number;
        createTimeoutMillis: number;
        destroyTimeoutMillis: number;
        idleTimeoutMillis: number;
        reapIntervalMillis: number;
        createRetryIntervalMillis: number;
        propagateCreateError: boolean;
    };
    updateConfig(newConfig: Partial<PoolConfig>): void;
    close(): Promise<void>;
}
export declare class QueryBuilder {
    private sql;
    private params;
    private table;
    private conditions;
    private joins;
    private orderByClauses;
    private groupByClauses;
    private havingClauses;
    private limitValue?;
    private offsetValue?;
    select(columns: string | string[]): QueryBuilder;
    from(table: string): QueryBuilder;
    where(condition: string, ...params: any[]): QueryBuilder;
    join(table: string, condition: string): QueryBuilder;
    leftJoin(table: string, condition: string): QueryBuilder;
    rightJoin(table: string, condition: string): QueryBuilder;
    orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder;
    groupBy(column: string): QueryBuilder;
    having(condition: string, ...params: any[]): QueryBuilder;
    limit(count: number): QueryBuilder;
    offset(count: number): QueryBuilder;
    build(): {
        sql: string;
        params: any[];
    };
}
export declare const databasePool: DatabasePool;
//# sourceMappingURL=database-pool.d.ts.map