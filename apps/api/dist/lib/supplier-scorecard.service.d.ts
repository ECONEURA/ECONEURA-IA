interface Supplier {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    type: 'manufacturer' | 'distributor' | 'service_provider' | 'consultant' | 'other';
    category: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
    contactInfo: {
        email: string;
        phone: string;
        address: string;
        city: string;
        country: string;
        website?: string;
    };
    businessInfo: {
        taxId: string;
        registrationNumber: string;
        legalName: string;
        foundedYear?: number;
        employeeCount?: number;
        annualRevenue?: number;
        currency: string;
    };
    certifications: string[];
    paymentTerms: {
        standardDays: number;
        earlyPaymentDiscount?: number;
        latePaymentPenalty?: number;
        preferredMethod: 'bank_transfer' | 'check' | 'credit_card' | 'cash';
    };
    performanceMetrics: {
        onTimeDelivery: number;
        qualityScore: number;
        costCompetitiveness: number;
        communicationScore: number;
        innovationScore: number;
        sustainabilityScore: number;
        otif: number;
        leadTime: number;
        ppv: number;
        sl: number;
    };
    riskAssessment: {
        financialRisk: 'low' | 'medium' | 'high';
        operationalRisk: 'low' | 'medium' | 'high';
        complianceRisk: 'low' | 'medium' | 'high';
        overallRisk: 'low' | 'medium' | 'high';
        riskFactors: string[];
    };
    scorecard: {
        overallScore: number;
        grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
        lastEvaluated: string;
        nextEvaluation: string;
        evaluationHistory: EvaluationRecord[];
    };
    createdAt: string;
    updatedAt: string;
}
interface EvaluationRecord {
    id: string;
    supplierId: string;
    organizationId: string;
    evaluationDate: string;
    evaluatedBy: string;
    evaluatedByName: string;
    period: {
        startDate: string;
        endDate: string;
    };
    scores: {
        delivery: number;
        quality: number;
        cost: number;
        communication: number;
        innovation: number;
        sustainability: number;
        overall: number;
    };
    metrics: {
        ordersCount: number;
        totalValue: number;
        onTimeDeliveries: number;
        qualityIssues: number;
        costSavings: number;
        responseTime: number;
    };
    comments: string;
    recommendations: string[];
    status: 'draft' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
}
interface SupplierPerformance {
    supplierId: string;
    organizationId: string;
    period: {
        startDate: string;
        endDate: string;
    };
    metrics: {
        totalOrders: number;
        totalValue: number;
        averageOrderValue: number;
        onTimeDeliveryRate: number;
        qualityDefectRate: number;
        averageResponseTime: number;
        costSavings: number;
        innovationContributions: number;
        otifRate: number;
        averageLeadTime: number;
        ppvRate: number;
        serviceLevel: number;
    };
    trends: {
        deliveryTrend: 'improving' | 'stable' | 'declining';
        qualityTrend: 'improving' | 'stable' | 'declining';
        costTrend: 'improving' | 'stable' | 'declining';
        overallTrend: 'improving' | 'stable' | 'declining';
    };
    alerts: {
        type: 'performance_decline' | 'quality_issue' | 'delivery_delay' | 'cost_increase' | 'communication_issue' | 'otif_decline' | 'lead_time_increase' | 'ppv_variance' | 'service_level_decline';
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        createdAt: string;
        threshold?: number;
        currentValue?: number;
        targetValue?: number;
    }[];
    lastUpdated: string;
}
interface SupplierComparison {
    id: string;
    organizationId: string;
    name: string;
    category: string;
    suppliers: {
        supplierId: string;
        supplierName: string;
        scores: {
            overall: number;
            delivery: number;
            quality: number;
            cost: number;
            communication: number;
            innovation: number;
            sustainability: number;
        };
        metrics: {
            totalOrders: number;
            totalValue: number;
            onTimeDeliveryRate: number;
            qualityDefectRate: number;
            averageResponseTime: number;
        };
        rank: number;
    }[];
    createdAt: string;
    updatedAt: string;
}
interface SupplierReport {
    id: string;
    organizationId: string;
    reportType: 'performance_summary' | 'scorecard_analysis' | 'risk_assessment' | 'comparative_analysis' | 'trend_analysis';
    period: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalSuppliers: number;
        evaluatedSuppliers: number;
        averageScore: number;
        topPerformers: number;
        underPerformers: number;
        riskSuppliers: number;
    };
    data: any;
    generatedBy: string;
    createdAt: string;
}
declare class SupplierScorecardService {
    private suppliers;
    private evaluations;
    private performances;
    private comparisons;
    constructor();
    init(): void;
    private createDemoData;
    createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'scorecard'>): Promise<Supplier>;
    getSupplier(supplierId: string): Promise<Supplier | undefined>;
    getSuppliers(organizationId: string, filters?: {
        status?: string;
        type?: string;
        category?: string;
        grade?: string;
        riskLevel?: string;
        search?: string;
        limit?: number;
    }): Promise<Supplier[]>;
    createEvaluation(evaluationData: Omit<EvaluationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<EvaluationRecord>;
    getEvaluations(organizationId: string, filters?: {
        supplierId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<EvaluationRecord[]>;
    getSupplierPerformance(supplierId: string, organizationId: string): Promise<SupplierPerformance | undefined>;
    getSuppliersPerformance(organizationId: string, filters?: {
        category?: string;
        minScore?: number;
        maxScore?: number;
        limit?: number;
    }): Promise<SupplierPerformance[]>;
    createSupplierComparison(comparisonData: Omit<SupplierComparison, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierComparison>;
    getSupplierComparisons(organizationId: string, filters?: {
        category?: string;
        limit?: number;
    }): Promise<SupplierComparison[]>;
    generateSupplierReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<SupplierReport>;
    getSupplierStats(organizationId: string): Promise<{
        totalSuppliers: number;
        activeSuppliers: number;
        averageScore: number;
        topPerformers: number;
        underPerformers: number;
        riskSuppliers: number;
        pendingEvaluations: number;
        last30Days: {
            evaluations: number;
            averageScore: number;
        };
        last90Days: {
            evaluations: number;
            newSuppliers: number;
        };
        byGrade: Record<string, number>;
        byRisk: Record<string, number>;
        byType: Record<string, number>;
        byCategory: Record<string, number>;
    }>;
    private calculateGrade;
    private analyzeRiskFactors;
    generateVendorScorecardAlerts(organizationId: string): Promise<{
        supplierId: string;
        supplierName: string;
        alerts: {
            type: 'otif_decline' | 'lead_time_increase' | 'ppv_variance' | 'service_level_decline';
            severity: 'low' | 'medium' | 'high' | 'critical';
            message: string;
            threshold: number;
            currentValue: number;
            targetValue: number;
            createdAt: string;
        }[];
    }[]>;
}
export declare const supplierScorecardService: SupplierScorecardService;
export {};
//# sourceMappingURL=supplier-scorecard.service.d.ts.map