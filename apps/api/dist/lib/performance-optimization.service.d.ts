import { PerformanceMetrics, PerformanceAlert, OptimizationRequest, OptimizationResult, ScalingRequest, PerformanceTrend, PerformanceStats } from './warmup-types.js';
export declare class PerformanceOptimizationService {
    private metrics;
    private alerts;
    private optimizations;
    private trends;
    constructor();
    recordMetrics(metrics: PerformanceMetrics): Promise<void>;
    getPerformanceMetrics(organizationId: string, serviceName: string, timeRange?: {
        start: Date;
        end: Date;
    }): Promise<PerformanceMetrics[]>;
    getPerformanceAlerts(organizationId: string): Promise<PerformanceAlert[]>;
    acknowledgeAlert(alertId: string, userId: string): Promise<PerformanceAlert | null>;
    resolveAlert(alertId: string, userId: string): Promise<PerformanceAlert | null>;
    optimizePerformance(request: OptimizationRequest): Promise<OptimizationResult>;
    getOptimizationResults(organizationId: string): Promise<OptimizationResult[]>;
    scaleResources(request: ScalingRequest): Promise<boolean>;
    getPerformanceTrends(organizationId: string, serviceName: string, metricName: string): Promise<PerformanceTrend>;
    getPerformanceStats(organizationId: string): Promise<PerformanceStats>;
    private checkForAlerts;
    private createAlert;
    private getAlertThresholds;
    private getCurrentMetrics;
    private generateOptimizationRecommendations;
    private applyOptimizations;
    private calculateImprovement;
    private simulateResourceScaling;
    private generatePerformanceTrend;
    private calculateTrend;
    private calculateChangeRate;
    private generatePrediction;
    private initializeDefaultData;
    private generateId;
}
//# sourceMappingURL=performance-optimization.service.d.ts.map