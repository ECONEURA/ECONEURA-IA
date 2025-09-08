import { structuredLogger } from './structured-logger.js';

// SEPA Robust Service - PR-70
// Sistema robusto de SEPA con excepciones y reglas UI para .053/.054

interface SEPARobustTransaction {
  id: string;
  organizationId: string;
  accountId: string;
  transactionId: string;
  amount: number;
  currency: string;
  date: string;
  valueDate: string;
  description: string;
  reference: string;
  counterparty: {
    name: string;
    iban: string;
    bic: string;
  };
  category: string;
  status: 'pending' | 'matched' | 'reconciled' | 'disputed' | 'exception';
  matchingScore: number;
  matchedTransactionId?: string;
  // PR-70: Campos específicos para robustez
  camtVersion: '053' | '054';
  exceptionType?: 'duplicate' | 'invalid_amount' | 'missing_reference' | 'invalid_iban' | 'date_mismatch' | 'currency_mismatch';
  exceptionDetails?: string;
  validationErrors: string[];
  processingFlags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SEPARobustRule {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  priority: number;
  conditions: {
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'range' | 'exists' | 'not_exists';
    value: any;
    weight: number;
  }[];
  actions: {
    type: 'auto_match' | 'flag_exception' | 'transform_data' | 'send_alert' | 'require_manual_review';
    parameters: Record<string, any>;
  }[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SEPARobustException {
  id: string;
  organizationId: string;
  transactionId: string;
  exceptionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  status: 'open' | 'in_review' | 'resolved' | 'ignored';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

interface SEPARobustValidation {
  transactionId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  confidence: number;
}

interface SEPARobustReport {
  id: string;
  organizationId: string;
  reportType: 'processing_summary' | 'exception_analysis' | 'rule_performance' | 'validation_report';
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalTransactions: number;
    processedTransactions: number;
    exceptionTransactions: number;
    matchedTransactions: number;
    averageProcessingTime: number;
    successRate: number;
  };
  data: any;
  generatedBy: string;
  createdAt: string;
}

class SEPARobustService {
  private transactions: Map<string, SEPARobustTransaction> = new Map();
  private rules: Map<string, SEPARobustRule> = new Map();
  private exceptions: Map<string, SEPARobustException> = new Map();
  private validations: Map<string, SEPARobustValidation> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('SEPA Robust Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Demo transactions
    const transaction1: SEPARobustTransaction = {
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

    const transaction2: SEPARobustTransaction = {
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
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    };

    const transaction3: SEPARobustTransaction = {
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
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.transactions.set(transaction1.id, transaction1);
    this.transactions.set(transaction2.id, transaction2);
    this.transactions.set(transaction3.id, transaction3);

    // Demo rules
    const rule1: SEPARobustRule = {
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

    const rule2: SEPARobustRule = {
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

    // Demo exceptions
    const exception1: SEPARobustException = {
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

    const exception2: SEPARobustException = {
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

  // Transaction Management
  async createTransaction(transactionData: Omit<SEPARobustTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<SEPARobustTransaction> {
    const now = new Date().toISOString();
    const newTransaction: SEPARobustTransaction = {
      id: `sepa_robust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...transactionData,
      status: transactionData.status || 'pending',
      validationErrors: [],
      processingFlags: [],
      createdAt: now,
      updatedAt: now
    };

    // Validate transaction
    const validation = await this.validateTransaction(newTransaction);
    newTransaction.validationErrors = validation.errors;
    
    if (!validation.isValid) {
      newTransaction.status = 'exception';
      newTransaction.exceptionType = this.determineExceptionType(validation.errors);
      newTransaction.exceptionDetails = validation.errors.join('; ');
    }

    // Apply rules
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

  async getTransaction(transactionId: string): Promise<SEPARobustTransaction | undefined> {
    return this.transactions.get(transactionId);
  }

  async getTransactions(organizationId: string, filters: {
    status?: string;
    exceptionType?: string;
    camtVersion?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<SEPARobustTransaction[]> {
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
      transactions = transactions.filter(t => t.date >= filters.startDate!);
    }

    if (filters.endDate) {
      transactions = transactions.filter(t => t.date <= filters.endDate!);
    }

    if (filters.limit) {
      transactions = transactions.slice(0, filters.limit);
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Rule Management
  async createRule(ruleData: Omit<SEPARobustRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<SEPARobustRule> {
    const now = new Date().toISOString();
    const newRule: SEPARobustRule = {
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

  async getRules(organizationId: string, filters: {
    enabled?: boolean;
    priority?: number;
    limit?: number;
  } = {}): Promise<SEPARobustRule[]> {
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

  // Exception Management
  async createException(exceptionData: Omit<SEPARobustException, 'id' | 'createdAt' | 'updatedAt'>): Promise<SEPARobustException> {
    const now = new Date().toISOString();
    const newException: SEPARobustException = {
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

  async getExceptions(organizationId: string, filters: {
    status?: string;
    severity?: string;
    exceptionType?: string;
    assignedTo?: string;
    limit?: number;
  } = {}): Promise<SEPARobustException[]> {
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

  // Validation
  async validateTransaction(transaction: SEPARobustTransaction): Promise<SEPARobustValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate IBAN format
    if (!this.validateIBAN(transaction.counterparty.iban)) {
      errors.push('Invalid IBAN format');
    }

    // Validate amount
    if (transaction.amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Validate currency
    if (!['EUR', 'USD', 'GBP'].includes(transaction.currency)) {
      warnings.push('Unsupported currency');
    }

    // Validate reference format
    if (transaction.reference && !this.validateReference(transaction.reference)) {
      warnings.push('Reference format may not be standard');
      suggestions.push('Consider using standard reference format: REF-YYYY-NNNN');
    }

    // Check for duplicates
    const duplicates = Array.from(this.transactions.values())
      .filter(t => t.id !== transaction.id && 
                  t.reference === transaction.reference && 
                  t.amount === transaction.amount &&
                  t.counterparty.iban === transaction.counterparty.iban);
    
    if (duplicates.length > 0) {
      errors.push('Potential duplicate transaction detected');
      suggestions.push('Review existing transactions with same reference and amount');
      // Add duplicate_detected flag
      transaction.processingFlags.push('duplicate_detected');
    }

    const confidence = Math.max(0, 100 - (errors.length * 30) - (warnings.length * 10));

    const validation: SEPARobustValidation = {
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

  // Rule Application
  private async applyRules(transaction: SEPARobustTransaction): Promise<void> {
    const rules = Array.from(this.rules.values())
      .filter(r => r.organizationId === transaction.organizationId && r.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of rules) {
      if (await this.evaluateRule(rule, transaction)) {
        await this.executeRuleActions(rule, transaction);
      }
    }
  }

  private async evaluateRule(rule: SEPARobustRule, transaction: SEPARobustTransaction): Promise<boolean> {
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const condition of rule.conditions) {
      totalWeight += condition.weight;
      
      if (this.evaluateCondition(condition, transaction)) {
        matchedWeight += condition.weight;
      }
    }

    return matchedWeight >= (totalWeight * 0.7); // 70% threshold
  }

  private evaluateCondition(condition: SEPARobustRule['conditions'][0], transaction: SEPARobustTransaction): boolean {
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

  private getFieldValue(transaction: SEPARobustTransaction, field: string): any {
    const fields = field.split('.');
    let value: any = transaction;
    
    for (const f of fields) {
      value = value?.[f];
    }
    
    return value;
  }

  private async executeRuleActions(rule: SEPARobustRule, transaction: SEPARobustTransaction): Promise<void> {
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
          // Implementation for sending alerts
          structuredLogger.warn('SEPA robust alert triggered', {
            ruleId: rule.id,
            transactionId: transaction.id,
            alertType: action.parameters.alert_type
          });
          break;
      }
    }
  }

  // Helper methods
  private validateIBAN(iban: string): boolean {
    // Basic IBAN validation
    return /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban) && iban.length >= 15 && iban.length <= 34;
  }

  private validateReference(reference: string): boolean {
    // Standard reference format validation
    return /^[A-Z]{3}-[0-9]{4}-[0-9]{4}$/.test(reference);
  }

  private determineExceptionType(errors: string[]): SEPARobustTransaction['exceptionType'] {
    if (errors.some(e => e.includes('duplicate'))) return 'duplicate';
    if (errors.some(e => e.includes('amount'))) return 'invalid_amount';
    if (errors.some(e => e.includes('reference'))) return 'missing_reference';
    if (errors.some(e => e.includes('IBAN'))) return 'invalid_iban';
    if (errors.some(e => e.includes('date'))) return 'date_mismatch';
    if (errors.some(e => e.includes('currency'))) return 'currency_mismatch';
    return 'invalid_amount'; // default
  }

  // Reports
  async generateReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<SEPARobustReport> {
    const transactions = Array.from(this.transactions.values())
      .filter(t => t.organizationId === organizationId && 
                  t.date >= startDate && 
                  t.date <= endDate);

    const exceptions = Array.from(this.exceptions.values())
      .filter(e => e.organizationId === organizationId &&
                  e.createdAt >= startDate &&
                  e.createdAt <= endDate);

    let summary: any = {};
    let data: any = {};

    switch (reportType) {
      case 'processing_summary':
        summary = {
          totalTransactions: transactions.length,
          processedTransactions: transactions.filter(t => t.status !== 'pending').length,
          exceptionTransactions: transactions.filter(t => t.status === 'exception').length,
          matchedTransactions: transactions.filter(t => t.status === 'matched').length,
          averageProcessingTime: 2.5, // Mock value
          successRate: (transactions.filter(t => t.status === 'matched').length / transactions.length) * 100
        };
        data = { transactions, exceptions };
        break;

      case 'exception_analysis':
        const exceptionTypes = exceptions.reduce((acc, e) => {
          acc[e.exceptionType] = (acc[e.exceptionType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        summary = {
          totalTransactions: transactions.length,
          processedTransactions: transactions.filter(t => t.status !== 'pending').length,
          exceptionTransactions: exceptions.length,
          matchedTransactions: transactions.filter(t => t.status === 'matched').length,
          averageProcessingTime: 2.5,
          successRate: (transactions.filter(t => t.status === 'matched').length / transactions.length) * 100
        };
        data = { exceptionTypes, exceptions };
        break;
    }

    const report: SEPARobustReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
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

  // Statistics
  async getStats(organizationId: string) {
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
      }, {} as Record<string, number>),
      byExceptionType: exceptions.reduce((acc, e) => {
        acc[e.exceptionType] = (acc[e.exceptionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: exceptions.reduce((acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const sepaRobustService = new SEPARobustService();
