import { EventEmitter } from 'events';

import { structuredLogger } from './structured-logger.js';
export class HITLV2Service extends EventEmitter {
    tasks = new Map();
    batches = new Map();
    CACHE_TTL = 300;
    constructor() {
        super();
        this.initializeDemoData();
        this.startSLAWatcher();
    }
    initializeDemoData() {
        const demoTasks = [
            {
                organizationId: 'demo-org-1',
                type: 'email',
                status: 'pending',
                priority: 'high',
                title: 'Aprobar email de marketing Q4',
                description: 'Revisar y aprobar el email de marketing para el Q4',
                content: 'Estimados clientes,<br><br>Nos complace anunciar nuestras nuevas ofertas para el Q4...',
                metadata: {
                    campaign: 'Q4-2024',
                    targetAudience: 'existing_customers',
                    language: 'es'
                },
                assignedTo: 'user_2',
                assignedBy: 'user_1',
                slaHours: 24,
                tags: ['marketing', 'email', 'q4'],
                comments: [],
                attachments: [],
                workflow: [
                    {
                        id: 'step_1',
                        name: 'Revisión de contenido',
                        type: 'review',
                        assignedTo: 'user_2',
                        assignedBy: 'user_1',
                        status: 'pending',
                        order: 1,
                        comments: ''
                    },
                    {
                        id: 'step_2',
                        name: 'Aprobación final',
                        type: 'approval',
                        assignedTo: 'user_1',
                        assignedBy: 'user_1',
                        status: 'pending',
                        order: 2,
                        comments: ''
                    }
                ],
                currentStep: 0
            },
            {
                organizationId: 'demo-org-1',
                type: 'document',
                status: 'in_progress',
                priority: 'normal',
                title: 'Traducir propuesta al inglés',
                description: 'Traducir la propuesta comercial al inglés para cliente internacional',
                content: 'Business Proposal for International Expansion...',
                originalContent: 'Propuesta comercial para expansión internacional...',
                metadata: {
                    sourceLanguage: 'es',
                    targetLanguage: 'en',
                    documentType: 'proposal',
                    clientId: 'client_123'
                },
                assignedTo: 'user_3',
                assignedBy: 'user_1',
                slaHours: 48,
                tags: ['translation', 'proposal', 'international'],
                comments: [
                    {
                        id: 'comment_1',
                        taskId: 'task_2',
                        userId: 'user_3',
                        userName: 'Carlos López',
                        content: 'He comenzado la traducción. ¿Hay algún término específico que prefieras usar?',
                        type: 'question',
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        isResolved: false
                    }
                ],
                attachments: [
                    {
                        id: 'att_1',
                        taskId: 'task_2',
                        fileName: 'propuesta_original.pdf',
                        fileSize: 1024000,
                        mimeType: 'application/pdf',
                        url: '/attachments/propuesta_original.pdf',
                        uploadedBy: 'user_1',
                        uploadedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                        isProcessed: true
                    }
                ],
                workflow: [
                    {
                        id: 'step_1',
                        name: 'Traducción inicial',
                        type: 'translation',
                        assignedTo: 'user_3',
                        assignedBy: 'user_1',
                        status: 'in_progress',
                        order: 1,
                        comments: ''
                    },
                    {
                        id: 'step_2',
                        name: 'Revisión de calidad',
                        type: 'quality_check',
                        assignedTo: 'user_2',
                        assignedBy: 'user_1',
                        status: 'pending',
                        order: 2,
                        comments: ''
                    }
                ],
                currentStep: 0
            }
        ];
        demoTasks.forEach((task, index) => {
            const id = `task_${index + 1}`;
            const now = new Date().toISOString();
            const hitlTask = {
                ...task,
                id,
                createdAt: now,
                updatedAt: now
            };
            this.tasks.set(id, hitlTask);
        });
        structuredLogger.info('HITL V2 Service initialized with demo data', {
            tasksCount: this.tasks.size,
            requestId: ''
        });
    }
    startSLAWatcher() {
        setInterval(() => {
            this.checkSLACompliance();
        }, 60 * 60 * 1000);
    }
    checkSLACompliance() {
        const now = new Date();
        let overdueCount = 0;
        for (const task of this.tasks.values()) {
            if (task.status === 'pending' || task.status === 'in_progress') {
                const createdAt = new Date(task.createdAt);
                const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                if (hoursElapsed > task.slaHours) {
                    overdueCount++;
                    this.emit('slaOverdue', task);
                    structuredLogger.warn('HITL task SLA overdue', {
                        taskId: task.id,
                        title: task.title,
                        slaHours: task.slaHours,
                        hoursElapsed: Math.round(hoursElapsed),
                        requestId: ''
                    });
                }
            }
        }
        if (overdueCount > 0) {
            structuredLogger.warn('HITL SLA compliance check', {
                overdueTasks: overdueCount,
                totalTasks: this.tasks.size,
                requestId: ''
            });
        }
    }
    async createTask(taskData) {
        const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const task = {
            ...taskData,
            id,
            createdAt: now,
            updatedAt: now,
            comments: [],
            attachments: [],
            workflow: [],
            currentStep: 0
        };
        this.tasks.set(id, task);
        structuredLogger.info('HITL task created', {
            taskId: id,
            type: task.type,
            priority: task.priority,
            assignedTo: task.assignedTo,
            requestId: ''
        });
        this.emit('taskCreated', task);
        return task;
    }
    async getTask(taskId) {
        return this.tasks.get(taskId) || null;
    }
    async getTasks(organizationId, filters) {
        let tasks = Array.from(this.tasks.values()).filter(task => task.organizationId === organizationId);
        if (filters) {
            if (filters.status) {
                tasks = tasks.filter(task => task.status === filters.status);
            }
            if (filters.type) {
                tasks = tasks.filter(task => task.type === filters.type);
            }
            if (filters.priority) {
                tasks = tasks.filter(task => task.priority === filters.priority);
            }
            if (filters.assignedTo) {
                tasks = tasks.filter(task => task.assignedTo === filters.assignedTo);
            }
            if (filters.tags && filters.tags.length > 0) {
                tasks = tasks.filter(task => filters.tags.some(tag => task.tags.includes(tag)));
            }
        }
        return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async updateTask(taskId, updates) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return null;
        }
        const updatedTask = {
            ...task,
            ...updates,
            id: taskId,
            updatedAt: new Date().toISOString()
        };
        this.tasks.set(taskId, updatedTask);
        structuredLogger.info('HITL task updated', {
            taskId,
            updates: Object.keys(updates),
            requestId: ''
        });
        this.emit('taskUpdated', updatedTask);
        return updatedTask;
    }
    async addComment(taskId, comment) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return null;
        }
        const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newComment = {
            ...comment,
            id,
            taskId,
            createdAt: new Date().toISOString()
        };
        task.comments.push(newComment);
        task.updatedAt = new Date().toISOString();
        structuredLogger.info('HITL comment added', {
            taskId,
            commentId: id,
            type: comment.type,
            requestId: ''
        });
        this.emit('commentAdded', { task, comment: newComment });
        return newComment;
    }
    async addAttachment(taskId, attachment) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return null;
        }
        const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newAttachment = {
            ...attachment,
            id,
            taskId,
            uploadedAt: new Date().toISOString()
        };
        task.attachments.push(newAttachment);
        task.updatedAt = new Date().toISOString();
        structuredLogger.info('HITL attachment added', {
            taskId,
            attachmentId: id,
            fileName: attachment.fileName,
            requestId: ''
        });
        this.emit('attachmentAdded', { task, attachment: newAttachment });
        return newAttachment;
    }
    async advanceWorkflow(taskId, stepId, comments) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return null;
        }
        const step = task.workflow.find(s => s.id === stepId);
        if (!step) {
            return null;
        }
        step.status = 'completed';
        step.completedAt = new Date().toISOString();
        if (comments) {
            step.comments = comments;
        }
        task.currentStep++;
        if (task.currentStep >= task.workflow.length) {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
        }
        else {
            const nextStep = task.workflow[task.currentStep];
            nextStep.status = 'in_progress';
        }
        task.updatedAt = new Date().toISOString();
        structuredLogger.info('HITL workflow advanced', {
            taskId,
            stepId,
            currentStep: task.currentStep,
            status: task.status,
            requestId: ''
        });
        this.emit('workflowAdvanced', task);
        return task;
    }
    async createBatch(batchData) {
        const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const batch = {
            ...batchData,
            id,
            createdAt: now,
            taskIds: [],
            status: 'pending'
        };
        this.batches.set(id, batch);
        structuredLogger.info('HITL batch created', {
            batchId: id,
            name: batch.name,
            createdBy: batch.createdBy,
            requestId: ''
        });
        this.emit('batchCreated', batch);
        return batch;
    }
    async addTasksToBatch(batchId, taskIds) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            return null;
        }
        const validTaskIds = taskIds.filter(taskId => {
            const task = this.tasks.get(taskId);
            return task && task.organizationId === batch.organizationId;
        });
        batch.taskIds.push(...validTaskIds);
        batch.status = 'in_progress';
        structuredLogger.info('Tasks added to HITL batch', {
            batchId,
            addedTasks: validTaskIds.length,
            totalTasks: batch.taskIds.length,
            requestId: ''
        });
        this.emit('tasksAddedToBatch', { batch, taskIds: validTaskIds });
        return batch;
    }
    async getStats(organizationId) {
        const tasks = Array.from(this.tasks.values()).filter(task => task.organizationId === organizationId);
        const now = new Date();
        const overdueTasks = tasks.filter(task => {
            if (task.status === 'completed' || task.status === 'cancelled')
                return false;
            const createdAt = new Date(task.createdAt);
            const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            return hoursElapsed > task.slaHours;
        }).length;
        const completedTasks = tasks.filter(task => task.status === 'completed');
        const averageCompletionTime = completedTasks.length > 0
            ? completedTasks.reduce((sum, task) => {
                const createdAt = new Date(task.createdAt);
                const completedAt = new Date(task.completedAt);
                return sum + (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            }, 0) / completedTasks.length
            : 0;
        const slaCompliance = tasks.length > 0
            ? ((tasks.length - overdueTasks) / tasks.length) * 100
            : 100;
        const tasksByType = tasks.reduce((acc, task) => {
            acc[task.type] = (acc[task.type] || 0) + 1;
            return acc;
        }, {});
        const tasksByPriority = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});
        const tasksByAssignee = tasks.reduce((acc, task) => {
            if (task.assignedTo) {
                acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
            }
            return acc;
        }, {});
        return {
            totalTasks: tasks.length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            overdueTasks,
            averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
            slaCompliance: Math.round(slaCompliance * 100) / 100,
            tasksByType,
            tasksByPriority,
            tasksByAssignee
        };
    }
    async getHealth() {
        const allTasks = Array.from(this.tasks.values());
        const now = new Date();
        const overdueTasks = allTasks.filter(task => {
            if (task.status === 'completed' || task.status === 'cancelled')
                return false;
            const createdAt = new Date(task.createdAt);
            const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            return hoursElapsed > task.slaHours;
        }).length;
        const slaCompliance = allTasks.length > 0
            ? ((allTasks.length - overdueTasks) / allTasks.length) * 100
            : 100;
        const activeBatches = Array.from(this.batches.values()).filter(b => b.status === 'pending' || b.status === 'in_progress').length;
        return {
            status: slaCompliance > 80 ? 'ok' : slaCompliance > 60 ? 'degraded' : 'error',
            totalTasks: allTasks.length,
            overdueTasks,
            slaCompliance: Math.round(slaCompliance * 100) / 100,
            activeBatches
        };
    }
}
export const hitlV2Service = new HITLV2Service();
//# sourceMappingURL=hitl-v2.service.js.map