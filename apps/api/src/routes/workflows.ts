import { Router } from 'express';
import { z } from 'zod';
import { workflowsService, WorkflowSchema, WorkflowInstanceSchema } from '../lib/workflows.service.js';

const router = Router();

// Middleware de validación
const validateWorkflow = (req: any, res: any, next: any) => {
  try {
    req.body = WorkflowSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid workflow data',
      details: error
    });
  }
};

const validateWorkflowInstance = (req: any, res: any, next: any) => {
  try {
    req.body = WorkflowInstanceSchema.omit({ id: true, startedAt: true, completedAt: true }).parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid workflow instance data',
      details: error
    });
  }
};

// ==================== WORKFLOWS ====================

// GET /v1/workflows - Listar workflows
router.get('/', async (req, res) => {
  try {
    const { type, status } = req.query;
    const filters: any = {};
    
    if (type) filters.type = type as string;
    if (status) filters.status = status as string;
    
    const workflows = await workflowsService.getWorkflows(filters);
    
    res.json({
      success: true,
      data: workflows,
      total: workflows.length,
      filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflows',
      details: error
    });
  }
});

// GET /v1/workflows/:id - Obtener workflow específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await workflowsService.getWorkflow(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow',
      details: error
    });
  }
});

// POST /v1/workflows - Crear nuevo workflow
router.post('/', validateWorkflow, async (req, res) => {
  try {
    // Validar workflow antes de crear
    const validation = await workflowsService.validateWorkflow(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Workflow validation failed',
        details: validation.errors,
        warnings: validation.warnings
      });
    }
    
    const workflow = await workflowsService.createWorkflow(req.body);
    
    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create workflow',
      details: error
    });
  }
});

// PUT /v1/workflows/:id - Actualizar workflow
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validar actualizaciones si se proporciona definición completa
    if (updates.definition || updates.actions) {
      const existing = await workflowsService.getWorkflow(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }
      
      const validation = await workflowsService.validateWorkflow({ ...existing, ...updates });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Workflow validation failed',
          details: validation.errors,
          warnings: validation.warnings
        });
      }
    }
    
    const workflow = await workflowsService.updateWorkflow(id, updates);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      details: error
    });
  }
});

// DELETE /v1/workflows/:id - Eliminar workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await workflowsService.deleteWorkflow(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      details: error
    });
  }
});

// POST /v1/workflows/:id/start - Iniciar workflow
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { context, metadata } = req.body;
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Context is required to start workflow'
      });
    }
    
    const instance = await workflowsService.startWorkflow(id, context, metadata || {});
    
    res.json({
      success: true,
      data: instance,
      message: 'Workflow started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start workflow',
      details: error
    });
  }
});

// ==================== WORKFLOW INSTANCES ====================

// GET /v1/workflows/instances - Listar instancias
router.get('/instances', async (req, res) => {
  try {
    const { status, workflowId } = req.query;
    const filters: any = {};
    
    if (status) filters.status = status as string;
    if (workflowId) filters.workflowId = workflowId as string;
    
    const instances = await workflowsService.getInstances(filters);
    
    res.json({
      success: true,
      data: instances,
      total: instances.length,
      filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow instances',
      details: error
    });
  }
});

// GET /v1/workflows/instances/:id - Obtener instancia específica
router.get('/instances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const instance = await workflowsService.getInstance(id);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found'
      });
    }
    
    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow instance',
      details: error
    });
  }
});

// POST /v1/workflows/instances/:id/pause - Pausar instancia
router.post('/instances/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const instance = await workflowsService.pauseInstance(id);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found'
      });
    }
    
    res.json({
      success: true,
      data: instance,
      message: 'Workflow instance paused successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to pause workflow instance',
      details: error
    });
  }
});

// POST /v1/workflows/instances/:id/resume - Reanudar instancia
router.post('/instances/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const instance = await workflowsService.resumeInstance(id);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found'
      });
    }
    
    res.json({
      success: true,
      data: instance,
      message: 'Workflow instance resumed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resume workflow instance',
      details: error
    });
  }
});

// POST /v1/workflows/instances/:id/cancel - Cancelar instancia
router.post('/instances/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const instance = await workflowsService.cancelInstance(id);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Workflow instance not found'
      });
    }
    
    res.json({
      success: true,
      data: instance,
      message: 'Workflow instance cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel workflow instance',
      details: error
    });
  }
});

// POST /v1/workflows/instances/:id/actions - Ejecutar acción
router.post('/instances/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { actionId } = req.body;
    
    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: 'Action ID is required'
      });
    }
    
    const result = await workflowsService.executeAction(id, actionId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        data: { actionId }
      });
    }
    
    res.json({
      success: true,
      data: {
        actionId,
        result: result.result
      },
      message: 'Action executed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
      details: error
    });
  }
});

// ==================== STATISTICS ====================

// GET /v1/workflows/stats - Obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    const stats = await workflowsService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow statistics',
      details: error
    });
  }
});

// ==================== VALIDATION ====================

// POST /v1/workflows/validate - Validar workflow
router.post('/validate', validateWorkflow, async (req, res) => {
  try {
    const validation = await workflowsService.validateWorkflow(req.body);
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate workflow',
      details: error
    });
  }
});

// ==================== HEALTH CHECK ====================

// GET /v1/workflows/health - Health check
router.get('/health', async (req, res) => {
  try {
    const stats = await workflowsService.getStats();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalWorkflows: stats.totalWorkflows,
        totalInstances: stats.totalInstances,
        activeInstances: stats.instancesByStatus.running || 0
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Workflow service unhealthy',
      details: error
    });
  }
});

export default router;
