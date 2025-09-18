// Reconciliation Service for PR-42
import { SEPATransaction, ReconciliationResult } from './sepa-types.js';
import { MatchingEngineService } from './matching-engine.service.js';

export class ReconciliationService {
  private matchingEngine: MatchingEngineService;
  private reconciliationResults: ReconciliationResult[] = [];

  constructor() {
    this.matchingEngine = new MatchingEngineService();
  }

  async performReconciliation(
    sepaTransactions: SEPATransaction[],
    existingTransactions: SEPATransaction[]
  ): Promise<{
    results: ReconciliationResult[];
    summary: {
      total: number;
      autoReconciled: number;
      manualReconciled: number;
      pending: number;
      disputed: number;
      successRate: number;
    };
  }> {
    // Perform matching
    const matchingResults = await this.matchingEngine.matchTransactions(
      sepaTransactions,
      existingTransactions
    );

    // Process reconciliation results
    const results: ReconciliationResult[] = [];
    
    for (const sepaTransaction of sepaTransactions) {
      const matchingResult = matchingResults.find(r => r.transactionId === sepaTransaction.id);
      
      if (matchingResult) {
        // Create reconciliation result
        const reconciliationResult: ReconciliationResult = {
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

        // Update transaction status
        sepaTransaction.status = matchingResult.status === 'auto' ? 'reconciled' : 'matched';
        sepaTransaction.matchingScore = matchingResult.score;
        sepaTransaction.matchedTransactionId = matchingResult.matchedTransactionId;
      } else {
        // No match found - mark as pending
        sepaTransaction.status = 'pending';
      }
    }

    // Calculate summary
    const summary = this.calculateReconciliationSummary(results);

    return { results, summary };
  }

  private calculateReconciliationSummary(results: ReconciliationResult[]): {
    total: number;
    autoReconciled: number;
    manualReconciled: number;
    pending: number;
    disputed: number;
    successRate: number;
  } {
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

  async manualReconciliation(
    transactionId: string,
    matchedTransactionId: string,
    userId: string
  ): Promise<ReconciliationResult | null> {
    const existingResult = this.reconciliationResults.find(r => r.transactionId === transactionId);
    
    if (existingResult) {
      // Update existing result
      existingResult.matchedTransactionId = matchedTransactionId;
      existingResult.status = 'manual';
      existingResult.updatedAt = new Date();
      return existingResult;
    } else {
      // Create new result
      const newResult: ReconciliationResult = {
        id: `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId,
        matchedTransactionId,
        score: 1.0, // Manual reconciliation gets full score
        status: 'manual',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reconciliationResults.push(newResult);
      return newResult;
    }
  }

  async disputeReconciliation(
    transactionId: string,
    reason: string,
    userId: string
  ): Promise<ReconciliationResult | null> {
    const existingResult = this.reconciliationResults.find(r => r.transactionId === transactionId);
    
    if (existingResult) {
      existingResult.status = 'disputed';
      existingResult.updatedAt = new Date();
      return existingResult;
    }

    return null;
  }

  async approveReconciliation(
    transactionId: string,
    userId: string
  ): Promise<ReconciliationResult | null> {
    const existingResult = this.reconciliationResults.find(r => r.transactionId === transactionId);
    
    if (existingResult) {
      existingResult.status = existingResult.status === 'manual' ? 'auto' : existingResult.status;
      existingResult.updatedAt = new Date();
      return existingResult;
    }

    return null;
  }

  getReconciliationResults(): ReconciliationResult[] {
    return this.reconciliationResults;
  }

  getReconciliationResult(transactionId: string): ReconciliationResult | null {
    return this.reconciliationResults.find(r => r.transactionId === transactionId) || null;
  }

  getReconciliationStats(): {
    totalReconciliations: number;
    autoReconciled: number;
    manualReconciled: number;
    pending: number;
    disputed: number;
    successRate: number;
    averageScore: number;
  } {
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

  exportReconciliationReport(): {
    summary: any;
    results: ReconciliationResult[];
    exportedAt: Date;
  } {
    return {
      summary: this.getReconciliationStats(),
      results: this.reconciliationResults,
      exportedAt: new Date()
    };
  }
}
