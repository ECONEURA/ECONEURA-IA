import { EventEmitter } from 'events';
import { structuredLogger } from './structured-logger.js';
import { apiCache } from './advanced-cache.js';

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

export class HITLV2Service extends EventEmitter {
  private tasks: Map<string, HITLTask> = new Map();
  private batches: Map<string, HITLBatch> = new Map();
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor() {
    super();
    this.initializeDemoData();
    this.startSLAWatcher();
  }

  private initializeDemoData(): void {
    // Demo tasks
    const demoTasks: Omit<HITLTask, 'id' | 'createdAt' | 'updatedAt'>[] = [
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
      const hitlTask: HITLTask = {
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

  private startSLAWatcher(): void {
    // Check SLA compliance every hour
    setInterval(() => {
      this.checkSLACompliance();
    }, 60 * 60 * 1000);
  }

  private checkSLACompliance(): void {
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

  public async createTask(taskData: Omit<HITLTask, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'attachments' | 'workflow' | 'currentStep'>): Promise<HITLTask> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const task: HITLTask = {
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

  public async getTask(taskId: string): Promise<HITLTask | null> {
    return this.tasks.get(taskId) || null;
  }

  public async getTasks(organizationId: string, filters?: {
    status?: HITLTask['status'];
    type?: HITLTask['type'];
    priority?: HITLTask['priority'];
    assignedTo?: string;
    tags?: string[];
  }): Promise<HITLTask[]> {
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
        tasks = tasks.filter(task =>
          filters.tags!.some(tag => task.tags.includes(tag))
        );
      }
    }

    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateTask(taskId: string, updates: Partial<HITLTask>): Promise<HITLTask | null> {
    const task = this.tasks.get(taskId);

    if (!task) {
      return null;
    }

    const updatedTask = {
      ...task,
      ...updates,
      id: taskId, // Ensure ID doesn't change
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

  public async addComment(taskId: string, comment: Omit<HITLComment, 'id' | 'taskId' | 'createdAt'>): Promise<HITLComment | null> {
    const task = this.tasks.get(taskId);

    if (!task) {
      return null;
    }

    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newComment: HITLComment = {
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

  public async addAttachment(taskId: string, attachment: Omit<HITLAttachment, 'id' | 'taskId' | 'uploadedAt'>): Promise<HITLAttachment | null> {
    const task = this.tasks.get(taskId);

    if (!task) {
      return null;
    }

    const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAttachment: HITLAttachment = {
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

  public async advanceWorkflow(taskId: string, stepId: string, comments?: string): Promise<HITLTask | null> {
    const task = this.tasks.get(taskId);

    if (!task) {
      return null;
    }

    const step = task.workflow.find(s => s.id === stepId);
    if (!step) {
      return null;
    }

    // Complete current step
    step.status = 'completed';
    step.completedAt = new Date().toISOString();
    if (comments) {
      step.comments = comments;
    }

    // Move to next step
    task.currentStep++;

    // Check if workflow is complete
    if (task.currentStep >= task.workflow.length) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
    } else {
      // Activate next step
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

  public async createBatch(batchData: Omit<HITLBatch, 'id' | 'createdAt' | 'taskIds' | 'status'>): Promise<HITLBatch> {
    const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const batch: HITLBatch = {
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

  public async addTasksToBatch(batchId: string, taskIds: string[]): Promise<HITLBatch | null> {
    const batch = this.batches.get(batchId);

    if (!batch) {
      return null;
    }

    // Validate that all tasks exist and belong to the same organization
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

  public async getStats(organizationId: string): Promise<HITLStats> {
    const tasks = Array.from(this.tasks.values()).filter(task => task.organizationId === organizationId);

    const now = new Date();
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return false;
      const createdAt = new Date(task.createdAt);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursElapsed > task.slaHours;
    }).length;

    const completedTasks = tasks.filter(task => task.status === 'completed');
    const averageCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const createdAt = new Date(task.createdAt);
          const completedAt = new Date(task.completedAt!);
          return sum + (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        }, 0) / completedTasks.length
      : 0;

    const slaCompliance = tasks.length > 0
      ? ((tasks.length - overdueTasks) / tasks.length) * 100
      : 100;

    const tasksByType = tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByAssignee = tasks.reduce((acc, task) => {
      if (task.assignedTo) {
        acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

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

  public async getHealth(): Promise<{
    status: 'ok' | 'degraded' | 'error';
    totalTasks: number;
    overdueTasks: number;
    slaCompliance: number;
    activeBatches: number;
  }> {
    const allTasks = Array.from(this.tasks.values());
    const now = new Date();

    const overdueTasks = allTasks.filter(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return false;
      const createdAt = new Date(task.createdAt);
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      return hoursElapsed > task.slaHours;
    }).length;

    const slaCompliance = allTasks.length > 0
      ? ((allTasks.length - overdueTasks) / allTasks.length) * 100
      : 100;

    const activeBatches = Array.from(this.batches.values()).filter(b =>
      b.status === 'pending' || b.status === 'in_progress'
    ).length;

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
