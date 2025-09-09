import { Router } from 'express';
import { z } from 'zod';
import { hitlOwnershipSLAService } from '../lib/hitl-ownership-sla.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const hitlOwnershipSLARouter = Router();

// Validation schemas
const GetAgentsSchema = z.object({
  organizationId: z.string().min(1),
  role: z.enum(['agent', 'supervisor', 'manager', 'admin']).optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave', 'training']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateAgentSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['agent', 'supervisor', 'manager', 'admin']),
  department: z.string().min(1),
  skills: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  status: z.enum(['active', 'inactive', 'on_leave', 'training']).default('active'),
  availability: z.object({
    timezone: z.string().min(1),
    workingHours: z.object({
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      days: z.array(z.coerce.number().int().min(0).max(6)).min(1),
    }),
    maxConcurrentTasks: z.coerce.number().int().positive(),
    currentTasks: z.coerce.number().int().min(0).default(0),
  }),
  performance: z.object({
    averageResponseTime: z.coerce.number().positive(),
    taskCompletionRate: z.coerce.number().min(0).max(100),
    customerSatisfaction: z.coerce.number().min(1).max(10),
    lastPerformanceReview: z.string().datetime(),
  }),
  sla: z.object({
    responseTimeTarget: z.coerce.number().positive(),
    resolutionTimeTarget: z.coerce.number().positive(),
    escalationThreshold: z.coerce.number().positive(),
    autoEscalation: z.coerce.boolean().default(true),
  }),
});

