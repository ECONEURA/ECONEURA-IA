import { z } from 'zod';
export declare const InteractionTypeSchema: z.ZodEnum<["email", "call", "meeting", "note", "task"]>;
export declare const InteractionStatusSchema: z.ZodEnum<["pending", "completed", "cancelled"]>;
export declare const InteractionPrioritySchema: z.ZodEnum<["low", "medium", "high", "urgent"]>;
export declare const CreateInteractionSchema: z.ZodObject<{
    type: z.ZodEnum<["email", "call", "meeting", "note", "task"]>;
    subject: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["pending", "completed", "cancelled"]>>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    due_date: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    company_id: z.ZodOptional<z.ZodString>;
    contact_id: z.ZodOptional<z.ZodString>;
    deal_id: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: "email" | "call" | "meeting" | "note" | "task";
    status?: "pending" | "completed" | "cancelled";
    metadata?: Record<string, any>;
    subject?: string;
    content?: string;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assigned_to?: string;
}, {
    type?: "email" | "call" | "meeting" | "note" | "task";
    status?: "pending" | "completed" | "cancelled";
    metadata?: Record<string, any>;
    subject?: string;
    content?: string;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assigned_to?: string;
}>;
export declare const UpdateInteractionSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["email", "call", "meeting", "note", "task"]>>;
    subject: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    content: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["pending", "completed", "cancelled"]>>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>>;
    due_date: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assigned_to: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    company_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contact_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    deal_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
}, "strip", z.ZodTypeAny, {
    type?: "email" | "call" | "meeting" | "note" | "task";
    status?: "pending" | "completed" | "cancelled";
    metadata?: Record<string, any>;
    subject?: string;
    content?: string;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assigned_to?: string;
}, {
    type?: "email" | "call" | "meeting" | "note" | "task";
    status?: "pending" | "completed" | "cancelled";
    metadata?: Record<string, any>;
    subject?: string;
    content?: string;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    due_date?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    assigned_to?: string;
}>;
export declare const InteractionFiltersSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["email", "call", "meeting", "note", "task"]>>;
    status: z.ZodOptional<z.ZodEnum<["pending", "completed", "cancelled"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    company_id: z.ZodOptional<z.ZodString>;
    contact_id: z.ZodOptional<z.ZodString>;
    deal_id: z.ZodOptional<z.ZodString>;
    assigned_to: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodString>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "email" | "call" | "meeting" | "note" | "task";
    status?: "pending" | "completed" | "cancelled";
    limit?: number;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    offset?: number;
    assigned_to?: string;
    created_by?: string;
    date_from?: string;
    date_to?: string;
}, {
    type?: "email" | "call" | "meeting" | "note" | "task";
    status?: "pending" | "completed" | "cancelled";
    limit?: number;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    offset?: number;
    assigned_to?: string;
    created_by?: string;
    date_from?: string;
    date_to?: string;
}>;
export interface Interaction {
    id: string;
    org_id: string;
    type: 'email' | 'call' | 'meeting' | 'note' | 'task';
    subject?: string;
    content: string;
    status: 'pending' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
    completed_at?: string;
    assigned_to?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    company_id?: string;
    contact_id?: string;
    deal_id?: string;
    metadata?: Record<string, any>;
}
export interface InteractionSummary {
    total: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    pending_count: number;
    overdue_count: number;
    completed_today: number;
    avg_completion_time: number;
    top_assignees: Array<{
        user_id: string;
        count: number;
    }>;
    recent_activity: Array<{
        date: string;
        count: number;
    }>;
}
export interface InteractionAnalytics {
    summary: InteractionSummary;
    trends: {
        completion_rate: number;
        avg_response_time: number;
        satisfaction_score: number;
        productivity_metrics: {
            interactions_per_day: number;
            completion_rate_by_type: Record<string, number>;
            peak_hours: Array<{
                hour: number;
                count: number;
            }>;
        };
    };
    recommendations: string[];
}
export declare class InteractionsService {
    private interactions;
    private nextId;
    constructor();
    private initializeSampleData;
    createInteraction(orgId: string, userId: string, data: z.infer<typeof CreateInteractionSchema>): Promise<Interaction>;
    getInteractions(orgId: string, filters: z.infer<typeof InteractionFiltersSchema>): Promise<{
        interactions: Interaction[];
        total: number;
    }>;
    getInteractionById(orgId: string, interactionId: string): Promise<Interaction | null>;
    updateInteraction(orgId: string, interactionId: string, userId: string, data: z.infer<typeof UpdateInteractionSchema>): Promise<Interaction | null>;
    deleteInteraction(orgId: string, interactionId: string, userId: string): Promise<boolean>;
    getInteractionSummary(orgId: string): Promise<InteractionSummary>;
    getInteractionAnalytics(orgId: string): Promise<InteractionAnalytics>;
    bulkUpdateInteractions(orgId: string, userId: string, updates: Array<{
        id: string;
        data: z.infer<typeof UpdateInteractionSchema>;
    }>): Promise<{
        updated: number;
        failed: number;
        errors: string[];
    }>;
    getStats(): any;
}
export declare const interactionsService: InteractionsService;
//# sourceMappingURL=interactions.service.d.ts.map