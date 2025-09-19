import { EscalationRule, EscalationEvent, CreateEscalationRuleRequest, UpdateEscalationRuleRequest, TriggerEscalationRequest, EscalationStats } from './quiet-hours-types.js';
export declare class EscalationService {
    private rules;
    private events;
    private participants;
    constructor();
    getEscalationRules(organizationId: string): Promise<EscalationRule[]>;
    getEscalationRule(id: string): Promise<EscalationRule | null>;
    createEscalationRule(request: CreateEscalationRuleRequest): Promise<EscalationRule>;
    updateEscalationRule(id: string, request: UpdateEscalationRuleRequest): Promise<EscalationRule | null>;
    deleteEscalationRule(id: string): Promise<boolean>;
    triggerEscalation(request: TriggerEscalationRequest): Promise<EscalationEvent | null>;
    getEscalationStatus(organizationId: string): Promise<EscalationEvent[]>;
    acknowledgeEscalation(eventId: string, userId: string): Promise<EscalationEvent | null>;
    getEscalationStats(organizationId: string): Promise<EscalationStats>;
    private processEscalation;
    private executeActions;
    private evaluateConditions;
    private evaluateSeverityCondition;
    private evaluateServiceCondition;
    private evaluateTimeCondition;
    private evaluateCountCondition;
    private calculateNextEscalation;
    private calculateResponseTime;
    private generateId;
    private initializeDefaultRules;
}
//# sourceMappingURL=escalation.service.d.ts.map