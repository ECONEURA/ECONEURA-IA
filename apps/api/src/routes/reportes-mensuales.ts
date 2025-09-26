import { Router } from 'express';
import { z } from 'zod';

import { reportesMensualesService } from '../lib/reportes-mensuales.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const reportesMensualesRouter = Router();

// Validation schemas
const CrearReporteSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().min(1).max(500),
  tipo: z.enum(['financiero', 'operacional', 'comercial', 'recursos_humanos', 'inventario', 'personalizado']),
  organizacionId: z.string().min(1),
  configuracion: z.object({
    formato: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
    idioma: z.enum(['es', 'en', 'fr', 'de']).default('es'),
    moneda: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
    timezone: z.string().default('Europe/Madrid'),
    incluirGraficos: z.boolean().default(true),
    incluirDetalles: z.boolean().default(true),
    incluirComparativas: z.boolean().default(true),
    incluirProyecciones: z.boolean().default(true)
  }),
  plantilla: z.object({
    header: z.object({
      logo: z.string().optional(),
      titulo: z.string().min(1),
      subtitulo: z.string().optional(),
      fechaGeneracion: z.boolean().default(true),
      numeroPagina: z.boolean().default(true)
    }),
    secciones: z.array(z.object({
      id: z.string(),
      titulo: z.string(),
      tipo: z.enum(['tabla', 'grafico', 'texto', 'metricas', 'kpi']),
      datos: z.any().optional(),
      orden: z.number().int().positive(),
      visible: z.boolean().default(true)
    })),
    footer: z.object({
      texto: z.string().optional(),
      contacto: z.string().optional(),
      legal: z.string().optional()
    })
  }),
  programacion: z.object({
    activa: z.boolean().default(false),
    frecuencia: z.enum(['mensual', 'trimestral', 'anual']).default('mensual'),
    diaMes: z.number().int().min(1).max(31).default(1),
    hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
    timezone: z.string().default('Europe/Madrid')
  }),
  distribucion: z.object({
    email: z.object({
      activo: z.boolean().default(false),
      destinatarios: z.array(z.string().email()).default([]),
      asunto: z.string().optional(),
      mensaje: z.string().optional()
    }),
    almacenamiento: z.object({
      activo: z.boolean().default(false),
      ruta: z.string().optional(),
      retencionDias: z.number().int().positive().default(365)
    }),
    webhook: z.object({
      activo: z.boolean().default(false),
      url: z.string().url().optional(),
      formato: z.enum(['json', 'xml']).default('json')
    })
  })
});

const ActualizarReporteSchema = CrearReporteSchema.partial();

const GenerarReporteSchema = z.object({
  reporteId: z.string().min(1),
  periodo: z.object({
    mes: z.number().int().min(1).max(12),
    año: z.number().int().min(2020).max(2030)
  })
});

const ProgramarReporteSchema = z.object({
  reporteId: z.string().min(1),
  programacion: z.object({
    activa: z.boolean(),
    frecuencia: z.enum(['mensual', 'trimestral', 'anual']),
    diaMes: z.number().int().min(1).max(31),
    hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    timezone: z.string()
  })
});

// Routes

