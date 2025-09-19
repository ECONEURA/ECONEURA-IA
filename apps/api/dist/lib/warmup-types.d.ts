export interface WarmupSchedule {
    id: string;
    organizationId: string;
    serviceName: string;
    scheduleCron: string;
    enabled: boolean;
    quietHoursOnly: boolean;
    warmupConfig: WarmupConfig;
    createdAt: Date;
    updatedAt: Date;
}
export interface WarmupConfig {
    services: WarmupService[];
    cacheWarming: CacheWarmingConfig;
    connectionPooling: ConnectionPoolingConfig;
    resourcePreloading: ResourcePreloadingConfig;
    performanceTargets: PerformanceTargets;
}
export interface WarmupService {
    name: string;
    type: 'ai-model' | 'search-engine' | 'database' | 'cache' | 'api';
    priority: 'high' | 'medium' | 'low';
    warmupStrategy: WarmupStrategy;
    dependencies: string[];
    timeout: number;
    retryCount: number;
    healthCheck: HealthCheckConfig;
}
export interface WarmupStrategy {
    type: 'immediate' | 'gradual' | 'scheduled' | 'on-demand';
    batchSize?: number;
    delayBetweenBatches?: number;
    maxConcurrency?: number;
    preloadData?: boolean;
}
export interface CacheWarmingConfig {
    enabled: boolean;
    strategies: CacheStrategy[];
    dataSources: DataSource[];
    compression: boolean;
    ttl: number;
}
export interface CacheStrategy {
    type: 'lru' | 'lfu' | 'ttl' | 'custom';
    maxSize: number;
    evictionPolicy: EvictionPolicy;
    preloadFrequency: string;
}
export interface EvictionPolicy {
    type: 'time-based' | 'size-based' | 'frequency-based' | 'hybrid';
    threshold: number;
    cleanupInterval: number;
}
export interface ConnectionPoolingConfig {
    enabled: boolean;
    maxConnections: number;
    minConnections: number;
    idleTimeout: number;
    connectionTimeout: number;
    healthCheckInterval: number;
}
export interface ResourcePreloadingConfig {
    enabled: boolean;
    resources: PreloadResource[];
    priority: 'high' | 'medium' | 'low';
    maxMemoryUsage: number;
}
export interface PreloadResource {
    name: string;
    type: 'model' | 'data' | 'configuration' | 'template';
    size: number;
    source: string;
    dependencies: string[];
}
export interface PerformanceTargets {
    maxLatency: number;
    minThroughput: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
    cacheHitRate: number;
}
export interface HealthCheckConfig {
    enabled: boolean;
    endpoint?: string;
    interval: number;
    timeout: number;
    retryCount: number;
    expectedResponse?: any;
}
export interface DataSource {
    name: string;
    type: 'database' | 'api' | 'file' | 'stream';
    connectionString?: string;
    query?: string;
    frequency: string;
    priority: 'high' | 'medium' | 'low';
}
export interface WarmupStatus {
    id: string;
    scheduleId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    services: ServiceWarmupStatus[];
    metrics: WarmupMetrics;
    errors: WarmupError[];
}
export interface ServiceWarmupStatus {
    serviceName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    progress: number;
    metrics: ServiceMetrics;
    errors: string[];
}
export interface WarmupMetrics {
    totalServices: number;
    completedServices: number;
    failedServices: number;
    averageLatency: number;
    totalDuration: number;
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
}
export interface ServiceMetrics {
    latency: number;
    throughput: number;
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
    errorRate: number;
}
export interface WarmupError {
    serviceName: string;
    error: string;
    timestamp: Date;
    retryCount: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface SearchRequest {
    query: string;
    filters?: SearchFilter[];
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeHighlights?: boolean;
    includeExplanations?: boolean;
    semanticSearch?: boolean;
    organizationId: string;
}
export interface SearchFilter {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'between';
    value: any;
    type: 'text' | 'number' | 'date' | 'boolean';
}
export interface SearchResult {
    id: string;
    title: string;
    content: string;
    score: number;
    highlights?: SearchHighlight[];
    explanation?: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface SearchHighlight {
    field: string;
    text: string;
    score: number;
    position: number;
}
export interface SearchResponse {
    results: SearchResult[];
    total: number;
    took: number;
    suggestions?: string[];
    clusters?: SearchCluster[];
    analytics: SearchAnalytics;
}
export interface SearchCluster {
    id: string;
    name: string;
    documents: string[];
    centroid: number[];
    size: number;
    coherence: number;
}
export interface SearchAnalytics {
    query: string;
    responseTime: number;
    resultCount: number;
    cacheHit: boolean;
    semanticSearch: boolean;
    filters: SearchFilter[];
    userAgent?: string;
    timestamp: Date;
}
export interface EmbeddingRequest {
    text: string;
    model?: string;
    organizationId: string;
}
export interface EmbeddingResponse {
    embedding: number[];
    model: string;
    dimensions: number;
    tokens: number;
    cost: number;
    processingTime: number;
}
export interface SearchOptimization {
    id: string;
    originalQuery: string;
    optimizedQuery: string;
    improvements: QueryImprovement[];
    performanceGain: number;
    createdAt: Date;
}
export interface QueryImprovement {
    type: 'filter_optimization' | 'index_usage' | 'semantic_enhancement' | 'cache_utilization';
    description: string;
    impact: 'low' | 'medium' | 'high';
    before: any;
    after: any;
}
export interface CacheConfig {
    id: string;
    organizationId: string;
    name: string;
    strategy: CacheStrategy;
    compression: boolean;
    encryption: boolean;
    ttl: number;
    maxSize: number;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CacheEntry {
    key: string;
    value: any;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    size: number;
    compressed: boolean;
    encrypted: boolean;
}
export interface CacheMetrics {
    hitCount: number;
    missCount: number;
    hitRate: number;
    missRate: number;
    totalSize: number;
    entryCount: number;
    evictionCount: number;
    compressionRatio: number;
    averageAccessTime: number;
    lastCleanup: Date;
}
export interface CacheWarmingRequest {
    cacheName: string;
    dataSource: DataSource;
    priority: 'high' | 'medium' | 'low';
    batchSize?: number;
    maxConcurrency?: number;
    organizationId: string;
}
export interface CacheWarmingStatus {
    id: string;
    cacheName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    entriesProcessed: number;
    totalEntries: number;
    startTime: Date;
    endTime?: Date;
    errors: string[];
}
export interface CacheInvalidationRequest {
    cacheName: string;
    pattern?: string;
    keys?: string[];
    reason: string;
    organizationId: string;
}
export interface CacheCompressionRequest {
    cacheName: string;
    algorithm: 'gzip' | 'brotli' | 'lz4' | 'zstd';
    level: number;
    organizationId: string;
}
export interface PerformanceMetrics {
    id: string;
    organizationId: string;
    serviceName: string;
    metricName: string;
    metricValue: number;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
}
export interface PerformanceAlert {
    id: string;
    organizationId: string;
    serviceName: string;
    metricName: string;
    threshold: number;
    currentValue: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    resolved: boolean;
}
export interface OptimizationRequest {
    serviceName: string;
    optimizationType: 'latency' | 'throughput' | 'memory' | 'cpu' | 'cache';
    targetValue: number;
    constraints: OptimizationConstraint[];
    organizationId: string;
}
export interface OptimizationConstraint {
    type: 'max_memory' | 'max_cpu' | 'max_latency' | 'min_throughput';
    value: number;
    unit: string;
}
export interface OptimizationResult {
    id: string;
    serviceName: string;
    optimizationType: string;
    beforeMetrics: PerformanceMetrics[];
    afterMetrics: PerformanceMetrics[];
    improvement: number;
    recommendations: OptimizationRecommendation[];
    applied: boolean;
    createdAt: Date;
}
export interface OptimizationRecommendation {
    type: 'configuration' | 'scaling' | 'caching' | 'indexing' | 'query_optimization';
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    estimatedImprovement: number;
    implementation: string;
}
export interface ScalingRequest {
    serviceName: string;
    scalingType: 'horizontal' | 'vertical';
    targetInstances?: number;
    targetResources?: ResourceSpec;
    reason: string;
    organizationId: string;
}
export interface ResourceSpec {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
}
export interface PerformanceTrend {
    metricName: string;
    timeSeries: TimeSeriesPoint[];
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    changeRate: number;
    prediction: TimeSeriesPoint[];
}
export interface TimeSeriesPoint {
    timestamp: Date;
    value: number;
    tags?: Record<string, string>;
}
export interface CreateWarmupScheduleRequest {
    organizationId: string;
    serviceName: string;
    scheduleCron: string;
    quietHoursOnly?: boolean;
    warmupConfig: WarmupConfig;
}
export interface UpdateWarmupScheduleRequest {
    scheduleCron?: string;
    enabled?: boolean;
    quietHoursOnly?: boolean;
    warmupConfig?: WarmupConfig;
}
export interface TriggerWarmupRequest {
    scheduleId?: string;
    services?: string[];
    priority?: 'high' | 'medium' | 'low';
    organizationId: string;
}
export interface GenerateEmbeddingRequest {
    text: string;
    model?: string;
    organizationId: string;
}
export interface OptimizeQueryRequest {
    query: string;
    context?: string;
    organizationId: string;
}
export interface PerformanceOptimizationRequest {
    serviceName: string;
    optimizationType: 'latency' | 'throughput' | 'memory' | 'cpu';
    targetValue: number;
    organizationId: string;
}
export interface WarmupResponse {
    success: boolean;
    data?: WarmupSchedule | WarmupSchedule[] | WarmupStatus | WarmupMetrics;
    message?: string;
    error?: string;
}
export interface CacheResponse {
    success: boolean;
    data?: CacheConfig | CacheMetrics | CacheWarmingStatus | CacheEntry;
    message?: string;
    error?: string;
}
export interface PerformanceResponse {
    success: boolean;
    data?: PerformanceMetrics | OptimizationResult | PerformanceTrend | PerformanceAlert;
    message?: string;
    error?: string;
}
export interface WarmupStats {
    totalSchedules: number;
    activeSchedules: number;
    totalWarmups: number;
    successRate: number;
    averageWarmupTime: number;
    cacheHitRate: number;
    resourceUtilization: number;
}
export interface SearchStats {
    totalQueries: number;
    averageResponseTime: number;
    cacheHitRate: number;
    semanticSearchUsage: number;
    topQueries: string[];
    searchAccuracy: number;
}
export interface CacheStats {
    totalCaches: number;
    totalSize: number;
    averageHitRate: number;
    compressionRatio: number;
    evictionRate: number;
    warmingFrequency: number;
}
export interface PerformanceStats {
    averageLatency: number;
    averageThroughput: number;
    resourceEfficiency: number;
    uptime: number;
    optimizationCount: number;
    alertCount: number;
}
//# sourceMappingURL=warmup-types.d.ts.map