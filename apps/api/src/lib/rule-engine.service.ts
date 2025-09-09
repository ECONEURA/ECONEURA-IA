// Rule Engine Service for PR-42
import { MatchingRule, MatchingCondition, MatchingAction } from './sepa-types';

export class RuleEngineService {
  private rules: MatchingRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'exact_reference_match',
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
            parameters: { threshold: 1.0, autoApprove: true }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'amount_date_tolerance',
        name: 'Amount and Date Tolerance Match',
        description: 'Match transactions with amount and date within tolerance',
        priority: 80,
        conditions: [
          {
            field: 'amount',
            operator: 'range',
            value: { tolerance: 0.01 },
            weight: 0.6
          },
          {
            field: 'date',
            operator: 'range',
            value: { tolerance: 1 },
            weight: 0.4
          }
        ],
        actions: [
          {
            type: 'match',
            parameters: { threshold: 0.8, autoApprove: false }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'counterparty_iban_match',
        name: 'Counterparty IBAN Match',
        description: 'Match transactions with same counterparty IBAN',
        priority: 70,
        conditions: [
          {
            field: 'counterparty.iban',
            operator: 'equals',
            value: '',
            weight: 0.8
          },
          {
            field: 'amount',
            operator: 'range',
            value: { tolerance: 0.05 },
            weight: 0.2
          }
        ],
        actions: [
          {
            type: 'match',
            parameters: { threshold: 0.7, autoApprove: false }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'description_pattern_match',
        name: 'Description Pattern Match',
        description: 'Match transactions with similar description patterns',
        priority: 50,
        conditions: [
          {
            field: 'description',
            operator: 'contains',
            value: '',
            weight: 0.5
          },
          {
            field: 'amount',
            operator: 'range',
            value: { tolerance: 0.1 },
            weight: 0.3
          },
          {
            field: 'date',
            operator: 'range',
            value: { tolerance: 3 },
            weight: 0.2
          }
        ],
        actions: [
          {
            type: 'flag',
            parameters: { flag: 'requires_review', threshold: 0.6 }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  addRule(rule: Omit<MatchingRule, 'id' | 'createdAt' | 'updatedAt'>): MatchingRule {
    const newRule: MatchingRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.push(newRule);
    this.sortRulesByPriority();
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<MatchingRule>): MatchingRule | null {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return null;

    this.rules[ruleIndex] = {
      ...this.rules[ruleIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.sortRulesByPriority();
    return this.rules[ruleIndex];
  }

  deleteRule(ruleId: string): boolean {
    const ruleIndex = this.rules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) return false;

    this.rules.splice(ruleIndex, 1);
    return true;
  }

  getRule(ruleId: string): MatchingRule | null {
    return this.rules.find(rule => rule.id === ruleId) || null;
  }

  getRules(): MatchingRule[] {
    return [...this.rules];
  }

  getEnabledRules(): MatchingRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  enableRule(ruleId: string): boolean {
    const rule = this.getRule(ruleId);
    if (!rule) return false;

    rule.enabled = true;
    rule.updatedAt = new Date();
    return true;
  }

  disableRule(ruleId: string): boolean {
    const rule = this.getRule(ruleId);
    if (!rule) return false;

    rule.enabled = false;
    rule.updatedAt = new Date();
    return true;
  }

  validateRule(rule: Omit<MatchingRule, 'id' | 'createdAt' | 'updatedAt'>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate rule name
    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Rule name is required');
    }

    // Validate priority
    if (typeof rule.priority !== 'number' || rule.priority < 0 || rule.priority > 1000) {
      errors.push('Priority must be a number between 0 and 1000');
    }

    // Validate conditions
    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    } else {
      for (const condition of rule.conditions) {
        const conditionErrors = this.validateCondition(condition);
        errors.push(...conditionErrors);
      }
    }

    // Validate actions
    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    } else {
      for (const action of rule.actions) {
        const actionErrors = this.validateAction(action);
        errors.push(...actionErrors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateCondition(condition: MatchingCondition): string[] {
    const errors: string[] = [];

    if (!condition.field || condition.field.trim().length === 0) {
      errors.push('Condition field is required');
    }

    if (!['equals', 'contains', 'regex', 'range'].includes(condition.operator)) {
      errors.push('Invalid condition operator');
    }

    if (typeof condition.weight !== 'number' || condition.weight < 0 || condition.weight > 1) {
      errors.push('Condition weight must be a number between 0 and 1');
    }

    if (condition.operator === 'regex' && typeof condition.value !== 'string') {
      errors.push('Regex operator requires string value');
    }

    if (condition.operator === 'range' && typeof condition.value !== 'object') {
      errors.push('Range operator requires object value with tolerance');
    }

    return errors;
  }

  private validateAction(action: MatchingAction): string[] {
    const errors: string[] = [];

    if (!['match', 'flag', 'transform'].includes(action.type)) {
      errors.push('Invalid action type');
    }

    if (!action.parameters || typeof action.parameters !== 'object') {
      errors.push('Action parameters are required');
    }

    if (action.type === 'match') {
      const threshold = (action.parameters as any).threshold;
      if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
        errors.push('Match action threshold must be a number between 0 and 1');
      }
    }

    return errors;
  }

  testRule(rule: MatchingRule, testData: any): {
    passed: boolean;
    score: number;
    details: any;
  } {
    let totalScore = 0;
    let totalWeight = 0;
    const details: any = {};

    for (const condition of rule.conditions) {
      const conditionResult = this.evaluateCondition(condition, testData);
      totalScore += conditionResult.score * condition.weight;
      totalWeight += condition.weight;
      details[condition.field] = conditionResult;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const passed = finalScore >= 0.7; // Default threshold

    return {
      passed,
      score: finalScore,
      details
    };
  }

  private evaluateCondition(condition: MatchingCondition, testData: any): {
    score: number;
    matched: boolean;
    value: any;
  } {
    const fieldValue = this.getNestedValue(testData, condition.field);

    switch (condition.operator) {
      case 'equals':
        return {
          score: fieldValue === condition.value ? 1.0 : 0.0,
          matched: fieldValue === condition.value,
          value: fieldValue
        };

      case 'contains':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          const matched = fieldValue.toLowerCase().includes(condition.value.toLowerCase());
          return {
            score: matched ? 0.8 : 0.0,
            matched,
            value: fieldValue
          };
        }
        return { score: 0.0, matched: false, value: fieldValue };

      case 'regex':
        if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
          try {
            const regex = new RegExp(condition.value);
            const matched = regex.test(fieldValue);
            return {
              score: matched ? 1.0 : 0.0,
              matched,
              value: fieldValue
            };
          } catch (error) {
            return { score: 0.0, matched: false, value: fieldValue };
          }
        }
        return { score: 0.0, matched: false, value: fieldValue };

      case 'range':
        if (typeof fieldValue === 'number' && typeof condition.value === 'object') {
          const tolerance = (condition.value as any).tolerance || 0.01;
          const diff = Math.abs(fieldValue - (condition.value as any).target || 0);
          const matched = diff <= tolerance;
          const score = matched ? 1.0 : Math.max(0, 1 - (diff / tolerance));
          return { score, matched, value: fieldValue };
        }
        return { score: 0.0, matched: false, value: fieldValue };

      default:
        return { score: 0.0, matched: false, value: fieldValue };
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  getRuleStats(): {
    totalRules: number;
    enabledRules: number;
    disabledRules: number;
    averagePriority: number;
  } {
    const total = this.rules.length;
    const enabled = this.rules.filter(r => r.enabled).length;
    const disabled = total - enabled;
    const averagePriority = total > 0
      ? this.rules.reduce((sum, r) => sum + r.priority, 0) / total
      : 0;

    return {
      totalRules: total,
      enabledRules: enabled,
      disabledRules: disabled,
      averagePriority
    };
  }
}
