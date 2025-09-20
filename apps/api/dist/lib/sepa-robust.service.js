import { structuredLogger } from './structured-logger.js';
class SEPARobustService {
    transactions = new Map();
    rules = new Map();
    exceptions = new Map();
    validations = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('SEPA Robust Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const transaction1 = {
            id: 'sepa_robust_1',
            organizationId: 'demo-org-1',
            accountId: 'acc_001',
            transactionId: 'TXN-2024-001',
            amount: 1500.00,
            currency: 'EUR',
            date: oneDayAgo.toISOString(),
            valueDate: oneDayAgo.toISOString(),
            description: 'Payment for services',
            reference: 'REF-001',
            counterparty: {
                name: 'TechCorp Solutions',
                iban: 'ES1234567890123456789012',
                bic: 'TECHESMM'
            },
            category: 'services',
            status: 'matched',
            matchingScore: 95,
            matchedTransactionId: 'match_001',
            camtVersion: '053',
            validationErrors: [],
            processingFlags: ['auto_matched'],
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        const transaction2 = {
            id: 'sepa_robust_2',
            organizationId: 'demo-org-1',
            accountId: 'acc_001',
            transactionId: 'TXN-2024-002',
            amount: 2500.00,
            currency: 'EUR',
            date: twoDaysAgo.toISOString(),
            valueDate: twoDaysAgo.toISOString(),
            description: 'Invoice payment',
            reference: 'INV-2024-001',
            counterparty: {
                name: 'LogiFlow Distribution',
                iban: 'ES9876543210987654321098',
                bic: 'LOGIESMM'
            },
            category: 'invoice',
            status: 'exception',
            matchingScore: 45,
            exceptionType: 'missing_reference',
            exceptionDetails: 'Reference number does not match expected format',
            validationErrors: ['Invalid reference format'],
            processingFlags: ['requires_manual_review'],
            camtVersion: '053',
            createdAt: twoDaysAgo.toISOString(),
            updatedAt: twoDaysAgo.toISOString()
        };
        const transaction3 = {
            id: 'sepa_robust_3',
            organizationId: 'demo-org-1',
            accountId: 'acc_002',
            transactionId: 'TXN-2024-003',
            amount: 750.50,
            currency: 'EUR',
            date: oneDayAgo.toISOString(),
            valueDate: oneDayAgo.toISOString(),
            description: 'Duplicate payment detected',
            reference: 'REF-001',
            counterparty: {
                name: 'TechCorp Solutions',
                iban: 'ES1234567890123456789012',
                bic: 'TECHESMM'
            },
            category: 'services',
            status: 'exception',
            matchingScore: 0,
            exceptionType: 'duplicate',
            exceptionDetails: 'Transaction appears to be a duplicate of TXN-2024-001',
            validationErrors: ['Potential duplicate transaction'],
            processingFlags: ['duplicate_detected', 'requires_manual_review'],
            camtVersion: '053',
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        this.transactions.set(transaction1.id, transaction1);
        this.transactions.set(transaction2.id, transaction2);
        this.transactions.set(transaction3.id, transaction3);
        const rule1 = {
            id: 'rule_1',
            organizationId: 'demo-org-1',
            name: 'Auto-match high confidence transactions',
            description: 'Automatically match transactions with high confidence scores',
            priority: 1,
            conditions: [
                {
                    field: 'matchingScore',
                    operator: 'range',
                    value: { min: 90, max: 100 },
                    weight: 100
                },
                {
                    field: 'status',
                    operator: 'equals',
                    value: 'pending',
                    weight: 50
                }
            ],
            actions: [
                {
                    type: 'auto_match',
                    parameters: { confidence_threshold: 90 }
                }
            ],
            enabled: true,
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        const rule2 = {
            id: 'rule_2',
            organizationId: 'demo-org-1',
            name: 'Flag duplicate transactions',
            description: 'Detect and flag potential duplicate transactions',
            priority: 2,
            conditions: [
                {
                    field: 'reference',
                    operator: 'equals',
                    value: 'REF-001',
                    weight: 80
                },
                {
                    field: 'amount',
                    operator: 'range',
                    value: { min: 700, max: 800 },
                    weight: 70
                }
            ],
            actions: [
                {
                    type: 'flag_exception',
                    parameters: { exception_type: 'duplicate', severity: 'high' }
                },
                {
                    type: 'require_manual_review',
                    parameters: {}
                }
            ],
            enabled: true,
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        this.rules.set(rule1.id, rule1);
        this.rules.set(rule2.id, rule2);
        const exception1 = {
            id: 'exception_1',
            organizationId: 'demo-org-1',
            transactionId: 'sepa_robust_2',
            exceptionType: 'missing_reference',
            severity: 'medium',
            description: 'Reference number does not match expected format',
            details: {
                expectedFormat: 'INV-YYYY-NNNN',
                actualValue: 'INV-2024-001',
                suggestedAction: 'Verify reference format with counterparty'
            },
            status: 'open',
            createdAt: twoDaysAgo.toISOString(),
            updatedAt: twoDaysAgo.toISOString()
        };
        const exception2 = {
            id: 'exception_2',
            organizationId: 'demo-org-1',
            transactionId: 'sepa_robust_3',
            exceptionType: 'duplicate',
            severity: 'high',
            description: 'Transaction appears to be a duplicate',
            details: {
                originalTransactionId: 'sepa_robust_1',
                similarityScore: 95,
                suggestedAction: 'Review both transactions for confirmation'
            },
            status: 'in_review',
            assignedTo: 'user_1',
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        this.exceptions.set(exception1.id, exception1);
        this.exceptions.set(exception2.id, exception2);
    }
    async createTransaction(transactionData) {
        const now = new Date().toISOString();
        const newTransaction = {
            id: `sepa_robust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...transactionData,
            status: transactionData.status || 'pending',
            validationErrors: [],
            processingFlags: [],
            createdAt: now,
            updatedAt: now
        };
        const validation = await this.validateTransaction(newTransaction);
        newTransaction.validationErrors = validation.errors;
        if (!validation.isValid) {
            newTransaction.status = 'exception';
            newTransaction.exceptionType = this.determineExceptionType(validation.errors);
            newTransaction.exceptionDetails = validation.errors.join('; ');
        }
        await this.applyRules(newTransaction);
        this.transactions.set(newTransaction.id, newTransaction);
        structuredLogger.info('SEPA robust transaction created', {
            transactionId: newTransaction.id,
            organizationId: newTransaction.organizationId,
            status: newTransaction.status,
            validationErrors: newTransaction.validationErrors.length
        });
        return newTransaction;
    }
    async getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }
    async getTransactions(organizationId, filters = {}) {
        let transactions = Array.from(this.transactions.values())
            .filter(t => t.organizationId === organizationId);
        if (filters.status) {
            transactions = transactions.filter(t => t.status === filters.status);
        }
        if (filters.exceptionType) {
            transactions = transactions.filter(t => t.exceptionType === filters.exceptionType);
        }
        if (filters.camtVersion) {
            transactions = transactions.filter(t => t.camtVersion === filters.camtVersion);
        }
        if (filters.accountId) {
            transactions = transactions.filter(t => t.accountId === filters.accountId);
        }
        if (filters.startDate) {
            transactions = transactions.filter(t => t.date >= filters.startDate);
        }
        if (filters.endDate) {
            transactions = transactions.filter(t => t.date <= filters.endDate);
        }
        if (filters.limit) {
            transactions = transactions.slice(0, filters.limit);
        }
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    async createRule(ruleData) {
        const now = new Date().toISOString();
        const newRule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...ruleData,
            createdAt: now,
            updatedAt: now
        };
        this.rules.set(newRule.id, newRule);
        structuredLogger.info('SEPA robust rule created', {
            ruleId: newRule.id,
            organizationId: newRule.organizationId,
            name: newRule.name,
            priority: newRule.priority
        });
        return newRule;
    }
    async getRules(organizationId, filters = {}) {
        let rules = Array.from(this.rules.values())
            .filter(r => r.organizationId === organizationId);
        if (filters.enabled !== undefined) {
            rules = rules.filter(r => r.enabled === filters.enabled);
        }
        if (filters.priority) {
            rules = rules.filter(r => r.priority === filters.priority);
        }
        if (filters.limit) {
            rules = rules.slice(0, filters.limit);
        }
        return rules.sort((a, b) => a.priority - b.priority);
    }
    async createException(exceptionData) {
        const now = new Date().toISOString();
        const newException = {
            id: `exception_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...exceptionData,
            createdAt: now,
            updatedAt: now
        };
        this.exceptions.set(newException.id, newException);
        structuredLogger.info('SEPA robust exception created', {
            exceptionId: newException.id,
            organizationId: newException.organizationId,
            transactionId: newException.transactionId,
            exceptionType: newException.exceptionType,
            severity: newException.severity
        });
        return newException;
    }
    async getExceptions(organizationId, filters = {}) {
        let exceptions = Array.from(this.exceptions.values())
            .filter(e => e.organizationId === organizationId);
        if (filters.status) {
            exceptions = exceptions.filter(e => e.status === filters.status);
        }
        if (filters.severity) {
            exceptions = exceptions.filter(e => e.severity === filters.severity);
        }
        if (filters.exceptionType) {
            exceptions = exceptions.filter(e => e.exceptionType === filters.exceptionType);
        }
        if (filters.assignedTo) {
            exceptions = exceptions.filter(e => e.assignedTo === filters.assignedTo);
        }
        if (filters.limit) {
            exceptions = exceptions.slice(0, filters.limit);
        }
        return exceptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async validateTransaction(transaction) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        if (!this.validateIBAN(transaction.counterparty.iban)) {
            errors.push('Invalid IBAN format');
        }
        if (transaction.amount <= 0) {
            errors.push('Amount must be positive');
        }
        if (!['EUR', 'USD', 'GBP'].includes(transaction.currency)) {
            warnings.push('Unsupported currency');
        }
        if (transaction.reference && !this.validateReference(transaction.reference)) {
            warnings.push('Reference format may not be standard');
            suggestions.push('Consider using standard reference format: REF-YYYY-NNNN');
        }
        const duplicates = Array.from(this.transactions.values())
            .filter(t => t.id !== transaction.id &&
            t.reference === transaction.reference &&
            t.amount === transaction.amount &&
            t.counterparty.iban === transaction.counterparty.iban);
        if (duplicates.length > 0) {
            errors.push('Potential duplicate transaction detected');
            suggestions.push('Review existing transactions with same reference and amount');
            transaction.processingFlags.push('duplicate_detected');
        }
        const confidence = Math.max(0, 100 - (errors.length * 30) - (warnings.length * 10));
        const validation = {
            transactionId: transaction.id,
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions,
            confidence
        };
        this.validations.set(transaction.id, validation);
        return validation;
    }
    async applyRules(transaction) {
        const rules = Array.from(this.rules.values())
            .filter(r => r.organizationId === transaction.organizationId && r.enabled)
            .sort((a, b) => a.priority - b.priority);
        for (const rule of rules) {
            if (await this.evaluateRule(rule, transaction)) {
                await this.executeRuleActions(rule, transaction);
            }
        }
    }
    async evaluateRule(rule, transaction) {
        let totalWeight = 0;
        let matchedWeight = 0;
        for (const condition of rule.conditions) {
            totalWeight += condition.weight;
            if (this.evaluateCondition(condition, transaction)) {
                matchedWeight += condition.weight;
            }
        }
        return matchedWeight >= (totalWeight * 0.7);
    }
    evaluateCondition(condition, transaction) {
        const fieldValue = this.getFieldValue(transaction, condition.field);
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'contains':
                return String(fieldValue).includes(String(condition.value));
            case 'regex':
                return new RegExp(condition.value).test(String(fieldValue));
            case 'range':
                return fieldValue >= condition.value.min && fieldValue <= condition.value.max;
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'not_exists':
                return fieldValue === undefined || fieldValue === null;
            default:
                return false;
        }
    }
    getFieldValue(transaction, field) {
        const fields = field.split('.');
        let value = transaction;
        for (const f of fields) {
            value = value?.[f];
        }
        return value;
    }
    async executeRuleActions(rule, transaction) {
        for (const action of rule.actions) {
            switch (action.type) {
                case 'auto_match':
                    transaction.status = 'matched';
                    transaction.matchingScore = 95;
                    transaction.processingFlags.push('auto_matched');
                    break;
                case 'flag_exception':
                    await this.createException({
                        organizationId: transaction.organizationId,
                        transactionId: transaction.id,
                        exceptionType: action.parameters.exception_type,
                        severity: action.parameters.severity,
                        description: `Exception flagged by rule: ${rule.name}`,
                        details: { ruleId: rule.id, ruleName: rule.name },
                        status: 'open'
                    });
                    transaction.status = 'exception';
                    transaction.exceptionType = action.parameters.exception_type;
                    break;
                case 'require_manual_review':
                    transaction.processingFlags.push('requires_manual_review');
                    break;
                case 'send_alert':
                    structuredLogger.warn('SEPA robust alert triggered', {
                        ruleId: rule.id,
                        transactionId: transaction.id,
                        alertType: action.parameters.alert_type
                    });
                    break;
            }
        }
    }
    validateIBAN(iban) {
        return /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban) && iban.length >= 15 && iban.length <= 34;
    }
    validateReference(reference) {
        return /^[A-Z]{3}-[0-9]{4}-[0-9]{4}$/.test(reference);
    }
    determineExceptionType(errors) {
        if (errors.some(e => e.includes('duplicate')))
            return 'duplicate';
        if (errors.some(e => e.includes('amount')))
            return 'invalid_amount';
        if (errors.some(e => e.includes('reference')))
            return 'missing_reference';
        if (errors.some(e => e.includes('IBAN')))
            return 'invalid_iban';
        if (errors.some(e => e.includes('date')))
            return 'date_mismatch';
        if (errors.some(e => e.includes('currency')))
            return 'currency_mismatch';
        return 'invalid_amount';
    }
    async generateReport(organizationId, reportType, startDate, endDate, generatedBy) {
        const transactions = Array.from(this.transactions.values())
            .filter(t => t.organizationId === organizationId &&
            t.date >= startDate &&
            t.date <= endDate);
        const exceptions = Array.from(this.exceptions.values())
            .filter(e => e.organizationId === organizationId &&
            e.createdAt >= startDate &&
            e.createdAt <= endDate);
        let summary = {};
        let data = {};
        switch (reportType) {
            case 'processing_summary':
                summary = {
                    totalTransactions: transactions.length,
                    processedTransactions: transactions.filter(t => t.status !== 'pending').length,
                    exceptionTransactions: transactions.filter(t => t.status === 'exception').length,
                    matchedTransactions: transactions.filter(t => t.status === 'matched').length,
                    averageProcessingTime: 2.5,
                    successRate: (transactions.filter(t => t.status === 'matched').length / transactions.length) * 100
                };
                data = { transactions, exceptions };
                break;
            case 'exception_analysis':
                {
                    const exceptionTypes = exceptions.reduce((acc, e) => {
                        acc[e.exceptionType] = (acc[e.exceptionType] || 0) + 1;
                        return acc;
                    }, {});
                    summary = {
                        totalTransactions: transactions.length,
                        processedTransactions: transactions.filter(t => t.status !== 'pending').length,
                        exceptionTransactions: exceptions.length,
                        matchedTransactions: transactions.filter(t => t.status === 'matched').length,
                        averageProcessingTime: 2.5,
                        successRate: (transactions.filter(t => t.status === 'matched').length / transactions.length) * 100
                    };
                    data = { exceptionTypes, exceptions };
                }
                break;
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
        structuredLogger.info('SEPA robust report generated', {
            reportId: report.id,
            organizationId,
            reportType,
            period: `${startDate} to ${endDate}`
        });
        return report;
    }
    async getStats(organizationId) {
        const transactions = Array.from(this.transactions.values()).filter(t => t.organizationId === organizationId);
        const exceptions = Array.from(this.exceptions.values()).filter(e => e.organizationId === organizationId);
        const rules = Array.from(this.rules.values()).filter(r => r.organizationId === organizationId);
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentTransactions = transactions.filter(t => new Date(t.createdAt) >= last24Hours);
        const recentExceptions = exceptions.filter(e => new Date(e.createdAt) >= last24Hours);
        return {
            totalTransactions: transactions.length,
            totalExceptions: exceptions.length,
            totalRules: rules.length,
            activeRules: rules.filter(r => r.enabled).length,
            last24Hours: {
                transactions: recentTransactions.length,
                exceptions: recentExceptions.length,
                successRate: recentTransactions.length > 0 ?
                    (recentTransactions.filter(t => t.status === 'matched').length / recentTransactions.length) * 100 : 0
            },
            last7Days: {
                transactions: transactions.filter(t => new Date(t.createdAt) >= last7Days).length,
                exceptions: exceptions.filter(e => new Date(e.createdAt) >= last7Days).length
            },
            byStatus: transactions.reduce((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            }, {}),
            byExceptionType: exceptions.reduce((acc, e) => {
                acc[e.exceptionType] = (acc[e.exceptionType] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: exceptions.reduce((acc, e) => {
                acc[e.severity] = (acc[e.severity] || 0) + 1;
                return acc;
            }, {})
        };
    }
}
export const sepaRobustService = new SEPARobustService();
//# sourceMappingURL=sepa-robust.service.js.map