import { EventEmitter } from 'events';
export interface HITLTask {
    id: string;
    organizationId: string;
    type: 'email' | 'document' | 'approval' | 'review' | 'translation';
    status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    title: string;
    description: string;
    content: string;
    originalContent?: string;
    metadata: Record<string, any>;
    assignedTo?: string;
    assignedBy: string;
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    completedAt?: string;
    slaHours: number;
    tags: string[];
    comments: HITLComment[];
    attachments: HITLAttachment[];
    workflow: HITLWorkflowStep[];
    currentStep: number;
}
export interface HITLComment {
    id: string;
    taskId: string;
    userId: string;
    userName: string;
    content: string;
    type: 'comment' | 'approval' | 'rejection' | 'suggestion' | 'question';
    createdAt: string;
    isResolved: boolean;
    parentCommentId?: string;
}
export interface HITLAttachment {
    id: string;
    taskId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    isProcessed: boolean;
}
export interface HITLWorkflowStep {
    id: string;
    name: string;
    type: 'approval' | 'review' | 'edit' | 'translation' | 'quality_check';
    assignedTo?: string;
    assignedBy: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    dueDate?: string;
    completedAt?: string;
    comments: string;
    order: number;
}
export interface HITLStats {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
    averageCompletionTime: number;
    slaCompliance: number;
    tasksByType: Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByAssignee: Record<string, number>;
}
export interface HITLBatch {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    taskIds: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    createdAt: string;
    completedAt?: string;
    createdBy: string;
    slaHours: number;
}
export declare class HITLV2Service extends EventEmitter {
    private tasks;
    private batches;
    private readonly CACHE_TTL;
    constructor();
    private initializeDemoData;
    private startSLAWatcher;
    private checkSLACompliance;
    createTask(taskData: Omit<HITLTask, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'workflow' | 'currentStep'>): Promise<HITLTask>;
    getTask(taskId: string): Promise<HITLTask | null>;
    getTasks(organizationId: string, filters?: {
        status?: HITLTask['status'];
        type?: HITLTask['type'];
        priority?: HITLTask['priority'];
        assignedTo?: string;
        tags?: string[];
    }): Promise<HITLTask[]>;
    updateTask(taskId: string, updates: Partial<HITLTask>): Promise<HITLTask | null>;
    addComment(taskId: string, comment: Omit<HITLComment, 'id' | 'taskId' | 'createdAt'>): Promise<HITLComment | null>;
    addAttachment(taskId: string, attachment: Omit<HITLAttachment, 'id' | 'taskId' | 'uploadedAt'>): Promise<HITLAttachment | null>;
    advanceWorkflow(taskId: string, stepId: string, comments?: string): Promise<HITLTask | null>;
    createBatch(batchData: Omit<HITLBatch, 'id' | 'createdAt' | 'taskIds' | 'status'>): Promise<HITLBatch>;
    addTasksToBatch(batchId: string, taskIds: string[]): Promise<HITLBatch | null>;
    getStats(organizationId: string): Promise<HITLStats>;
    getHealth(): Promise<{
        status: 'ok' | 'degraded' | 'error';
        totalTasks: number;
        overdueTasks: number;
        slaCompliance: number;
        activeBatches: number;
    }>;
}
export declare const hitlV2Service: HITLV2Service;
//# sourceMappingURL=hitl-v2.service.d.ts.map