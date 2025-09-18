import { structuredLogger } from './structured-logger.js';

// Supplier Scorecard Service - PR-35
// Sistema completo de evaluación y scoring de proveedores

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
    onTimeDelivery: number; // percentage
    qualityScore: number; // 1-10
    costCompetitiveness: number; // 1-10
    communicationScore: number; // 1-10
    innovationScore: number; // 1-10
    sustainabilityScore: number; // 1-10
    // PR-69: Métricas específicas de vendor scorecard
    otif: number; // On-Time In-Full percentage
    leadTime: number; // Average lead time in days
    ppv: number; // Purchase Price Variance percentage
    sl: number; // Service Level percentage
  };
  riskAssessment: {
    financialRisk: 'low' | 'medium' | 'high';
    operationalRisk: 'low' | 'medium' | 'high';
    complianceRisk: 'low' | 'medium' | 'high';
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
  };
  scorecard: {
    overallScore: number; // 1-100
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
    responseTime: number; // hours
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
    // PR-69: Métricas específicas de vendor scorecard
    otifRate: number; // On-Time In-Full percentage
    averageLeadTime: number; // Average lead time in days
    ppvRate: number; // Purchase Price Variance percentage
    serviceLevel: number; // Service Level percentage
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
    // PR-69: Alertas específicas de vendor scorecard
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

class SupplierScorecardService {
  private suppliers: Map<string, Supplier> = new Map();
  private evaluations: Map<string, EvaluationRecord> = new Map();
  private performances: Map<string, SupplierPerformance> = new Map();
  private comparisons: Map<string, SupplierComparison> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Supplier Scorecard Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Demo suppliers
    const supplier1: Supplier = {
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
        // PR-69: Métricas específicas de vendor scorecard
        otif: 92.5, // On-Time In-Full percentage
        leadTime: 7.2, // Average lead time in days
        ppv: -2.1, // Purchase Price Variance percentage (negative = savings)
        sl: 98.3 // Service Level percentage
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

    const supplier2: Supplier = {
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
        // PR-69: Métricas específicas de vendor scorecard
        otif: 84.2, // On-Time In-Full percentage
        leadTime: 12.5, // Average lead time in days
        ppv: 1.8, // Purchase Price Variance percentage (positive = over budget)
        sl: 94.7 // Service Level percentage
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

    const supplier3: Supplier = {
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
        // PR-69: Métricas específicas de vendor scorecard
        otif: 89.8, // On-Time In-Full percentage
        leadTime: 5.8, // Average lead time in days
        ppv: -3.2, // Purchase Price Variance percentage (negative = savings)
        sl: 96.1 // Service Level percentage
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

    // Demo evaluations
    const evaluation1: EvaluationRecord = {
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

    // Demo performances
    const performance1: SupplierPerformance = {
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
        // PR-69: Métricas específicas de vendor scorecard
        otifRate: 92.5, // On-Time In-Full percentage
        averageLeadTime: 7.2, // Average lead time in days
        ppvRate: -2.1, // Purchase Price Variance percentage
        serviceLevel: 98.3 // Service Level percentage
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

  // Supplier Management
  async createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'scorecard'>): Promise<Supplier> {
    const now = new Date().toISOString();
    const newSupplier: Supplier = {
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

  async getSupplier(supplierId: string): Promise<Supplier | undefined> {
    return this.suppliers.get(supplierId);
  }

  async getSuppliers(organizationId: string, filters: {
    status?: string;
    type?: string;
    category?: string;
    grade?: string;
    riskLevel?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<Supplier[]> {
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
      suppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.code.toLowerCase().includes(searchLower) ||
        s.contactInfo.email.toLowerCase().includes(searchLower)
      );
    }

    if (filters.limit) {
      suppliers = suppliers.slice(0, filters.limit);
    }

    return suppliers.sort((a, b) => b.scorecard.overallScore - a.scorecard.overallScore);
  }

  // Evaluation Management
  async createEvaluation(evaluationData: Omit<EvaluationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<EvaluationRecord> {
    const now = new Date().toISOString();
    const newEvaluation: EvaluationRecord = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...evaluationData,
      createdAt: now,
      updatedAt: now
    };

    this.evaluations.set(newEvaluation.id, newEvaluation);

    // Update supplier scorecard
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

  async getEvaluations(organizationId: string, filters: {
    supplierId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<EvaluationRecord[]> {
    let evaluations = Array.from(this.evaluations.values())
      .filter(e => e.organizationId === organizationId);

    if (filters.supplierId) {
      evaluations = evaluations.filter(e => e.supplierId === filters.supplierId);
    }

    if (filters.status) {
      evaluations = evaluations.filter(e => e.status === filters.status);
    }

    if (filters.startDate) {
      evaluations = evaluations.filter(e => e.evaluationDate >= filters.startDate!);
    }

    if (filters.endDate) {
      evaluations = evaluations.filter(e => e.evaluationDate <= filters.endDate!);
    }

    if (filters.limit) {
      evaluations = evaluations.slice(0, filters.limit);
    }

    return evaluations.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());
  }

  // Performance Management
  async getSupplierPerformance(supplierId: string, organizationId: string): Promise<SupplierPerformance | undefined> {
    const performance = this.performances.get(supplierId);
    if (performance && performance.organizationId === organizationId) {
      return performance;
    }
    return undefined;
  }

  async getSuppliersPerformance(organizationId: string, filters: {
    category?: string;
    minScore?: number;
    maxScore?: number;
    limit?: number;
  } = {}): Promise<SupplierPerformance[]> {
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
        return supplier && supplier.scorecard.overallScore >= filters.minScore!;
      });
    }

    if (filters.maxScore) {
      performances = performances.filter(p => {
        const supplier = this.suppliers.get(p.supplierId);
        return supplier && supplier.scorecard.overallScore <= filters.maxScore!;
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

  // Comparison Management
  async createSupplierComparison(comparisonData: Omit<SupplierComparison, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplierComparison> {
    const now = new Date().toISOString();
    const newComparison: SupplierComparison = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...comparisonData,
      createdAt: now,
      updatedAt: now
    };

    // Calculate ranks based on overall scores
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

  async getSupplierComparisons(organizationId: string, filters: {
    category?: string;
    limit?: number;
  } = {}): Promise<SupplierComparison[]> {
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

  // Reports
  async generateSupplierReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<SupplierReport> {
    let summary: any = {};
    let data: any = {};

    const suppliers = Array.from(this.suppliers.values()).filter(s => s.organizationId === organizationId);
    const evaluations = Array.from(this.evaluations.values()).filter(e => 
      e.organizationId === organizationId && 
      e.evaluationDate >= startDate && 
      e.evaluationDate <= endDate
    );

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
        }, {} as Record<string, number>);

        const riskDistribution = suppliers.reduce((acc, s) => {
          acc[s.riskAssessment.overallRisk] = (acc[s.riskAssessment.overallRisk] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

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
        // handle other report types or do nothing
        break;
      }
    }

    const report: SupplierReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
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

  // Statistics
  async getSupplierStats(organizationId: string) {
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
      }, {} as Record<string, number>),
      byRisk: suppliers.reduce((acc, s) => {
        acc[s.riskAssessment.overallRisk] = (acc[s.riskAssessment.overallRisk] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: suppliers.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: suppliers.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Helper methods
  private calculateGrade(score: number): 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F' {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 60) return 'D';
    return 'F';
  }

  private analyzeRiskFactors(suppliers: Supplier[]): Record<string, number> {
    const riskFactors: Record<string, number> = {};
    
    suppliers.forEach(supplier => {
      supplier.riskAssessment.riskFactors.forEach(factor => {
        riskFactors[factor] = (riskFactors[factor] || 0) + 1;
      });
    });

    return riskFactors;
  }

  // PR-69: Método para generar alertas específicas de vendor scorecard
  async generateVendorScorecardAlerts(organizationId: string): Promise<{
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
  }[]> {
    const suppliers = Array.from(this.suppliers.values())
      .filter(s => s.organizationId === organizationId);
    
    const alerts: {
      supplierId: string;
      supplierName: string;
      alerts: any[];
    }[] = [];

    suppliers.forEach(supplier => {
      const supplierAlerts: any[] = [];
      const now = new Date().toISOString();

      // OTIF Alert (On-Time In-Full)
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

      // Lead Time Alert
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

      // PPV Alert (Purchase Price Variance)
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

      // Service Level Alert
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
