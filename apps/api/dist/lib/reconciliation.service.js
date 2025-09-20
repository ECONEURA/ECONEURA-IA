import { MatchingEngineService } from './matching-engine.service.js';
export class ReconciliationService {
    matchingEngine;
    reconciliationResults = [];
    constructor() {
        this.matchingEngine = new MatchingEngineService();
    }
    async performReconciliation(sepaTransactions, existingTransactions) {
        const matchingResults = await this.matchingEngine.matchTransactions(sepaTransactions, existingTransactions);
        const results = [];
        for (const sepaTransaction of sepaTransactions) {
            const matchingResult = matchingResults.find(r => r.transactionId === sepaTransaction.id);
            if (matchingResult) {
                const reconciliationResult = {
                    id: `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    transactionId: sepaTransaction.id,
                    matchedTransactionId: matchingResult.matchedTransactionId,
                    score: matchingResult.score,
                    status: matchingResult.status,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                results.push(reconciliationResult);
                this.reconciliationResults.push(reconciliationResult);
                sepaTransaction.status = matchingResult.status === 'auto' ? 'reconciled' : 'matched';
                sepaTransaction.matchingScore = matchingResult.score;
                sepaTransaction.matchedTransactionId = matchingResult.matchedTransactionId;
            }
            else {
                sepaTransaction.status = 'pending';
            }
        }
        const summary = this.calculateReconciliationSummary(results);
        return { results, summary };
    }
    calculateReconciliationSummary(results) {
        const total = results.length;
        const autoReconciled = results.filter(r => r.status === 'auto').length;
        const manualReconciled = results.filter(r => r.status === 'manual').length;
        const disputed = results.filter(r => r.status === 'disputed').length;
        const pending = total - autoReconciled - manualReconciled - disputed;
        const successRate = total > 0 ? (autoReconciled + manualReconciled) / total : 0;
        return {
            total,
            autoReconciled,
            manualReconciled,
            pending,
            disputed,
            successRate
        };
    }
    async manualReconciliation(transactionId, matchedTransactionId, userId) {
        const existingResult = this.reconciliationResults.find(r => r.transactionId === transactionId);
        if (existingResult) {
            existingResult.matchedTransactionId = matchedTransactionId;
            existingResult.status = 'manual';
            existingResult.updatedAt = new Date();
            return existingResult;
        }
        else {
            const newResult = {
                id: `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                transactionId,
                matchedTransactionId,
                score: 1.0,
                status: 'manual',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.reconciliationResults.push(newResult);
            return newResult;
        }
    }
    async disputeReconciliation(transactionId, reason, userId) {
        const existingResult = this.reconciliationResults.find(r => r.transactionId === transactionId);
        if (existingResult) {
            existingResult.status = 'disputed';
            existingResult.updatedAt = new Date();
            return existingResult;
        }
        return null;
    }
    async approveReconciliation(transactionId, userId) {
        const existingResult = this.reconciliationResults.find(r => r.transactionId === transactionId);
        if (existingResult) {
            existingResult.status = existingResult.status === 'manual' ? 'auto' : existingResult.status;
            existingResult.updatedAt = new Date();
            return existingResult;
        }
        return null;
    }
    getReconciliationResults() {
        return this.reconciliationResults;
    }
    getReconciliationResult(transactionId) {
        return this.reconciliationResults.find(r => r.transactionId === transactionId) || null;
    }
    getReconciliationStats() {
        const total = this.reconciliationResults.length;
        const autoReconciled = this.reconciliationResults.filter(r => r.status === 'auto').length;
        const manualReconciled = this.reconciliationResults.filter(r => r.status === 'manual').length;
        const pending = this.reconciliationResults.filter(r => r.status === 'pending').length;
        const disputed = this.reconciliationResults.filter(r => r.status === 'disputed').length;
        const successRate = total > 0 ? (autoReconciled + manualReconciled) / total : 0;
        const averageScore = total > 0
            ? this.reconciliationResults.reduce((sum, r) => sum + r.score, 0) / total
            : 0;
        return {
            totalReconciliations: total,
            autoReconciled,
            manualReconciled,
            pending,
            disputed,
            successRate,
            averageScore
        };
    }
    exportReconciliationReport() {
        return {
            summary: this.getReconciliationStats(),
            results: this.reconciliationResults,
            exportedAt: new Date()
        };
    }
}
//# sourceMappingURL=reconciliation.service.js.map