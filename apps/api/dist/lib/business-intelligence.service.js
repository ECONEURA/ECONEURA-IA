export class BusinessIntelligenceService {
    config;
    kpis = new Map();
    businessIntelligence = new Map();
    riskFactors = new Map();
    opportunities = new Map();
    competitiveAnalyses = new Map();
    roiAnalyses = new Map();
    constructor(config = {}) {
        this.config = {
            kpiTracking: true,
            competitiveAnalysis: true,
            roiAnalysis: true,
            riskAssessment: true,
            opportunityAnalysis: true,
            benchmarking: true,
            alerting: true,
            reporting: true,
            ...config
        };
    }
    async createKPI(request, organizationId) {
        const kpi = {
            id: this.generateId(),
            name: request.name,
            description: request.description,
            type: request.type,
            category: request.category,
            unit: request.unit,
            targetValue: request.targetValue,
            currentValue: 0,
            formula: request.formula,
            dataSource: request.dataSource,
            frequency: request.frequency,
            owner: request.owner,
            stakeholders: request.stakeholders,
            organizationId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.kpis.set(kpi.id, kpi);
        await this.initializeBusinessIntelligence(kpi);
        return kpi;
    }
    async updateKPI(kpiId, updates) {
        const kpi = this.kpis.get(kpiId);
        if (!kpi)
            return null;
        const updatedKPI = {
            ...kpi,
            ...updates,
            updatedAt: new Date()
        };
        this.kpis.set(kpiId, updatedKPI);
        await this.updateBusinessIntelligence(updatedKPI);
        return updatedKPI;
    }
    async getKPI(kpiId) {
        return this.kpis.get(kpiId) || null;
    }
    async getKPIs(organizationId, filters) {
        let kpis = Array.from(this.kpis.values())
            .filter(k => k.organizationId === organizationId);
        if (filters) {
            if (filters.type) {
                kpis = kpis.filter(k => k.type === filters.type);
            }
            if (filters.category) {
                kpis = kpis.filter(k => k.category === filters.category);
            }
            if (filters.owner) {
                kpis = kpis.filter(k => k.owner === filters.owner);
            }
            if (filters.isActive !== undefined) {
                kpis = kpis.filter(k => k.isActive === filters.isActive);
            }
        }
        return kpis;
    }
    async deleteKPI(kpiId) {
        const deleted = this.kpis.delete(kpiId);
        if (deleted) {
            this.businessIntelligence.delete(kpiId);
            this.riskFactors.delete(kpiId);
            this.opportunities.delete(kpiId);
        }
        return deleted;
    }
    async updateKPIValue(kpiId, value) {
        const kpi = this.kpis.get(kpiId);
        if (!kpi)
            return null;
        const updatedKPI = {
            ...kpi,
            currentValue: value,
            updatedAt: new Date()
        };
        this.kpis.set(kpiId, updatedKPI);
        await this.updateBusinessIntelligence(updatedKPI);
        return updatedKPI;
    }
    async initializeBusinessIntelligence(kpi) {
        const bi = {
            id: this.generateId(),
            kpiId: kpi.id,
            currentValue: kpi.currentValue,
            targetValue: kpi.targetValue,
            previousValue: 0,
            variance: 0,
            variancePercentage: 0,
            status: 'on-track',
            insights: [],
            recommendations: [],
            riskFactors: [],
            opportunities: [],
            organizationId: kpi.organizationId,
            period: 'monthly',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.businessIntelligence.set(kpi.id, bi);
    }
    async updateBusinessIntelligence(kpi) {
        const bi = this.businessIntelligence.get(kpi.id);
        if (!bi)
            return;
        const previousValue = bi.currentValue;
        const variance = kpi.currentValue - kpi.targetValue;
        const variancePercentage = (variance / kpi.targetValue) * 100;
        const status = this.determineKPIStatus(variancePercentage);
        const updatedBI = {
            ...bi,
            currentValue: kpi.currentValue,
            targetValue: kpi.targetValue,
            previousValue,
            variance,
            variancePercentage,
            status,
            insights: await this.generateInsights(kpi, variancePercentage),
            recommendations: await this.generateRecommendations(kpi, variancePercentage),
            riskFactors: await this.assessRisks(kpi, variancePercentage),
            opportunities: await this.identifyOpportunities(kpi, variancePercentage),
            updatedAt: new Date()
        };
        this.businessIntelligence.set(kpi.id, updatedBI);
    }
    determineKPIStatus(variancePercentage) {
        if (variancePercentage >= 10)
            return 'exceeding';
        if (variancePercentage >= -5 && variancePercentage < 10)
            return 'on-track';
        if (variancePercentage >= -15 && variancePercentage < -5)
            return 'at-risk';
        return 'off-track';
    }
    async generateInsights(kpi, variancePercentage) {
        const insights = [];
        if (variancePercentage > 0) {
            insights.push(`KPI is performing ${variancePercentage.toFixed(1)}% above target`);
            insights.push('Strong performance indicates effective strategies');
        }
        else {
            insights.push(`KPI is ${Math.abs(variancePercentage).toFixed(1)}% below target`);
            insights.push('Performance gap requires attention and action');
        }
        switch (kpi.type) {
            case 'financial':
                insights.push('Financial performance impacts overall business health');
                break;
            case 'operational':
                insights.push('Operational efficiency drives cost optimization');
                break;
            case 'customer':
                insights.push('Customer metrics directly affect revenue and growth');
                break;
            case 'marketing':
                insights.push('Marketing effectiveness influences brand awareness');
                break;
        }
        return insights;
    }
    async generateRecommendations(kpi, variancePercentage) {
        const recommendations = [];
        if (variancePercentage < -5) {
            recommendations.push('Review current strategies and identify improvement areas');
            recommendations.push('Consider additional resources or process optimization');
            recommendations.push('Set up more frequent monitoring and reporting');
        }
        else if (variancePercentage > 10) {
            recommendations.push('Leverage successful strategies for other KPIs');
            recommendations.push('Consider increasing targets for next period');
            recommendations.push('Document best practices for future reference');
        }
        else {
            recommendations.push('Maintain current performance levels');
            recommendations.push('Continue monitoring for any changes');
        }
        return recommendations;
    }
    async getBusinessIntelligence(kpiId) {
        return this.businessIntelligence.get(kpiId) || null;
    }
    async getAllBusinessIntelligence(organizationId) {
        return Array.from(this.businessIntelligence.values())
            .filter(bi => bi.organizationId === organizationId);
    }
    async assessRisks(kpi, variancePercentage) {
        const risks = [];
        if (variancePercentage < -15) {
            risks.push({
                id: this.generateId(),
                name: 'Critical Performance Gap',
                description: `KPI is significantly below target (${variancePercentage.toFixed(1)}%)`,
                severity: 'critical',
                probability: 0.9,
                impact: 9,
                riskScore: 8.1,
                mitigation: [
                    'Immediate action plan required',
                    'Escalate to senior management',
                    'Implement emergency measures'
                ],
                owner: kpi.owner,
                status: 'identified'
            });
        }
        else if (variancePercentage < -5) {
            risks.push({
                id: this.generateId(),
                name: 'Performance Risk',
                description: `KPI is below target (${variancePercentage.toFixed(1)}%)`,
                severity: 'high',
                probability: 0.7,
                impact: 7,
                riskScore: 4.9,
                mitigation: [
                    'Review and adjust strategies',
                    'Increase monitoring frequency',
                    'Provide additional support'
                ],
                owner: kpi.owner,
                status: 'monitoring'
            });
        }
        return risks;
    }
    async getRiskFactors(kpiId) {
        return this.riskFactors.get(kpiId) || [];
    }
    async getAllRiskFactors(organizationId) {
        const allRisks = [];
        for (const [kpiId, risks] of this.riskFactors.entries()) {
            const kpi = this.kpis.get(kpiId);
            if (kpi && kpi.organizationId === organizationId) {
                allRisks.push(...risks);
            }
        }
        return allRisks;
    }
    async updateRiskStatus(riskId, status) {
        for (const [kpiId, risks] of this.riskFactors.entries()) {
            const riskIndex = risks.findIndex(r => r.id === riskId);
            if (riskIndex !== -1) {
                risks[riskIndex].status = status;
                return risks[riskIndex];
            }
        }
        return null;
    }
    async identifyOpportunities(kpi, variancePercentage) {
        const opportunities = [];
        if (variancePercentage > 10) {
            opportunities.push({
                id: this.generateId(),
                name: 'Scale Success',
                description: `Leverage ${kpi.name} success for broader impact`,
                potentialValue: kpi.currentValue * 0.2,
                probability: 0.8,
                effort: 'medium',
                timeframe: '3-6 months',
                owner: kpi.owner,
                status: 'identified'
            });
        }
        switch (kpi.type) {
            case 'customer':
                opportunities.push({
                    id: this.generateId(),
                    name: 'Customer Expansion',
                    description: 'Expand successful customer strategies',
                    potentialValue: kpi.currentValue * 0.15,
                    probability: 0.6,
                    effort: 'high',
                    timeframe: '6-12 months',
                    owner: kpi.owner,
                    status: 'evaluating'
                });
                break;
            case 'financial':
                opportunities.push({
                    id: this.generateId(),
                    name: 'Investment Opportunity',
                    description: 'Reinvest excess performance gains',
                    potentialValue: kpi.currentValue * 0.25,
                    probability: 0.7,
                    effort: 'medium',
                    timeframe: '1-3 months',
                    owner: kpi.owner,
                    status: 'pursuing'
                });
                break;
        }
        return opportunities;
    }
    async getOpportunities(kpiId) {
        return this.opportunities.get(kpiId) || [];
    }
    async getAllOpportunities(organizationId) {
        const allOpportunities = [];
        for (const [kpiId, opportunities] of this.opportunities.entries()) {
            const kpi = this.kpis.get(kpiId);
            if (kpi && kpi.organizationId === organizationId) {
                allOpportunities.push(...opportunities);
            }
        }
        return allOpportunities;
    }
    async performCompetitiveAnalysis(organizationId, competitors) {
        const analyses = [];
        const kpis = await this.getKPIs(organizationId);
        for (const kpi of kpis) {
            for (const competitor of competitors) {
                const analysis = {
                    id: this.generateId(),
                    competitor,
                    metric: kpi.name,
                    ourValue: kpi.currentValue,
                    competitorValue: this.generateCompetitorValue(kpi.currentValue),
                    marketAverage: this.generateMarketAverage(kpi.currentValue),
                    position: this.determinePosition(kpi.currentValue, this.generateCompetitorValue(kpi.currentValue)),
                    gap: kpi.currentValue - this.generateCompetitorValue(kpi.currentValue),
                    recommendations: this.generateCompetitiveRecommendations(kpi, competitor),
                    organizationId,
                    analysisDate: new Date()
                };
                analyses.push(analysis);
            }
        }
        const existing = this.competitiveAnalyses.get(organizationId) || [];
        this.competitiveAnalyses.set(organizationId, [...existing, ...analyses]);
        return analyses;
    }
    generateCompetitorValue(ourValue) {
        const variance = (Math.random() - 0.5) * 0.4;
        return ourValue * (1 + variance);
    }
    generateMarketAverage(ourValue) {
        const variance = (Math.random() - 0.5) * 0.2;
        return ourValue * (1 + variance);
    }
    determinePosition(ourValue, competitorValue) {
        const difference = (ourValue - competitorValue) / competitorValue;
        if (difference > 0.1)
            return 'leading';
        if (difference < -0.1)
            return 'lagging';
        return 'competitive';
    }
    generateCompetitiveRecommendations(kpi, competitor) {
        const recommendations = [];
        recommendations.push(`Monitor ${competitor}'s strategies for ${kpi.name}`);
        recommendations.push('Benchmark performance against industry standards');
        recommendations.push('Identify competitive advantages and weaknesses');
        return recommendations;
    }
    async getCompetitiveAnalyses(organizationId) {
        return this.competitiveAnalyses.get(organizationId) || [];
    }
    async performROIAnalysis(organizationId, initiatives) {
        const analyses = [];
        for (const initiative of initiatives) {
            const roi = ((initiative.expectedReturns - initiative.investment) / initiative.investment) * 100;
            const paybackPeriod = initiative.investment / (initiative.expectedReturns / 12);
            const npv = this.calculateNPV(initiative.investment, initiative.expectedReturns, 0.1);
            const irr = this.calculateIRR(initiative.investment, initiative.expectedReturns);
            const analysis = {
                id: this.generateId(),
                initiative: initiative.name,
                investment: initiative.investment,
                returns: initiative.expectedReturns,
                roi,
                paybackPeriod,
                npv,
                irr,
                risk: this.assessROIRisk(roi, paybackPeriod),
                organizationId,
                period: initiative.timeframe,
                createdAt: new Date()
            };
            analyses.push(analysis);
        }
        const existing = this.roiAnalyses.get(organizationId) || [];
        this.roiAnalyses.set(organizationId, [...existing, ...analyses]);
        return analyses;
    }
    calculateNPV(investment, returns, discountRate) {
        return returns / Math.pow(1 + discountRate, 1) - investment;
    }
    calculateIRR(investment, returns) {
        return (returns - investment) / investment;
    }
    assessROIRisk(roi, paybackPeriod) {
        if (roi > 50 && paybackPeriod < 12)
            return 'low';
        if (roi > 20 && paybackPeriod < 24)
            return 'medium';
        return 'high';
    }
    async getROIAnalyses(organizationId) {
        return this.roiAnalyses.get(organizationId) || [];
    }
    async performBenchmarking(organizationId) {
        const kpis = await this.getKPIs(organizationId);
        const benchmarkedKPIs = [];
        let totalScore = 0;
        for (const kpi of kpis) {
            const benchmark = this.generateBenchmark(kpi.currentValue);
            const performance = kpi.currentValue > benchmark ? 'above' :
                kpi.currentValue < benchmark ? 'below' : 'at';
            const gap = kpi.currentValue - benchmark;
            benchmarkedKPIs.push({
                kpi,
                benchmark,
                performance,
                gap
            });
            const score = performance === 'above' ? 1 : performance === 'at' ? 0.5 : 0;
            totalScore += score;
        }
        const overallScore = (totalScore / kpis.length) * 100;
        const recommendations = this.generateBenchmarkRecommendations(benchmarkedKPIs);
        return {
            kpis: benchmarkedKPIs,
            overallScore,
            recommendations
        };
    }
    generateBenchmark(currentValue) {
        const variance = (Math.random() - 0.5) * 0.3;
        return currentValue * (1 + variance);
    }
    generateBenchmarkRecommendations(benchmarkedKPIs) {
        const recommendations = [];
        const belowBenchmark = benchmarkedKPIs.filter(b => b.performance === 'below');
        const aboveBenchmark = benchmarkedKPIs.filter(b => b.performance === 'above');
        if (belowBenchmark.length > 0) {
            recommendations.push(`Focus on improving ${belowBenchmark.length} KPIs that are below benchmark`);
        }
        if (aboveBenchmark.length > 0) {
            recommendations.push(`Leverage success in ${aboveBenchmark.length} KPIs for competitive advantage`);
        }
        recommendations.push('Continue monitoring performance against industry standards');
        return recommendations;
    }
    async generateStrategicInsights(organizationId) {
        const kpis = await this.getKPIs(organizationId);
        const businessIntelligence = await this.getAllBusinessIntelligence(organizationId);
        const risks = await this.getAllRiskFactors(organizationId);
        const opportunities = await this.getAllOpportunities(organizationId);
        const summary = this.generateExecutiveSummary(businessIntelligence);
        const keyFindings = this.extractKeyFindings(businessIntelligence);
        const recommendations = this.generateStrategicRecommendations(businessIntelligence, risks, opportunities);
        const riskSummary = this.summarizeRisks(risks);
        const opportunitySummary = this.summarizeOpportunities(opportunities);
        const nextSteps = this.generateNextSteps(businessIntelligence, risks, opportunities);
        return {
            summary,
            keyFindings,
            recommendations,
            risks: riskSummary,
            opportunities: opportunitySummary,
            nextSteps
        };
    }
    generateExecutiveSummary(businessIntelligence) {
        const onTrack = businessIntelligence.filter(bi => bi.status === 'on-track').length;
        const atRisk = businessIntelligence.filter(bi => bi.status === 'at-risk').length;
        const offTrack = businessIntelligence.filter(bi => bi.status === 'off-track').length;
        const exceeding = businessIntelligence.filter(bi => bi.status === 'exceeding').length;
        return `Business performance analysis shows ${exceeding} KPIs exceeding targets, ${onTrack} on-track, ${atRisk} at-risk, and ${offTrack} off-track. Overall performance requires strategic attention.`;
    }
    extractKeyFindings(businessIntelligence) {
        const findings = [];
        const avgVariance = businessIntelligence.reduce((sum, bi) => sum + bi.variancePercentage, 0) / businessIntelligence.length;
        findings.push(`Average KPI variance: ${avgVariance.toFixed(1)}%`);
        const criticalRisks = businessIntelligence.filter(bi => bi.riskFactors.some(rf => rf.severity === 'critical')).length;
        if (criticalRisks > 0) {
            findings.push(`${criticalRisks} KPIs have critical risk factors requiring immediate attention`);
        }
        const highOpportunities = businessIntelligence.filter(bi => bi.opportunities.some(o => o.probability > 0.7)).length;
        if (highOpportunities > 0) {
            findings.push(`${highOpportunities} KPIs present high-probability opportunities`);
        }
        return findings;
    }
    generateStrategicRecommendations(businessIntelligence, risks, opportunities) {
        const recommendations = [];
        if (risks.some(r => r.severity === 'critical')) {
            recommendations.push('Implement immediate risk mitigation strategies for critical issues');
        }
        if (opportunities.some(o => o.probability > 0.7)) {
            recommendations.push('Prioritize high-probability opportunities for quick wins');
        }
        recommendations.push('Establish regular KPI review meetings for continuous improvement');
        recommendations.push('Develop contingency plans for at-risk KPIs');
        return recommendations;
    }
    summarizeRisks(risks) {
        return risks.map(risk => `${risk.name}: ${risk.description} (${risk.severity} severity)`);
    }
    summarizeOpportunities(opportunities) {
        return opportunities.map(opp => `${opp.name}: ${opp.description} (${(opp.probability * 100).toFixed(0)}% probability)`);
    }
    generateNextSteps(businessIntelligence, risks, opportunities) {
        const nextSteps = [];
        nextSteps.push('Schedule executive review meeting within 48 hours');
        nextSteps.push('Assign owners for all critical risk mitigation actions');
        nextSteps.push('Develop implementation timeline for high-priority opportunities');
        nextSteps.push('Update KPI targets based on current performance trends');
        return nextSteps;
    }
    generateId() {
        return `bi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async getServiceStats() {
        return {
            totalKPIs: this.kpis.size,
            totalBusinessIntelligence: this.businessIntelligence.size,
            totalRisks: Array.from(this.riskFactors.values()).flat().length,
            totalOpportunities: Array.from(this.opportunities.values()).flat().length,
            config: this.config
        };
    }
}
//# sourceMappingURL=business-intelligence.service.js.map