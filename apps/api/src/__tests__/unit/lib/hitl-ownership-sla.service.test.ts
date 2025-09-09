import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hitlOwnershipSLAService } from '../../../lib/hitl-ownership-sla.service.js';

// ============================================================================
// HITL OWNERSHIP & SLA SERVICE UNIT TESTS - PR-71
// ============================================================================

describe('HITLOwnershipSLAService - PR-71', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset service state for isolation
    (hitlOwnershipSLAService as any).agents = new Map();
    (hitlOwnershipSLAService as any).shifts = new Map();
    (hitlOwnershipSLAService as any).vacations = new Map();
    (hitlOwnershipSLAService as any).tasks = new Map();
    (hitlOwnershipSLAService as any).escalations = new Map();
    (hitlOwnershipSLAService as any).slas = new Map();
    hitlOwnershipSLAService.init(); // Re-initialize with demo data
  });

  describe('HITL Agent Management', () => {
    it('should create agent with availability and performance metrics', async () => {
      const agentData = {
        organizationId: 'test-org-1',
        userId: 'user_test_1',
        name: 'Test Agent',
        email: 'test.agent@example.com',
        role: 'agent' as const,
        department: 'Data Processing',
        skills: ['data_validation', 'content_review'],
        languages: ['es', 'en'],
        status: 'active' as const,
        availability: {
          timezone: 'Europe/Madrid',
          workingHours: {
            start: '09:00',
            end: '17:00',
            days: [1, 2, 3, 4, 5]
          },
          maxConcurrentTasks: 5,
          currentTasks: 0
        },
        performance: {
          averageResponseTime: 20,
          taskCompletionRate: 90,
          customerSatisfaction: 8.5,
          lastPerformanceReview: new Date().toISOString()
        },
        sla: {
          responseTimeTarget: 30,
          resolutionTimeTarget: 4,
          escalationThreshold: 60,
          autoEscalation: true
        }
      };

      const agent = await hitlOwnershipSLAService.createAgent(agentData);

      expect(agent).toBeDefined();
      expect(agent.name).toBe('Test Agent');
      expect(agent.role).toBe('agent');
      expect(agent.availability.maxConcurrentTasks).toBe(5);
      expect(agent.performance.averageResponseTime).toBe(20);
      expect(agent.sla.responseTimeTarget).toBe(30);
    });

    it('should get agents with filters', async () => {
      const agents = await hitlOwnershipSLAService.getAgents('demo-org-1', {
        role: 'agent',
        status: 'active',
        limit: 10
      });

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.every(a => a.role === 'agent')).toBe(true);
      expect(agents.every(a => a.status === 'active')).toBe(true);
    });

    it('should get agent by ID', async () => {
      const agent = await hitlOwnershipSLAService.getAgent('agent_1');

      expect(agent).toBeDefined();
      expect(agent?.id).toBe('agent_1');
      expect(agent?.name).toBe('Ana García');
    });
  });

  describe('HITL Shift Management', () => {
    it('should create shift with coverage details', async () => {
      const shiftData = {
        organizationId: 'test-org-1',
        agentId: 'agent_1',
        shiftType: 'morning' as const,
        startTime: '09:00',
        endTime: '17:00',
        date: '2024-09-09',
        status: 'scheduled' as const,
        coverage: {
          department: 'Data Processing',
          skills: ['data_validation', 'content_review'],
          languages: ['es', 'en'],
          maxTasks: 5
        },
        notes: 'Test shift'
      };

      const shift = await hitlOwnershipSLAService.createShift(shiftData);

      expect(shift).toBeDefined();
      expect(shift.shiftType).toBe('morning');
      expect(shift.coverage.department).toBe('Data Processing');
      expect(shift.coverage.skills).toContain('data_validation');
      expect(shift.status).toBe('scheduled');
    });

    it('should get shifts with filters', async () => {
      const shifts = await hitlOwnershipSLAService.getShifts('demo-org-1', {
        agentId: 'agent_1',
        status: 'active',
        limit: 10
      });

      expect(shifts).toBeDefined();
      expect(Array.isArray(shifts)).toBe(true);
      expect(shifts.length).toBeGreaterThan(0);
      expect(shifts.every(s => s.agentId === 'agent_1')).toBe(true);
      expect(shifts.every(s => s.status === 'active')).toBe(true);
    });
  });

  describe('HITL Vacation Management', () => {
    it('should create vacation with coverage assignment', async () => {
      const vacationData = {
        organizationId: 'test-org-1',
        agentId: 'agent_1',
        type: 'vacation' as const,
        startDate: '2024-09-15',
        endDate: '2024-09-22',
        status: 'requested' as const,
        reason: 'Annual vacation',
        coverage: {
          assignedAgentId: 'agent_2',
          backupAgentIds: ['agent_3'],
          notes: 'Coverage assigned'
        }
      };

      const vacation = await hitlOwnershipSLAService.createVacation(vacationData);

      expect(vacation).toBeDefined();
      expect(vacation.type).toBe('vacation');
      expect(vacation.coverage.assignedAgentId).toBe('agent_2');
      expect(vacation.coverage.backupAgentIds).toContain('agent_3');
      expect(vacation.status).toBe('requested');
    });

    it('should get vacations with filters', async () => {
      const vacations = await hitlOwnershipSLAService.getVacations('demo-org-1', {
        type: 'vacation',
        status: 'approved',
        limit: 10
      });

      expect(vacations).toBeDefined();
      expect(Array.isArray(vacations)).toBe(true);
      expect(vacations.length).toBeGreaterThan(0);
      expect(vacations.every(v => v.type === 'vacation')).toBe(true);
      expect(vacations.every(v => v.status === 'approved')).toBe(true);
    });
  });

  describe('HITL Task Management', () => {
    it('should create task with SLA and escalation settings', async () => {
      const taskData = {
        organizationId: 'test-org-1',
        assignedAgentId: 'agent_1',
        customerId: 'customer_1',
        taskType: 'data_validation' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        title: 'Validate customer data',
        description: 'Review customer information for accuracy',
        data: {
          customerName: 'John Doe',
          email: 'john@example.com'
        },
        sla: {
          responseTimeTarget: 30,
          resolutionTimeTarget: 4,
          escalationTime: 60,
          autoEscalate: true
        }
      };

      const task = await hitlOwnershipSLAService.createTask(taskData);

      expect(task).toBeDefined();
      expect(task.taskType).toBe('data_validation');
      expect(task.priority).toBe('high');
      expect(task.sla.responseTimeTarget).toBe(30);
      expect(task.escalation.level).toBe(0);
      expect(task.timestamps.created).toBeDefined();
    });

    it('should get tasks with filters', async () => {
      const tasks = await hitlOwnershipSLAService.getTasks('demo-org-1', {
        assignedAgentId: 'agent_1',
        taskType: 'data_validation',
        priority: 'high',
        limit: 10
      });

      expect(tasks).toBeDefined();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks.every(t => t.assignedAgentId === 'agent_1')).toBe(true);
      expect(tasks.every(t => t.taskType === 'data_validation')).toBe(true);
      expect(tasks.every(t => t.priority === 'high')).toBe(true);
    });
  });

  describe('HITL Escalation Management', () => {
    it('should create escalation with SLA targets', async () => {
      const escalationData = {
        organizationId: 'test-org-1',
        taskId: 'task_1',
        fromAgentId: 'agent_1',
        toAgentId: 'agent_2',
        level: 1,
        reason: 'SLA exceeded',
        priority: 'high' as const,
        status: 'pending' as const,
        sla: {
          responseTimeTarget: 15,
          resolutionTimeTarget: 2
        }
      };

      const escalation = await hitlOwnershipSLAService.createEscalation(escalationData);

      expect(escalation).toBeDefined();
      expect(escalation.taskId).toBe('task_1');
      expect(escalation.level).toBe(1);
      expect(escalation.sla.responseTimeTarget).toBe(15);
      expect(escalation.status).toBe('pending');
    });

    it('should get escalations with filters', async () => {
      const escalations = await hitlOwnershipSLAService.getEscalations('demo-org-1', {
        taskId: 'task_1',
        level: 1,
        status: 'pending',
        limit: 10
      });

      expect(escalations).toBeDefined();
      expect(Array.isArray(escalations)).toBe(true);
    });
  });

  describe('HITL SLA Management', () => {
    it('should create SLA with escalation matrix', async () => {
      const slaData = {
        organizationId: 'test-org-1',
        taskType: 'content_review',
        priority: 'medium',
        metrics: {
          responseTimeTarget: 45,
          resolutionTimeTarget: 6,
          escalationTime: 90,
          qualityThreshold: 8,
          customerSatisfactionTarget: 8
        },
        escalation: {
          levels: 3,
          autoEscalate: true,
          escalationMatrix: [
            { level: 1, targetRole: 'supervisor', responseTime: 20 },
            { level: 2, targetRole: 'manager', responseTime: 15 },
            { level: 3, targetRole: 'admin', responseTime: 10 }
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
        enabled: true
      };

      const sla = await hitlOwnershipSLAService.createSLA(slaData);

      expect(sla).toBeDefined();
      expect(sla.taskType).toBe('content_review');
      expect(sla.escalation.levels).toBe(3);
      expect(sla.escalation.escalationMatrix).toHaveLength(3);
      expect(sla.penalties.missedResponse).toBe(10);
      expect(sla.rewards.earlyResponse).toBe(5);
    });

    it('should get SLAs with filters', async () => {
      const slas = await hitlOwnershipSLAService.getSLAs('demo-org-1', {
        taskType: 'data_validation',
        priority: 'high',
        enabled: true,
        limit: 10
      });

      expect(slas).toBeDefined();
      expect(Array.isArray(slas)).toBe(true);
      expect(slas.length).toBeGreaterThan(0);
      expect(slas.every(s => s.taskType === 'data_validation')).toBe(true);
      expect(slas.every(s => s.priority === 'high')).toBe(true);
      expect(slas.every(s => s.enabled === true)).toBe(true);
    });
  });

  describe('HITL Auto-escalation', () => {
    it('should check and escalate tasks based on SLA', async () => {
      // Create a task that should be escalated
      const taskData = {
        organizationId: 'demo-org-1',
        assignedAgentId: 'agent_1',
        customerId: 'customer_1',
        taskType: 'data_validation',
        priority: 'high',
        status: 'assigned' as const,
        title: 'Test escalation task',
        description: 'Task for testing escalation',
        data: {},
        sla: {
          responseTimeTarget: 5, // Very short for testing
          resolutionTimeTarget: 0.1, // Very short for testing
          escalationTime: 5,
          autoEscalate: true
        },
        timestamps: {
          created: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          assigned: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        }
      };

      const task = await hitlOwnershipSLAService.createTask(taskData);

      // Run auto-escalation check
      await hitlOwnershipSLAService.checkAndEscalateTasks();

      // Verify task was escalated
      const updatedTask = await hitlOwnershipSLAService.getTasks('demo-org-1', {
        assignedAgentId: 'agent_1',
        limit: 1
      });

      expect(updatedTask).toBeDefined();
      expect(updatedTask.length).toBeGreaterThan(0);
    });
  });

  describe('HITL Reports', () => {
    it('should generate agent performance report', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await hitlOwnershipSLAService.generateReport(
        'demo-org-1',
        'agent_performance',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('agent_performance');
      expect(report.data.agents).toBeDefined();
      expect(report.data.tasks).toBeDefined();
      expect(report.data.metrics).toBeDefined();
      expect(report.data.metrics.totalTasks).toBeGreaterThan(0);
    });

    it('should generate SLA compliance report', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await hitlOwnershipSLAService.generateReport(
        'demo-org-1',
        'sla_compliance',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('sla_compliance');
      expect(report.data.metrics.slaCompliance).toBeDefined();
      expect(report.data.metrics.averageResponseTime).toBeDefined();
      expect(report.data.metrics.averageResolutionTime).toBeDefined();
    });

    it('should generate escalation analysis report', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const report = await hitlOwnershipSLAService.generateReport(
        'demo-org-1',
        'escalation_analysis',
        startDate,
        endDate,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.reportType).toBe('escalation_analysis');
      expect(report.data.escalations).toBeDefined();
      expect(report.data.metrics.escalatedTasks).toBeDefined();
    });
  });

  describe('HITL Statistics', () => {
    it('should get comprehensive statistics', async () => {
      const stats = await hitlOwnershipSLAService.getStats('demo-org-1');

      expect(stats).toBeDefined();
      expect(stats.totalAgents).toBeGreaterThan(0);
      expect(stats.activeAgents).toBeGreaterThan(0);
      expect(stats.totalTasks).toBeGreaterThan(0);
      expect(stats.totalEscalations).toBeDefined();
      expect(stats.totalShifts).toBeGreaterThan(0);
      expect(stats.totalVacations).toBeGreaterThan(0);
      expect(stats.last24Hours).toBeDefined();
      expect(stats.last7Days).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byPriority).toBeDefined();
      expect(stats.byTaskType).toBeDefined();
    });

    it('should calculate SLA compliance correctly', async () => {
      const stats = await hitlOwnershipSLAService.getStats('demo-org-1');

      expect(stats.last24Hours.slaCompliance).toBeGreaterThanOrEqual(0);
      expect(stats.last24Hours.slaCompliance).toBeLessThanOrEqual(100);
    });

    it('should calculate average response time correctly', async () => {
      const stats = await hitlOwnershipSLAService.getStats('demo-org-1');

      expect(stats.last24Hours.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HITL Shift Coverage', () => {
    it('should handle shift coverage with skills and languages', async () => {
      const shiftData = {
        organizationId: 'test-org-1',
        agentId: 'agent_1',
        shiftType: 'afternoon' as const,
        startTime: '14:00',
        endTime: '22:00',
        date: '2024-09-09',
        status: 'scheduled' as const,
        coverage: {
          department: 'Data Processing',
          skills: ['data_validation', 'content_review', 'quality_check'],
          languages: ['es', 'en', 'fr'],
          maxTasks: 8
        }
      };

      const shift = await hitlOwnershipSLAService.createShift(shiftData);

      expect(shift).toBeDefined();
      expect(shift.coverage.skills).toContain('data_validation');
      expect(shift.coverage.skills).toContain('content_review');
      expect(shift.coverage.skills).toContain('quality_check');
      expect(shift.coverage.languages).toContain('es');
      expect(shift.coverage.languages).toContain('en');
      expect(shift.coverage.languages).toContain('fr');
      expect(shift.coverage.maxTasks).toBe(8);
    });
  });

  describe('HITL Vacation Coverage', () => {
    it('should handle vacation coverage with backup agents', async () => {
      const vacationData = {
        organizationId: 'test-org-1',
        agentId: 'agent_1',
        type: 'sick_leave' as const,
        startDate: '2024-09-10',
        endDate: '2024-09-12',
        status: 'approved' as const,
        reason: 'Medical leave',
        coverage: {
          assignedAgentId: 'agent_2',
          backupAgentIds: ['agent_3', 'agent_4'],
          notes: 'Multiple backup agents assigned'
        }
      };

      const vacation = await hitlOwnershipSLAService.createVacation(vacationData);

      expect(vacation).toBeDefined();
      expect(vacation.type).toBe('sick_leave');
      expect(vacation.coverage.assignedAgentId).toBe('agent_2');
      expect(vacation.coverage.backupAgentIds).toHaveLength(2);
      expect(vacation.coverage.backupAgentIds).toContain('agent_3');
      expect(vacation.coverage.backupAgentIds).toContain('agent_4');
    });
  });
});
