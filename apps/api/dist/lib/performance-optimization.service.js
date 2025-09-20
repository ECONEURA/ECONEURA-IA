export class PerformanceOptimizationService {
    metrics = new Map();
    alerts = new Map();
    optimizations = new Map();
    trends = new Map();
    constructor() {
        this.initializeDefaultData();
    }
    async recordMetrics(metrics) {
        const key = `${metrics.organizationId}_${metrics.serviceName}`;
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        const serviceMetrics = this.metrics.get(key);
        serviceMetrics.push(metrics);
        if (serviceMetrics.length > 1000) {
            serviceMetrics.splice(0, serviceMetrics.length - 1000);
        }
        await this.checkForAlerts(metrics);
    }
    async getPerformanceMetrics(organizationId, serviceName, timeRange) {
        const key = `${organizationId}_${serviceName}`;
        const serviceMetrics = this.metrics.get(key) || [];
        if (timeRange) {
            return serviceMetrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end);
        }
        return serviceMetrics;
    }
    async getPerformanceAlerts(organizationId) {
        const alerts = Array.from(this.alerts.values())
            .filter(alert => alert.organizationId === organizationId);
        return alerts;
    }
    async acknowledgeAlert(alertId, userId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return null;
        }
        alert.acknowledged = true;
        this.alerts.set(alertId, alert);
        return alert;
    }
    async resolveAlert(alertId, userId) {
        const alert = this.alerts.get(alertId);
        if (!alert) {
            return null;
        }
        alert.resolved = true;
        this.alerts.set(alertId, alert);
        return alert;
    }
    async optimizePerformance(request) {
        const optimizationId = this.generateId();
        try {
            const currentMetrics = await this.getCurrentMetrics(request.organizationId, request.serviceName);
            const recommendations = await this.generateOptimizationRecommendations(request, currentMetrics);
            const appliedOptimizations = await this.applyOptimizations(recommendations);
            const afterMetrics = await this.getCurrentMetrics(request.organizationId, request.serviceName);
            const improvement = this.calculateImprovement(currentMetrics, afterMetrics, request.optimizationType);
            const result = {
                id: optimizationId,
                serviceName: request.serviceName,
                optimizationType: request.optimizationType,
                beforeMetrics: currentMetrics,
                afterMetrics: afterMetrics,
                improvement,
                recommendations: appliedOptimizations,
                applied: true,
                createdAt: new Date()
            };
            this.optimizations.set(optimizationId, result);
            return result;
        }
        catch (error) {
            throw new Error(`Performance optimization failed: ${error.message}`);
        }
    }
    async getOptimizationResults(organizationId) {
        const results = Array.from(this.optimizations.values())
            .filter(result => {
            const metrics = this.metrics.get(`${organizationId}_${result.serviceName}`);
            return metrics && metrics.length > 0;
        });
        return results;
    }
    async scaleResources(request) {
        try {
            await this.simulateResourceScaling(request);
            await this.recordMetrics({
                id: this.generateId(),
                organizationId: request.organizationId,
                serviceName: request.serviceName,
                metricName: 'scaling_event',
                metricValue: 1,
                unit: 'count',
                timestamp: new Date(),
                tags: {
                    scalingType: request.scalingType,
                    reason: request.reason
                }
            });
            return true;
        }
        catch (error) {
            throw new Error(`Resource scaling failed: ${error.message}`);
        }
    }
    async getPerformanceTrends(organizationId, serviceName, metricName) {
        const key = `${organizationId}_${serviceName}_${metricName}`;
        let trend = this.trends.get(key);
        if (!trend) {
            trend = await this.generatePerformanceTrend(organizationId, serviceName, metricName);
            this.trends.set(key, trend);
        }
        return trend;
    }
    async getPerformanceStats(organizationId) {
        const allMetrics = Array.from(this.metrics.values()).flat()
            .filter(m => m.organizationId === organizationId);
        if (allMetrics.length === 0) {
            return {
                averageLatency: 0,
                averageThroughput: 0,
                resourceEfficiency: 0,
                uptime: 0,
                optimizationCount: 0,
                alertCount: 0
            };
        }
        const latencyMetrics = allMetrics.filter(m => m.metricName === 'latency');
        const throughputMetrics = allMetrics.filter(m => m.metricName === 'throughput');
        const efficiencyMetrics = allMetrics.filter(m => m.metricName === 'efficiency');
        const uptimeMetrics = allMetrics.filter(m => m.metricName === 'uptime');
        const averageLatency = latencyMetrics.length > 0
            ? latencyMetrics.reduce((sum, m) => sum + m.metricValue, 0) / latencyMetrics.length
            : 0;
        const averageThroughput = throughputMetrics.length > 0
            ? throughputMetrics.reduce((sum, m) => sum + m.metricValue, 0) / throughputMetrics.length
            : 0;
        const resourceEfficiency = efficiencyMetrics.length > 0
            ? efficiencyMetrics.reduce((sum, m) => sum + m.metricValue, 0) / efficiencyMetrics.length
            : 0;
        const uptime = uptimeMetrics.length > 0
            ? uptimeMetrics.reduce((sum, m) => sum + m.metricValue, 0) / uptimeMetrics.length
            : 0;
        const optimizationCount = Array.from(this.optimizations.values())
            .filter(o => {
            const metrics = this.metrics.get(`${organizationId}_${o.serviceName}`);
            return metrics && metrics.length > 0;
        }).length;
        const alertCount = Array.from(this.alerts.values())
            .filter(a => a.organizationId === organizationId).length;
        return {
            averageLatency,
            averageThroughput,
            resourceEfficiency,
            uptime,
            optimizationCount,
            alertCount
        };
    }
    async checkForAlerts(metrics) {
        const thresholds = this.getAlertThresholds(metrics.metricName);
        if (metrics.metricValue > thresholds.high) {
            await this.createAlert(metrics, 'high', thresholds.high);
        }
        else if (metrics.metricValue > thresholds.medium) {
            await this.createAlert(metrics, 'medium', thresholds.medium);
        }
        else if (metrics.metricValue > thresholds.low) {
            await this.createAlert(metrics, 'low', thresholds.low);
        }
    }
    async createAlert(metrics, severity, threshold) {
        const alertId = this.generateId();
        const alert = {
            id: alertId,
            organizationId: metrics.organizationId,
            serviceName: metrics.serviceName,
            metricName: metrics.metricName,
            threshold,
            currentValue: metrics.metricValue,
            severity: severity,
            message: `${metrics.metricName} exceeded threshold: ${metrics.metricValue} > ${threshold}`,
            timestamp: new Date(),
            acknowledged: false,
            resolved: false
        };
        this.alerts.set(alertId, alert);
    }
    getAlertThresholds(metricName) {
        const thresholds = {
            latency: { low: 100, medium: 200, high: 500 },
            throughput: { low: 1000, medium: 500, high: 100 },
            memory: { low: 70, medium: 85, high: 95 },
            cpu: { low: 70, medium: 85, high: 95 },
            error_rate: { low: 1, medium: 5, high: 10 }
        };
        return thresholds[metricName] || { low: 50, medium: 75, high: 90 };
    }
    async getCurrentMetrics(organizationId, serviceName) {
        const key = `${organizationId}_${serviceName}`;
        const serviceMetrics = this.metrics.get(key) || [];
        return serviceMetrics.slice(-10);
    }
    async generateOptimizationRecommendations(request, currentMetrics) {
        const recommendations = [];
        switch (request.optimizationType) {
            case 'latency':
                recommendations.push({
                    type: 'caching',
                    description: 'Implement additional caching layers',
                    impact: 'high',
                    effort: 'medium',
                    estimatedImprovement: 30,
                    implementation: 'Add Redis cache for frequently accessed data'
                });
                break;
            case 'throughput':
                recommendations.push({
                    type: 'scaling',
                    description: 'Scale horizontally to increase throughput',
                    impact: 'high',
                    effort: 'low',
                    estimatedImprovement: 50,
                    implementation: 'Add more instances to the service'
                });
                break;
            case 'memory':
                recommendations.push({
                    type: 'configuration',
                    description: 'Optimize memory allocation and garbage collection',
                    impact: 'medium',
                    effort: 'low',
                    estimatedImprovement: 20,
                    implementation: 'Adjust JVM heap size and GC settings'
                });
                break;
            case 'cpu':
                recommendations.push({
                    type: 'query_optimization',
                    description: 'Optimize database queries and algorithms',
                    impact: 'high',
                    effort: 'high',
                    estimatedImprovement: 40,
                    implementation: 'Add database indexes and optimize query patterns'
                });
                break;
        }
        return recommendations;
    }
    async applyOptimizations(recommendations) {
        const appliedOptimizations = [];
        for (const recommendation of recommendations) {
            await new Promise(resolve => setTimeout(resolve, 100));
            appliedOptimizations.push(recommendation);
        }
        return appliedOptimizations;
    }
    calculateImprovement(beforeMetrics, afterMetrics, optimizationType) {
        if (beforeMetrics.length === 0 || afterMetrics.length === 0) {
            return 0;
        }
        const beforeValue = beforeMetrics.reduce((sum, m) => sum + m.metricValue, 0) / beforeMetrics.length;
        const afterValue = afterMetrics.reduce((sum, m) => sum + m.metricValue, 0) / afterMetrics.length;
        if (optimizationType === 'latency' || optimizationType === 'memory') {
            return beforeValue > 0 ? ((beforeValue - afterValue) / beforeValue) * 100 : 0;
        }
        return beforeValue > 0 ? ((afterValue - beforeValue) / beforeValue) * 100 : 0;
    }
    async simulateResourceScaling(request) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.recordMetrics({
            id: this.generateId(),
            organizationId: request.organizationId,
            serviceName: request.serviceName,
            metricName: 'scaled_instances',
            metricValue: request.targetInstances || 1,
            unit: 'count',
            timestamp: new Date(),
            tags: {
                scalingType: request.scalingType,
                reason: request.reason
            }
        });
    }
    async generatePerformanceTrend(organizationId, serviceName, metricName) {
        const key = `${organizationId}_${serviceName}`;
        const serviceMetrics = this.metrics.get(key) || [];
        const metricData = serviceMetrics.filter(m => m.metricName === metricName);
        if (metricData.length === 0) {
            return {
                metricName,
                timeSeries: [],
                trend: 'stable',
                changeRate: 0,
                prediction: []
            };
        }
        const timeSeries = metricData.map(m => ({
            timestamp: m.timestamp,
            value: m.metricValue,
            tags: m.tags
        }));
        const trend = this.calculateTrend(timeSeries);
        const changeRate = this.calculateChangeRate(timeSeries);
        const prediction = this.generatePrediction(timeSeries);
        return {
            metricName,
            timeSeries,
            trend,
            changeRate,
            prediction
        };
    }
    calculateTrend(timeSeries) {
        if (timeSeries.length < 2)
            return 'stable';
        const firstHalf = timeSeries.slice(0, Math.floor(timeSeries.length / 2));
        const secondHalf = timeSeries.slice(Math.floor(timeSeries.length / 2));
        const firstAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length;
        const change = (secondAvg - firstAvg) / firstAvg;
        if (Math.abs(change) < 0.05)
            return 'stable';
        if (change > 0.1)
            return 'increasing';
        if (change < -0.1)
            return 'decreasing';
        return 'volatile';
    }
    calculateChangeRate(timeSeries) {
        if (timeSeries.length < 2)
            return 0;
        const first = timeSeries[0];
        const last = timeSeries[timeSeries.length - 1];
        const timeDiff = (last.timestamp.getTime() - first.timestamp.getTime()) / (1000 * 60 * 60);
        const valueDiff = last.value - first.value;
        return timeDiff > 0 ? (valueDiff / first.value) / timeDiff * 100 : 0;
    }
    generatePrediction(timeSeries) {
        if (timeSeries.length < 3)
            return [];
        const prediction = [];
        const lastPoint = timeSeries[timeSeries.length - 1];
        const changeRate = this.calculateChangeRate(timeSeries);
        for (let i = 1; i <= 5; i++) {
            const futureTime = new Date(lastPoint.timestamp.getTime() + i * 60 * 60 * 1000);
            const futureValue = lastPoint.value * (1 + changeRate / 100 * i);
            prediction.push({
                timestamp: futureTime,
                value: futureValue,
                tags: { predicted: 'true' }
            });
        }
        return prediction;
    }
    initializeDefaultData() {
        const defaultMetrics = {
            id: 'default_metric',
            organizationId: 'org_1',
            serviceName: 'default-service',
            metricName: 'latency',
            metricValue: 150,
            unit: 'ms',
            timestamp: new Date(),
            tags: { source: 'system' }
        };
        this.recordMetrics(defaultMetrics);
    }
    generateId() {
        return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=performance-optimization.service.js.map