import { structuredLogger } from './structured-logger.js';

// HITL Ownership & SLA Service - PR-71
// Sistema de gestión avanzada con turnos, vacaciones y escalado

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
      start: string; // HH:MM format
      end: string;   // HH:MM format
      days: number[]; // 0-6 (Sunday-Saturday)
    };
    maxConcurrentTasks: number;
    currentTasks: number;
  };
  performance: {
    averageResponseTime: number; // minutes
    taskCompletionRate: number; // percentage
    customerSatisfaction: number; // 1-10 scale
    lastPerformanceReview: string;
  };
  sla: {
    responseTimeTarget: number; // minutes
    resolutionTimeTarget: number; // hours
    escalationThreshold: number; // minutes
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
    responseTimeTarget: number; // minutes
    resolutionTimeTarget: number; // hours
    escalationTime: number; // minutes
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
    responseTime?: number; // minutes
    resolutionTime?: number; // hours
    qualityScore?: number; // 1-10
    customerFeedback?: number; // 1-10
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
    responseTimeTarget: number; // minutes
    resolutionTimeTarget: number; // hours
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
    responseTimeTarget: number; // minutes
    resolutionTimeTarget: number; // hours
    escalationTime: number; // minutes
    qualityThreshold: number; // 1-10
    customerSatisfactionTarget: number; // 1-10
  };
  escalation: {
    levels: number;
    autoEscalate: boolean;
    escalationMatrix: {
      level: number;
      targetRole: string;
      responseTime: number; // minutes
    }[];
  };
  penalties: {
    missedResponse: number; // penalty points
    missedResolution: number; // penalty points
    poorQuality: number; // penalty points
  };
  rewards: {
    earlyResponse: number; // bonus points
    earlyResolution: number; // bonus points
    excellentQuality: number; // bonus points
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

class HITLOwnershipSLAService {
  private agents: Map<string, HITLAgent> = new Map();
  private shifts: Map<string, HITLShift> = new Map();
  private vacations: Map<string, HITLVacation> = new Map();
  private tasks: Map<string, HITLTask> = new Map();
  private escalations: Map<string, HITLEScalation> = new Map();
  private slas: Map<string, HITLSLA> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('HITL Ownership & SLA Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Demo agents
    const agent1: HITLAgent = {
      id: 'agent_1',
      organizationId: 'demo-org-1',
      userId: 'user_1',
      name: 'Ana García',
      email: 'ana.garcia@demo.com',
      role: 'agent',
      department: 'Data Processing',
      skills: ['data_validation', 'content_review', 'quality_check'],
      languages: ['es', 'en'],
      status: 'active',
      availability: {
        timezone: 'Europe/Madrid',
        workingHours: {
          start: '09:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        maxConcurrentTasks: 5,
        currentTasks: 2
      },
      performance: {
        averageResponseTime: 15,
        taskCompletionRate: 95,
        customerSatisfaction: 8.5,
        lastPerformanceReview: oneWeekAgo.toISOString()
      },
      sla: {
        responseTimeTarget: 30,
        resolutionTimeTarget: 4,
        escalationThreshold: 60,
        autoEscalation: true
      },
      createdAt: oneWeekAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    const agent2: HITLAgent = {
      id: 'agent_2',
      organizationId: 'demo-org-1',
      userId: 'user_2',
      name: 'Carlos López',
      email: 'carlos.lopez@demo.com',
      role: 'supervisor',
      department: 'Data Processing',
      skills: ['data_validation', 'content_review', 'quality_check', 'escalation'],
      languages: ['es', 'en', 'fr'],
      status: 'active',
      availability: {
        timezone: 'Europe/Madrid',
        workingHours: {
          start: '08:00',
          end: '18:00',
          days: [1, 2, 3, 4, 5, 6] // Monday to Saturday
        },
        maxConcurrentTasks: 8,
        currentTasks: 3
      },
      performance: {
        averageResponseTime: 12,
        taskCompletionRate: 98,
        customerSatisfaction: 9.2,
        lastPerformanceReview: oneWeekAgo.toISOString()
      },
      sla: {
        responseTimeTarget: 20,
        resolutionTimeTarget: 2,
        escalationThreshold: 45,
        autoEscalation: true
      },
      createdAt: oneWeekAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.agents.set(agent1.id, agent1);
    this.agents.set(agent2.id, agent2);

    // Demo shifts
    const shift1: HITLShift = {
      id: 'shift_1',
      organizationId: 'demo-org-1',
      agentId: 'agent_1',
      shiftType: 'morning',
      startTime: '09:00',
      endTime: '17:00',
      date: now.toISOString().split('T')[0],
      status: 'active',
      coverage: {
        department: 'Data Processing',
        skills: ['data_validation', 'content_review'],
        languages: ['es', 'en'],
        maxTasks: 5
      },
      notes: 'Regular morning shift',
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.shifts.set(shift1.id, shift1);

    // Demo vacation
    const vacation1: HITLVacation = {
      id: 'vacation_1',
      organizationId: 'demo-org-1',
      agentId: 'agent_1',
      type: 'vacation',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'approved',
      reason: 'Annual vacation',
      approvedBy: 'manager_1',
      approvedAt: oneDayAgo.toISOString(),
      coverage: {
        assignedAgentId: 'agent_2',
        backupAgentIds: ['agent_3'],
        notes: 'Carlos will cover Ana\'s tasks during vacation'
      },
      createdAt: oneWeekAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.vacations.set(vacation1.id, vacation1);

    // Demo tasks
    const task1: HITLTask = {
      id: 'task_1',
      organizationId: 'demo-org-1',
      assignedAgentId: 'agent_1',
      customerId: 'customer_1',
      taskType: 'data_validation',
      priority: 'high',
      status: 'in_progress',
      title: 'Validate customer data',
      description: 'Review and validate customer information for accuracy',
      data: {
        customerName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890'
      },
      sla: {
        responseTimeTarget: 30,
        resolutionTimeTarget: 4,
        escalationTime: 60,
        autoEscalate: true
      },
      timestamps: {
        created: oneDayAgo.toISOString(),
        assigned: oneDayAgo.toISOString(),
        started: new Date(oneDayAgo.getTime() + 10 * 60 * 1000).toISOString()
      },
      escalation: {
        level: 0
      },
      performance: {
        responseTime: 10,
        qualityScore: 9
      },
      createdAt: oneDayAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.tasks.set(task1.id, task1);

    // Demo SLA
    const sla1: HITLSLA = {
      id: 'sla_1',
      organizationId: 'demo-org-1',
      taskType: 'data_validation',
      priority: 'high',
      metrics: {
        responseTimeTarget: 30,
        resolutionTimeTarget: 4,
        escalationTime: 60,
        qualityThreshold: 8,
        customerSatisfactionTarget: 8
      },
      escalation: {
        levels: 3,
        autoEscalate: true,
        escalationMatrix: [
          { level: 1, targetRole: 'supervisor', responseTime: 15 },
          { level: 2, targetRole: 'manager', responseTime: 10 },
          { level: 3, targetRole: 'admin', responseTime: 5 }
        ]
      },
      penalties: {
        missedResponse: 10,
        missedResolution: 20,
        poorQuality: 15
      },
      rewards: {
        earlyResponse: 5,
        earlyResolution: 10,
        excellentQuality: 8
      },
      enabled: true,
      createdAt: oneWeekAgo.toISOString(),
      updatedAt: oneDayAgo.toISOString()
    };

    this.slas.set(sla1.id, sla1);
  }

  // Agent Management
  async createAgent(agentData: Omit<HITLAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLAgent> {
    const now = new Date().toISOString();
    const newAgent: HITLAgent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...agentData,
      createdAt: now,
      updatedAt: now
    };

    this.agents.set(newAgent.id, newAgent);

    structuredLogger.info('HITL agent created', {
      agentId: newAgent.id,
      organizationId: newAgent.organizationId,
      name: newAgent.name,
      role: newAgent.role
    });

    return newAgent;
  }

  async getAgent(agentId: string): Promise<HITLAgent | undefined> {
    return this.agents.get(agentId);
  }

  async getAgents(organizationId: string, filters: {
    role?: string;
    department?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<HITLAgent[]> {
    let agents = Array.from(this.agents.values())
      .filter(a => a.organizationId === organizationId);

    if (filters.role) {
      agents = agents.filter(a => a.role === filters.role);
    }

    if (filters.department) {
      agents = agents.filter(a => a.department === filters.department);
    }

    if (filters.status) {
      agents = agents.filter(a => a.status === filters.status);
    }

    if (filters.limit) {
      agents = agents.slice(0, filters.limit);
    }

    return agents.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Shift Management
  async createShift(shiftData: Omit<HITLShift, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLShift> {
    const now = new Date().toISOString();
    const newShift: HITLShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...shiftData,
      createdAt: now,
      updatedAt: now
    };

    this.shifts.set(newShift.id, newShift);

    structuredLogger.info('HITL shift created', {
      shiftId: newShift.id,
      organizationId: newShift.organizationId,
      agentId: newShift.agentId,
      shiftType: newShift.shiftType,
      date: newShift.date
    });

    return newShift;
  }

  async getShifts(organizationId: string, filters: {
    agentId?: string;
    date?: string;
    status?: string;
    shiftType?: string;
    limit?: number;
  } = {}): Promise<HITLShift[]> {
    let shifts = Array.from(this.shifts.values())
      .filter(s => s.organizationId === organizationId);

    if (filters.agentId) {
      shifts = shifts.filter(s => s.agentId === filters.agentId);
    }

    if (filters.date) {
      shifts = shifts.filter(s => s.date === filters.date);
    }

    if (filters.status) {
      shifts = shifts.filter(s => s.status === filters.status);
    }

    if (filters.shiftType) {
      shifts = shifts.filter(s => s.shiftType === filters.shiftType);
    }

    if (filters.limit) {
      shifts = shifts.slice(0, filters.limit);
    }

    return shifts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Vacation Management
  async createVacation(vacationData: Omit<HITLVacation, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLVacation> {
    const now = new Date().toISOString();
    const newVacation: HITLVacation = {
      id: `vacation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...vacationData,
      createdAt: now,
      updatedAt: now
    };

    this.vacations.set(newVacation.id, newVacation);

    structuredLogger.info('HITL vacation created', {
      vacationId: newVacation.id,
      organizationId: newVacation.organizationId,
      agentId: newVacation.agentId,
      type: newVacation.type,
      status: newVacation.status
    });

    return newVacation;
  }

  async getVacations(organizationId: string, filters: {
    agentId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<HITLVacation[]> {
    let vacations = Array.from(this.vacations.values())
      .filter(v => v.organizationId === organizationId);

    if (filters.agentId) {
      vacations = vacations.filter(v => v.agentId === filters.agentId);
    }

    if (filters.type) {
      vacations = vacations.filter(v => v.type === filters.type);
    }

    if (filters.status) {
      vacations = vacations.filter(v => v.status === filters.status);
    }

    if (filters.startDate) {
      vacations = vacations.filter(v => v.startDate >= filters.startDate!);
    }

    if (filters.endDate) {
      vacations = vacations.filter(v => v.endDate <= filters.endDate!);
    }

    if (filters.limit) {
      vacations = vacations.slice(0, filters.limit);
    }

    return vacations.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  // Task Management
  async createTask(taskData: Omit<HITLTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLTask> {
    const now = new Date().toISOString();
    const newTask: HITLTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...taskData,
      timestamps: {
        created: now,
        ...taskData.timestamps
      },
      escalation: {
        level: 0,
        ...taskData.escalation
      },
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(newTask.id, newTask);

    structuredLogger.info('HITL task created', {
      taskId: newTask.id,
      organizationId: newTask.organizationId,
      taskType: newTask.taskType,
      priority: newTask.priority
    });

    return newTask;
  }

  async getTasks(organizationId: string, filters: {
    assignedAgentId?: string;
    taskType?: string;
    priority?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<HITLTask[]> {
    let tasks = Array.from(this.tasks.values())
      .filter(t => t.organizationId === organizationId);

    if (filters.assignedAgentId) {
      tasks = tasks.filter(t => t.assignedAgentId === filters.assignedAgentId);
    }

    if (filters.taskType) {
      tasks = tasks.filter(t => t.taskType === filters.taskType);
    }

    if (filters.priority) {
      tasks = tasks.filter(t => t.priority === filters.priority);
    }

    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }

    if (filters.startDate) {
      tasks = tasks.filter(t => t.timestamps.created >= filters.startDate!);
    }

    if (filters.endDate) {
      tasks = tasks.filter(t => t.timestamps.created <= filters.endDate!);
    }

    if (filters.limit) {
      tasks = tasks.slice(0, filters.limit);
    }

    return tasks.sort((a, b) => new Date(b.timestamps.created).getTime() - new Date(a.timestamps.created).getTime());
  }

  // Escalation Management
  async createEscalation(escalationData: Omit<HITLEScalation, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLEScalation> {
    const now = new Date().toISOString();
    const newEscalation: HITLEScalation = {
      id: `escalation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...escalationData,
      timestamps: {
        created: now,
        ...escalationData.timestamps
      },
      createdAt: now,
      updatedAt: now
    };

    this.escalations.set(newEscalation.id, newEscalation);

    structuredLogger.info('HITL escalation created', {
      escalationId: newEscalation.id,
      organizationId: newEscalation.organizationId,
      taskId: newEscalation.taskId,
      level: newEscalation.level,
      priority: newEscalation.priority
    });

    return newEscalation;
  }

  async getEscalations(organizationId: string, filters: {
    taskId?: string;
    fromAgentId?: string;
    toAgentId?: string;
    level?: number;
    status?: string;
    priority?: string;
    limit?: number;
  } = {}): Promise<HITLEScalation[]> {
    let escalations = Array.from(this.escalations.values())
      .filter(e => e.organizationId === organizationId);

    if (filters.taskId) {
      escalations = escalations.filter(e => e.taskId === filters.taskId);
    }

    if (filters.fromAgentId) {
      escalations = escalations.filter(e => e.fromAgentId === filters.fromAgentId);
    }

    if (filters.toAgentId) {
      escalations = escalations.filter(e => e.toAgentId === filters.toAgentId);
    }

    if (filters.level !== undefined) {
      escalations = escalations.filter(e => e.level === filters.level);
    }

    if (filters.status) {
      escalations = escalations.filter(e => e.status === filters.status);
    }

    if (filters.priority) {
      escalations = escalations.filter(e => e.priority === filters.priority);
    }

    if (filters.limit) {
      escalations = escalations.slice(0, filters.limit);
    }

    return escalations.sort((a, b) => new Date(b.timestamps.created).getTime() - new Date(a.timestamps.created).getTime());
  }

  // SLA Management
  async createSLA(slaData: Omit<HITLSLA, 'id' | 'createdAt' | 'updatedAt'>): Promise<HITLSLA> {
    const now = new Date().toISOString();
    const newSLA: HITLSLA = {
      id: `sla_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...slaData,
      createdAt: now,
      updatedAt: now
    };

    this.slas.set(newSLA.id, newSLA);

    structuredLogger.info('HITL SLA created', {
      slaId: newSLA.id,
      organizationId: newSLA.organizationId,
      taskType: newSLA.taskType,
      priority: newSLA.priority
    });

    return newSLA;
  }

  async getSLAs(organizationId: string, filters: {
    taskType?: string;
    priority?: string;
    enabled?: boolean;
    limit?: number;
  } = {}): Promise<HITLSLA[]> {
    let slas = Array.from(this.slas.values())
      .filter(s => s.organizationId === organizationId);

    if (filters.taskType) {
      slas = slas.filter(s => s.taskType === filters.taskType);
    }

    if (filters.priority) {
      slas = slas.filter(s => s.priority === filters.priority);
    }

    if (filters.enabled !== undefined) {
      slas = slas.filter(s => s.enabled === filters.enabled);
    }

    if (filters.limit) {
      slas = slas.slice(0, filters.limit);
    }

    return slas.sort((a, b) => a.taskType.localeCompare(b.taskType));
  }

  // Auto-escalation
  async checkAndEscalateTasks(): Promise<void> {
    const now = new Date();
    const tasks = Array.from(this.tasks.values())
      .filter(t => t.status === 'in_progress' || t.status === 'assigned');

    for (const task of tasks) {
      const sla = Array.from(this.slas.values())
        .find(s => s.taskType === task.taskType && s.priority === task.priority);

      if (!sla || !sla.enabled) continue;

      const timeSinceCreated = (now.getTime() - new Date(task.timestamps.created).getTime()) / (1000 * 60);
      const timeSinceAssigned = task.timestamps.assigned ?
        (now.getTime() - new Date(task.timestamps.assigned).getTime()) / (1000 * 60) : 0;

      // Check response time SLA
      if (timeSinceAssigned > sla.metrics.responseTimeTarget && !task.timestamps.started) {
        await this.escalateTask(task, 'Response time SLA exceeded');
      }

      // Check resolution time SLA
      if (timeSinceCreated > (sla.metrics.resolutionTimeTarget * 60)) {
        await this.escalateTask(task, 'Resolution time SLA exceeded');
      }
    }
  }

  private async escalateTask(task: HITLTask, reason: string): Promise<void> {
    const sla = Array.from(this.slas.values())
      .find(s => s.taskType === task.taskType && s.priority === task.priority);

    if (!sla || !sla.enabled) return;

    const currentLevel = task.escalation.level;
    const nextLevel = currentLevel + 1;

    if (nextLevel > sla.escalation.levels) {
      // Max escalation reached
      task.status = 'escalated';
      task.timestamps.escalated = new Date().toISOString();
      task.escalation.reason = reason;
      task.escalation.escalatedAt = new Date().toISOString();
    } else {
      // Find next escalation target
      const escalationTarget = sla.escalation.escalationMatrix.find(e => e.level === nextLevel);
      if (escalationTarget) {
        // Find available agent with target role
        const availableAgents = Array.from(this.agents.values())
          .filter(a => a.role === escalationTarget.targetRole &&
                      a.status === 'active' &&
                      a.availability.currentTasks < a.availability.maxConcurrentTasks);

        if (availableAgents.length > 0) {
          const targetAgent = availableAgents[0];

          // Create escalation
          await this.createEscalation({
            organizationId: task.organizationId,
            taskId: task.id,
            fromAgentId: task.assignedAgentId || 'system',
            toAgentId: targetAgent.id,
            level: nextLevel,
            reason,
            priority: task.priority,
            status: 'pending',
            sla: {
              responseTimeTarget: escalationTarget.responseTime,
              resolutionTimeTarget: sla.metrics.resolutionTimeTarget
            }
          });

          // Update task
          task.escalation.level = nextLevel;
          task.escalation.reason = reason;
          task.escalation.escalatedBy = task.assignedAgentId || 'system';
          task.escalation.escalatedTo = targetAgent.id;
          task.escalation.escalatedAt = new Date().toISOString();
        }
      }
    }

    this.tasks.set(task.id, task);

    structuredLogger.info('HITL task escalated', {
      taskId: task.id,
      organizationId: task.organizationId,
      level: task.escalation.level,
      reason
    });
  }

  // Reports
  async generateReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<HITLReport> {
    const agents = Array.from(this.agents.values()).filter(a => a.organizationId === organizationId);
    const tasks = Array.from(this.tasks.values())
      .filter(t => t.organizationId === organizationId &&
                  t.timestamps.created >= startDate &&
                  t.timestamps.created <= endDate);
    const escalations = Array.from(this.escalations.values())
      .filter(e => e.organizationId === organizationId &&
                  e.timestamps.created >= startDate &&
                  e.timestamps.created <= endDate);
    const shifts = Array.from(this.shifts.values())
      .filter(s => s.organizationId === organizationId &&
                  s.date >= startDate &&
                  s.date <= endDate);
    const vacations = Array.from(this.vacations.values())
      .filter(v => v.organizationId === organizationId &&
                  v.startDate >= startDate &&
                  v.endDate <= endDate);

    const metrics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      escalatedTasks: tasks.filter(t => t.status === 'escalated').length,
      averageResponseTime: this.calculateAverageResponseTime(tasks),
      averageResolutionTime: this.calculateAverageResolutionTime(tasks),
      slaCompliance: this.calculateSLACompliance(tasks),
      agentUtilization: this.calculateAgentUtilization(agents, tasks)
    };

    const report: HITLReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
      period: { startDate, endDate },
      data: {
        agents,
        tasks,
        escalations,
        shifts,
        vacations,
        metrics
      },
      generatedBy,
      createdAt: new Date().toISOString()
    };

    structuredLogger.info('HITL report generated', {
      reportId: report.id,
      organizationId,
      reportType,
      period: `${startDate} to ${endDate}`
    });

    return report;
  }

  private calculateAverageResponseTime(tasks: HITLTask[]): number {
    const tasksWithResponseTime = tasks.filter(t => t.performance.responseTime);
    if (tasksWithResponseTime.length === 0) return 0;

    const total = tasksWithResponseTime.reduce((sum, t) => sum + (t.performance.responseTime || 0), 0);
    return total / tasksWithResponseTime.length;
  }

  private calculateAverageResolutionTime(tasks: HITLTask[]): number {
    const tasksWithResolutionTime = tasks.filter(t => t.performance.resolutionTime);
    if (tasksWithResolutionTime.length === 0) return 0;

    const total = tasksWithResolutionTime.reduce((sum, t) => sum + (t.performance.resolutionTime || 0), 0);
    return total / tasksWithResolutionTime.length;
  }

  private calculateSLACompliance(tasks: HITLTask[]): number {
    if (tasks.length === 0) return 0;

    const compliantTasks = tasks.filter(t => {
      const sla = Array.from(this.slas.values())
        .find(s => s.taskType === t.taskType && s.priority === t.priority);

      if (!sla) return false;

      const responseTime = t.performance.responseTime || 0;
      const resolutionTime = t.performance.resolutionTime || 0;

      return responseTime <= sla.metrics.responseTimeTarget && ;
             resolutionTime <= sla.metrics.resolutionTimeTarget;
    });

    return (compliantTasks.length / tasks.length) * 100;
  }

  private calculateAgentUtilization(agents: HITLAgent[], tasks: HITLTask[]): number {
    if (agents.length === 0) return 0;

    const totalCapacity = agents.reduce((sum, a) => sum + a.availability.maxConcurrentTasks, 0);
    const totalCurrentTasks = agents.reduce((sum, a) => sum + a.availability.currentTasks, 0);

    return (totalCurrentTasks / totalCapacity) * 100;
  }

  // Statistics
  async getStats(organizationId: string) {
    const agents = Array.from(this.agents.values()).filter(a => a.organizationId === organizationId);
    const tasks = Array.from(this.tasks.values()).filter(t => t.organizationId === organizationId);
    const escalations = Array.from(this.escalations.values()).filter(e => e.organizationId === organizationId);
    const shifts = Array.from(this.shifts.values()).filter(s => s.organizationId === organizationId);
    const vacations = Array.from(this.vacations.values()).filter(v => v.organizationId === organizationId);

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(t => new Date(t.timestamps.created) >= last24Hours);
    const recentEscalations = escalations.filter(e => new Date(e.timestamps.created) >= last24Hours);

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalTasks: tasks.length,
      totalEscalations: escalations.length,
      totalShifts: shifts.length,
      totalVacations: vacations.length,
      last24Hours: {
        tasks: recentTasks.length,
        escalations: recentEscalations.length,
        averageResponseTime: this.calculateAverageResponseTime(recentTasks),
        slaCompliance: this.calculateSLACompliance(recentTasks)
      },
      last7Days: {
        tasks: tasks.filter(t => new Date(t.timestamps.created) >= last7Days).length,
        escalations: escalations.filter(e => new Date(e.timestamps.created) >= last7Days).length
      },
      byStatus: {
        agents: agents.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        tasks: tasks.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        escalations: escalations.reduce((acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      byPriority: tasks.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTaskType: tasks.reduce((acc, t) => {
        acc[t.taskType] = (acc[t.taskType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const hitlOwnershipSLAService = new HITLOwnershipSLAService();
