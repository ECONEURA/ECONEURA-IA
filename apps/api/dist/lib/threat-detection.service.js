export class ThreatDetectionService {
    config;
    threatDetections = new Map();
    securityIncidents = new Map();
    threatIntelligence = new Map();
    constructor(config = {}) {
        this.config = {
            aiDetection: true,
            behavioralAnalysis: true,
            anomalyDetection: true,
            threatIntelligence: true,
            incidentResponse: true,
            threatHunting: true,
            realTimeAnalysis: true,
            machineLearning: true,
            ...config
        };
    }
    async detectThreat(threatData) {
        const threatDetection = {
            id: this.generateId(),
            threatType: threatData.type,
            severity: this.determineThreatSeverity(threatData.type, threatData.indicators),
            confidence: await this.calculateThreatConfidence(threatData),
            timestamp: new Date(),
            source: threatData.source,
            target: threatData.target,
            organizationId: threatData.organizationId,
            description: threatData.description,
            indicators: threatData.indicators.map(indicator => ({
                id: this.generateId(),
                ...indicator,
                firstSeen: new Date(),
                lastSeen: new Date()
            })),
            analysis: await this.performThreatAnalysis(threatData),
            response: await this.initiateThreatResponse(threatData),
            status: 'detected',
            riskScore: await this.calculateRiskScore(threatData),
            impact: this.assessThreatImpact(threatData),
            likelihood: this.assessThreatLikelihood(threatData),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.threatDetections.set(threatDetection.id, threatDetection);
        if (this.config.realTimeAnalysis) {
            await this.processThreatDetection(threatDetection);
        }
        return threatDetection;
    }
    async getThreatDetection(detectionId) {
        return this.threatDetections.get(detectionId) || null;
    }
    async getThreatDetections(organizationId, filters) {
        let detections = Array.from(this.threatDetections.values())
            .filter(d => d.organizationId === organizationId);
        if (filters) {
            if (filters.threatType) {
                detections = detections.filter(d => d.threatType === filters.threatType);
            }
            if (filters.severity) {
                detections = detections.filter(d => d.severity === filters.severity);
            }
            if (filters.status) {
                detections = detections.filter(d => d.status === filters.status);
            }
            if (filters.dateFrom) {
                detections = detections.filter(d => d.timestamp >= filters.dateFrom);
            }
            if (filters.dateTo) {
                detections = detections.filter(d => d.timestamp <= filters.dateTo);
            }
        }
        return detections.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    determineThreatSeverity(threatType, indicators) {
        switch (threatType) {
            case 'data_breach':
            case 'malware':
                return 'critical';
            case 'phishing':
            case 'ddos':
                return 'high';
            case 'unauthorized_access':
            case 'insider_threat':
                return 'medium';
            case 'suspicious_activity':
                return 'low';
            default:
                return 'medium';
        }
    }
    async calculateThreatConfidence(threatData) {
        let confidence = 0.5;
        confidence += Math.min(0.3, threatData.indicators.length * 0.1);
        if (this.config.threatIntelligence) {
            const intelligenceMatch = await this.checkThreatIntelligence(threatData.indicators);
            confidence += intelligenceMatch * 0.2;
        }
        if (this.config.behavioralAnalysis) {
            const behaviorScore = await this.analyzeBehavior(threatData);
            confidence += behaviorScore * 0.2;
        }
        return Math.min(1.0, confidence);
    }
    async checkThreatIntelligence(indicators) {
        let matchScore = 0;
        for (const indicator of indicators) {
            if (this.threatIntelligence.has(indicator.value)) {
                matchScore += 0.2;
            }
        }
        return Math.min(1.0, matchScore);
    }
    async analyzeBehavior(threatData) {
        let behaviorScore = 0;
        if (threatData.metadata.unusualPattern) {
            behaviorScore += 0.3;
        }
        if (threatData.metadata.knownPattern) {
            behaviorScore += 0.4;
        }
        if (threatData.metadata.timingAnomaly) {
            behaviorScore += 0.2;
        }
        return Math.min(1.0, behaviorScore);
    }
    async performThreatAnalysis(threatData) {
        const analysis = {
            summary: this.generateThreatSummary(threatData),
            technicalDetails: this.generateTechnicalDetails(threatData),
            attackVector: this.identifyAttackVector(threatData),
            affectedSystems: this.identifyAffectedSystems(threatData),
            dataAtRisk: this.identifyDataAtRisk(threatData),
            potentialImpact: this.assessPotentialImpact(threatData),
            recommendations: this.generateThreatRecommendations(threatData),
            references: this.getThreatReferences(threatData)
        };
        return analysis;
    }
    generateThreatSummary(threatData) {
        return `Detected ${threatData.type} threat from ${threatData.source} targeting ${threatData.target}. ${threatData.description}`;
    }
    generateTechnicalDetails(threatData) {
        return `Technical analysis reveals ${threatData.indicators.length} indicators of compromise. Threat appears to be ${threatData.type} with ${threatData.metadata.complexity || 'medium'} complexity.`;
    }
    identifyAttackVector(threatData) {
        switch (threatData.type) {
            case 'phishing': return 'Email/Social Engineering';
            case 'malware': return 'Malicious Software';
            case 'ddos': return 'Network Flooding';
            case 'data_breach': return 'Unauthorized Access';
            case 'insider_threat': return 'Internal Actor';
            default: return 'Unknown';
        }
    }
    identifyAffectedSystems(threatData) {
        return [threatData.target, ...(threatData.metadata.relatedSystems || [])];
    }
    identifyDataAtRisk(threatData) {
        const dataTypes = ['PII', 'Financial Data', 'Intellectual Property', 'Credentials'];
        return dataTypes.filter(() => Math.random() > 0.5);
    }
    assessPotentialImpact(threatData) {
        switch (threatData.type) {
            case 'data_breach': return 'High - Potential exposure of sensitive data and regulatory violations';
            case 'malware': return 'High - System compromise and data exfiltration risk';
            case 'phishing': return 'Medium - Credential theft and account compromise';
            case 'ddos': return 'Medium - Service disruption and availability issues';
            default: return 'Unknown - Requires further investigation';
        }
    }
    generateThreatRecommendations(threatData) {
        const recommendations = [];
        switch (threatData.type) {
            case 'malware':
                recommendations.push('Isolate affected systems immediately');
                recommendations.push('Run full antivirus scan on all systems');
                recommendations.push('Review and update security controls');
                break;
            case 'phishing':
                recommendations.push('Block malicious email addresses and domains');
                recommendations.push('Educate users about phishing indicators');
                recommendations.push('Implement email security controls');
                break;
            case 'ddos':
                recommendations.push('Activate DDoS mitigation services');
                recommendations.push('Implement rate limiting and traffic filtering');
                recommendations.push('Monitor network traffic patterns');
                break;
            case 'data_breach':
                recommendations.push('Contain the breach immediately');
                recommendations.push('Assess data exposure and notify stakeholders');
                recommendations.push('Implement additional monitoring and controls');
                break;
        }
        recommendations.push('Update threat intelligence feeds');
        recommendations.push('Review and strengthen security policies');
        recommendations.push('Conduct post-incident analysis');
        return recommendations;
    }
    getThreatReferences(threatData) {
        return [
            'https://attack.mitre.org/',
            'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
            'https://www.malware-traffic-analysis.net/'
        ];
    }
    async initiateThreatResponse(threatData) {
        const actions = [];
        const severity = this.determineThreatSeverity(threatData.type, threatData.indicators);
        if (severity === 'critical' || severity === 'high') {
            actions.push({
                id: this.generateId(),
                type: 'contain',
                description: 'Contain the threat to prevent further spread',
                status: 'pending',
                assignedTo: 'security_team',
                dueDate: new Date(Date.now() + 30 * 60 * 1000)
            });
            actions.push({
                id: this.generateId(),
                type: 'investigate',
                description: 'Investigate the threat to understand scope and impact',
                status: 'pending',
                assignedTo: 'security_team',
                dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000)
            });
        }
        actions.push({
            id: this.generateId(),
            type: 'notify',
            description: 'Notify relevant stakeholders about the threat',
            status: 'pending',
            assignedTo: 'security_team',
            dueDate: new Date(Date.now() + 60 * 60 * 1000)
        });
        const response = {
            actions,
            status: 'pending',
            priority: severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium',
            estimatedResolution: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
        return response;
    }
    async calculateRiskScore(threatData) {
        let riskScore = 0;
        switch (threatData.type) {
            case 'data_breach':
                riskScore = 90;
                break;
            case 'malware':
                riskScore = 85;
                break;
            case 'phishing':
                riskScore = 70;
                break;
            case 'ddos':
                riskScore = 60;
                break;
            case 'unauthorized_access':
                riskScore = 75;
                break;
            case 'insider_threat':
                riskScore = 80;
                break;
            case 'suspicious_activity':
                riskScore = 40;
                break;
            default: riskScore = 50;
        }
        riskScore += Math.min(10, threatData.indicators.length * 2);
        const confidence = await this.calculateThreatConfidence(threatData);
        riskScore += confidence * 10;
        return Math.min(100, riskScore);
    }
    assessThreatImpact(threatData) {
        switch (threatData.type) {
            case 'data_breach':
            case 'malware':
                return 'critical';
            case 'phishing':
            case 'unauthorized_access':
                return 'high';
            case 'ddos':
            case 'insider_threat':
                return 'medium';
            case 'suspicious_activity':
                return 'low';
            default:
                return 'medium';
        }
    }
    assessThreatLikelihood(threatData) {
        const random = Math.random();
        if (random > 0.8)
            return 'critical';
        if (random > 0.6)
            return 'high';
        if (random > 0.4)
            return 'medium';
        return 'low';
    }
    async processThreatDetection(detection) {
        if (this.config.threatIntelligence) {
            await this.updateThreatIntelligence(detection);
        }
        if (this.config.behavioralAnalysis) {
            await this.performBehavioralAnalysis(detection);
        }
        if (this.config.anomalyDetection) {
            await this.performAnomalyDetection(detection);
        }
        if (this.config.incidentResponse && detection.severity === 'critical') {
            await this.triggerIncidentResponse(detection);
        }
        if (this.config.threatHunting) {
            await this.performThreatHunting(detection);
        }
    }
    async updateThreatIntelligence(detection) {
        for (const indicator of detection.indicators) {
            this.threatIntelligence.set(indicator.value, {
                type: indicator.type,
                threatType: detection.threatType,
                severity: detection.severity,
                firstSeen: indicator.firstSeen,
                lastSeen: indicator.lastSeen,
                confidence: detection.confidence
            });
        }
    }
    async performBehavioralAnalysis(detection) {
    }
    async performAnomalyDetection(detection) {
    }
    async triggerIncidentResponse(detection) {
        const incident = {
            id: this.generateId(),
            title: `Critical Threat Detected: ${detection.threatType}`,
            description: detection.description,
            severity: 'critical',
            status: 'new',
            category: this.mapThreatTypeToIncidentCategory(detection.threatType),
            organizationId: detection.organizationId,
            reportedBy: 'threat_detection_system',
            reportedAt: new Date(),
            detectedAt: detection.timestamp,
            affectedSystems: detection.analysis.affectedSystems,
            affectedUsers: [],
            dataAtRisk: detection.analysis.dataAtRisk,
            impact: detection.analysis.potentialImpact,
            actions: detection.response.actions.map(action => ({
                id: action.id,
                type: this.mapResponseActionToIncidentAction(action.type),
                description: action.description,
                status: 'pending',
                assignedTo: action.assignedTo,
                dueDate: action.dueDate
            })),
            timeline: [{
                    id: this.generateId(),
                    timestamp: new Date(),
                    event: 'Threat detected',
                    description: `Threat ${detection.threatType} detected with ${detection.severity} severity`,
                    actor: 'threat_detection_system',
                    type: 'detection'
                }],
            evidence: detection.indicators.map(indicator => ({
                id: indicator.id,
                type: 'log',
                title: `Threat Indicator: ${indicator.type}`,
                description: `Indicator value: ${indicator.value}`,
                collectedBy: 'threat_detection_system',
                collectedAt: new Date(),
                chainOfCustody: ['threat_detection_system']
            })),
            tags: [detection.threatType, detection.severity],
            metadata: { threatDetectionId: detection.id },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.securityIncidents.set(incident.id, incident);
    }
    mapThreatTypeToIncidentCategory(threatType) {
        switch (threatType) {
            case 'malware': return 'malware';
            case 'phishing': return 'phishing';
            case 'ddos': return 'ddos';
            case 'data_breach': return 'data_breach';
            case 'insider_threat': return 'insider_threat';
            case 'unauthorized_access': return 'system_compromise';
            default: return 'other';
        }
    }
    mapResponseActionToIncidentAction(actionType) {
        switch (actionType) {
            case 'contain': return 'contain';
            case 'investigate': return 'investigate';
            case 'remediate': return 'remediate';
            case 'notify': return 'communicate';
            case 'escalate': return 'escalate';
            case 'document': return 'document';
            default: return 'investigate';
        }
    }
    async performThreatHunting(detection) {
    }
    async createSecurityIncident(request, organizationId, reportedBy) {
        const incident = {
            id: this.generateId(),
            title: request.title,
            description: request.description,
            severity: request.severity,
            status: 'new',
            category: request.category,
            subcategory: request.subcategory,
            organizationId,
            reportedBy,
            reportedAt: new Date(),
            affectedSystems: request.affectedSystems,
            affectedUsers: request.affectedUsers,
            dataAtRisk: request.dataAtRisk,
            impact: request.impact,
            actions: [],
            timeline: [{
                    id: this.generateId(),
                    timestamp: new Date(),
                    event: 'Incident reported',
                    description: `Security incident reported: ${request.title}`,
                    actor: reportedBy,
                    type: 'detection'
                }],
            evidence: [],
            tags: request.tags,
            metadata: request.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.securityIncidents.set(incident.id, incident);
        return incident;
    }
    async getSecurityIncident(incidentId) {
        return this.securityIncidents.get(incidentId) || null;
    }
    async getSecurityIncidents(organizationId, filters) {
        let incidents = Array.from(this.securityIncidents.values())
            .filter(i => i.organizationId === organizationId);
        if (filters) {
            if (filters.severity) {
                incidents = incidents.filter(i => i.severity === filters.severity);
            }
            if (filters.status) {
                incidents = incidents.filter(i => i.status === filters.status);
            }
            if (filters.category) {
                incidents = incidents.filter(i => i.category === filters.category);
            }
            if (filters.reportedBy) {
                incidents = incidents.filter(i => i.reportedBy === filters.reportedBy);
            }
            if (filters.dateFrom) {
                incidents = incidents.filter(i => i.reportedAt >= filters.dateFrom);
            }
            if (filters.dateTo) {
                incidents = incidents.filter(i => i.reportedAt <= filters.dateTo);
            }
        }
        return incidents.sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
    }
    async updateIncidentStatus(incidentId, status) {
        const incident = this.securityIncidents.get(incidentId);
        if (!incident)
            return null;
        const updatedIncident = {
            ...incident,
            status,
            updatedAt: new Date()
        };
        if (status === 'resolved') {
            updatedIncident.resolvedAt = new Date();
        }
        else if (status === 'closed') {
            updatedIncident.closedAt = new Date();
        }
        this.securityIncidents.set(incidentId, updatedIncident);
        return updatedIncident;
    }
    async getThreatAnalytics(organizationId, period) {
        const threats = await this.getThreatDetections(organizationId, {
            dateFrom: period?.start,
            dateTo: period?.end
        });
        const incidents = await this.getSecurityIncidents(organizationId, {
            dateFrom: period?.start,
            dateTo: period?.end
        });
        const threatsByType = {};
        const threatsBySeverity = {};
        const threatsByStatus = {};
        threats.forEach(threat => {
            threatsByType[threat.threatType] = (threatsByType[threat.threatType] || 0) + 1;
            threatsBySeverity[threat.severity] = (threatsBySeverity[threat.severity] || 0) + 1;
            threatsByStatus[threat.status] = (threatsByStatus[threat.status] || 0) + 1;
        });
        const topThreats = Object.entries(threatsByType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
        const threatTrend = this.calculateThreatTrend(threats);
        const riskScore = this.calculateOverallRiskScore(threats);
        return {
            totalThreats: threats.length,
            threatsByType,
            threatsBySeverity,
            threatsByStatus,
            topThreats,
            threatTrend,
            riskScore,
            incidentCount: incidents.length
        };
    }
    calculateThreatTrend(threats) {
        const trend = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayThreats = threats.filter(t => t.timestamp.toISOString().split('T')[0] === dateStr);
            trend.push({ date: dateStr, count: dayThreats.length });
        }
        return trend;
    }
    calculateOverallRiskScore(threats) {
        if (threats.length === 0)
            return 0;
        const totalRiskScore = threats.reduce((sum, threat) => sum + threat.riskScore, 0);
        return Math.round(totalRiskScore / threats.length);
    }
    generateId() {
        return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async getServiceStats() {
        return {
            totalThreats: this.threatDetections.size,
            totalIncidents: this.securityIncidents.size,
            threatIntelligenceEntries: this.threatIntelligence.size,
            config: this.config
        };
    }
}
//# sourceMappingURL=threat-detection.service.js.map