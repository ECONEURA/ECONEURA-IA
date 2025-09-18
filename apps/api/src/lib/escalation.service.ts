/**
 * PR-46: Escalation Management Service
 * 
 * Service for managing escalation rules, events, and intelligent escalation
 */

import { 
  EscalationRule, 
  EscalationEvent, 
  EscalationCondition, 
  EscalationAction, 
  EscalationTimeout,
  EscalationParticipant,
  EscalationHistoryEntry,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  TriggerEscalationRequest,
  EscalationStats
} from './quiet-hours-types';

export class EscalationService {
  private rules: Map<string, EscalationRule> = new Map();
  private events: Map<string, EscalationEvent> = new Map();
  private participants: Map<string, EscalationParticipant> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Get all escalation rules for an organization
   */
  async getEscalationRules(organizationId: string): Promise<EscalationRule[]> {
    const rules = Array.from(this.rules.values())
      .filter(rule => rule.organizationId === organizationId);
    
    return rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get a specific escalation rule
   */
  async getEscalationRule(id: string): Promise<EscalationRule | null> {
    return this.rules.get(id) || null;
  }

  /**
   * Create a new escalation rule
   */
  async createEscalationRule(request: CreateEscalationRuleRequest): Promise<EscalationRule> {
    const id = this.generateId();
    const now = new Date();

    const rule: EscalationRule = {
      id,
      organizationId: request.organizationId,
      ruleName: request.ruleName,
      conditions: request.conditions,
      actions: request.actions,
      timeouts: request.timeouts,
      enabled: true,
      priority: request.priority ?? 100,
      createdAt: now,
      updatedAt: now
    };

    this.rules.set(id, rule);
    return rule;
  }

  /**
   * Update an existing escalation rule
   */
  async updateEscalationRule(id: string, request: UpdateEscalationRuleRequest): Promise<EscalationRule | null> {
    const rule = this.rules.get(id);
    if (!rule) {
      return null;
    }

    const updatedRule: EscalationRule = {
      ...rule,
      ruleName: request.ruleName ?? rule.ruleName,
      conditions: request.conditions ?? rule.conditions,
      actions: request.actions ?? rule.actions,
      timeouts: request.timeouts ?? rule.timeouts,
      enabled: request.enabled ?? rule.enabled,
      priority: request.priority ?? rule.priority,
      updatedAt: new Date()
    };

    this.rules.set(id, updatedRule);
    return updatedRule;
  }

  /**
   * Delete an escalation rule
   */
  async deleteEscalationRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  /**
   * Trigger an escalation event
   */
  async triggerEscalation(request: TriggerEscalationRequest): Promise<EscalationEvent | null> {
    const organizationId = 'org_1'; // In production, get from context
    const rules = await this.getEscalationRules(organizationId);
    
    // Find matching rules
    const matchingRules = rules.filter(rule => 
      rule.enabled && this.evaluateConditions(rule.conditions, request)
    );

    if (matchingRules.length === 0) {
      return null;
    }

    // Use the highest priority rule
    const rule = matchingRules[0];
    const eventId = this.generateId();
    const now = new Date();

    const event: EscalationEvent = {
      id: eventId,
      ruleId: rule.id,
      organizationId,
      alertId: request.alertId,
      severity: request.severity,
      status: 'pending',
      currentLevel: 0,
      startTime: now,
      lastEscalation: now,
      nextEscalation: this.calculateNextEscalation(rule.timeouts, 0),
      participants: [],
      history: []
    };

    this.events.set(eventId, event);
    
    // Start escalation process
    await this.processEscalation(event);
    
    return event;
  }

  /**
   * Get escalation status for active events
   */
  async getEscalationStatus(organizationId: string): Promise<EscalationEvent[]> {
    const events = Array.from(this.events.values())
      .filter(event => 
        event.organizationId === organizationId &&
        (event.status === 'pending' || event.status === 'escalating')
      );
    
    return events;
  }

  /**
   * Acknowledge an escalation event
   */
  async acknowledgeEscalation(eventId: string, userId: string): Promise<EscalationEvent | null> {
    const event = this.events.get(eventId);
    if (!event) {
      return null;
    }

    const participant = event.participants.find(p => p.userId === userId);
    if (participant) {
      participant.respondedAt = new Date();
      participant.responseTime = this.calculateResponseTime(participant.notifiedAt, participant.respondedAt);
    }

    // Add to history
    event.history.push({
      timestamp: new Date(),
      level: event.currentLevel,
      action: 'acknowledged',
      participant: userId,
      result: 'success',
      details: `Escalation acknowledged by ${userId}`
    });

    // Check if all participants have responded
    const allResponded = event.participants.every(p => p.respondedAt);
    if (allResponded) {
      event.status = 'resolved';
      event.resolvedAt = new Date();
    }

    this.events.set(eventId, event);
    return event;
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStats(organizationId: string): Promise<EscalationStats> {
    const rules = await this.getEscalationRules(organizationId);
    const activeRules = rules.filter(r => r.enabled);
    
    const allEvents = Array.from(this.events.values())
      .filter(event => event.organizationId === organizationId);

    const resolvedEvents = allEvents.filter(e => e.status === 'resolved');
    const timeoutEvents = allEvents.filter(e => e.status === 'timeout');
    
    const averageEscalationTime = resolvedEvents.length > 0
      ? resolvedEvents.reduce((sum, event) => {
          const escalationTime = event.resolvedAt 
            ? event.resolvedAt.getTime() - event.startTime.getTime()
            : 0;
          return sum + escalationTime;
        }, 0) / resolvedEvents.length / 1000 / 60 // Convert to minutes
      : 0;

    const resolutionRate = allEvents.length > 0
      ? (resolvedEvents.length / allEvents.length) * 100
      : 0;

    const timeoutRate = allEvents.length > 0
      ? (timeoutEvents.length / allEvents.length) * 100
      : 0;

    return {
      totalRules: rules.length,
      activeRules: activeRules.length,
      totalEvents: allEvents.length,
      averageEscalationTime,
      resolutionRate,
      timeoutRate
    };
  }

  /**
   * Process escalation for an event
   */
  private async processEscalation(event: EscalationEvent): Promise<void> {
    const rule = this.rules.get(event.ruleId);
    if (!rule) {
      return;
    }

    // Execute actions for current level
    const currentTimeout = rule.timeouts.find(t => t.level === event.currentLevel);
    if (currentTimeout) {
      await this.executeActions(currentTimeout.action, event);
      
      // Schedule next escalation
      if (event.currentLevel < rule.timeouts.length - 1) {
        event.currentLevel++;
        event.nextEscalation = this.calculateNextEscalation(rule.timeouts, event.currentLevel);
        event.status = 'escalating';
      } else {
        event.status = 'timeout';
      }
    }

    this.events.set(event.id, event);
  }

  /**
   * Execute escalation actions
   */
  private async executeActions(action: EscalationAction, event: EscalationEvent): Promise<void> {
    const now = new Date();
    
    // Add participant
    const participant: EscalationParticipant = {
      userId: action.target,
      name: `User ${action.target}`,
      email: `${action.target}@example.com`,
      phone: '+1234567890',
      level: event.currentLevel,
      notifiedAt: now
    };

    event.participants.push(participant);
    this.participants.set(participant.userId, participant);

    // Add to history
    event.history.push({
      timestamp: now,
      level: event.currentLevel,
      action: action.type,
      participant: action.target,
      result: 'success',
      details: `Action ${action.type} executed for target ${action.target}`
    });

    // In production, actually send notifications, make calls, etc.
    
  }

  /**
   * Evaluate escalation conditions
   */
  private evaluateConditions(conditions: EscalationCondition[], request: TriggerEscalationRequest): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'severity':
          return this.evaluateSeverityCondition(condition, request.severity);
        case 'service':
          return this.evaluateServiceCondition(condition, request.service);
        case 'time':
          return this.evaluateTimeCondition(condition);
        case 'count':
          return this.evaluateCountCondition(condition);
        default:
          return true;
      }
    });
  }

  private evaluateSeverityCondition(condition: EscalationCondition, severity: string): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const requestLevel = severityLevels[severity as keyof typeof severityLevels] || 0;
    const conditionLevel = severityLevels[condition.value as keyof typeof severityLevels] || 0;

    switch (condition.operator) {
      case 'equals':
        return requestLevel === conditionLevel;
      case 'greater_than':
        return requestLevel > conditionLevel;
      case 'less_than':
        return requestLevel < conditionLevel;
      default:
        return false;
    }
  }

  private evaluateServiceCondition(condition: EscalationCondition, service?: string): boolean {
    if (!service) return false;

    switch (condition.operator) {
      case 'equals':
        return service === condition.value;
      case 'contains':
        return service.includes(condition.value);
      case 'matches':
        return new RegExp(condition.value).test(service);
      default:
        return false;
    }
  }

  private evaluateTimeCondition(condition: EscalationCondition): boolean {
    const now = new Date();
    const hour = now.getHours();

    switch (condition.operator) {
      case 'equals':
        return hour === condition.value;
      case 'greater_than':
        return hour > condition.value;
      case 'less_than':
        return hour < condition.value;
      default:
        return false;
    }
  }

  private evaluateCountCondition(condition: EscalationCondition): boolean {
    // Simplified implementation - in production, count actual events
    const count = Math.floor(Math.random() * 10);

    switch (condition.operator) {
      case 'equals':
        return count === condition.value;
      case 'greater_than':
        return count > condition.value;
      case 'less_than':
        return count < condition.value;
      default:
        return false;
    }
  }

  private calculateNextEscalation(timeouts: EscalationTimeout[], currentLevel: number): Date {
    const nextTimeout = timeouts.find(t => t.level === currentLevel + 1);
    if (nextTimeout) {
      const nextEscalation = new Date();
      nextEscalation.setMinutes(nextEscalation.getMinutes() + nextTimeout.timeoutMinutes);
      return nextEscalation;
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  }

  private calculateResponseTime(notifiedAt?: Date, respondedAt?: Date): number {
    if (!notifiedAt || !respondedAt) {
      return 0;
    }
    return (respondedAt.getTime() - notifiedAt.getTime()) / 1000 / 60; // minutes
  }

  private generateId(): string {
    return `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultRules(): void {
    // Create default escalation rule
    const defaultRule: EscalationRule = {
      id: 'default-escalation-rule',
      organizationId: 'org_1',
      ruleName: 'Default Critical Escalation',
      conditions: [
        {
          type: 'severity',
          operator: 'greater_than',
          value: 'high'
        }
      ],
      actions: [
        {
          type: 'notify',
          target: 'user_1',
          message: 'Critical alert requires immediate attention',
          delay: 0,
          retryCount: 3,
          retryDelay: 60
        }
      ],
      timeouts: [
        {
          level: 0,
          timeoutMinutes: 5,
          action: {
            type: 'notify',
            target: 'user_1',
            message: 'Critical alert - Level 0 escalation',
            delay: 0
          }
        },
        {
          level: 1,
          timeoutMinutes: 10,
          action: {
            type: 'notify',
            target: 'user_2',
            message: 'Critical alert - Level 1 escalation',
            delay: 0
          }
        },
        {
          level: 2,
          timeoutMinutes: 15,
          action: {
            type: 'call',
            target: 'user_1',
            message: 'Critical alert - Level 2 escalation - Phone call',
            delay: 0
          }
        }
      ],
      enabled: true,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(defaultRule.id, defaultRule);
  }
}
