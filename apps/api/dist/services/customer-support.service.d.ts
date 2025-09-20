import { z } from 'zod';
export declare const TicketPrioritySchema: z.ZodEnum<["low", "medium", "high", "urgent", "critical"]>;
export declare const TicketStatusSchema: z.ZodEnum<["open", "in_progress", "pending", "resolved", "closed"]>;
export declare const TicketCategorySchema: z.ZodEnum<["technical", "billing", "general", "feature_request", "bug_report"]>;
export declare const TicketSourceSchema: z.ZodEnum<["email", "chat", "phone", "portal", "api", "social"]>;
export declare const SupportTicketSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    customerId: z.ZodString;
    customerEmail: z.ZodString;
    customerName: z.ZodString;
    subject: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["technical", "billing", "general", "feature_request", "bug_report"]>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent", "critical"]>;
    status: z.ZodEnum<["open", "in_progress", "pending", "resolved", "closed"]>;
    source: z.ZodEnum<["email", "chat", "phone", "portal", "api", "social"]>;
    assignedTo: z.ZodOptional<z.ZodString>;
    assignedAt: z.ZodOptional<z.ZodDate>;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    closedAt: z.ZodOptional<z.ZodDate>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        url: z.ZodString;
        size: z.ZodNumber;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }, {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }>, "many">>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "open" | "in_progress" | "resolved" | "closed";
    organizationId?: string;
    metadata?: Record<string, any>;
    id?: string;
    source?: "chat" | "email" | "phone" | "api" | "social" | "portal";
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    assignedTo?: string;
    subject?: string;
    category?: "technical" | "general" | "billing" | "feature_request" | "bug_report";
    priority?: "critical" | "low" | "medium" | "high" | "urgent";
    resolvedAt?: Date;
    attachments?: {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }[];
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    assignedAt?: Date;
    closedAt?: Date;
}, {
    status?: "pending" | "open" | "in_progress" | "resolved" | "closed";
    organizationId?: string;
    metadata?: Record<string, any>;
    id?: string;
    source?: "chat" | "email" | "phone" | "api" | "social" | "portal";
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    assignedTo?: string;
    subject?: string;
    category?: "technical" | "general" | "billing" | "feature_request" | "bug_report";
    priority?: "critical" | "low" | "medium" | "high" | "urgent";
    resolvedAt?: Date;
    attachments?: {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }[];
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    assignedAt?: Date;
    closedAt?: Date;
}>;
export declare const ChatMessageSchema: z.ZodObject<{
    id: z.ZodString;
    ticketId: z.ZodString;
    senderId: z.ZodString;
    senderType: z.ZodEnum<["customer", "agent", "bot"]>;
    message: z.ZodString;
    messageType: z.ZodDefault<z.ZodEnum<["text", "image", "file", "system"]>>;
    attachments: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        url: z.ZodString;
        size: z.ZodNumber;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }, {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }>, "many">>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    readAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    message?: string;
    id?: string;
    createdAt?: Date;
    isRead?: boolean;
    readAt?: Date;
    attachments?: {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }[];
    messageType?: "system" | "text" | "image" | "file";
    senderId?: string;
    ticketId?: string;
    senderType?: "customer" | "agent" | "bot";
}, {
    message?: string;
    id?: string;
    createdAt?: Date;
    isRead?: boolean;
    readAt?: Date;
    attachments?: {
        type?: string;
        name?: string;
        url?: string;
        id?: string;
        size?: number;
    }[];
    messageType?: "system" | "text" | "image" | "file";
    senderId?: string;
    ticketId?: string;
    senderType?: "customer" | "agent" | "bot";
}>;
export declare const KnowledgeBaseArticleSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
    category: z.ZodString;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isPublished: z.ZodDefault<z.ZodBoolean>;
    viewCount: z.ZodDefault<z.ZodNumber>;
    helpfulCount: z.ZodDefault<z.ZodNumber>;
    notHelpfulCount: z.ZodDefault<z.ZodNumber>;
    authorId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    title?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    category?: string;
    isPublished?: boolean;
    viewCount?: number;
    helpfulCount?: number;
    notHelpfulCount?: number;
    authorId?: string;
}, {
    organizationId?: string;
    title?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    category?: string;
    isPublished?: boolean;
    viewCount?: number;
    helpfulCount?: number;
    notHelpfulCount?: number;
    authorId?: string;
}>;
export declare const SupportAgentSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    email: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    maxTickets: z.ZodDefault<z.ZodNumber>;
    currentTickets: z.ZodDefault<z.ZodNumber>;
    skills: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    languages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    workingHours: z.ZodOptional<z.ZodObject<{
        timezone: z.ZodDefault<z.ZodString>;
        schedule: z.ZodRecord<z.ZodString, z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
            isWorking: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            end?: string;
            start?: string;
            isWorking?: boolean;
        }, {
            end?: string;
            start?: string;
            isWorking?: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        timezone?: string;
        schedule?: Record<string, {
            end?: string;
            start?: string;
            isWorking?: boolean;
        }>;
    }, {
        timezone?: string;
        schedule?: Record<string, {
            end?: string;
            start?: string;
            isWorking?: boolean;
        }>;
    }>>;
    performance: z.ZodOptional<z.ZodObject<{
        ticketsResolved: z.ZodDefault<z.ZodNumber>;
        averageResolutionTime: z.ZodDefault<z.ZodNumber>;
        customerSatisfaction: z.ZodDefault<z.ZodNumber>;
        responseTime: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        responseTime?: number;
        averageResolutionTime?: number;
        ticketsResolved?: number;
        customerSatisfaction?: number;
    }, {
        responseTime?: number;
        averageResolutionTime?: number;
        ticketsResolved?: number;
        customerSatisfaction?: number;
    }>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    organizationId?: string;
    name?: string;
    performance?: {
        responseTime?: number;
        averageResolutionTime?: number;
        ticketsResolved?: number;
        customerSatisfaction?: number;
    };
    id?: string;
    email?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    languages?: string[];
    skills?: string[];
    maxTickets?: number;
    currentTickets?: number;
    workingHours?: {
        timezone?: string;
        schedule?: Record<string, {
            end?: string;
            start?: string;
            isWorking?: boolean;
        }>;
    };
}, {
    userId?: string;
    organizationId?: string;
    name?: string;
    performance?: {
        responseTime?: number;
        averageResolutionTime?: number;
        ticketsResolved?: number;
        customerSatisfaction?: number;
    };
    id?: string;
    email?: string;
    createdAt?: Date;
    updatedAt?: Date;
    isActive?: boolean;
    languages?: string[];
    skills?: string[];
    maxTickets?: number;
    currentTickets?: number;
    workingHours?: {
        timezone?: string;
        schedule?: Record<string, {
            end?: string;
            start?: string;
            isWorking?: boolean;
        }>;
    };
}>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type TicketSource = z.infer<typeof TicketSourceSchema>;
export type SupportTicket = z.infer<typeof SupportTicketSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type KnowledgeBaseArticle = z.infer<typeof KnowledgeBaseArticleSchema>;
export type SupportAgent = z.infer<typeof SupportAgentSchema>;
export declare class CustomerSupportService {
    private db;
    private tickets;
    private messages;
    private articles;
    private agents;
    private chatSessions;
    constructor();
    private initializeService;
    private initializeSupportTables;
    private loadExistingData;
    private startBackgroundProcessing;
    createTicket(organizationId: string, ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket>;
    getTicket(ticketId: string, organizationId: string): Promise<SupportTicket | null>;
    updateTicketStatus(ticketId: string, organizationId: string, status: TicketStatus, updatedBy: string): Promise<SupportTicket | null>;
    sendMessage(ticketId: string, senderId: string, senderType: 'customer' | 'agent' | 'bot', message: string, messageType?: 'text' | 'image' | 'file' | 'system', attachments?: any[]): Promise<ChatMessage>;
    getTicketMessages(ticketId: string): Promise<ChatMessage[]>;
    createArticle(organizationId: string, articleData: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBaseArticle>;
    searchArticles(organizationId: string, query: string, category?: string): Promise<KnowledgeBaseArticle[]>;
    createAgent(organizationId: string, agentData: Omit<SupportAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportAgent>;
    private autoAssignTicket;
    private processTicketEscalation;
    private updateAgentPerformance;
    private generateId;
    getSupportStatistics(organizationId: string): Promise<{
        totalTickets: number;
        ticketsByStatus: Record<string, number>;
        ticketsByPriority: Record<string, number>;
        ticketsByCategory: Record<string, number>;
        averageResolutionTime: number;
        totalAgents: number;
        activeAgents: number;
        totalArticles: number;
        topCategories: Array<{
            category: string;
            count: number;
        }>;
        customerSatisfaction: number;
    }>;
}
export declare const customerSupportService: CustomerSupportService;
//# sourceMappingURL=customer-support.service.d.ts.map