import { logger } from './logger.js';
import { z } from 'zod';
export const SEPATransactionSchema = z.object({
    id: z.string().uuid().optional(),
    accountId: z.string().min(1),
    transactionId: z.string().min(1),
    amount: z.number(),
    currency: z.string().length(3).default('EUR'),
    date: z.string().datetime(),
    valueDate: z.string().datetime(),
    description: z.string().min(1),
    reference: z.string().optional(),
    counterparty: z.object({
        name: z.string().optional(),
        iban: z.string().optional(),
        bic: z.string().optional()
    }),
    category: z.string().default('unknown'),
    status: z.enum(['pending', 'matched', 'reconciled', 'disputed']).default('pending'),
    matchingScore: z.number().min(0).max(100).optional(),
    matchedTransactionId: z.string().uuid().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});
export const MatchingRuleSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    priority: z.number().min(1).max(100).default(50),
    conditions: z.array(z.object({
        field: z.string().min(1),
        operator: z.enum(['equals', 'contains', 'regex', 'range']),
        value: z.any(),
        weight: z.number().min(0).max(100).default(50)
    })),
    actions: z.array(z.object({
        type: z.enum(['match', 'flag', 'transform']),
        parameters: z.record(z.any())
    })),
    enabled: z.boolean().default(true),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});
