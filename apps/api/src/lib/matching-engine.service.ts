// Matching Engine Service for PR-42
import { SEPATransaction, MatchingRule, ReconciliationResult } from './sepa-types';

export class MatchingEngineService {
  private rules: MatchingRule[] = [];
  private reconciliationResults: ReconciliationResult[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Default matching rules
    this.rules = [
      {
        id: 'exact_reference',
        name: 'Exact Reference Match',
        description: 'Match transactions with identical reference numbers',
        priority: 100,
        conditions: [
          {
            field: 'reference',
            operator: 'equals',
            value: '',
            weight: 1.0
          }
        ],
        actions: [
          {
            type: 'match',
            parameters: { threshold: 1.0 }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'amount_date_fuzzy',
        name: 'Amount and Date Fuzzy Match',
        description: 'Match transactions with similar amount and date within tolerance',
        priority: 80,
        conditions: [
          {
            field: 'amount',
            operator: 'range',
            value: { tolerance: 0.01 },
            weight: 0.7
          },
          {
            field: 'date',
            operator: 'range',
            value: { tolerance: 1 }, // 1 day tolerance
            weight: 0.3
          }
        ],
        actions: [
          {
            type: 'match',
            parameters: { threshold: 0.8 }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async matchTransactions(
    sepaTransactions: SEPATransaction[],
    existingTransactions: SEPATransaction[]
  ): Promise<ReconciliationResult[]> {
    const results: ReconciliationResult[] = [];

    for (const sepaTransaction of sepaTransactions) {
      let bestMatch: { transaction: SEPATransaction; score: number } | null = null;

      for (const existingTransaction of existingTransactions) {
        const score = this.calculateMatchingScore(sepaTransaction, existingTransaction);
        
        if (score > 0.7 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { transaction: existingTransaction, score };
        }
      }

      if (bestMatch) {
        const result: ReconciliationResult = {
          id: `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transactionId: sepaTransaction.id,
          matchedTransactionId: bestMatch.transaction.id,
          score: bestMatch.score,
          status: bestMatch.score >= 0.9 ? 'auto' : 'manual',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        results.push(result);
        this.reconciliationResults.push(result);

        // Update transaction status
        sepaTransaction.status = bestMatch.score >= 0.9 ? 'matched' : 'pending';
        sepaTransaction.matchingScore = bestMatch.score;
        sepaTransaction.matchedTransactionId = bestMatch.transaction.id;
      }
    }

    return results;
  }

  private calculateMatchingScore(
    sepaTransaction: SEPATransaction,
    existingTransaction: SEPATransaction
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      for (const condition of rule.conditions) {
        const conditionScore = this.evaluateCondition(sepaTransaction, existingTransaction, condition);
        totalScore += conditionScore * condition.weight;
        totalWeight += condition.weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private evaluateCondition(
    sepaTransaction: SEPATransaction,
    existingTransaction: SEPATransaction,
    condition: any
  ): number {
    const sepaValue = this.getFieldValue(sepaTransaction, condition.field);
    const existingValue = this.getFieldValue(existingTransaction, condition.field);

    switch (condition.operator) {
      case 'equals':
        return sepaValue === existingValue ? 1.0 : 0.0;
      
      case 'contains':
        if (typeof sepaValue === 'string' && typeof existingValue === 'string') {
          return sepaValue.toLowerCase().includes(existingValue.toLowerCase()) ? 0.8 : 0.0;
        }
        return 0.0;
      
      case 'regex':
        if (typeof sepaValue === 'string' && typeof condition.value === 'string') {
          const regex = new RegExp(condition.value);
          return regex.test(sepaValue) ? 1.0 : 0.0;
        }
        return 0.0;
      
      case 'range':
        if (typeof sepaValue === 'number' && typeof existingValue === 'number') {
          const tolerance = (condition.value as any).tolerance || 0.01;
          const diff = Math.abs(sepaValue - existingValue);
          return diff <= tolerance ? 1.0 : Math.max(0, 1 - (diff / tolerance));
        }
        return 0.0;
      
      default:
        return 0.0;
    }
  }

  private getFieldValue(transaction: SEPATransaction, field: string): unknown {
    const fieldMap: Record<string, string> = {
      'reference': 'reference',
      'amount': 'amount',
      'date': 'date',
      'description': 'description',
      'counterparty.name': 'counterparty.name',
      'counterparty.iban': 'counterparty.iban'
    };

    const mappedField = fieldMap[field] || field;
    
    if (mappedField.includes('.')) {
      const [parent, child] = mappedField.split('.');
      return (transaction as any)[parent]?.[child];
    }
    
    return (transaction as any)[mappedField];
  }

  addRule(rule: MatchingRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  updateRule(ruleId: string, updates: Partial<MatchingRule>): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates, updatedAt: new Date() };
    return true;
  }

  deleteRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.rules.splice(ruleIndex, 1);
    return true;
  }

  getRules(): MatchingRule[] {
    return this.rules;
  }

  getReconciliationResults(): ReconciliationResult[] {
    return this.reconciliationResults;
  }

  getMatchingStats(): {
    totalTransactions: number;
    matchedTransactions: number;
    autoMatched: number;
    manualMatched: number;
    pendingTransactions: number;
    averageScore: number;
  } {
    const total = this.reconciliationResults.length;
    const autoMatched = this.reconciliationResults.filter(r => r.status === 'auto').length;
    const manualMatched = this.reconciliationResults.filter(r => r.status === 'manual').length;
    const averageScore = total > 0 
      ? this.reconciliationResults.reduce((sum, r) => sum + r.score, 0) / total 
      : 0;

    return {
      totalTransactions: total,
      matchedTransactions: autoMatched + manualMatched,
      autoMatched,
      manualMatched,
      pendingTransactions: total - autoMatched - manualMatched,
      averageScore
    };
  }
}