// Crear nuevo reporte
reportesMensualesRouter.post('/', async (req, res) => {
  try {
    const reporteData = CrearReporteSchema.parse(req.body);
    const reporte = await reportesMensualesService.crearReporte(reporteData);
    
    res.status(201).json({
      success: true,
      data: reporte,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Obtener todos los reportes
reportesMensualesRouter.get('/', async (req, res) => {
  try {
    const { organizacionId } = z.object({ 
      organizacionId: z.string().optional() 
    }).parse(req.query);
    
    const reportes = await reportesMensualesService.obtenerReportes(organizacionId);
    
    res.json({
      success: true,
      data: {
        reportes,
        total: reportes.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting reportes', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Obtener plantillas (debe ir antes de /:id)
reportesMensualesRouter.get('/plantillas', async (req, res) => {
  try {
    const plantillas = await reportesMensualesService.obtenerPlantillas();
    
    res.json({
      success: true,
      data: {
        plantillas,
        total: plantillas.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting plantillas', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get plantillas'
    });
  }
});

// Obtener generaciones (debe ir antes de /:id)
reportesMensualesRouter.get('/generaciones', async (req, res) => {
  try {
    const { reporteId } = z.object({ 
      reporteId: z.string().optional() 
    }).parse(req.query);
    
    const generaciones = await reportesMensualesService.obtenerGeneraciones(reporteId);
    
    res.json({
      success: true,
      data: {
        generaciones,
        total: generaciones.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting generaciones', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Obtener generación específica
reportesMensualesRouter.get('/generaciones/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const generacion = await reportesMensualesService.obtenerGeneracion(id);
    
    if (!generacion) {
      return res.status(404).json({
        success: false,
        error: 'Generación not found'
      });
    }
    
    res.json({
      success: true,
      data: generacion,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting generación', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Obtener estadísticas (debe ir antes de /:id)
reportesMensualesRouter.get('/stats', async (req, res) => {
  try {
    const { organizacionId } = z.object({ 
      organizacionId: z.string().optional() 
    }).parse(req.query);
    
    const estadisticas = await reportesMensualesService.obtenerEstadisticas(organizacionId);
    
    res.json({
      success: true,
      data: estadisticas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting estadísticas', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health check (debe ir antes de /:id)
reportesMensualesRouter.get('/health', async (req, res) => {
  try {
    const estadisticas = await reportesMensualesService.obtenerEstadisticas();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        reportes: estadisticas.reportes.total,
        generaciones: estadisticas.generaciones.total,
        plantillas: 3
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Obtener reporte específico
reportesMensualesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const reporte = await reportesMensualesService.obtenerReporte(id);
    
    if (!reporte) {
      return res.status(404).json({
        success: false,
        error: 'Reporte not found'
      });
    }
    
    res.json({
      success: true,
      data: reporte,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Actualizar reporte
reportesMensualesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const updates = ActualizarReporteSchema.parse(req.body);
    
    const reporte = await reportesMensualesService.actualizarReporte(id, updates);
    
    if (!reporte) {
      return res.status(404).json({
        success: false,
        error: 'Reporte not found'
      });
    }
    
    res.json({
      success: true,
      data: reporte,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error updating reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Eliminar reporte
reportesMensualesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const eliminado = await reportesMensualesService.eliminarReporte(id);
    
    if (!eliminado) {
      return res.status(404).json({
        success: false,
        error: 'Reporte not found'
      });
    }
    
    res.json({
      success: true,
      data: { message: 'Reporte eliminado exitosamente' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error deleting reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Generar reporte
reportesMensualesRouter.post('/generar', async (req, res) => {
  try {
    const { reporteId, periodo } = GenerarReporteSchema.parse(req.body);
    const generacion = await reportesMensualesService.generarReporte(reporteId, periodo);
    
    res.status(202).json({
      success: true,
      data: generacion,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error generating reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Obtener datos del reporte
reportesMensualesRouter.get('/:id/datos', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string() }).parse(req.params);
    const mes = parseInt(req.query.mes as string) || 1;
    const año = parseInt(req.query.año as string) || 2024;
    
    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        error: 'Mes debe estar entre 1 y 12'
      });
    }
    
    if (año < 2020 || año > 2030) {
      return res.status(400).json({
        success: false,
        error: 'Año debe estar entre 2020 y 2030'
      });
    }
    
    const reporte = await reportesMensualesService.obtenerReporte(id);
    if (!reporte) {
      return res.status(404).json({
        success: false,
        error: 'Reporte not found'
      });
    }
    
    const datos = await reportesMensualesService.obtenerDatosReporte(reporte.organizacionId, { mes, año });
    
    res.json({
      success: true,
      data: datos,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting reporte datos', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Programar reporte
reportesMensualesRouter.post('/programar', async (req, res) => {
  try {
    const { reporteId, programacion } = ProgramarReporteSchema.parse(req.body);
    const programado = await reportesMensualesService.programarReporte(reporteId, programacion);
    
    if (!programado) {
      return res.status(404).json({
        success: false,
        error: 'Reporte not found'
      });
    }
    
    res.json({
      success: true,
      data: { message: 'Reporte programado exitosamente' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error scheduling reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Distribuir reporte
reportesMensualesRouter.post('/distribuir/:generacionId', async (req, res) => {
  try {
    const { generacionId } = z.object({ generacionId: z.string() }).parse(req.params);
    const distribuido = await reportesMensualesService.distribuirReporte(generacionId);
    
    if (!distribuido) {
      return res.status(404).json({
        success: false,
        error: 'Generación not found or not completed'
      });
    }
    
    res.json({
      success: true,
      data: { message: 'Reporte distribuido exitosamente' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error distributing reporte', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

export { reportesMensualesRouter };