export const SEPAFilterSchema = z.object({
    accountId: z.string().optional(),
    status: z.enum(['pending', 'matched', 'reconciled', 'disputed']).optional(),
    category: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    amountMin: z.number().optional(),
    amountMax: z.number().optional(),
    reference: z.string().optional(),
    counterpartyName: z.string().optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0)
});
export class SEPAService {
    transactions = new Map();
    matchingRules = new Map();
    reconciliationResults = new Map();
    nextId = 1;
    constructor() {
        this.initializeSampleData();
        this.initializeDefaultRules();
        logger.info('SEPAService initialized');
    }
    initializeSampleData() {
        const sampleTransactions = [
            {
                accountId: 'account-1',
                transactionId: 'TXN-001',
                amount: 1500.00,
                currency: 'EUR',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                valueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                description: 'Payment from customer ABC Corp',
                reference: 'INV-2024-001',
                counterparty: {
                    name: 'ABC Corp',
                    iban: 'ES1234567890123456789012',
                    bic: 'ABCDESMM'
                },
                category: 'income',
                status: 'matched',
                matchingScore: 95,
                matchedTransactionId: 'internal-txn-001',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                accountId: 'account-1',
                transactionId: 'TXN-002',
                amount: -250.00,
                currency: 'EUR',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                valueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                description: 'Office supplies payment',
                reference: 'SUP-2024-001',
                counterparty: {
                    name: 'Office Supplies Ltd',
                    iban: 'ES9876543210987654321098',
                    bic: 'OFFICESMM'
                },
                category: 'expense',
                status: 'reconciled',
                matchingScore: 100,
                matchedTransactionId: 'internal-txn-002',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
            },
            {
                accountId: 'account-2',
                transactionId: 'TXN-003',
                amount: 3200.00,
                currency: 'EUR',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                valueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                description: 'Service payment from XYZ Ltd',
                reference: 'SRV-2024-001',
                counterparty: {
                    name: 'XYZ Ltd',
                    iban: 'ES1111222233334444555566',
                    bic: 'XYZLESMM'
                },
                category: 'income',
                status: 'pending',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                accountId: 'account-1',
                transactionId: 'TXN-004',
                amount: -75.50,
                currency: 'EUR',
                date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                valueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                description: 'Bank fees',
                reference: 'FEE-2024-001',
                counterparty: {
                    name: 'Bank Fees',
                    iban: '',
                    bic: ''
                },
                category: 'fees',
                status: 'disputed',
                matchingScore: 85,
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                accountId: 'account-2',
                transactionId: 'TXN-005',
                amount: 500.00,
                currency: 'EUR',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                valueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                description: 'Refund to customer',
                reference: 'REF-2024-001',
                counterparty: {
                    name: 'Customer Refund',
                    iban: 'ES7777888899990000111122',
                    bic: 'CUSTSMM'
                },
                category: 'refund',
                status: 'matched',
                matchingScore: 90,
                matchedTransactionId: 'internal-txn-005',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
            }
        ];
        sampleTransactions.forEach(transaction => {
            const id = `sepa-${this.nextId++}`;
            this.transactions.set(id, { ...transaction, id });
        });
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                name: 'Exact Reference Match',
                description: 'Match transactions with exact reference number',
                priority: 100,
                conditions: [
                    {
                        field: 'reference',
                        operator: 'equals',
                        value: '',
                        weight: 100
                    }
                ],
                actions: [
                    {
                        type: 'match',
                        parameters: { threshold: 100 }
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Amount and Date Match',
                description: 'Match transactions with same amount and date within tolerance',
                priority: 80,
                conditions: [
                    {
                        field: 'amount',
                        operator: 'range',
                        value: { min: -0.01, max: 0.01 },
                        weight: 80
                    },
                    {
                        field: 'date',
                        operator: 'range',
                        value: { min: -1, max: 1 },
                        weight: 70
                    }
                ],
                actions: [
                    {
                        type: 'match',
                        parameters: { threshold: 75 }
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                name: 'Counterparty Name Match',
                description: 'Match transactions with similar counterparty names',
                priority: 60,
                conditions: [
                    {
                        field: 'counterparty.name',
                        operator: 'contains',
                        value: '',
                        weight: 60
                    }
                ],
                actions: [
                    {
                        type: 'flag',
                        parameters: { flag: 'manual_review' }
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        defaultRules.forEach(rule => {
            const id = `rule-${this.nextId++}`;
            this.matchingRules.set(id, { ...rule, id });
        });
    }
    async createTransaction(orgId, userId, data) {
        try {
            const validatedData = SEPATransactionSchema.parse(data);
            const transaction = {
                id: `sepa-${this.nextId++}`,
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.transactions.set(transaction.id, transaction);
            await this.autoMatchTransaction(transaction.id);
            logger.info('SEPA transaction created', {
                transactionId: transaction.id,
                amount: transaction.amount,
                status: transaction.status,
                orgId,
                userId
            });
            return transaction;
        }
        catch (error) {
            logger.error('Failed to create SEPA transaction', {
                error: error.message,
                orgId,
                userId,
                data
            });
            throw error;
        }
    }
    async getTransactions(orgId, filters) {
        try {
            const validatedFilters = SEPAFilterSchema.parse(filters);
            let filteredTransactions = Array.from(this.transactions.values());
            if (validatedFilters.accountId) {
                filteredTransactions = filteredTransactions.filter(t => t.accountId === validatedFilters.accountId);
            }
            if (validatedFilters.status) {
                filteredTransactions = filteredTransactions.filter(t => t.status === validatedFilters.status);
            }
            if (validatedFilters.category) {
                filteredTransactions = filteredTransactions.filter(t => t.category === validatedFilters.category);
            }
            if (validatedFilters.dateFrom) {
                const fromDate = new Date(validatedFilters.dateFrom);
                filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= fromDate);
            }
            if (validatedFilters.dateTo) {
                const toDate = new Date(validatedFilters.dateTo);
                filteredTransactions = filteredTransactions.filter(t => new Date(t.date) <= toDate);
            }
            if (validatedFilters.amountMin !== undefined) {
                filteredTransactions = filteredTransactions.filter(t => t.amount >= validatedFilters.amountMin);
            }
            if (validatedFilters.amountMax !== undefined) {
                filteredTransactions = filteredTransactions.filter(t => t.amount <= validatedFilters.amountMax);
            }
            if (validatedFilters.reference) {
                filteredTransactions = filteredTransactions.filter(t => t.reference?.toLowerCase().includes(validatedFilters.reference.toLowerCase()));
            }
            if (validatedFilters.counterpartyName) {
                filteredTransactions = filteredTransactions.filter(t => t.counterparty.name?.toLowerCase().includes(validatedFilters.counterpartyName.toLowerCase()));
            }
            filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const total = filteredTransactions.length;
            const transactions = filteredTransactions.slice(validatedFilters.offset, validatedFilters.offset + validatedFilters.limit);
            logger.info('SEPA transactions retrieved', {
                orgId,
                filters: validatedFilters,
                count: transactions.length,
                total
            });
            return { transactions, total };
        }
        catch (error) {
            logger.error('Failed to get SEPA transactions', {
                error: error.message,
                orgId,
                filters
            });
            throw error;
        }
    }
    async getTransactionById(orgId, transactionId) {
        try {
            const transaction = this.transactions.get(transactionId);
            if (!transaction) {
                return null;
            }
            logger.info('SEPA transaction retrieved by ID', {
                transactionId,
                orgId
            });
            return transaction;
        }
        catch (error) {
            logger.error('Failed to get SEPA transaction by ID', {
                error: error.message,
                transactionId,
                orgId
            });
            throw error;
        }
    }
    async updateTransaction(orgId, transactionId, userId, data) {
        try {
            const transaction = this.transactions.get(transactionId);
            if (!transaction) {
                return null;
            }
            const updatedTransaction = {
                ...transaction,
                ...data,
                updatedAt: new Date(),
            };
            this.transactions.set(transactionId, updatedTransaction);
            logger.info('SEPA transaction updated', {
                transactionId,
                orgId,
                userId,
                updates: Object.keys(data)
            });
            return updatedTransaction;
        }
        catch (error) {
            logger.error('Failed to update SEPA transaction', {
                error: error.message,
                transactionId,
                orgId,
                userId,
                data
            });
            throw error;
        }
    }
    async deleteTransaction(orgId, transactionId, userId) {
        try {
            const transaction = this.transactions.get(transactionId);
            if (!transaction) {
                return false;
            }
            this.transactions.delete(transactionId);
            logger.info('SEPA transaction deleted', {
                transactionId,
                orgId,
                userId
            });
            return true;
        }
        catch (error) {
            logger.error('Failed to delete SEPA transaction', {
                error: error.message,
                transactionId,
                orgId,
                userId
            });
            throw error;
        }
    }
    async autoMatchTransaction(transactionId) {
        try {
            const transaction = this.transactions.get(transactionId);
            if (!transaction || transaction.status !== 'pending') {
                return { matched: false };
            }
            const rules = Array.from(this.matchingRules.values())
                .filter(rule => rule.enabled)
                .sort((a, b) => b.priority - a.priority);
            for (const rule of rules) {
                const matchResult = await this.applyMatchingRule(transaction, rule);
                if (matchResult.matched) {
                    const updatedTransaction = {
                        ...transaction,
                        status: 'matched',
                        matchingScore: matchResult.score,
                        matchedTransactionId: matchResult.matchedTransactionId,
                        updatedAt: new Date()
                    };
                    this.transactions.set(transactionId, updatedTransaction);
                    const reconciliationResult = {
                        id: `recon-${this.nextId++}`,
                        transactionId,
                        matchedTransactionId: matchResult.matchedTransactionId,
                        score: matchResult.score,
                        status: 'auto',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    this.reconciliationResults.set(reconciliationResult.id, reconciliationResult);
                    logger.info('Transaction auto-matched', {
                        transactionId,
                        ruleId: rule.id,
                        score: matchResult.score,
                        matchedTransactionId: matchResult.matchedTransactionId
                    });
                    return matchResult;
                }
            }
            return { matched: false };
        }
        catch (error) {
            logger.error('Failed to auto-match transaction', {
                error: error.message,
                transactionId
            });
            throw error;
        }
    }
    async applyMatchingRule(transaction, rule) {
        try {
            let totalScore = 0;
            let totalWeight = 0;
            for (const condition of rule.conditions) {
                const conditionScore = this.evaluateCondition(transaction, condition);
                totalScore += conditionScore * condition.weight;
                totalWeight += condition.weight;
            }
            const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
            const threshold = rule.actions.find(a => a.type === 'match')?.parameters?.threshold || 80;
            if (finalScore >= threshold) {
                const matchedTransaction = await this.findBestMatch(transaction, finalScore);
                return {
                    matched: true,
                    score: finalScore,
                    matchedTransactionId: matchedTransaction?.id
                };
            }
            return { matched: false };
        }
        catch (error) {
            logger.error('Failed to apply matching rule', {
                error: error.message,
                transactionId: transaction.id,
                ruleId: rule.id
            });
            return { matched: false };
        }
    }
    evaluateCondition(transaction, condition) {
        try {
            const fieldValue = this.getFieldValue(transaction, condition.field);
            switch (condition.operator) {
                case 'equals':
                    return fieldValue === condition.value ? 100 : 0;
                case 'contains': {
                    return fieldValue?.toString().toLowerCase().includes(condition.value.toString().toLowerCase()) ? 100 : 0;
                }
                case 'regex': {
                    const regex = new RegExp(condition.value);
                    return regex.test(fieldValue?.toString() || '') ? 100 : 0;
                }
                case 'range': {
                    const numValue = parseFloat(fieldValue?.toString() || '0');
                    const range = condition.value;
                    return (numValue >= range.min && numValue <= range.max) ? 100 : 0;
                }
                default: {
                    return 0;
                }
            }
        }
        catch (error) {
            return 0;
        }
    }
    getFieldValue(transaction, field) {
        const fieldParts = field.split('.');
        let value = transaction;
        for (const part of fieldParts) {
            value = value?.[part];
        }
        return value;
    }
    async findBestMatch(transaction, score) {
        const allTransactions = Array.from(this.transactions.values());
        const candidates = allTransactions.filter(t => t.id !== transaction.id &&
            t.status === 'pending' &&
            Math.abs(t.amount - transaction.amount) < 0.01 &&
            Math.abs(new Date(t.date).getTime() - new Date(transaction.date).getTime()) < 24 * 60 * 60 * 1000);
        return candidates.length > 0 ? candidates[0] : null;
    }
    async getSEPASummary(orgId) {
        try {
            const transactions = Array.from(this.transactions.values());
            const total = transactions.length;
            const totalValue = transactions.reduce((sum, t) => sum + t.amount, 0);
            const averageAmount = total > 0 ? totalValue / total : 0;
            const byStatus = transactions.reduce((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            }, {});
            const byCategory = transactions.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + 1;
                return acc;
            }, {});
            const byAccount = transactions.reduce((acc, t) => {
                acc[t.accountId] = (acc[t.accountId] || 0) + 1;
                return acc;
            }, {});
            const pendingCount = transactions.filter(t => t.status === 'pending').length;
            const matchedCount = transactions.filter(t => t.status === 'matched').length;
            const reconciledCount = transactions.filter(t => t.status === 'reconciled').length;
            const disputedCount = transactions.filter(t => t.status === 'disputed').length;
            const counterpartyStats = transactions
                .filter(t => t.counterparty.name)
                .reduce((acc, t) => {
                const name = t.counterparty.name;
                if (!acc[name]) {
                    acc[name] = { count: 0, totalAmount: 0 };
                }
                acc[name].count++;
                acc[name].totalAmount += t.amount;
                return acc;
            }, {});
            const topCounterparties = Object.entries(counterpartyStats)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 5);
            const recentActivity = [];
            const now = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
                const count = transactions.filter(t => {
                    const created = new Date(t.createdAt);
                    return created >= dayStart && created < dayEnd;
                }).length;
                recentActivity.push({
                    date: dayStart.toISOString().split('T')[0],
                    count
                });
            }
            const summary = {
                total,
                totalValue,
                byStatus,
                byCategory,
                byAccount,
                pendingCount,
                matchedCount,
                reconciledCount,
                disputedCount,
                averageAmount,
                topCounterparties,
                recentActivity
            };
            logger.info('SEPA summary generated', {
                orgId,
                total,
                pendingCount,
                matchedCount
            });
            return summary;
        }
        catch (error) {
            logger.error('Failed to get SEPA summary', {
                error: error.message,
                orgId
            });
            throw error;
        }
    }
    async getSEPAAnalytics(orgId) {
        try {
            const summary = await this.getSEPASummary(orgId);
            const transactions = Array.from(this.transactions.values());
            const totalTransactions = transactions.length;
            const matchedTransactions = transactions.filter(t => t.status === 'matched' || t.status === 'reconciled').length;
            const reconciledTransactions = transactions.filter(t => t.status === 'reconciled').length;
            const disputedTransactions = transactions.filter(t => t.status === 'disputed').length;
            const matchingRate = totalTransactions > 0 ? (matchedTransactions / totalTransactions) * 100 : 0;
            const reconciliationRate = matchedTransactions > 0 ? (reconciledTransactions / matchedTransactions) * 100 : 0;
            const errorRate = totalTransactions > 0 ? (disputedTransactions / totalTransactions) * 100 : 0;
            const averageProcessingTime = 2.5;
            const matchingAccuracy = 95;
            const processingEfficiency = 88;
            const recommendations = [];
            if (matchingRate < 80) {
                recommendations.push('La tasa de matching automático está por debajo del 80%. Considera revisar las reglas de matching.');
            }
            if (reconciliationRate < 90) {
                recommendations.push('La tasa de conciliación está por debajo del 90%. Revisa los procesos de conciliación.');
            }
            if (errorRate > 5) {
                recommendations.push('La tasa de errores está por encima del 5%. Revisa la calidad de los datos de entrada.');
            }
            if (recommendations.length === 0) {
                recommendations.push('¡Excelente rendimiento! Todas las métricas están en niveles óptimos.');
            }
            const analytics = {
                summary,
                trends: {
                    matchingRate,
                    reconciliationRate,
                    averageProcessingTime,
                    errorRate
                },
                performance: {
                    totalTransactions,
                    matchedTransactions,
                    reconciledTransactions,
                    disputedTransactions,
                    matchingAccuracy,
                    processingEfficiency
                },
                recommendations
            };
            logger.info('SEPA analytics generated', {
                orgId,
                matchingRate: matchingRate.toFixed(2),
                reconciliationRate: reconciliationRate.toFixed(2)
            });
            return analytics;
        }
        catch (error) {
            logger.error('Failed to get SEPA analytics', {
                error: error.message,
                orgId
            });
            throw error;
        }
    }
    async createMatchingRule(orgId, userId, data) {
        try {
            const validatedData = MatchingRuleSchema.parse(data);
            const rule = {
                id: `rule-${this.nextId++}`,
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.matchingRules.set(rule.id, rule);
            logger.info('Matching rule created', {
                ruleId: rule.id,
                name: rule.name,
                priority: rule.priority,
                orgId,
                userId
            });
            return rule;
        }
        catch (error) {
            logger.error('Failed to create matching rule', {
                error: error.message,
                orgId,
                userId,
                data
            });
            throw error;
        }
    }
    async getMatchingRules(orgId) {
        try {
            const rules = Array.from(this.matchingRules.values())
                .sort((a, b) => b.priority - a.priority);
            logger.info('Matching rules retrieved', {
                orgId,
                count: rules.length
            });
            return rules;
        }
        catch (error) {
            logger.error('Failed to get matching rules', {
                error: error.message,
                orgId
            });
            throw error;
        }
    }
    getStats() {
        return {
            totalTransactions: this.transactions.size,
            totalRules: this.matchingRules.size,
            totalReconciliations: this.reconciliationResults.size,
            byStatus: Array.from(this.transactions.values()).reduce((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            }, {}),
            byCategory: Array.from(this.transactions.values()).reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + 1;
                return acc;
            }, {})
        };
    }
}
export const sepaService = new SEPAService();
//# sourceMappingURL=sepa.service.js.map