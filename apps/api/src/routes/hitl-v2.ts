import { Router } from 'express';
import { z } from 'zod';
import { hitlV2Service } from '../lib/hitl-v2.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const CreateTaskSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['email', 'document', 'approval', 'review', 'translation']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  originalContent: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  assignedTo: z.string().optional(),
  assignedBy: z.string().min(1),
  dueDate: z.string().optional(),
  slaHours: z.number().int().positive().default(24),
  tags: z.array(z.string()).default([])
});

const UpdateTaskSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'approved', 'rejected', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  slaHours: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional()
});

const AddCommentSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['comment', 'approval', 'rejection', 'suggestion', 'question']).default('comment'),
  parentCommentId: z.string().optional()
});

const AddAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  url: z.string().min(1),
  uploadedBy: z.string().min(1),
  isProcessed: z.boolean().default(false)
});

const AdvanceWorkflowSchema = z.object({
  stepId: z.string().min(1),
  comments: z.string().optional()
});

const CreateBatchSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  createdBy: z.string().min(1),
  slaHours: z.number().int().positive().default(48)
});

const AddTasksToBatchSchema = z.object({
  taskIds: z.array(z.string().min(1)).min(1)
});

// GET /v1/hitl/tasks - Get tasks
router.get('/tasks', async (req, res) => {
  try {
    const { organizationId, status, type, priority, assignedTo, tags } = req.query;
    
    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'organizationId is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (assignedTo) filters.assignedTo = assignedTo;
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

    const tasks = await hitlV2Service.getTasks(organizationId as string, filters);

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
    structuredLogger.error('Failed to get HITL tasks', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get HITL tasks',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /v1/hitl/tasks/:taskId - Get specific task
router.get('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await hitlV2Service.getTask(taskId);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get HITL task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.taskId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get HITL task',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/hitl/tasks - Create task
router.post('/tasks', async (req, res) => {
  try {
    const validatedData = CreateTaskSchema.parse(req.body);
    
    const task = await hitlV2Service.createTask(validatedData);

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to create HITL task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create HITL task',
      timestamp: new Date().toISOString()
    });
  }
});

// PUT /v1/hitl/tasks/:taskId - Update task
router.put('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const validatedData = UpdateTaskSchema.parse(req.body);
    
    const task = await hitlV2Service.updateTask(taskId, validatedData);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to update HITL task', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.taskId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update HITL task',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/hitl/tasks/:taskId/comments - Add comment
router.post('/tasks/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const validatedData = AddCommentSchema.parse(req.body);
    
    const comment = await hitlV2Service.addComment(taskId, validatedData);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: comment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to add HITL comment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.taskId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to add HITL comment',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/hitl/tasks/:taskId/attachments - Add attachment
router.post('/tasks/:taskId/attachments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const validatedData = AddAttachmentSchema.parse(req.body);
    
    const attachment = await hitlV2Service.addAttachment(taskId, validatedData);

    if (!attachment) {
      res.status(404).json({
        success: false,
        error: 'Task not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: attachment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to add HITL attachment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.taskId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to add HITL attachment',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/hitl/tasks/:taskId/workflow/advance - Advance workflow
router.post('/tasks/:taskId/workflow/advance', async (req, res) => {
  try {
    const { taskId } = req.params;
    const validatedData = AdvanceWorkflowSchema.parse(req.body);
    
    const task = await hitlV2Service.advanceWorkflow(taskId, validatedData.stepId, validatedData.comments);

    if (!task) {
      res.status(404).json({
        success: false,
        error: 'Task or workflow step not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to advance HITL workflow', {
      error: error instanceof Error ? error.message : 'Unknown error',
      taskId: req.params.taskId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to advance HITL workflow',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/hitl/batches - Create batch
router.post('/batches', async (req, res) => {
  try {
    const validatedData = CreateBatchSchema.parse(req.body);
    
    const batch = await hitlV2Service.createBatch(validatedData);

    res.json({
      success: true,
      data: batch,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to create HITL batch', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create HITL batch',
      timestamp: new Date().toISOString()
    });
  }
});

// POST /v1/hitl/batches/:batchId/tasks - Add tasks to batch
router.post('/batches/:batchId/tasks', async (req, res) => {
  try {
    const { batchId } = req.params;
    const validatedData = AddTasksToBatchSchema.parse(req.body);
    
    const batch = await hitlV2Service.addTasksToBatch(batchId, validatedData.taskIds);

    if (!batch) {
      res.status(404).json({
        success: false,
        error: 'Batch not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.json({
      success: true,
      data: batch,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
      return;
    }

    structuredLogger.error('Failed to add tasks to HITL batch', {
      error: error instanceof Error ? error.message : 'Unknown error',
      batchId: req.params.batchId,
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to add tasks to HITL batch',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /v1/hitl/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const { organizationId } = req.query;
    
    if (!organizationId) {
      res.status(400).json({
        success: false,
        error: 'organizationId is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const stats = await hitlV2Service.getStats(organizationId as string);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get HITL stats', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get HITL stats',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /v1/hitl/health - Health check
router.get('/health', async (req, res) => {
  try {
    const health = await hitlV2Service.getHealth();

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Failed to get HITL health', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.headers['x-request-id'] as string || ''
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get HITL health',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as hitlV2Router };
