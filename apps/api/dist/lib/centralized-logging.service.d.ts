import { z } from 'zod';
declare const LogEntrySchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodDate;
    level: z.ZodEnum<["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]>;
    message: z.ZodString;
    service: z.ZodString;
    environment: z.ZodString;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    source: z.ZodOptional<z.ZodString>;
    hostname: z.ZodOptional<z.ZodString>;
    pid: z.ZodOptional<z.ZodNumber>;
    version: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    userId?: string;
    requestId?: string;
    sessionId?: string;
    organizationId?: string;
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    context?: Record<string, any>;
    timestamp?: Date;
    version?: string;
    metadata?: Record<string, any>;
    environment?: string;
    id?: string;
    source?: string;
    correlationId?: string;
    tags?: string[];
    hostname?: string;
    pid?: number;
}, {
    message?: string;
    userId?: string;
    requestId?: string;
    sessionId?: string;
    organizationId?: string;
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    context?: Record<string, any>;
    timestamp?: Date;
    version?: string;
    metadata?: Record<string, any>;
    environment?: string;
    id?: string;
    source?: string;
    correlationId?: string;
    tags?: string[];
    hostname?: string;
    pid?: number;
}>;
declare const LogQuerySchema: z.ZodObject<{
    level: z.ZodOptional<z.ZodEnum<["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]>>;
    service: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    requestId: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    correlationId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    source: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodDate>;
    endTime: z.ZodOptional<z.ZodDate>;
    message: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodEnum<["timestamp", "level", "service"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    sort?: "level" | "service" | "timestamp";
    userId?: string;
    requestId?: string;
    sessionId?: string;
    organizationId?: string;
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    limit?: number;
    order?: "asc" | "desc";
    environment?: string;
    source?: string;
    correlationId?: string;
    tags?: string[];
    startTime?: Date;
    endTime?: Date;
    offset?: number;
}, {
    message?: string;
    sort?: "level" | "service" | "timestamp";
    userId?: string;
    requestId?: string;
    sessionId?: string;
    organizationId?: string;
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    limit?: number;
    order?: "asc" | "desc";
    environment?: string;
    source?: string;
    correlationId?: string;
    tags?: string[];
    startTime?: Date;
    endTime?: Date;
    offset?: number;
}>;
declare const LogAggregationSchema: z.ZodObject<{
    groupBy: z.ZodArray<z.ZodEnum<["level", "service", "environment", "userId", "organizationId", "source", "tags"]>, "many">;
    timeRange: z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        end?: Date;
        start?: Date;
    }, {
        end?: Date;
        start?: Date;
    }>;
    interval: z.ZodOptional<z.ZodEnum<["1m", "5m", "15m", "1h", "6h", "1d"]>>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    filters?: Record<string, any>;
    timeRange?: {
        end?: Date;
        start?: Date;
    };
    groupBy?: ("userId" | "organizationId" | "level" | "service" | "environment" | "source" | "tags")[];
    interval?: "1h" | "6h" | "15m" | "1m" | "5m" | "1d";
}, {
    filters?: Record<string, any>;
    timeRange?: {
        end?: Date;
        start?: Date;
    };
    groupBy?: ("userId" | "organizationId" | "level" | "service" | "environment" | "source" | "tags")[];
    interval?: "1h" | "6h" | "15m" | "1m" | "5m" | "1d";
}>;
declare const LogAlertRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    pattern: z.ZodString;
    level: z.ZodOptional<z.ZodEnum<["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]>>;
    service: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodString>;
    threshold: z.ZodNumber;
    window: z.ZodNumber;
    enabled: z.ZodBoolean;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["EMAIL", "SLACK", "WEBHOOK", "SMS"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }, {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    name?: string;
    environment?: string;
    id?: string;
    pattern?: string;
    description?: string;
    actions?: {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }[];
    threshold?: number;
    enabled?: boolean;
    window?: number;
}, {
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    name?: string;
    environment?: string;
    id?: string;
    pattern?: string;
    description?: string;
    actions?: {
        type?: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
        config?: Record<string, any>;
    }[];
    threshold?: number;
    enabled?: boolean;
    window?: number;
}>;
declare const LogRetentionPolicySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    service: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodEnum<["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]>>;
    retentionDays: z.ZodNumber;
    enabled: z.ZodBoolean;
    compressionEnabled: z.ZodOptional<z.ZodBoolean>;
    archiveEnabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    name?: string;
    environment?: string;
    id?: string;
    description?: string;
    enabled?: boolean;
    retentionDays?: number;
    compressionEnabled?: boolean;
    archiveEnabled?: boolean;
}, {
    level?: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
    service?: string;
    name?: string;
    environment?: string;
    id?: string;
    description?: string;
    enabled?: boolean;
    retentionDays?: number;
    compressionEnabled?: boolean;
    archiveEnabled?: boolean;
}>;
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type LogQuery = z.infer<typeof LogQuerySchema>;
export type LogAggregation = z.infer<typeof LogAggregationSchema>;
export type LogAlertRule = z.infer<typeof LogAlertRuleSchema>;
export type LogRetentionPolicy = z.infer<typeof LogRetentionPolicySchema>;
export interface CentralizedLoggingConfig {
    elasticsearchEnabled: boolean;
    applicationInsightsEnabled: boolean;
    fileLoggingEnabled: boolean;
    consoleLoggingEnabled: boolean;
    logLevel: string;
    maxLogSize: number;
    maxLogFiles: number;
    retentionDays: number;
    compressionEnabled: boolean;
    archiveEnabled: boolean;
    alertingEnabled: boolean;
    realTimeProcessing: boolean;
    batchSize: number;
    flushInterval: number;
}
export interface LogStatistics {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByService: Record<string, number>;
    logsByEnvironment: Record<string, number>;
    averageLogSize: number;
    errorRate: number;
    topErrors: Array<{
        message: string;
        count: number;
    }>;
    logVolume: Array<{
        timestamp: Date;
        count: number;
    }>;
    lastProcessed: Date | null;
}
export interface LogSearchResult {
    logs: LogEntry[];
    total: number;
    aggregations?: Record<string, any>;
    took: number;
}
export declare class CentralizedLoggingService {
    private config;
    private logs;
    private alertRules;
    private retentionPolicies;
    private logBuffer;
    private processingInterval;
    constructor(config: CentralizedLoggingConfig);
    writeLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry>;
    searchLogs(query: LogQuery): Promise<LogSearchResult>;
    aggregateLogs(aggregation: LogAggregation): Promise<Record<string, any>>;
    private aggregateByTime;
    private getIntervalMs;
    createAlertRule(rule: Omit<LogAlertRule, 'id'>): Promise<LogAlertRule>;
    getAlertRule(ruleId: string): Promise<LogAlertRule | null>;
    listAlertRules(): Promise<LogAlertRule[]>;
    updateAlertRule(ruleId: string, updates: Partial<LogAlertRule>): Promise<LogAlertRule | null>;
    deleteAlertRule(ruleId: string): Promise<boolean>;
    private evaluateAlertRules;
    private matchesPattern;
    private triggerAlert;
    private sendAlertNotification;
    createRetentionPolicy(policy: Omit<LogRetentionPolicy, 'id'>): Promise<LogRetentionPolicy>;
    getRetentionPolicy(policyId: string): Promise<LogRetentionPolicy | null>;
    listRetentionPolicies(): Promise<LogRetentionPolicy[]>;
    updateRetentionPolicy(policyId: string, updates: Partial<LogRetentionPolicy>): Promise<LogRetentionPolicy | null>;
    deleteRetentionPolicy(policyId: string): Promise<boolean>;
    applyRetentionPolicies(): Promise<{
        deleted: number;
        archived: number;
        compressed: number;
    }>;
    private archiveLog;
    private compressLog;
    private sendToApplicationInsights;
    private sendToElasticsearch;
    private writeToFile;
    private processLogEntry;
    private startLogProcessing;
    private processBatch;
    getLogStatistics(): Promise<LogStatistics>;
    generateLogReport(period: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<{
        period: string;
        generatedAt: Date;
        summary: any;
        topErrors: Array<{
            message: string;
            count: number;
        }>;
        serviceBreakdown: Record<string, number>;
        levelBreakdown: Record<string, number>;
        recommendations: string[];
    }>;
    private generateLogRecommendations;
    updateConfig(updates: Partial<CentralizedLoggingConfig>): Promise<CentralizedLoggingConfig>;
    getConfig(): Promise<CentralizedLoggingConfig>;
    private initializeDefaultRules;
    private initializeDefaultRetentionPolicies;
    cleanup(): Promise<void>;
}
export default CentralizedLoggingService;
//# sourceMappingURL=centralized-logging.service.d.ts.map