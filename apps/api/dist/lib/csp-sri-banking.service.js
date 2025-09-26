import { z } from 'zod';

import { logger } from './logger.js';
const CSPViolationSchema = z.object({
    'csp-report': z.object({
        'document-uri': z.string(),
        'referrer': z.string().optional(),
        'violated-directive': z.string(),
        'effective-directive': z.string().optional(),
        'original-policy': z.string(),
        'disposition': z.enum(['enforce', 'report']),
        'blocked-uri': z.string().optional(),
        'line-number': z.number().optional(),
        'column-number': z.number().optional(),
        'source-file': z.string().optional(),
        'status-code': z.number().optional(),
        'script-sample': z.string().optional(),
    })
});
const SRIViolationSchema = z.object({
    'sri-report': z.object({
        'document-uri': z.string(),
        'referrer': z.string().optional(),
        'blocked-uri': z.string(),
        'violation-type': z.enum(['integrity-mismatch', 'missing-integrity', 'invalid-integrity']),
        'expected-hash': z.string().optional(),
        'actual-hash': z.string().optional(),
        'algorithm': z.enum(['sha256', 'sha384', 'sha512']).optional(),
    })
});
export class CSPBankingService {
    config;
    reports = [];
    violationPatterns = new Map();
    alertThresholds = new Map();
    constructor(config = {}) {
        this.config = {
            enabled: true,
            reportUri: '/api/security/csp-reports',
            enforceMode: true,
            strictMode: true,
            bankingMode: true,
            allowedDomains: ['self'],
            allowedScripts: ['self', 'unsafe-inline'],
            allowedStyles: ['self', 'unsafe-inline'],
            allowedImages: ['self', 'data:', 'https:'],
            allowedFonts: ['self'],
            allowedConnections: ['self'],
            customDirectives: {},
            reportOnly: false,
            maxReportAge: 30,
            alertThreshold: 10,
            ...config
        };
        this.initializeBankingDefaults();
        this.initializeViolationPatterns();
    }
    initializeBankingDefaults() {
        if (this.config.bankingMode) {
            this.config.allowedDomains = ['self'];
            this.config.allowedScripts = ['self'];
            this.config.allowedStyles = ['self'];
            this.config.allowedImages = ['self', 'data:'];
            this.config.allowedFonts = ['self'];
            this.config.allowedConnections = ['self'];
            this.config.strictMode = true;
            this.config.enforceMode = true;
            this.config.customDirectives = {
                'frame-ancestors': ['none'],
                'base-uri': ['self'],
                'object-src': ['none'],
                'form-action': ['self'],
                'frame-src': ['none'],
                'media-src': ['none'],
                'manifest-src': ['none'],
                'worker-src': ['none'],
                'child-src': ['none'],
                'connect-src': ['self'],
                'upgrade-insecure-requests': [],
                'block-all-mixed-content': []
            };
        }
        else {
            this.config.allowedScripts = ['self', 'unsafe-inline'];
            this.config.allowedStyles = ['self', 'unsafe-inline'];
        }
    }
    initializeViolationPatterns() {
        this.violationPatterns.set('script-src-unsafe-inline', 0);
        this.violationPatterns.set('style-src-unsafe-inline', 0);
        this.violationPatterns.set('img-src-external', 0);
        this.violationPatterns.set('connect-src-external', 0);
        this.violationPatterns.set('frame-ancestors-violation', 0);
        this.violationPatterns.set('sri-integrity-mismatch', 0);
        this.violationPatterns.set('sri-missing-integrity', 0);
    }
    generateCSPHeader() {
        if (!this.config.enabled) {
            return '';
        }
        const directives = [];
        directives.push(`default-src 'self'`);
        directives.push(`script-src ${this.config.allowedScripts.map(s => s === 'self' ? "'self'" : s).join(' ')}`);
        directives.push(`style-src ${this.config.allowedStyles.map(s => s === 'self' ? "'self'" : s).join(' ')}`);
        directives.push(`img-src ${this.config.allowedImages.map(s => s === 'self' ? "'self'" : s).join(' ')}`);
        directives.push(`font-src ${this.config.allowedFonts.map(s => s === 'self' ? "'self'" : s).join(' ')}`);
        directives.push(`connect-src ${this.config.allowedConnections.map(s => s === 'self' ? "'self'" : s).join(' ')}`);
        Object.entries(this.config.customDirectives).forEach(([directive, values]) => {
            if (values.length > 0) {
                directives.push(`${directive} ${values.map(v => v === 'self' ? "'self'" : v).join(' ')}`);
            }
            else {
                directives.push(directive);
            }
        });
        if (this.config.reportUri) {
            const reportDirective = this.config.reportOnly ? 'report-uri' : 'report-uri';
            directives.push(`${reportDirective} ${this.config.reportUri}`);
        }
        return directives.join('; ');
    }
    generateSRIHashes(resources) {
        const crypto = require('crypto');
        return resources.map(resource => {
            const algorithm = resource.algorithm || 'sha384';
            const hash = crypto.createHash(algorithm).update(resource.content).digest('base64');
            const integrity = `${algorithm}-${hash}`;
            return {
                url: resource.url,
                hash,
                algorithm,
                integrity
            };
        });
    }
    async processCSPViolation(violationData, metadata) {
        try {
            const violation = CSPViolationSchema.parse(violationData);
            const severity = this.calculateSeverity(violation['csp-report']);
            const report = {
                id: this.generateReportId(),
                timestamp: new Date(),
                type: 'csp',
                violation,
                severity,
                source: violation['csp-report']['document-uri'],
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress,
                organizationId: metadata.organizationId,
                userId: metadata.userId,
                resolved: false,
                tags: this.generateTags(violation['csp-report'])
            };
            this.reports.push(report);
            this.updateViolationPatterns(violation['csp-report']);
            await this.checkAlertThresholds(report);
            logger.info('CSP violation processed', {
                reportId: report.id,
                severity: report.severity,
                directive: violation['csp-report']['violated-directive'],
                source: report.source,
                requestId: ''
            });
            return report;
        }
        catch (error) {
            logger.error('Failed to process CSP violation', {
                error: error instanceof Error ? error.message : 'Unknown error',
                violationData,
                requestId: ''
            });
            throw error;
        }
    }
    async processSRIViolation(violationData, metadata) {
        try {
            const violation = SRIViolationSchema.parse(violationData);
            const severity = this.calculateSRISeverity(violation['sri-report']);
            const report = {
                id: this.generateReportId(),
                timestamp: new Date(),
                type: 'sri',
                violation,
                severity,
                source: violation['sri-report']['document-uri'],
                userAgent: metadata.userAgent,
                ipAddress: metadata.ipAddress,
                organizationId: metadata.organizationId,
                userId: metadata.userId,
                resolved: false,
                tags: this.generateSRITags(violation['sri-report'])
            };
            this.reports.push(report);
            this.updateSRIViolationPatterns(violation['sri-report']);
            await this.checkAlertThresholds(report);
            logger.info('SRI violation processed', {
                reportId: report.id,
                severity: report.severity,
                violationType: violation['sri-report']['violation-type'],
                source: report.source,
                requestId: ''
            });
            return report;
        }
        catch (error) {
            logger.error('Failed to process SRI violation', {
                error: error instanceof Error ? error.message : 'Unknown error',
                violationData,
                requestId: ''
            });
            throw error;
        }
    }
    calculateSeverity(cspReport) {
        const directive = cspReport['violated-directive'];
        const blockedUri = cspReport['blocked-uri'] || '';
        if (directive.includes('script-src') && blockedUri.includes('http')) {
            return 'critical';
        }
        if (directive.includes('connect-src') && blockedUri.includes('http')) {
            return 'critical';
        }
        if (directive.includes('frame-ancestors')) {
            return 'critical';
        }
        if (directive.includes('style-src') && blockedUri.includes('http')) {
            return 'high';
        }
        if (directive.includes('img-src') && blockedUri.includes('http')) {
            return 'high';
        }
        if (directive.includes('font-src') && blockedUri.includes('http')) {
            return 'medium';
        }
        return 'low';
    }
    calculateSRISeverity(sriReport) {
        const violationType = sriReport['violation-type'];
        switch (violationType) {
            case 'integrity-mismatch':
                return 'critical';
            case 'missing-integrity':
                return 'high';
            case 'invalid-integrity':
                return 'medium';
            default:
                return 'low';
        }
    }
    generateTags(cspReport) {
        const tags = [];
        const directive = cspReport['violated-directive'];
        const blockedUri = cspReport['blocked-uri'] || '';
        if (directive.includes('script-src'))
            tags.push('script');
        if (directive.includes('style-src'))
            tags.push('style');
        if (directive.includes('img-src'))
            tags.push('image');
        if (directive.includes('connect-src'))
            tags.push('connection');
        if (directive.includes('frame-ancestors'))
            tags.push('frame');
        if (blockedUri.includes('http://'))
            tags.push('insecure');
        if (blockedUri.includes('https://'))
            tags.push('external');
        if (blockedUri.includes('data:'))
            tags.push('data-uri');
        if (blockedUri.includes('blob:'))
            tags.push('blob');
        if (cspReport['script-sample'])
            tags.push('inline-script');
        if (cspReport['source-file'])
            tags.push('external-script');
        return tags;
    }
    generateSRITags(sriReport) {
        const tags = [];
        tags.push('sri');
        tags.push(sriReport['violation-type']);
        if (sriReport['algorithm']) {
            tags.push(sriReport['algorithm']);
        }
        return tags;
    }
    updateViolationPatterns(cspReport) {
        const directive = cspReport['violated-directive'];
        const blockedUri = cspReport['blocked-uri'] || '';
        if (directive.includes('script-src') && blockedUri.includes('unsafe-inline')) {
            this.violationPatterns.set('script-src-unsafe-inline', (this.violationPatterns.get('script-src-unsafe-inline') || 0) + 1);
        }
        if (directive.includes('style-src') && blockedUri.includes('unsafe-inline')) {
            this.violationPatterns.set('style-src-unsafe-inline', (this.violationPatterns.get('style-src-unsafe-inline') || 0) + 1);
        }
        if (blockedUri.includes('http')) {
            this.violationPatterns.set('img-src-external', (this.violationPatterns.get('img-src-external') || 0) + 1);
        }
        if (directive.includes('connect-src') && blockedUri.includes('http')) {
            this.violationPatterns.set('connect-src-external', (this.violationPatterns.get('connect-src-external') || 0) + 1);
        }
        if (directive.includes('frame-ancestors')) {
            this.violationPatterns.set('frame-ancestors-violation', (this.violationPatterns.get('frame-ancestors-violation') || 0) + 1);
        }
    }
    updateSRIViolationPatterns(sriReport) {
        const violationType = sriReport['violation-type'];
        if (violationType === 'integrity-mismatch') {
            this.violationPatterns.set('sri-integrity-mismatch', (this.violationPatterns.get('sri-integrity-mismatch') || 0) + 1);
        }
        else if (violationType === 'missing-integrity') {
            this.violationPatterns.set('sri-missing-integrity', (this.violationPatterns.get('sri-missing-integrity') || 0) + 1);
        }
    }
    async checkAlertThresholds(report) {
        const pattern = this.getViolationPattern(report);
        const count = this.violationPatterns.get(pattern) || 0;
        if (count >= this.config.alertThreshold) {
            await this.generateAlert(report, pattern, count);
        }
    }
    getViolationPattern(report) {
        if (report.type === 'csp') {
            const cspReport = report.violation;
            const directive = cspReport['csp-report']['violated-directive'];
            const blockedUri = cspReport['csp-report']['blocked-uri'] || '';
            if (directive.includes('script-src') && blockedUri.includes('unsafe-inline')) {
                return 'script-src-unsafe-inline';
            }
            if (directive.includes('style-src') && blockedUri.includes('unsafe-inline')) {
                return 'style-src-unsafe-inline';
            }
            if (blockedUri.includes('http')) {
                return 'img-src-external';
            }
            if (directive.includes('connect-src') && blockedUri.includes('http')) {
                return 'connect-src-external';
            }
            if (directive.includes('frame-ancestors')) {
                return 'frame-ancestors-violation';
            }
        }
        else if (report.type === 'sri') {
            const sriReport = report.violation;
            const violationType = sriReport['sri-report']['violation-type'];
            if (violationType === 'integrity-mismatch') {
                return 'sri-integrity-mismatch';
            }
            else if (violationType === 'missing-integrity') {
                return 'sri-missing-integrity';
            }
        }
        return 'unknown';
    }
    async generateAlert(report, pattern, count) {
        logger.warn('CSP/SRI alert threshold exceeded', {
            pattern,
            count,
            threshold: this.config.alertThreshold,
            reportId: report.id,
            severity: report.severity,
            requestId: ''
        });
    }
    generateReportId() {
        return `csp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getStats() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const recentReports = this.reports.filter(r => r.timestamp >= thirtyDaysAgo);
        const reportsByType = recentReports.reduce((acc, report) => {
            acc[report.type] = (acc[report.type] || 0) + 1;
            return acc;
        }, {});
        const reportsBySeverity = recentReports.reduce((acc, report) => {
            acc[report.severity] = (acc[report.severity] || 0) + 1;
            return acc;
        }, {});
        const reportsBySource = recentReports.reduce((acc, report) => {
            acc[report.source] = (acc[report.source] || 0) + 1;
            return acc;
        }, {});
        const directiveCounts = new Map();
        recentReports.forEach(report => {
            if (report.type === 'csp') {
                const cspReport = report.violation;
                const directive = cspReport['csp-report']['violated-directive'];
                directiveCounts.set(directive, (directiveCounts.get(directive) || 0) + 1);
            }
        });
        const topViolations = Array.from(directiveCounts.entries())
            .map(([directive, count]) => ({
            directive,
            count,
            percentage: (count / recentReports.length) * 100
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const recentTrends = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
            const dayReports = recentReports.filter(r => r.timestamp >= dayStart && r.timestamp < dayEnd);
            recentTrends.push({
                date: dayStart.toISOString().split('T')[0],
                count: dayReports.length
            });
        }
        const unresolvedCount = this.reports.filter(r => !r.resolved).length;
        const resolvedReports = this.reports.filter(r => r.resolved);
        const averageResolutionTime = resolvedReports.length > 0
            ? resolvedReports.reduce((sum, r) => {
                return sum + 2;
            }, 0) / resolvedReports.length
            : 0;
        return {
            totalReports: recentReports.length,
            reportsByType,
            reportsBySeverity,
            reportsBySource,
            topViolations,
            recentTrends,
            unresolvedCount,
            averageResolutionTime
        };
    }
    getReports(filters = {}) {
        let filteredReports = [...this.reports];
        if (filters.type) {
            filteredReports = filteredReports.filter(r => r.type === filters.type);
        }
        if (filters.severity) {
            filteredReports = filteredReports.filter(r => r.severity === filters.severity);
        }
        if (filters.resolved !== undefined) {
            filteredReports = filteredReports.filter(r => r.resolved === filters.resolved);
        }
        if (filters.startDate) {
            filteredReports = filteredReports.filter(r => r.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            filteredReports = filteredReports.filter(r => r.timestamp <= filters.endDate);
        }
        filteredReports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const offset = filters.offset || 0;
        const limit = filters.limit || 100;
        return filteredReports.slice(offset, offset + limit);
    }
    resolveReport(reportId, resolution) {
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            report.resolved = true;
            report.resolution = resolution;
            logger.info('CSP/SRI report resolved', {
                reportId,
                resolution,
                requestId: ''
            });
            return true;
        }
        return false;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.bankingMode !== undefined) {
            this.initializeBankingDefaults();
        }
        logger.info('CSP banking configuration updated', {
            config: this.config,
            requestId: ''
        });
    }
    cleanupOldReports() {
        const cutoffDate = new Date(Date.now() - (this.config.maxReportAge * 24 * 60 * 60 * 1000));
        const initialCount = this.reports.length;
        this.reports = this.reports.filter(r => r.timestamp >= cutoffDate);
        const removedCount = initialCount - this.reports.length;
        if (removedCount > 0) {
            logger.info('Cleaned up old CSP/SRI reports', {
                removedCount,
                remainingCount: this.reports.length,
                requestId: ''
            });
        }
        return removedCount;
    }
    getConfig() {
        return { ...this.config };
    }
    reset() {
        this.reports = [];
        this.violationPatterns.clear();
        this.alertThresholds.clear();
        logger.info('CSP banking service reset', {
            requestId: ''
        });
    }
}
export const cspBankingService = new CSPBankingService();
//# sourceMappingURL=csp-sri-banking.service.js.map