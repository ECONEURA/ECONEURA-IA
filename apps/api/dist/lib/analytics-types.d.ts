export interface AnalyticsMetric {
    id: string;
    name: string;
    type: 'performance' | 'business' | 'financial' | 'operational' | 'customer' | 'marketing';
    value: number;
    unit: string;
    timestamp: Date;
    organizationId: string;
    userId?: string;
    metadata: Record<string, any>;
    tags: string[];
    category: string;
    subcategory?: string;
    source: string;
    confidence?: number;
    status: 'active' | 'inactive' | 'deprecated';
    createdAt: Date;
    updatedAt: Date;
}
export interface TrendAnalysis {
    id: string;
    metricId: string;
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'seasonal';
    changePercentage: number;
    confidence: number;
    forecast: ForecastData[];
    seasonality: SeasonalityData;
    anomalies: AnomalyData[];
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ForecastData {
    timestamp: Date;
    predictedValue: number;
    confidenceInterval: {
        lower: number;
        upper: number;
    };
    probability: number;
}
export interface SeasonalityData {
    hasSeasonality: boolean;
    period: number;
    strength: number;
    pattern: number[];
}
export interface AnomalyData {
    id: string;
    timestamp: Date;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'spike' | 'drop' | 'pattern_change' | 'outlier';
    description: string;
    impact: string;
    recommendations: string[];
}
export interface BusinessIntelligence {
    id: string;
    kpiId: string;
    currentValue: number;
    targetValue: number;
    previousValue: number;
    variance: number;
    variancePercentage: number;
    status: 'on-track' | 'at-risk' | 'off-track' | 'exceeding';
    insights: string[];
    recommendations: string[];
    riskFactors: RiskFactor[];
    opportunities: Opportunity[];
    organizationId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    createdAt: Date;
    updatedAt: Date;
}
export interface KPI {
    id: string;
    name: string;
    description: string;
    type: 'financial' | 'operational' | 'customer' | 'marketing' | 'strategic';
    category: string;
    unit: string;
    targetValue: number;
    currentValue: number;
    formula: string;
    dataSource: string;
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    owner: string;
    stakeholders: string[];
    organizationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RiskFactor {
    id: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    impact: number;
    riskScore: number;
    mitigation: string[];
    owner: string;
    status: 'identified' | 'monitoring' | 'mitigating' | 'resolved';
}
export interface Opportunity {
    id: string;
    name: string;
    description: string;
    potentialValue: number;
    probability: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    owner: string;
    status: 'identified' | 'evaluating' | 'pursuing' | 'implemented';
}
export interface CompetitiveAnalysis {
    id: string;
    competitor: string;
    metric: string;
    ourValue: number;
    competitorValue: number;
    marketAverage: number;
    position: 'leading' | 'competitive' | 'lagging';
    gap: number;
    recommendations: string[];
    organizationId: string;
    analysisDate: Date;
}
export interface ROIAnalysis {
    id: string;
    initiative: string;
    investment: number;
    returns: number;
    roi: number;
    paybackPeriod: number;
    npv: number;
    irr: number;
    risk: 'low' | 'medium' | 'high';
    organizationId: string;
    period: string;
    createdAt: Date;
}
export interface Report {
    id: string;
    name: string;
    description: string;
    type: 'dashboard' | 'analytics' | 'executive' | 'operational' | 'custom';
    template: string;
    data: ReportData[];
    filters: ReportFilter[];
    schedule?: ReportSchedule;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv' | 'json' | 'html';
    organizationId: string;
    createdBy: string;
    isPublic: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastGenerated?: Date;
}
export interface ReportData {
    metricId: string;
    metricName: string;
    value: number;
    unit: string;
    trend: TrendAnalysis;
    visualization: VisualizationConfig;
}
export interface ReportFilter {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
    value: any;
    values?: any[];
}
export interface ReportSchedule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
    isActive: boolean;
}
export interface VisualizationConfig {
    type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'table' | 'gauge' | 'heatmap';
    title: string;
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    options?: Record<string, any>;
}
export interface ReportGeneration {
    id: string;
    reportId: string;
    status: 'pending' | 'generating' | 'completed' | 'failed';
    progress: number;
    fileUrl?: string;
    errorMessage?: string;
    generatedAt?: Date;
    generatedBy: string;
    parameters: Record<string, any>;
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    type: 'executive' | 'operational' | 'analytical' | 'custom';
    layout: DashboardLayout;
    widgets: DashboardWidget[];
    filters: DashboardFilter[];
    organizationId: string;
    createdBy: string;
    isPublic: boolean;
    isActive: boolean;
    refreshInterval: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface DashboardLayout {
    columns: number;
    rows: number;
    gridSize: number;
    responsive: boolean;
}
export interface DashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'gauge' | 'alert' | 'kpi' | 'trend';
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: WidgetConfig;
    data: any;
    refreshInterval: number;
    isVisible: boolean;
}
export interface WidgetConfig {
    metricId?: string;
    chartType?: string;
    colors?: string[];
    thresholds?: Threshold[];
    options?: Record<string, any>;
}
export interface Threshold {
    value: number;
    color: string;
    label: string;
    operator: 'greater_than' | 'less_than' | 'equals';
}
export interface DashboardFilter {
    id: string;
    name: string;
    type: 'date' | 'select' | 'multiselect' | 'range' | 'text';
    field: string;
    options?: any[];
    defaultValue?: any;
    isRequired: boolean;
}
export interface DashboardAlert {
    id: string;
    dashboardId: string;
    widgetId: string;
    condition: AlertCondition;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    isActive: boolean;
    lastTriggered?: Date;
    recipients: string[];
}
export interface AlertCondition {
    metric: string;
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'change_by';
    value: number;
    timeWindow: number;
}
export interface AnalyticsQuery {
    metrics: string[];
    filters: ReportFilter[];
    timeRange: {
        start: Date;
        end: Date;
    };
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median';
    groupBy?: string[];
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
}
export interface AnalyticsResult {
    data: AnalyticsDataPoint[];
    metadata: {
        totalRecords: number;
        executionTime: number;
        cacheHit: boolean;
        query: AnalyticsQuery;
    };
    aggregations: Record<string, number>;
    trends: TrendAnalysis[];
    anomalies: AnomalyData[];
}
export interface AnalyticsDataPoint {
    timestamp: Date;
    metrics: Record<string, number>;
    dimensions: Record<string, string>;
    metadata: Record<string, any>;
}
export interface StatisticalAnalysis {
    mean: number;
    median: number;
    mode: number;
    standardDeviation: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    min: number;
    max: number;
    range: number;
    quartiles: {
        q1: number;
        q2: number;
        q3: number;
    };
    outliers: number[];
    correlation: Record<string, number>;
}
export interface CreateMetricRequest {
    name: string;
    type: AnalyticsMetric['type'];
    unit: string;
    category: string;
    subcategory?: string;
    source: string;
    tags: string[];
    metadata: Record<string, any>;
}
export interface UpdateMetricRequest {
    name?: string;
    unit?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    status?: AnalyticsMetric['status'];
}
export interface CreateKPIRequest {
    name: string;
    description: string;
    type: KPI['type'];
    category: string;
    unit: string;
    targetValue: number;
    formula: string;
    dataSource: string;
    frequency: KPI['frequency'];
    owner: string;
    stakeholders: string[];
}
export interface CreateReportRequest {
    name: string;
    description: string;
    type: Report['type'];
    template: string;
    data: Omit<ReportData, 'trend'>[];
    filters: ReportFilter[];
    schedule?: ReportSchedule;
    recipients: string[];
    format: Report['format'];
    isPublic: boolean;
}
export interface CreateDashboardRequest {
    name: string;
    description: string;
    type: Dashboard['type'];
    layout: DashboardLayout;
    widgets: Omit<DashboardWidget, 'data'>[];
    filters: DashboardFilter[];
    isPublic: boolean;
    refreshInterval: number;
}
export interface AnalyticsResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
    metadata?: {
        timestamp: Date;
        executionTime: number;
        cacheHit: boolean;
    };
}
export interface AnalyticsConfig {
    realTimeProcessing: boolean;
    anomalyDetection: boolean;
    forecasting: boolean;
    seasonalityAnalysis: boolean;
    correlationAnalysis: boolean;
    cacheEnabled: boolean;
    cacheTTL: number;
    maxDataPoints: number;
    batchSize: number;
}
export interface BIConfig {
    kpiTracking: boolean;
    competitiveAnalysis: boolean;
    roiAnalysis: boolean;
    riskAssessment: boolean;
    opportunityAnalysis: boolean;
    benchmarking: boolean;
    alerting: boolean;
    reporting: boolean;
}
export interface DashboardConfig {
    realTimeUpdates: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    maxWidgets: number;
    customWidgets: boolean;
    mobileResponsive: boolean;
    exportEnabled: boolean;
    sharingEnabled: boolean;
}
export type { AnalyticsMetric, TrendAnalysis, ForecastData, SeasonalityData, AnomalyData, BusinessIntelligence, KPI, RiskFactor, Opportunity, CompetitiveAnalysis, ROIAnalysis, Report, ReportData, ReportFilter, ReportSchedule, VisualizationConfig, ReportGeneration, Dashboard, DashboardLayout, DashboardWidget, WidgetConfig, Threshold, DashboardFilter, DashboardAlert, AlertCondition, AnalyticsQuery, AnalyticsResult, AnalyticsDataPoint, StatisticalAnalysis, CreateMetricRequest, UpdateMetricRequest, CreateKPIRequest, CreateReportRequest, CreateDashboardRequest, AnalyticsResponse, AnalyticsConfig, BIConfig, DashboardConfig };
//# sourceMappingURL=analytics-types.d.ts.map