interface HITLAgent {
    id: string;
    organizationId: string;
    userId: string;
    name: string;
    email: string;
    role: 'agent' | 'supervisor' | 'manager' | 'admin';
    department: string;
    skills: string[];
    languages: string[];
    status: 'active' | 'inactive' | 'on_leave' | 'training';
    availability: {
        timezone: string;
        workingHours: {
            start: string;
            end: string;
            days: number[];
        };
        maxConcurrentTasks: number;
        currentTasks: number;
    };
    performance: {
        averageResponseTime: number;
        taskCompletionRate: number;
        customerSatisfaction: number;
        lastPerformanceReview: string;
    };
    sla: {
        responseTimeTarget: number;
        resolutionTimeTarget: number;
        escalationThreshold: number;
        autoEscalation: boolean;
    };
    createdAt: string;
    updatedAt: string;
}
interface HITLShift {
    id: string;
    organizationId: string;
    agentId: string;
    shiftType: 'morning' | 'afternoon' | 'night' | 'weekend' | 'holiday';
    startTime: string;
    endTime: string;
    date: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    coverage: {
        department: string;
        skills: string[];
        languages: string[];
        maxTasks: number;
    };
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
interface HITLVacation {
    id: string;
    organizationId: string;
    agentId: string;
    type: 'vacation' | 'sick_leave' | 'personal' | 'training' | 'emergency';
    startDate: string;
    endDate: string;
    status: 'requested' | 'approved' | 'rejected' | 'active' | 'completed';
    reason: string;
    approvedBy?: string;
    approvedAt?: string;
    coverage: {
        assignedAgentId?: string;
        backupAgentIds: string[];
        notes?: string;
    };
    createdAt: string;
    updatedAt: string;
}
interface HITLTask {
    id: string;
    organizationId: string;
    assignedAgentId?: string;
    customerId: string;
    taskType: 'data_validation' | 'content_review' | 'quality_check' | 'manual_processing' | 'escalation';
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'escalated' | 'cancelled';
    title: string;
    description: string;
    data: Record<string, any>;
    sla: {
        responseTimeTarget: number;
        resolutionTimeTarget: number;
        escalationTime: number;
        autoEscalate: boolean;
    };
    timestamps: {
        created: string;
        assigned?: string;
        started?: string;
        completed?: string;
        escalated?: string;
    };
    escalation: {
        level: number;
        reason?: string;
        escalatedBy?: string;
        escalatedTo?: string;
        escalatedAt?: string;
    };
    performance: {
        responseTime?: number;
        resolutionTime?: number;
        qualityScore?: number;
        customerFeedback?: number;
    };
    createdAt: string;
    updatedAt: string;
}
interface HITLEScalation {
    id: string;
    organizationId: string;
    taskId: string;
    fromAgentId: string;
    toAgentId?: string;
    toRole?: string;
    level: number;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
    status: 'pending' | 'accepted' | 'rejected' | 'completed';
    sla: {
        responseTimeTarget: number;
        resolutionTimeTarget: number;
    };
    timestamps: {
        created: string;
        accepted?: string;
        completed?: string;
    };
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
interface HITLSLA {
    id: string;
    organizationId: string;
    taskType: string;
    priority: string;
    metrics: {
        responseTimeTarget: number;
        resolutionTimeTarget: number;
        escalationTime: number;
        qualityThreshold: number;
        customerSatisfactionTarget: number;
    };
    escalation: {
        levels: number;
        autoEscalate: boolean;
        escalationMatrix: {
            level: number;
            targetRole: string;
            responseTime: number;
        }[];
    };
    penalties: {
        missedResponse: number;
        missedResolution: number;
        poorQuality: number;
    };
    rewards: {
        earlyResponse: number;
        earlyResolution: number;
        excellentQuality: number;
    };
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface HITLReport {
    id: string;
    organizationId: string;
    reportType: 'agent_performance' | 'sla_compliance' | 'escalation_analysis' | 'shift_coverage' | 'vacation_impact';
    period: {
        startDate: string;
        endDate: string;
    };
    data: {
        agents: HITLAgent[];
        tasks: HITLTask[];
        escalations: HITLEScalation[];
        shifts: HITLShift[];
        vacations: HITLVacation[];
        metrics: {
            totalTasks: number;
            completedTasks: number;
            escalatedTasks: number;
            averageResponseTime: number;
            averageResolutionTime: number;
            slaCompliance: number;
            agentUtilization: number;
        };
    };
    generatedBy: string;
    createdAt: string;
}
declare class HITLOwnershipSLAService {
    private agents;
    private shifts;
    private vacations;
    private tasks;
    private escalations;
    private slas;
    constructor();
    init(): void;
    private createDemoData;
    createAgent(agentData: Omit<HITLAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLAgent>;
    getAgent(agentId: string): Promise<HITLAgent | undefined>;
    getAgents(organizationId: string, filters?: {
        role?: string;
        department?: string;
        status?: string;
        limit?: number;
    }): Promise<HITLAgent[]>;
    createShift(shiftData: Omit<HITLShift, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLShift>;
    getShifts(organizationId: string, filters?: {
        agentId?: string;
        date?: string;
        status?: string;
        shiftType?: string;
        limit?: number;
    }): Promise<HITLShift[]>;
    createVacation(vacationData: Omit<HITLVacation, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLVacation>;
    getVacations(organizationId: string, filters?: {
        agentId?: string;
        type?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<HITLVacation[]>;
    createTask(taskData: Omit<HITLTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLTask>;
    getTasks(organizationId: string, filters?: {
        assignedAgentId?: string;
        taskType?: string;
        priority?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<HITLTask[]>;
    createEscalation(escalationData: Omit<HITLEScalation, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLEScalation>;
    getEscalations(organizationId: string, filters?: {
        taskId?: string;
        fromAgentId?: string;
        toAgentId?: string;
        level?: number;
        status?: string;
        priority?: string;
        limit?: number;
    }): Promise<HITLEScalation[]>;
    createSLA(slaData: Omit<HITLSLA, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLSLA>;
    getSLAs(organizationId: string, filters?: {
        taskType?: string;
        priority?: string;
        enabled?: boolean;
        limit?: number;
    }): Promise<HITLSLA[]>;
    checkAndEscalateTasks(): Promise<void>;
    private escalateTask;
    generateReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<HITLReport>;
    private calculateAverageResponseTime;
    private calculateAverageResolutionTime;
    private calculateSLACompliance;
    private calculateAgentUtilization;
    getStats(organizationId: string): Promise<{
        totalAgents: number;
        activeAgents: number;
        totalTasks: number;
        totalEscalations: number;
        totalShifts: number;
        totalVacations: number;
        last24Hours: {
            tasks: number;
            escalations: number;
            averageResponseTime: number;
            slaCompliance: number;
        };
        last7Days: {
            tasks: number;
            escalations: number;
        };
        byStatus: {
            agents: Record<string, number>;
            tasks: Record<string, number>;
            escalations: Record<string, number>;
        };
        byPriority: Record<string, number>;
        byTaskType: Record<string, number>;
    }>;
}
export declare const hitlOwnershipSLAService: HITLOwnershipSLAService;
export {};
//# sourceMappingURL=hitl-ownership-sla.service.d.ts.map