const GetShiftsSchema = z.object({
  organizationId: z.string().min(1),
  agentId: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
  shiftType: z.enum(['morning', 'afternoon', 'night', 'weekend', 'holiday']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateShiftSchema = z.object({
  organizationId: z.string().min(1),
  agentId: z.string().min(1),
  shiftType: z.enum(['morning', 'afternoon', 'night', 'weekend', 'holiday']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('scheduled'),
  coverage: z.object({
    department: z.string().min(1),
    skills: z.array(z.string()).min(1),
    languages: z.array(z.string()).min(1),
    maxTasks: z.coerce.number().int().positive(),
  }),
  notes: z.string().optional(),
});

const GetVacationsSchema = z.object({
  organizationId: z.string().min(1),
  agentId: z.string().optional(),
  type: z.enum(['vacation', 'sick_leave', 'personal', 'training', 'emergency']).optional(),
  status: z.enum(['requested', 'approved', 'rejected', 'active', 'completed']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateVacationSchema = z.object({
  organizationId: z.string().min(1),
  agentId: z.string().min(1),
  type: z.enum(['vacation', 'sick_leave', 'personal', 'training', 'emergency']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['requested', 'approved', 'rejected', 'active', 'completed']).default('requested'),
  reason: z.string().min(1),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  coverage: z.object({
    assignedAgentId: z.string().optional(),
    backupAgentIds: z.array(z.string()).default([]),
    notes: z.string().optional(),
  }),
});

const GetTasksSchema = z.object({
  organizationId: z.string().min(1),
  assignedAgentId: z.string().optional(),
  taskType: z.enum(['data_validation', 'content_review', 'quality_check', 'manual_processing', 'escalation']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'escalated', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateTaskSchema = z.object({
  organizationId: z.string().min(1),
  assignedAgentId: z.string().optional(),
  customerId: z.string().min(1),
  taskType: z.enum(['data_validation', 'content_review', 'quality_check', 'manual_processing', 'escalation']),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  status: z.enum(['pending', 'assigned', 'in_progress', 'completed', 'escalated', 'cancelled']).default('pending'),
  title: z.string().min(1),
  description: z.string().min(1),
  data: z.record(z.any()),
  sla: z.object({
    responseTimeTarget: z.coerce.number().positive(),
    resolutionTimeTarget: z.coerce.number().positive(),
    escalationTime: z.coerce.number().positive(),
    autoEscalate: z.coerce.boolean().default(true),
  }),
  timestamps: z.object({
    created: z.string().datetime().optional(),
    assigned: z.string().datetime().optional(),
    started: z.string().datetime().optional(),
    completed: z.string().datetime().optional(),
    escalated: z.string().datetime().optional(),
  }).optional(),
  escalation: z.object({
    level: z.coerce.number().int().min(0).default(0),
    reason: z.string().optional(),
    escalatedBy: z.string().optional(),
    escalatedTo: z.string().optional(),
    escalatedAt: z.string().datetime().optional(),
  }).optional(),
  performance: z.object({
    responseTime: z.coerce.number().positive().optional(),
    resolutionTime: z.coerce.number().positive().optional(),
    qualityScore: z.coerce.number().min(1).max(10).optional(),
    customerFeedback: z.coerce.number().min(1).max(10).optional(),
  }).optional(),
});

const GetEscalationsSchema = z.object({
  organizationId: z.string().min(1),
  taskId: z.string().optional(),
  fromAgentId: z.string().optional(),
  toAgentId: z.string().optional(),
  level: z.coerce.number().int().min(0).optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateEscalationSchema = z.object({
  organizationId: z.string().min(1),
  taskId: z.string().min(1),
  fromAgentId: z.string().min(1),
  toAgentId: z.string().optional(),
  toRole: z.string().optional(),
  level: z.coerce.number().int().min(1),
  reason: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed']).default('pending'),
  sla: z.object({
    responseTimeTarget: z.coerce.number().positive(),
    resolutionTimeTarget: z.coerce.number().positive(),
  }),
  timestamps: z.object({
    created: z.string().datetime().optional(),
    accepted: z.string().datetime().optional(),
    completed: z.string().datetime().optional(),
  }).optional(),
  notes: z.string().optional(),
});

const GetSLAsSchema = z.object({
  organizationId: z.string().min(1),
  taskType: z.string().optional(),
  priority: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateSLASchema = z.object({
  organizationId: z.string().min(1),
  taskType: z.string().min(1),
  priority: z.string().min(1),
  metrics: z.object({
    responseTimeTarget: z.coerce.number().positive(),
    resolutionTimeTarget: z.coerce.number().positive(),
    escalationTime: z.coerce.number().positive(),
    qualityThreshold: z.coerce.number().min(1).max(10),
    customerSatisfactionTarget: z.coerce.number().min(1).max(10),
  }),
  escalation: z.object({
    levels: z.coerce.number().int().min(1),
    autoEscalate: z.coerce.boolean().default(true),
    escalationMatrix: z.array(z.object({
      level: z.coerce.number().int().min(1),
      targetRole: z.string().min(1),
      responseTime: z.coerce.number().positive(),
    })).min(1),
  }),
  penalties: z.object({
    missedResponse: z.coerce.number().int().min(0),
    missedResolution: z.coerce.number().int().min(0),
    poorQuality: z.coerce.number().int().min(0),
  }),
  rewards: z.object({
    earlyResponse: z.coerce.number().int().min(0),
    earlyResolution: z.coerce.number().int().min(0),
    excellentQuality: z.coerce.number().int().min(0),
  }),
  enabled: z.coerce.boolean().default(true),
});

const GenerateReportSchema = z.object({
  organizationId: z.string().min(1),
  reportType: z.enum(['agent_performance', 'sla_compliance', 'escalation_analysis', 'shift_coverage', 'vacation_impact']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  generatedBy: z.string().min(1),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Agent Management
hitlOwnershipSLARouter.get('/agents', async (req, res) => {
  try {
    const filters = GetAgentsSchema.parse(req.query);
    const agents = await hitlOwnershipSLAService.getAgents(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        agents,
        total: agents.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL agents', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.get('/agents/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const agent = await hitlOwnershipSLAService.getAgent(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      data: agent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL agent', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.post('/agents', async (req, res) => {
  try {
    const agentData = CreateAgentSchema.parse(req.body);
    const agent = await hitlOwnershipSLAService.createAgent(agentData);

    res.status(201).json({
      success: true,
      data: agent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating HITL agent', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Shift Management
hitlOwnershipSLARouter.get('/shifts', async (req, res) => {
  try {
    const filters = GetShiftsSchema.parse(req.query);
    const shifts = await hitlOwnershipSLAService.getShifts(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        shifts,
        total: shifts.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL shifts', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.post('/shifts', async (req, res) => {
  try {
    const shiftData = CreateShiftSchema.parse(req.body);
    const shift = await hitlOwnershipSLAService.createShift(shiftData);

    res.status(201).json({
      success: true,
      data: shift,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating HITL shift', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Vacation Management
hitlOwnershipSLARouter.get('/vacations', async (req, res) => {
  try {
    const filters = GetVacationsSchema.parse(req.query);
    const vacations = await hitlOwnershipSLAService.getVacations(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        vacations,
        total: vacations.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL vacations', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.post('/vacations', async (req, res) => {
  try {
    const vacationData = CreateVacationSchema.parse(req.body);
    const vacation = await hitlOwnershipSLAService.createVacation(vacationData);

    res.status(201).json({
      success: true,
      data: vacation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating HITL vacation', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Task Management
hitlOwnershipSLARouter.get('/tasks', async (req, res) => {
  try {
    const filters = GetTasksSchema.parse(req.query);
    const tasks = await hitlOwnershipSLAService.getTasks(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        tasks,
        total: tasks.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL tasks', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.post('/tasks', async (req, res) => {
  try {
    const taskData = CreateTaskSchema.parse(req.body);
    const task = await hitlOwnershipSLAService.createTask(taskData);

    res.status(201).json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating HITL task', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Escalation Management
hitlOwnershipSLARouter.get('/escalations', async (req, res) => {
  try {
    const filters = GetEscalationsSchema.parse(req.query);
    const escalations = await hitlOwnershipSLAService.getEscalations(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        escalations,
        total: escalations.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL escalations', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.post('/escalations', async (req, res) => {
  try {
    const escalationData = CreateEscalationSchema.parse(req.body);
    const escalation = await hitlOwnershipSLAService.createEscalation(escalationData);

    res.status(201).json({
      success: true,
      data: escalation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating HITL escalation', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// SLA Management
hitlOwnershipSLARouter.get('/slas', async (req, res) => {
  try {
    const filters = GetSLAsSchema.parse(req.query);
    const slas = await hitlOwnershipSLAService.getSLAs(filters.organizationId, filters);

    res.json({
      success: true,
      data: {
        slas,
        total: slas.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL SLAs', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

hitlOwnershipSLARouter.post('/slas', async (req, res) => {
  try {
    const slaData = CreateSLASchema.parse(req.body);
    const sla = await hitlOwnershipSLAService.createSLA(slaData);

    res.status(201).json({
      success: true,
      data: sla,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating HITL SLA', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Auto-escalation
hitlOwnershipSLARouter.post('/escalate-tasks', async (req, res) => {
  try {
    await hitlOwnershipSLAService.checkAndEscalateTasks();

    res.json({
      success: true,
      message: 'Auto-escalation check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error running auto-escalation', { error });
    res.status(500).json({
      success: false,
      error: 'Auto-escalation failed'
    });
  }
});

// Reports
hitlOwnershipSLARouter.post('/reports', async (req, res) => {
  try {
    const reportData = GenerateReportSchema.parse(req.body);
    const report = await hitlOwnershipSLAService.generateReport(
      reportData.organizationId,
      reportData.reportType,
      reportData.startDate,
      reportData.endDate,
      reportData.generatedBy
    );

    res.status(201).json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error generating HITL report', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
hitlOwnershipSLARouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await hitlOwnershipSLAService.getStats(organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting HITL stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
hitlOwnershipSLARouter.get('/health', async (req, res) => {
  try {
    const stats = await hitlOwnershipSLAService.getStats('demo-org-1');

    res.json({
      success: true,
      data: {
        status: 'ok',
        totalAgents: stats.totalAgents,
        activeAgents: stats.activeAgents,
        totalTasks: stats.totalTasks,
        totalEscalations: stats.totalEscalations,
        last24Hours: stats.last24Hours,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking HITL health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { hitlOwnershipSLARouter };
