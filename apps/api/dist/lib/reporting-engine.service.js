import { structuredLogger } from './structured-logger.js';
export class ReportingEngineService {
    reports = [];
    costTrends = [];
    costForecasts = [];
    costAnomalies = [];
    constructor() {
        this.initializeSampleData();
        this.startPeriodicReporting();
        structuredLogger.info('ReportingEngineService initialized', {
            operation: 'reporting_engine_init'
        });
    }
    initializeSampleData() {
        const now = new Date();
        const sampleReports = [
            {
                id: 'report_1',
                name: 'Monthly Cost Analysis',
                type: 'executive',
                period: {
                    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                    end: new Date(now.getFullYear(), now.getMonth(), 0)
                },
                organizationId: 'org_1',
                data: {
                    totalCosts: 12500.50,
                    costsByService: {
                        'compute': 6500.25,
                        'storage': 2100.75,
                        'database': 1800.00,
                        'network': 1200.50,
                        'licenses': 900.00
                    },
                    costsByCategory: {
                        'infrastructure': 8500.25,
                        'software': 2100.75,
                        'services': 1200.50,
                        'licenses': 900.00
                    },
                    costsByResource: {
                        'ec2-instances': 4500.00,
                        'rds-instances': 1800.00,
                        's3-buckets': 1500.00,
                        'load-balancers': 800.00,
                        'cloudfront': 400.50
                    },
                    costsByOrganization: {
                        'org_1': 12500.50
                    },
                    trends: this.generateSampleTrends(),
                    recommendations: this.generateSampleRecommendations(),
                    budgetStatus: this.generateSampleBudgetStatus(),
                    anomalies: this.generateSampleAnomalies(),
                    forecasts: this.generateSampleForecasts()
                },
                generatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                generatedBy: 'system',
                format: 'pdf',
                status: 'completed',
                filePath: '/reports/monthly-cost-analysis.pdf',
                fileSize: 2048576,
                metadata: {
                    template: 'executive_monthly',
                    includeCharts: true,
                    includeRecommendations: true
                }
            },
            {
                id: 'report_2',
                name: 'Cost Optimization Report',
                type: 'optimization',
                period: {
                    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                    end: new Date()
                },
                organizationId: 'org_1',
                data: {
                    totalCosts: 3200.75,
                    costsByService: {
                        'compute': 1800.25,
                        'storage': 800.50,
                        'database': 600.00
                    },
                    costsByCategory: {
                        'infrastructure': 2400.25,
                        'software': 800.50
                    },
                    costsByResource: {},
                    costsByOrganization: {
                        'org_1': 3200.75
                    },
                    trends: this.generateSampleTrends(),
                    recommendations: this.generateSampleRecommendations(),
                    budgetStatus: this.generateSampleBudgetStatus(),
                    anomalies: this.generateSampleAnomalies(),
                    forecasts: this.generateSampleForecasts()
                },
                generatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                generatedBy: 'admin',
                format: 'excel',
                status: 'completed',
                filePath: '/reports/cost-optimization.xlsx',
                fileSize: 1024000,
                metadata: {
                    template: 'optimization_weekly',
                    includeCharts: true,
                    includeRecommendations: true
                }
            }
        ];
        this.reports = sampleReports;
    }
    generateSampleTrends() {
        const trends = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const baseAmount = 100 + Math.random() * 50;
            trends.push({
                date,
                amount: baseAmount,
                service: 'compute',
                category: 'infrastructure',
                organizationId: 'org_1',
                trend: i > 15 ? 'increasing' : 'stable',
                changePercentage: Math.random() * 10 - 5,
                metadata: {}
            });
        }
        return trends;
    }
    generateSampleRecommendations() {
        return [
            {
                id: 'rec_sample_1',
                type: 'right_sizing',
                title: 'Right-size EC2 instances',
                description: 'Several EC2 instances are underutilized',
                potentialSavings: 450.00,
                confidence: 85,
                effort: 'medium',
                impact: 'high',
                resources: ['ec2-instance-1', 'ec2-instance-2'],
                implementation: 'Downsize instances based on utilization',
                estimatedSavings: {
                    monthly: 450.00,
                    yearly: 5400.00,
                    percentage: 25
                },
                status: 'pending',
                priority: 'high',
                createdAt: new Date(),
                tags: ['compute', 'optimization'],
                metadata: {}
            }
        ];
    }
    generateSampleBudgetStatus() {
        return [
            {
                budgetId: 'budget_1',
                budgetName: 'Production Infrastructure',
                currentAmount: 4200.50,
                budgetAmount: 5000.00,
                percentage: 84.01,
                status: 'at_risk',
                daysRemaining: 15,
                projectedAmount: 4800.00,
                variance: -200.00,
                variancePercentage: -4.0
            }
        ];
    }
    generateSampleAnomalies() {
        return [
            {
                id: 'anomaly_1',
                type: 'spike',
                severity: 'high',
                description: 'Unusual spike in compute costs detected',
                detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                period: {
                    start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                },
                affectedServices: ['compute'],
                affectedResources: ['ec2-instance-3'],
                impact: {
                    costIncrease: 150.00,
                    percentageIncrease: 25.0
                },
                status: 'detected',
                metadata: {}
            }
        ];
    }
    generateSampleForecasts() {
        const forecasts = [];
        const now = new Date();
        for (let i = 1; i <= 30; i++) {
            const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const baseAmount = 120 + Math.random() * 20;
            forecasts.push({
                date,
                predictedAmount: baseAmount,
                confidence: 75 + Math.random() * 20,
                model: 'linear',
                factors: ['historical_trends', 'seasonality'],
                metadata: {}
            });
        }
        return forecasts;
    }
    startPeriodicReporting() {
        setInterval(() => {
            this.generateDailyReport();
        }, 24 * 60 * 60 * 1000);
        setInterval(() => {
            if (new Date().getDay() === 1) {
                this.generateWeeklyReport();
            }
        }, 24 * 60 * 60 * 1000);
        setInterval(() => {
            if (new Date().getDate() === 1) {
                this.generateMonthlyReport();
            }
        }, 24 * 60 * 60 * 1000);
    }
    async generateReport(name, type, organizationId, period, format = 'pdf', generatedBy = 'system') {
        try {
            const report = {
                id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                type,
                period,
                organizationId,
                data: await this.generateReportData(organizationId, period),
                generatedAt: new Date(),
                generatedBy,
                format,
                status: 'generating',
                metadata: {
                    template: `${type}_${this.getPeriodType(period)}`,
                    includeCharts: true,
                    includeRecommendations: type === 'optimization' || type === 'executive'
                }
            };
            this.reports.push(report);
            setTimeout(() => {
                this.completeReportGeneration(report.id);
            }, 2000);
            structuredLogger.info('Report generation started', {
                operation: 'report_generate',
                reportId: report.id,
                name,
                type,
                organizationId,
                format
            });
            return report;
        }
        catch (error) {
            structuredLogger.error('Failed to generate report', error, {
                operation: 'report_generate',
                name,
                type,
                organizationId
            });
            throw error;
        }
    }
    async generateReportData(organizationId, period) {
        const totalCosts = 5000 + Math.random() * 10000;
        const costsByService = {
            'compute': totalCosts * 0.4,
            'storage': totalCosts * 0.2,
            'database': totalCosts * 0.15,
            'network': totalCosts * 0.1,
            'licenses': totalCosts * 0.1,
            'services': totalCosts * 0.05
        };
        const costsByCategory = {
            'infrastructure': totalCosts * 0.6,
            'software': totalCosts * 0.25,
            'services': totalCosts * 0.1,
            'licenses': totalCosts * 0.05
        };
        return {
            totalCosts,
            costsByService,
            costsByCategory,
            costsByResource: {},
            costsByOrganization: { [organizationId]: totalCosts },
            trends: this.generateSampleTrends(),
            recommendations: this.generateSampleRecommendations(),
            budgetStatus: this.generateSampleBudgetStatus(),
            anomalies: this.generateSampleAnomalies(),
            forecasts: this.generateSampleForecasts()
        };
    }
    getPeriodType(period) {
        const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 1)
            return 'daily';
        if (days <= 7)
            return 'weekly';
        if (days <= 31)
            return 'monthly';
        if (days <= 93)
            return 'quarterly';
        return 'yearly';
    }
    async completeReportGeneration(reportId) {
        try {
            const report = this.reports.find(r => r.id === reportId);
            if (!report) {
                return;
            }
            report.status = 'completed';
            report.filePath = `/reports/${report.name.toLowerCase().replace(/\s+/g, '-')}.${report.format}`;
            report.fileSize = Math.floor(Math.random() * 5000000) + 1000000;
            structuredLogger.info('Report generation completed', {
                operation: 'report_complete',
                reportId,
                filePath: report.filePath,
                fileSize: report.fileSize
            });
        }
        catch (error) {
            structuredLogger.error('Failed to complete report generation', error, {
                operation: 'report_complete',
                reportId
            });
        }
    }
    async generateDailyReport() {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
            await this.generateReport(`Daily Cost Report - ${startOfDay.toISOString().split('T')[0]}`, 'technical', 'org_1', { start: startOfDay, end: endOfDay }, 'json', 'system');
        }
        catch (error) {
            structuredLogger.error('Failed to generate daily report', error, {
                operation: 'daily_report_generate'
            });
        }
    }
    async generateWeeklyReport() {
        try {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const startOfWeek = new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() - lastWeek.getDay());
            const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
            await this.generateReport(`Weekly Cost Report - Week of ${startOfWeek.toISOString().split('T')[0]}`, 'executive', 'org_1', { start: startOfWeek, end: endOfWeek }, 'pdf', 'system');
        }
        catch (error) {
            structuredLogger.error('Failed to generate weekly report', error, {
                operation: 'weekly_report_generate'
            });
        }
    }
    async generateMonthlyReport() {
        try {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const startOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
            const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
            await this.generateReport(`Monthly Cost Report - ${startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, 'executive', 'org_1', { start: startOfMonth, end: endOfMonth }, 'pdf', 'system');
        }
        catch (error) {
            structuredLogger.error('Failed to generate monthly report', error, {
                operation: 'monthly_report_generate'
            });
        }
    }
    getReport(reportId) {
        return this.reports.find(r => r.id === reportId) || null;
    }
    getReports(filters) {
        let filteredReports = [...this.reports];
        if (filters) {
            if (filters.organizationId) {
                filteredReports = filteredReports.filter(r => r.organizationId === filters.organizationId);
            }
            if (filters.type) {
                filteredReports = filteredReports.filter(r => r.type === filters.type);
            }
            if (filters.status) {
                filteredReports = filteredReports.filter(r => r.status === filters.status);
            }
            if (filters.startDate) {
                filteredReports = filteredReports.filter(r => r.generatedAt >= filters.startDate);
            }
            if (filters.endDate) {
                filteredReports = filteredReports.filter(r => r.generatedAt <= filters.endDate);
            }
        }
        return filteredReports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    async generateCostForecast(organizationId, period, model = 'linear') {
        try {
            const forecasts = [];
            const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
            for (let i = 0; i < days; i++) {
                const date = new Date(period.start.getTime() + i * 24 * 60 * 60 * 1000);
                const baseAmount = 100 + Math.random() * 50;
                forecasts.push({
                    date,
                    predictedAmount: baseAmount,
                    confidence: 70 + Math.random() * 25,
                    model,
                    factors: ['historical_trends', 'seasonality', 'business_growth'],
                    metadata: {
                        organizationId,
                        generatedAt: new Date().toISOString()
                    }
                });
            }
            this.costForecasts.push(...forecasts);
            structuredLogger.info('Cost forecast generated', {
                operation: 'cost_forecast',
                organizationId,
                period,
                model,
                forecastDays: days
            });
            return forecasts;
        }
        catch (error) {
            structuredLogger.error('Failed to generate cost forecast', error, {
                operation: 'cost_forecast',
                organizationId,
                period
            });
            throw error;
        }
    }
    getCostForecasts(organizationId) {
        if (organizationId) {
            return this.costForecasts.filter(f => f.metadata.organizationId === organizationId);
        }
        return [...this.costForecasts];
    }
    async generateFinOpsMetrics(organizationId) {
        try {
            const reports = this.getReports({ organizationId });
            const latestReport = reports[0];
            if (!latestReport) {
                throw new Error('No reports found for organization');
            }
            const metrics = {
                totalCosts: latestReport.data.totalCosts,
                costsByPeriod: {
                    current: latestReport.data.totalCosts,
                    previous: latestReport.data.totalCosts * 0.95,
                    change: latestReport.data.totalCosts * 0.05,
                    changePercentage: 5.0
                },
                costsByService: Object.entries(latestReport.data.costsByService).reduce((acc, [service, amount]) => {
                    acc[service] = {
                        amount,
                        percentage: (amount / latestReport.data.totalCosts) * 100,
                        trend: Math.random() > 0.5 ? 'up' : 'down'
                    };
                    return acc;
                }, {}),
                costsByCategory: Object.entries(latestReport.data.costsByCategory).reduce((acc, [category, amount]) => {
                    acc[category] = {
                        amount,
                        percentage: (amount / latestReport.data.totalCosts) * 100,
                        trend: Math.random() > 0.5 ? 'up' : 'down'
                    };
                    return acc;
                }, {}),
                budgetAdherence: {
                    totalBudgets: latestReport.data.budgetStatus.length,
                    onTrack: latestReport.data.budgetStatus.filter(b => b.status === 'on_track').length,
                    atRisk: latestReport.data.budgetStatus.filter(b => b.status === 'at_risk').length,
                    exceeded: latestReport.data.budgetStatus.filter(b => b.status === 'exceeded').length,
                    averageAdherence: latestReport.data.budgetStatus.reduce((sum, b) => sum + b.percentage, 0) / latestReport.data.budgetStatus.length
                },
                optimization: {
                    totalRecommendations: latestReport.data.recommendations.length,
                    implemented: latestReport.data.recommendations.filter(r => r.status === 'implemented').length,
                    pending: latestReport.data.recommendations.filter(r => r.status === 'pending').length,
                    totalSavings: latestReport.data.recommendations
                        .filter(r => r.status === 'implemented')
                        .reduce((sum, r) => sum + r.potentialSavings, 0),
                    potentialSavings: latestReport.data.recommendations
                        .filter(r => r.status === 'pending')
                        .reduce((sum, r) => sum + r.potentialSavings, 0)
                },
                anomalies: {
                    total: latestReport.data.anomalies.length,
                    critical: latestReport.data.anomalies.filter(a => a.severity === 'critical').length,
                    high: latestReport.data.anomalies.filter(a => a.severity === 'high').length,
                    medium: latestReport.data.anomalies.filter(a => a.severity === 'medium').length,
                    low: latestReport.data.anomalies.filter(a => a.severity === 'low').length
                },
                efficiency: {
                    averageResourceUtilization: 75 + Math.random() * 20,
                    averageCostEfficiency: 80 + Math.random() * 15,
                    wastePercentage: 5 + Math.random() * 10
                }
            };
            structuredLogger.info('FinOps metrics generated', {
                operation: 'finops_metrics',
                organizationId,
                totalCosts: metrics.totalCosts
            });
            return metrics;
        }
        catch (error) {
            structuredLogger.error('Failed to generate FinOps metrics', error, {
                operation: 'finops_metrics',
                organizationId
            });
            throw error;
        }
    }
    getReportingStats() {
        const totalReports = this.reports.length;
        const reportsByType = this.reports.reduce((acc, r) => {
            acc[r.type] = (acc[r.type] || 0) + 1;
            return acc;
        }, {});
        const reportsByStatus = this.reports.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});
        const reportsByFormat = this.reports.reduce((acc, r) => {
            acc[r.format] = (acc[r.format] || 0) + 1;
            return acc;
        }, {});
        const totalReportSize = this.reports.reduce((sum, r) => sum + (r.fileSize || 0), 0);
        const averageReportSize = totalReports > 0 ? totalReportSize / totalReports : 0;
        return {
            totalReports,
            reportsByType,
            reportsByStatus,
            reportsByFormat,
            averageReportSize,
            totalReportSize
        };
    }
}
//# sourceMappingURL=reporting-engine.service.js.map