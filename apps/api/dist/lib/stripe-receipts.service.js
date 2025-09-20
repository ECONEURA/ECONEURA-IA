import { structuredLogger } from './structured-logger.js';
class StripeReceiptsService {
    receipts = new Map();
    reconciliationRules = new Map();
    webhookEvents = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('Stripe Receipts Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const receipt1 = {
            id: 'receipt_1',
            organizationId: 'demo-org-1',
            stripePaymentIntentId: 'pi_1234567890abcdef',
            stripeChargeId: 'ch_1234567890abcdef',
            amount: 2500,
            currency: 'eur',
            status: 'succeeded',
            customerId: 'cus_demo_customer_1',
            customerEmail: 'cliente1@demo.com',
            description: 'Suscripción Premium - Enero 2024',
            metadata: { plan: 'premium', period: 'monthly' },
            receiptUrl: 'https://pay.stripe.com/receipts/receipt_1',
            receiptNumber: 'RCP-2024-001',
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString(),
            reconciledAt: oneDayAgo.toISOString(),
            reconciliationStatus: 'reconciled',
            bankTransactionId: 'TXN-2024-001',
            bankReference: 'STRIPE-001'
        };
        const receipt2 = {
            id: 'receipt_2',
            organizationId: 'demo-org-1',
            stripePaymentIntentId: 'pi_2345678901bcdefg',
            stripeChargeId: 'ch_2345678901bcdefg',
            amount: 5000,
            currency: 'eur',
            status: 'succeeded',
            customerId: 'cus_demo_customer_2',
            customerEmail: 'cliente2@demo.com',
            description: 'Servicio de Consultoría - Proyecto Alpha',
            metadata: { project: 'alpha', service: 'consulting' },
            receiptUrl: 'https://pay.stripe.com/receipts/receipt_2',
            receiptNumber: 'RCP-2024-002',
            createdAt: twoDaysAgo.toISOString(),
            updatedAt: twoDaysAgo.toISOString(),
            reconciliationStatus: 'pending',
            bankReference: 'STRIPE-002'
        };
        const receipt3 = {
            id: 'receipt_3',
            organizationId: 'demo-org-1',
            stripePaymentIntentId: 'pi_3456789012cdefgh',
            stripeChargeId: 'ch_3456789012cdefgh',
            amount: 1200,
            currency: 'eur',
            status: 'succeeded',
            customerId: 'cus_demo_customer_3',
            customerEmail: 'cliente3@demo.com',
            description: 'Suscripción Básica - Enero 2024',
            metadata: { plan: 'basic', period: 'monthly' },
            receiptUrl: 'https://pay.stripe.com/receipts/receipt_3',
            receiptNumber: 'RCP-2024-003',
            createdAt: threeDaysAgo.toISOString(),
            updatedAt: threeDaysAgo.toISOString(),
            reconciliationStatus: 'discrepancy',
            bankTransactionId: 'TXN-2024-003',
            bankReference: 'STRIPE-003',
            discrepancyReason: 'Amount mismatch: expected €12.00, received €11.50',
            discrepancyAmount: -50
        };
        this.receipts.set(receipt1.id, receipt1);
        this.receipts.set(receipt2.id, receipt2);
        this.receipts.set(receipt3.id, receipt3);
        const rule1 = {
            id: 'rule_1',
            organizationId: 'demo-org-1',
            name: 'Auto-reconcile Premium Subscriptions',
            description: 'Automatically reconcile premium subscription payments',
            conditions: {
                amountRange: { min: 2000, max: 3000 },
                currency: 'eur',
                descriptionPattern: 'Suscripción Premium',
                metadata: { plan: 'premium' }
            },
            actions: {
                autoReconcile: true,
                alertOnDiscrepancy: true,
                requireManualReview: false
            },
            isActive: true,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        const rule2 = {
            id: 'rule_2',
            organizationId: 'demo-org-1',
            name: 'Manual Review for Large Amounts',
            description: 'Require manual review for payments over €100',
            conditions: {
                amountRange: { min: 10000, max: 999999 },
                currency: 'eur'
            },
            actions: {
                autoReconcile: false,
                alertOnDiscrepancy: true,
                requireManualReview: true
            },
            isActive: true,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        this.reconciliationRules.set(rule1.id, rule1);
        this.reconciliationRules.set(rule2.id, rule2);
    }
    async createReceipt(receiptData) {
        const now = new Date().toISOString();
        const newReceipt = {
            id: `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...receiptData,
            reconciliationStatus: 'pending',
            createdAt: now,
            updatedAt: now
        };
        this.receipts.set(newReceipt.id, newReceipt);
        structuredLogger.info('Stripe receipt created', {
            receiptId: newReceipt.id,
            organizationId: newReceipt.organizationId,
            amount: newReceipt.amount,
            currency: newReceipt.currency
        });
        await this.autoReconcileReceipt(newReceipt.id);
        return newReceipt;
    }
    async getReceipt(receiptId) {
        return this.receipts.get(receiptId);
    }
    async getReceipts(organizationId, filters = {}) {
        let receipts = Array.from(this.receipts.values())
            .filter(r => r.organizationId === organizationId);
        if (filters.status) {
            receipts = receipts.filter(r => r.status === filters.status);
        }
        if (filters.reconciliationStatus) {
            receipts = receipts.filter(r => r.reconciliationStatus === filters.reconciliationStatus);
        }
        if (filters.startDate) {
            receipts = receipts.filter(r => r.createdAt >= filters.startDate);
        }
        if (filters.endDate) {
            receipts = receipts.filter(r => r.createdAt <= filters.endDate);
        }
        if (filters.limit) {
            receipts = receipts.slice(0, filters.limit);
        }
        return receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async processWebhookEvent(event) {
        this.webhookEvents.set(event.id, event);
        switch (event.type) {
            case 'payment_intent.succeeded':
                return await this.handlePaymentIntentSucceeded(event);
            case 'payment_intent.payment_failed':
                return await this.handlePaymentIntentFailed(event);
            case 'charge.dispute.created':
                return await this.handleChargeDispute(event);
            default:
                structuredLogger.info('Unhandled webhook event type', { eventType: event.type });
                return { processed: false };
        }
    }
    async handlePaymentIntentSucceeded(event) {
        const paymentIntent = event.data.object;
        const receiptData = {
            organizationId: 'demo-org-1',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'succeeded',
            customerId: paymentIntent.customer,
            customerEmail: paymentIntent.receipt_email,
            description: paymentIntent.description || 'Payment',
            metadata: paymentIntent.metadata || {},
            receiptUrl: paymentIntent.receipt_url,
            receiptNumber: `RCP-${new Date().getFullYear()}-${String(this.receipts.size + 1).padStart(3, '0')}`
        };
        const receipt = await this.createReceipt(receiptData);
        structuredLogger.info('Payment intent succeeded, receipt created', {
            receiptId: receipt.id,
            paymentIntentId: paymentIntent.id
        });
        return { processed: true, receiptId: receipt.id };
    }
    async handlePaymentIntentFailed(event) {
        const paymentIntent = event.data.object;
        const existingReceipt = Array.from(this.receipts.values())
            .find(r => r.stripePaymentIntentId === paymentIntent.id);
        if (existingReceipt) {
            existingReceipt.status = 'failed';
            existingReceipt.updatedAt = new Date().toISOString();
            this.receipts.set(existingReceipt.id, existingReceipt);
            structuredLogger.info('Payment intent failed, receipt updated', {
                receiptId: existingReceipt.id,
                paymentIntentId: paymentIntent.id
            });
            return { processed: true, receiptId: existingReceipt.id };
        }
        return { processed: false };
    }
    async handleChargeDispute(event) {
        const charge = event.data.object;
        const existingReceipt = Array.from(this.receipts.values())
            .find(r => r.stripeChargeId === charge.id);
        if (existingReceipt) {
            existingReceipt.reconciliationStatus = 'manual_review';
            existingReceipt.discrepancyReason = `Charge dispute: ${charge.dispute?.reason || 'Unknown reason'}`;
            existingReceipt.updatedAt = new Date().toISOString();
            this.receipts.set(existingReceipt.id, existingReceipt);
            structuredLogger.warn('Charge dispute detected, receipt marked for review', {
                receiptId: existingReceipt.id,
                chargeId: charge.id,
                disputeReason: charge.dispute?.reason
            });
            return { processed: true, receiptId: existingReceipt.id };
        }
        return { processed: false };
    }
    async autoReconcileReceipt(receiptId) {
        const receipt = this.receipts.get(receiptId);
        if (!receipt)
            return false;
        const applicableRules = Array.from(this.reconciliationRules.values())
            .filter(rule => rule.organizationId === receipt.organizationId &&
            rule.isActive &&
            this.matchesRule(receipt, rule));
        if (applicableRules.length === 0) {
            return false;
        }
        const rule = applicableRules[0];
        if (rule.actions.autoReconcile) {
            receipt.reconciliationStatus = 'reconciled';
            receipt.reconciledAt = new Date().toISOString();
            receipt.updatedAt = new Date().toISOString();
            this.receipts.set(receiptId, receipt);
            structuredLogger.info('Receipt auto-reconciled', {
                receiptId,
                ruleId: rule.id,
                ruleName: rule.name
            });
            return true;
        }
        if (rule.actions.requireManualReview) {
            receipt.reconciliationStatus = 'manual_review';
            receipt.updatedAt = new Date().toISOString();
            this.receipts.set(receiptId, receipt);
            structuredLogger.info('Receipt marked for manual review', {
                receiptId,
                ruleId: rule.id,
                ruleName: rule.name
            });
        }
        return false;
    }
    matchesRule(receipt, rule) {
        const conditions = rule.conditions;
        if (conditions.amountRange) {
            if (receipt.amount < conditions.amountRange.min || receipt.amount > conditions.amountRange.max) {
                return false;
            }
        }
        if (conditions.currency && receipt.currency !== conditions.currency) {
            return false;
        }
        if (conditions.customerEmail && receipt.customerEmail !== conditions.customerEmail) {
            return false;
        }
        if (conditions.descriptionPattern && !receipt.description.includes(conditions.descriptionPattern)) {
            return false;
        }
        if (conditions.metadata) {
            for (const [key, value] of Object.entries(conditions.metadata)) {
                if (receipt.metadata[key] !== value) {
                    return false;
                }
            }
        }
        return true;
    }
    async manualReconcileReceipt(receiptId, bankTransactionId, bankReference, notes) {
        const receipt = this.receipts.get(receiptId);
        if (!receipt)
            return undefined;
        receipt.reconciliationStatus = 'reconciled';
        receipt.reconciledAt = new Date().toISOString();
        receipt.bankTransactionId = bankTransactionId;
        receipt.bankReference = bankReference;
        receipt.updatedAt = new Date().toISOString();
        if (notes) {
            receipt.discrepancyReason = notes;
        }
        this.receipts.set(receiptId, receipt);
        structuredLogger.info('Receipt manually reconciled', {
            receiptId,
            bankTransactionId,
            bankReference,
            reconciledBy: 'manual'
        });
        return receipt;
    }
    async createReconciliationRule(ruleData) {
        const now = new Date().toISOString();
        const newRule = {
            id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...ruleData,
            createdAt: now,
            updatedAt: now
        };
        this.reconciliationRules.set(newRule.id, newRule);
        structuredLogger.info('Reconciliation rule created', {
            ruleId: newRule.id,
            organizationId: newRule.organizationId,
            ruleName: newRule.name
        });
        return newRule;
    }
    async getReconciliationRules(organizationId) {
        return Array.from(this.reconciliationRules.values())
            .filter(rule => rule.organizationId === organizationId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async generateReconciliationReport(organizationId, startDate, endDate, generatedBy) {
        const receipts = await this.getReceipts(organizationId, { startDate, endDate });
        const summary = {
            totalReceipts: receipts.length,
            totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
            reconciledReceipts: receipts.filter(r => r.reconciliationStatus === 'reconciled').length,
            reconciledAmount: receipts.filter(r => r.reconciliationStatus === 'reconciled').reduce((sum, r) => sum + r.amount, 0),
            pendingReceipts: receipts.filter(r => r.reconciliationStatus === 'pending').length,
            pendingAmount: receipts.filter(r => r.reconciliationStatus === 'pending').reduce((sum, r) => sum + r.amount, 0),
            discrepancyReceipts: receipts.filter(r => r.reconciliationStatus === 'discrepancy').length,
            discrepancyAmount: receipts.filter(r => r.reconciliationStatus === 'discrepancy').reduce((sum, r) => sum + r.amount, 0),
            reconciliationRate: receipts.length > 0 ? (receipts.filter(r => r.reconciliationStatus === 'reconciled').length / receipts.length) * 100 : 0
        };
        const discrepancies = receipts
            .filter(r => r.reconciliationStatus === 'discrepancy' || r.reconciliationStatus === 'manual_review')
            .map(r => ({
            receiptId: r.id,
            reason: r.discrepancyReason || 'Unknown discrepancy',
            amount: r.discrepancyAmount || 0,
            suggestedAction: r.reconciliationStatus === 'discrepancy' ? 'Review amount mismatch' : 'Manual review required'
        }));
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            organizationId,
            period: { startDate, endDate },
            summary,
            receipts,
            discrepancies,
            createdAt: new Date().toISOString(),
            generatedBy
        };
        structuredLogger.info('Reconciliation report generated', {
            reportId: report.id,
            organizationId,
            period: `${startDate} to ${endDate}`,
            totalReceipts: summary.totalReceipts,
            reconciliationRate: summary.reconciliationRate
        });
        return report;
    }
    async getReconciliationStats(organizationId) {
        const receipts = Array.from(this.receipts.values())
            .filter(r => r.organizationId === organizationId);
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentReceipts = receipts.filter(r => new Date(r.createdAt) >= last30Days);
        const lastWeekReceipts = receipts.filter(r => new Date(r.createdAt) >= last7Days);
        return {
            totalReceipts: receipts.length,
            totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
            reconciledReceipts: receipts.filter(r => r.reconciliationStatus === 'reconciled').length,
            pendingReceipts: receipts.filter(r => r.reconciliationStatus === 'pending').length,
            discrepancyReceipts: receipts.filter(r => r.reconciliationStatus === 'discrepancy').length,
            manualReviewReceipts: receipts.filter(r => r.reconciliationStatus === 'manual_review').length,
            reconciliationRate: receipts.length > 0 ? (receipts.filter(r => r.reconciliationStatus === 'reconciled').length / receipts.length) * 100 : 0,
            last30Days: {
                receipts: recentReceipts.length,
                amount: recentReceipts.reduce((sum, r) => sum + r.amount, 0),
                reconciled: recentReceipts.filter(r => r.reconciliationStatus === 'reconciled').length
            },
            last7Days: {
                receipts: lastWeekReceipts.length,
                amount: lastWeekReceipts.reduce((sum, r) => sum + r.amount, 0),
                reconciled: lastWeekReceipts.filter(r => r.reconciliationStatus === 'reconciled').length
            },
            byStatus: {
                succeeded: receipts.filter(r => r.status === 'succeeded').length,
                failed: receipts.filter(r => r.status === 'failed').length,
                pending: receipts.filter(r => r.status === 'pending').length,
                canceled: receipts.filter(r => r.status === 'canceled').length
            }
        };
    }
}
export const stripeReceiptsService = new StripeReceiptsService();
//# sourceMappingURL=stripe-receipts.service.js.map