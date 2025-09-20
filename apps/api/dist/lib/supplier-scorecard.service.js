import { structuredLogger } from './structured-logger.js';
class SupplierScorecardService {
    suppliers = new Map();
    evaluations = new Map();
    performances = new Map();
    comparisons = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('Supplier Scorecard Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const supplier1 = {
            id: 'supp_1',
            organizationId: 'demo-org-1',
            name: 'TechCorp Solutions',
            code: 'TCS001',
            type: 'manufacturer',
            category: 'Electronics',
            status: 'active',
            contactInfo: {
                email: 'contact@techcorp.com',
                phone: '+34 91 123 4567',
                address: 'Calle Tecnología 123',
                city: 'Madrid',
                country: 'Spain',
                website: 'https://techcorp.com'
            },
            businessInfo: {
                taxId: 'B12345678',
                registrationNumber: 'REG-2023-001',
                legalName: 'TechCorp Solutions S.L.',
                foundedYear: 2015,
                employeeCount: 150,
                annualRevenue: 5000000,
                currency: 'EUR'
            },
            certifications: ['ISO 9001', 'ISO 14001', 'CE Marking'],
            paymentTerms: {
                standardDays: 30,
                earlyPaymentDiscount: 2,
                latePaymentPenalty: 1.5,
                preferredMethod: 'bank_transfer'
            },
            performanceMetrics: {
                onTimeDelivery: 95,
                qualityScore: 9.2,
                costCompetitiveness: 8.5,
                communicationScore: 9.0,
                innovationScore: 8.8,
                sustainabilityScore: 8.0,
                otif: 92.5,
                leadTime: 7.2,
                ppv: -2.1,
                sl: 98.3
            },
            riskAssessment: {
                financialRisk: 'low',
                operationalRisk: 'low',
                complianceRisk: 'low',
                overallRisk: 'low',
                riskFactors: []
            },
            scorecard: {
                overallScore: 88.5,
                grade: 'A',
                lastEvaluated: oneMonthAgo.toISOString(),
                nextEvaluation: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                evaluationHistory: []
            },
            createdAt: twoMonthsAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        const supplier2 = {
            id: 'supp_2',
            organizationId: 'demo-org-1',
            name: 'LogiFlow Distribution',
            code: 'LFD002',
            type: 'distributor',
            category: 'Logistics',
            status: 'active',
            contactInfo: {
                email: 'info@logiflow.com',
                phone: '+34 93 987 6543',
                address: 'Avenida Logística 456',
                city: 'Barcelona',
                country: 'Spain',
                website: 'https://logiflow.com'
            },
            businessInfo: {
                taxId: 'B87654321',
                registrationNumber: 'REG-2022-045',
                legalName: 'LogiFlow Distribution S.A.',
                foundedYear: 2010,
                employeeCount: 75,
                annualRevenue: 2500000,
                currency: 'EUR'
            },
            certifications: ['ISO 9001', 'OHSAS 18001'],
            paymentTerms: {
                standardDays: 45,
                earlyPaymentDiscount: 1.5,
                latePaymentPenalty: 2.0,
                preferredMethod: 'bank_transfer'
            },
            performanceMetrics: {
                onTimeDelivery: 87,
                qualityScore: 8.5,
                costCompetitiveness: 9.0,
                communicationScore: 8.2,
                innovationScore: 7.5,
                sustainabilityScore: 8.5,
                otif: 84.2,
                leadTime: 12.5,
                ppv: 1.8,
                sl: 94.7
            },
            riskAssessment: {
                financialRisk: 'medium',
                operationalRisk: 'low',
                complianceRisk: 'low',
                overallRisk: 'low',
                riskFactors: ['High dependency on single customer']
            },
            scorecard: {
                overallScore: 82.0,
                grade: 'A-',
                lastEvaluated: oneMonthAgo.toISOString(),
                nextEvaluation: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                evaluationHistory: []
            },
            createdAt: twoMonthsAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        const supplier3 = {
            id: 'supp_3',
            organizationId: 'demo-org-1',
            name: 'GreenTech Services',
            code: 'GTS003',
            type: 'service_provider',
            category: 'Environmental',
            status: 'active',
            contactInfo: {
                email: 'hello@greentech.com',
                phone: '+34 95 555 1234',
                address: 'Plaza Verde 789',
                city: 'Sevilla',
                country: 'Spain',
                website: 'https://greentech.com'
            },
            businessInfo: {
                taxId: 'B11223344',
                registrationNumber: 'REG-2023-078',
                legalName: 'GreenTech Services S.L.',
                foundedYear: 2020,
                employeeCount: 25,
                annualRevenue: 800000,
                currency: 'EUR'
            },
            certifications: ['ISO 14001', 'EMAS', 'Green Business Certification'],
            paymentTerms: {
                standardDays: 15,
                earlyPaymentDiscount: 3,
                latePaymentPenalty: 1.0,
                preferredMethod: 'bank_transfer'
            },
            performanceMetrics: {
                onTimeDelivery: 92,
                qualityScore: 9.5,
                costCompetitiveness: 7.8,
                communicationScore: 9.2,
                innovationScore: 9.8,
                sustainabilityScore: 10.0,
                otif: 89.8,
                leadTime: 5.8,
                ppv: -3.2,
                sl: 96.1
            },
            riskAssessment: {
                financialRisk: 'medium',
                operationalRisk: 'low',
                complianceRisk: 'low',
                overallRisk: 'low',
                riskFactors: ['New company with limited track record']
            },
            scorecard: {
                overallScore: 91.0,
                grade: 'A+',
                lastEvaluated: oneMonthAgo.toISOString(),
                nextEvaluation: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                evaluationHistory: []
            },
            createdAt: twoMonthsAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        this.suppliers.set(supplier1.id, supplier1);
        this.suppliers.set(supplier2.id, supplier2);
        this.suppliers.set(supplier3.id, supplier3);
        const evaluation1 = {
            id: 'eval_1',
            supplierId: 'supp_1',
            organizationId: 'demo-org-1',
            evaluationDate: oneMonthAgo.toISOString(),
            evaluatedBy: 'user_1',
            evaluatedByName: 'Procurement Manager',
            period: {
                startDate: twoMonthsAgo.toISOString(),
                endDate: oneMonthAgo.toISOString()
            },
            scores: {
                delivery: 95,
                quality: 92,
                cost: 85,
                communication: 90,
                innovation: 88,
                sustainability: 80,
                overall: 88.5
            },
            metrics: {
                ordersCount: 45,
                totalValue: 125000,
                onTimeDeliveries: 43,
                qualityIssues: 2,
                costSavings: 5000,
                responseTime: 4.5
            },
            comments: 'Excellent performance overall. Strong delivery record and quality. Room for improvement in cost competitiveness.',
            recommendations: [
                'Negotiate better pricing for bulk orders',
                'Implement sustainability initiatives',
                'Continue excellent communication practices'
            ],
            status: 'approved',
            createdAt: oneMonthAgo.toISOString(),
            updatedAt: oneMonthAgo.toISOString()
        };
        this.evaluations.set(evaluation1.id, evaluation1);
        const performance1 = {
            supplierId: 'supp_1',
            organizationId: 'demo-org-1',
            period: {
                startDate: twoMonthsAgo.toISOString(),
                endDate: now.toISOString()
            },
            metrics: {
                totalOrders: 45,
                totalValue: 125000,
                averageOrderValue: 2777.78,
                onTimeDeliveryRate: 95.6,
                qualityDefectRate: 4.4,
                averageResponseTime: 4.5,
                costSavings: 5000,
                innovationContributions: 3,
                otifRate: 92.5,
                averageLeadTime: 7.2,
                ppvRate: -2.1,
                serviceLevel: 98.3
            },
            trends: {
                deliveryTrend: 'stable',
                qualityTrend: 'improving',
                costTrend: 'stable',
                overallTrend: 'improving'
            },
            alerts: [],
            lastUpdated: now.toISOString()
        };
        this.performances.set(performance1.supplierId, performance1);
    }
    async createSupplier(supplierData) {
        const now = new Date().toISOString();
        const newSupplier = {
            id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...supplierData,
            scorecard: {
                overallScore: 0,
                grade: 'F',
                lastEvaluated: now,
                nextEvaluation: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                evaluationHistory: []
            },
            createdAt: now,
            updatedAt: now
        };
        this.suppliers.set(newSupplier.id, newSupplier);
        structuredLogger.info('Supplier created', {
            supplierId: newSupplier.id,
            organizationId: newSupplier.organizationId,
            name: newSupplier.name,
            code: newSupplier.code
        });
        return newSupplier;
    }
    async getSupplier(supplierId) {
        return this.suppliers.get(supplierId);
    }
    async getSuppliers(organizationId, filters = {}) {
        let suppliers = Array.from(this.suppliers.values())
            .filter(s => s.organizationId === organizationId);
        if (filters.status) {
            suppliers = suppliers.filter(s => s.status === filters.status);
        }
        if (filters.type) {
            suppliers = suppliers.filter(s => s.type === filters.type);
        }
        if (filters.category) {
            suppliers = suppliers.filter(s => s.category === filters.category);
        }
        if (filters.grade) {
            suppliers = suppliers.filter(s => s.scorecard.grade === filters.grade);
        }
        if (filters.riskLevel) {
            suppliers = suppliers.filter(s => s.riskAssessment.overallRisk === filters.riskLevel);
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            suppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchLower) ||
                s.code.toLowerCase().includes(searchLower) ||
                s.contactInfo.email.toLowerCase().includes(searchLower));
        }
        if (filters.limit) {
            suppliers = suppliers.slice(0, filters.limit);
        }
        return suppliers.sort((a, b) => b.scorecard.overallScore - a.scorecard.overallScore);
    }
    async createEvaluation(evaluationData) {
        const now = new Date().toISOString();
        const newEvaluation = {
            id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...evaluationData,
            createdAt: now,
            updatedAt: now
        };
        this.evaluations.set(newEvaluation.id, newEvaluation);
        const supplier = this.suppliers.get(newEvaluation.supplierId);
        if (supplier) {
            supplier.scorecard.overallScore = newEvaluation.scores.overall;
            supplier.scorecard.grade = this.calculateGrade(newEvaluation.scores.overall);
            supplier.scorecard.lastEvaluated = newEvaluation.evaluationDate;
            supplier.scorecard.nextEvaluation = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            supplier.scorecard.evaluationHistory.push(newEvaluation.id);
            supplier.updatedAt = now;
            this.suppliers.set(supplier.id, supplier);
        }
        structuredLogger.info('Supplier evaluation created', {
            evaluationId: newEvaluation.id,
            supplierId: newEvaluation.supplierId,
            overallScore: newEvaluation.scores.overall,
            grade: this.calculateGrade(newEvaluation.scores.overall)
        });
        return newEvaluation;
    }
    async getEvaluations(organizationId, filters = {}) {
        let evaluations = Array.from(this.evaluations.values())
            .filter(e => e.organizationId === organizationId);
        if (filters.supplierId) {
            evaluations = evaluations.filter(e => e.supplierId === filters.supplierId);
        }
        if (filters.status) {
            evaluations = evaluations.filter(e => e.status === filters.status);
        }
        if (filters.startDate) {
            evaluations = evaluations.filter(e => e.evaluationDate >= filters.startDate);
        }
        if (filters.endDate) {
            evaluations = evaluations.filter(e => e.evaluationDate <= filters.endDate);
        }
        if (filters.limit) {
            evaluations = evaluations.slice(0, filters.limit);
        }
        return evaluations.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
    }
    async getSupplierPerformance(supplierId, organizationId) {
        const performance = this.performances.get(supplierId);
        if (performance && performance.organizationId === organizationId) {
            return performance;
        }
        return undefined;
    }
    async getSuppliersPerformance(organizationId, filters = {}) {
        let performances = Array.from(this.performances.values())
            .filter(p => p.organizationId === organizationId);
        if (filters.category) {
            performances = performances.filter(p => {
                const supplier = this.suppliers.get(p.supplierId);
                return supplier && supplier.category === filters.category;
            });
        }
        if (filters.minScore) {
            performances = performances.filter(p => {
                const supplier = this.suppliers.get(p.supplierId);
                return supplier && supplier.scorecard.overallScore >= filters.minScore;
            });
        }
        if (filters.maxScore) {
            performances = performances.filter(p => {
                const supplier = this.suppliers.get(p.supplierId);
                return supplier && supplier.scorecard.overallScore <= filters.maxScore;
            });
        }
        if (filters.limit) {
            performances = performances.slice(0, filters.limit);
        }
        return performances.sort((a, b) => {
            const supplierA = this.suppliers.get(a.supplierId);
            const supplierB = this.suppliers.get(b.supplierId);
            return (supplierB?.scorecard.overallScore || 0) - (supplierA?.scorecard.overallScore || 0);
        });
    }
    async createSupplierComparison(comparisonData) {
        const now = new Date().toISOString();
        const newComparison = {
            id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...comparisonData,
            createdAt: now,
            updatedAt: now
        };
        newComparison.suppliers.sort((a, b) => b.scores.overall - a.scores.overall);
        newComparison.suppliers.forEach((supplier, index) => {
            supplier.rank = index + 1;
        });
        this.comparisons.set(newComparison.id, newComparison);
        structuredLogger.info('Supplier comparison created', {
            comparisonId: newComparison.id,
            organizationId: newComparison.organizationId,
            suppliersCount: newComparison.suppliers.length
        });
        return newComparison;
    }
    async getSupplierComparisons(organizationId, filters = {}) {
        let comparisons = Array.from(this.comparisons.values())
            .filter(c => c.organizationId === organizationId);
        if (filters.category) {
            comparisons = comparisons.filter(c => c.category === filters.category);
        }
        if (filters.limit) {
            comparisons = comparisons.slice(0, filters.limit);
        }
        return comparisons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async generateSupplierReport(organizationId, reportType, startDate, endDate, generatedBy) {
        let summary = {};
        let data = {};
        const suppliers = Array.from(this.suppliers.values()).filter(s => s.organizationId === organizationId);
        const evaluations = Array.from(this.evaluations.values()).filter(e => e.organizationId === organizationId &&
            e.evaluationDate >= startDate &&
            e.evaluationDate <= endDate);
        switch (reportType) {
            case 'performance_summary': {
                summary = {
                    totalSuppliers: suppliers.length,
                    evaluatedSuppliers: evaluations.length,
                    averageScore: suppliers.reduce((sum, s) => sum + s.scorecard.overallScore, 0) / suppliers.length,
                    topPerformers: suppliers.filter(s => s.scorecard.grade === 'A+' || s.scorecard.grade === 'A').length,
                    underPerformers: suppliers.filter(s => s.scorecard.grade === 'D' || s.scorecard.grade === 'F').length,
                    riskSuppliers: suppliers.filter(s => s.riskAssessment.overallRisk === 'high').length
                };
                data = { suppliers, evaluations };
                break;
            }
            case 'scorecard_analysis': {
                const scoreDistribution = suppliers.reduce((acc, s) => {
                    acc[s.scorecard.grade] = (acc[s.scorecard.grade] || 0) + 1;
                    return acc;
                }, {});
                const riskDistribution = suppliers.reduce((acc, s) => {
                    acc[s.riskAssessment.overallRisk] = (acc[s.riskAssessment.overallRisk] || 0) + 1;
                    return acc;
                }, {});
                summary = {
                    totalSuppliers: suppliers.length,
                    evaluatedSuppliers: evaluations.length,
                    averageScore: suppliers.reduce((sum, s) => sum + s.scorecard.overallScore, 0) / suppliers.length,
                    topPerformers: suppliers.filter(s => s.scorecard.grade === 'A+' || s.scorecard.grade === 'A').length,
                    underPerformers: suppliers.filter(s => s.scorecard.grade === 'D' || s.scorecard.grade === 'F').length,
                    riskSuppliers: suppliers.filter(s => s.riskAssessment.overallRisk === 'high').length
                };
                data = { scoreDistribution, riskDistribution, suppliers };
                break;
            }
            case 'risk_assessment': {
                const riskSuppliers = suppliers.filter(s => s.riskAssessment.overallRisk === 'high' || s.riskAssessment.overallRisk === 'medium');
                summary = {
                    totalSuppliers: suppliers.length,
                    evaluatedSuppliers: evaluations.length,
                    averageScore: suppliers.reduce((sum, s) => sum + s.scorecard.overallScore, 0) / suppliers.length,
                    topPerformers: suppliers.filter(s => s.scorecard.grade === 'A+' || s.scorecard.grade === 'A').length,
                    underPerformers: suppliers.filter(s => s.scorecard.grade === 'D' || s.scorecard.grade === 'F').length,
                    riskSuppliers: riskSuppliers.length
                };
                data = { riskSuppliers, riskFactors: this.analyzeRiskFactors(suppliers) };
                break;
            }
            default: {
                break;
            }
        }
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            organizationId,
            reportType: reportType,
            period: { startDate, endDate },
            summary,
            data,
            generatedBy,
            createdAt: new Date().toISOString()
        };
        structuredLogger.info('Supplier report generated', {
            reportId: report.id,
            organizationId,
            reportType,
            period: `${startDate} to ${endDate}`
        });
        return report;
    }
    async getSupplierStats(organizationId) {
        const suppliers = Array.from(this.suppliers.values()).filter(s => s.organizationId === organizationId);
        const evaluations = Array.from(this.evaluations.values()).filter(e => e.organizationId === organizationId);
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const recentEvaluations = evaluations.filter(e => new Date(e.evaluationDate) >= last30Days);
        return {
            totalSuppliers: suppliers.length,
            activeSuppliers: suppliers.filter(s => s.status === 'active').length,
            averageScore: suppliers.reduce((sum, s) => sum + s.scorecard.overallScore, 0) / suppliers.length,
            topPerformers: suppliers.filter(s => s.scorecard.grade === 'A+' || s.scorecard.grade === 'A').length,
            underPerformers: suppliers.filter(s => s.scorecard.grade === 'D' || s.scorecard.grade === 'F').length,
            riskSuppliers: suppliers.filter(s => s.riskAssessment.overallRisk === 'high').length,
            pendingEvaluations: suppliers.filter(s => new Date(s.scorecard.nextEvaluation) <= now).length,
            last30Days: {
                evaluations: recentEvaluations.length,
                averageScore: recentEvaluations.reduce((sum, e) => sum + e.scores.overall, 0) / recentEvaluations.length || 0
            },
            last90Days: {
                evaluations: evaluations.filter(e => new Date(e.evaluationDate) >= last90Days).length,
                newSuppliers: suppliers.filter(s => new Date(s.createdAt) >= last90Days).length
            },
            byGrade: suppliers.reduce((acc, s) => {
                acc[s.scorecard.grade] = (acc[s.scorecard.grade] || 0) + 1;
                return acc;
            }, {}),
            byRisk: suppliers.reduce((acc, s) => {
                acc[s.riskAssessment.overallRisk] = (acc[s.riskAssessment.overallRisk] || 0) + 1;
                return acc;
            }, {}),
            byType: suppliers.reduce((acc, s) => {
                acc[s.type] = (acc[s.type] || 0) + 1;
                return acc;
            }, {}),
            byCategory: suppliers.reduce((acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            }, {})
        };
    }
    calculateGrade(score) {
        if (score >= 97)
            return 'A+';
        if (score >= 93)
            return 'A';
        if (score >= 90)
            return 'A-';
        if (score >= 87)
            return 'B+';
        if (score >= 83)
            return 'B';
        if (score >= 80)
            return 'B-';
        if (score >= 77)
            return 'C+';
        if (score >= 73)
            return 'C';
        if (score >= 70)
            return 'C-';
        if (score >= 60)
            return 'D';
        return 'F';
    }
    analyzeRiskFactors(suppliers) {
        const riskFactors = {};
        suppliers.forEach(supplier => {
            supplier.riskAssessment.riskFactors.forEach(factor => {
                riskFactors[factor] = (riskFactors[factor] || 0) + 1;
            });
        });
        return riskFactors;
    }
    async generateVendorScorecardAlerts(organizationId) {
        const suppliers = Array.from(this.suppliers.values())
            .filter(s => s.organizationId === organizationId);
        const alerts = [];
        suppliers.forEach(supplier => {
            const supplierAlerts = [];
            const now = new Date().toISOString();
            if (supplier.performanceMetrics.otif < 90) {
                supplierAlerts.push({
                    type: 'otif_decline',
                    severity: supplier.performanceMetrics.otif < 80 ? 'critical' :
                        supplier.performanceMetrics.otif < 85 ? 'high' : 'medium',
                    message: `OTIF below target: ${supplier.performanceMetrics.otif}% (target: 90%)`,
                    threshold: 90,
                    currentValue: supplier.performanceMetrics.otif,
                    targetValue: 90,
                    createdAt: now
                });
            }
            if (supplier.performanceMetrics.leadTime > 10) {
                supplierAlerts.push({
                    type: 'lead_time_increase',
                    severity: supplier.performanceMetrics.leadTime > 15 ? 'critical' :
                        supplier.performanceMetrics.leadTime > 12 ? 'high' : 'medium',
                    message: `Lead time above target: ${supplier.performanceMetrics.leadTime} days (target: 10 days)`,
                    threshold: 10,
                    currentValue: supplier.performanceMetrics.leadTime,
                    targetValue: 10,
                    createdAt: now
                });
            }
            if (supplier.performanceMetrics.ppv > 5) {
                supplierAlerts.push({
                    type: 'ppv_variance',
                    severity: supplier.performanceMetrics.ppv > 10 ? 'critical' :
                        supplier.performanceMetrics.ppv > 7 ? 'high' : 'medium',
                    message: `PPV above target: ${supplier.performanceMetrics.ppv}% (target: <5%)`,
                    threshold: 5,
                    currentValue: supplier.performanceMetrics.ppv,
                    targetValue: 5,
                    createdAt: now
                });
            }
            if (supplier.performanceMetrics.sl < 95) {
                supplierAlerts.push({
                    type: 'service_level_decline',
                    severity: supplier.performanceMetrics.sl < 90 ? 'critical' :
                        supplier.performanceMetrics.sl < 93 ? 'high' : 'medium',
                    message: `Service level below target: ${supplier.performanceMetrics.sl}% (target: 95%)`,
                    threshold: 95,
                    currentValue: supplier.performanceMetrics.sl,
                    targetValue: 95,
                    createdAt: now
                });
            }
            if (supplierAlerts.length > 0) {
                alerts.push({
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    alerts: supplierAlerts
                });
            }
        });
        structuredLogger.info('Vendor scorecard alerts generated', {
            organizationId,
            totalSuppliers: suppliers.length,
            suppliersWithAlerts: alerts.length,
            totalAlerts: alerts.reduce((sum, a) => sum + a.alerts.length, 0)
        });
        return alerts;
    }
}
export const supplierScorecardService = new SupplierScorecardService();
//# sourceMappingURL=supplier-scorecard.service.js.map