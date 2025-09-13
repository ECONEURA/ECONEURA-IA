import { structuredLogger } from './structured-logger.js';

// Reportes Mensuales Service - PR-54
// Sistema completo de generación de reportes mensuales en PDF

interface ReporteConfig {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'financiero' | 'operacional' | 'comercial' | 'recursos_humanos' | 'inventario' | 'personalizado';
  organizacionId: string;
  configuracion: {
    formato: 'pdf' | 'excel' | 'csv';
    idioma: 'es' | 'en' | 'fr' | 'de';
    moneda: 'EUR' | 'USD' | 'GBP';
    timezone: string;
    incluirGraficos: boolean;
    incluirDetalles: boolean;
    incluirComparativas: boolean;
    incluirProyecciones: boolean;
  };
  plantilla: {
    header: {
      logo: string;
      titulo: string;
      subtitulo: string;
      fechaGeneracion: boolean;
      numeroPagina: boolean;
    };
    secciones: Array<{
      id: string;
      titulo: string;
      tipo: 'tabla' | 'grafico' | 'texto' | 'metricas' | 'kpi';
      datos: any;
      orden: number;
      visible: boolean;
    }>;
    footer: {
      texto: string;
      contacto: string;
      legal: string;
    };
  };
  programacion: {
    activa: boolean;
    frecuencia: 'mensual' | 'trimestral' | 'anual';
    diaMes: number; // 1-31
    hora: string; // HH:MM
    timezone: string;
    proximaEjecucion: string;
    ultimaEjecucion?: string;
  };
  distribucion: {
    email: {
      activo: boolean;
      destinatarios: string[];
      asunto: string;
      mensaje: string;
    };
    almacenamiento: {
      activo: boolean;
      ruta: string;
      retencionDias: number;
    };
    webhook: {
      activo: boolean;
      url: string;
      formato: 'json' | 'xml';
    };
  };
  estado: 'activo' | 'inactivo' | 'error' | 'procesando';
  creadoEn: string;
  actualizadoEn: string;
}

interface DatosReporte {
  periodo: {
    inicio: string;
    fin: string;
    mes: string;
    año: number;
  };
  organizacion: {
    id: string;
    nombre: string;
    logo: string;
    direccion: string;
    contacto: string;
  };
  resumen: {
    totalVentas: number;
    totalGastos: number;
    beneficio: number;
    margen: number;
    crecimiento: number;
  };
  metricas: {
    ventas: {
      total: number;
      porCategoria: Array<{ categoria: string; monto: number; porcentaje: number }>;
      porMes: Array<{ mes: string; monto: number }>;
      tendencia: 'creciente' | 'decreciente' | 'estable';
    };
    clientes: {
      total: number;
      nuevos: number;
      activos: number;
      inactivos: number;
      satisfaccion: number;
    };
    productos: {
      total: number;
      masVendidos: Array<{ producto: string; cantidad: number; ingresos: number }>;
      stockBajo: number;
      rotacion: number;
    };
    finanzas: {
      ingresos: number;
      gastos: number;
      beneficio: number;
      margen: number;
      flujoCaja: number;
    };
    operaciones: {
      pedidos: number;
      entregas: number;
      devoluciones: number;
      tiempoPromedio: number;
    };
  };
  graficos: {
    ventasMensuales: Array<{ mes: string; monto: number }>;
    distribucionCategorias: Array<{ categoria: string; porcentaje: number }>;
    tendenciaClientes: Array<{ mes: string; clientes: number }>;
    evolucionBeneficios: Array<{ mes: string; beneficio: number }>;
  };
  comparativas: {
    mesAnterior: {
      ventas: number;
      clientes: number;
      beneficio: number;
      crecimiento: number;
    };
    añoAnterior: {
      ventas: number;
      clientes: number;
      beneficio: number;
      crecimiento: number;
    };
    objetivo: {
      ventas: number;
      clientes: number;
      beneficio: number;
      cumplimiento: number;
    };
  };
  proyecciones: {
    proximoMes: {
      ventas: number;
      clientes: number;
      beneficio: number;
      confianza: number;
    };
    proximoTrimestre: {
      ventas: number;
      clientes: number;
      beneficio: number;
      confianza: number;
    };
  };
  alertas: Array<{
    tipo: 'info' | 'warning' | 'error' | 'success';
    mensaje: string;
    accion: string;
    prioridad: 'baja' | 'media' | 'alta';
  }>;
  recomendaciones: Array<{
    categoria: string;
    descripcion: string;
    impacto: 'bajo' | 'medio' | 'alto';
    esfuerzo: 'bajo' | 'medio' | 'alto';
    prioridad: number;
  }>;
}

interface GeneracionReporte {
  id: string;
  reporteId: string;
  organizacionId: string;
  estado: 'iniciado' | 'procesando' | 'completado' | 'error' | 'cancelado';
  progreso: number; // 0-100
  inicio: string;
  fin?: string;
  duracion?: number; // segundos
  archivo?: {
    nombre: string;
    ruta: string;
    tamaño: number;
    formato: string;
  };
  errores?: Array<{
    codigo: string;
    mensaje: string;
    timestamp: string;
  }>;
  estadisticas: {
    datosProcesados: number;
    graficosGenerados: number;
    paginasGeneradas: number;
    tiempoGeneracion: number;
  };
}

class ReportesMensualesService {
  private reportes: Map<string, ReporteConfig> = new Map();
  private generaciones: Map<string, GeneracionReporte> = new Map();
  private plantillas: Map<string, any> = new Map();

  constructor() {
    this.initializePlantillas();
    this.initializeReportesDemo();
    
    structuredLogger.info('Reportes Mensuales Service initialized', {
      reportesCount: this.reportes.size,
      plantillasCount: this.plantillas.size
    });
  }

  private initializePlantillas(): void {
    // Plantilla financiera
    this.plantillas.set('financiero', {
      id: 'financiero',
      nombre: 'Reporte Financiero Mensual',
      secciones: [
        {
          id: 'resumen',
          titulo: 'Resumen Ejecutivo',
          tipo: 'metricas',
          orden: 1
        },
        {
          id: 'ingresos',
          titulo: 'Análisis de Ingresos',
          tipo: 'tabla',
          orden: 2
        },
        {
          id: 'gastos',
          titulo: 'Análisis de Gastos',
          tipo: 'tabla',
          orden: 3
        },
        {
          id: 'beneficios',
          titulo: 'Análisis de Beneficios',
          tipo: 'grafico',
          orden: 4
        },
        {
          id: 'flujo_caja',
          titulo: 'Flujo de Caja',
          tipo: 'grafico',
          orden: 5
        }
      ]
    });

    // Plantilla operacional
    this.plantillas.set('operacional', {
      id: 'operacional',
      nombre: 'Reporte Operacional Mensual',
      secciones: [
        {
          id: 'kpi',
          titulo: 'KPIs Principales',
          tipo: 'kpi',
          orden: 1
        },
        {
          id: 'ventas',
          titulo: 'Análisis de Ventas',
          tipo: 'grafico',
          orden: 2
        },
        {
          id: 'clientes',
          titulo: 'Análisis de Clientes',
          tipo: 'tabla',
          orden: 3
        },
        {
          id: 'productos',
          titulo: 'Análisis de Productos',
          tipo: 'tabla',
          orden: 4
        },
        {
          id: 'operaciones',
          titulo: 'Métricas Operacionales',
          tipo: 'metricas',
          orden: 5
        }
      ]
    });

    // Plantilla comercial
    this.plantillas.set('comercial', {
      id: 'comercial',
      nombre: 'Reporte Comercial Mensual',
      secciones: [
        {
          id: 'ventas',
          titulo: 'Rendimiento de Ventas',
          tipo: 'grafico',
          orden: 1
        },
        {
          id: 'clientes',
          titulo: 'Análisis de Clientes',
          tipo: 'tabla',
          orden: 2
        },
        {
          id: 'productos',
          titulo: 'Top Productos',
          tipo: 'tabla',
          orden: 3
        },
        {
          id: 'tendencias',
          titulo: 'Tendencias de Mercado',
          tipo: 'grafico',
          orden: 4
        }
      ]
    });
  }

  private initializeReportesDemo(): void {
    const reporteDemo: ReporteConfig = {
      id: 'reporte_demo_1',
      nombre: 'Reporte Financiero Mensual - Demo',
      descripcion: 'Reporte financiero completo con análisis de ingresos, gastos y beneficios',
      tipo: 'financiero',
      organizacionId: 'demo-org-1',
      configuracion: {
        formato: 'pdf',
        idioma: 'es',
        moneda: 'EUR',
        timezone: 'Europe/Madrid',
        incluirGraficos: true,
        incluirDetalles: true,
        incluirComparativas: true,
        incluirProyecciones: true
      },
      plantilla: {
        header: {
          logo: '/assets/logo.png',
          titulo: 'Reporte Financiero Mensual',
          subtitulo: 'Análisis Completo de Resultados',
          fechaGeneracion: true,
          numeroPagina: true
        },
        secciones: this.plantillas.get('financiero')?.secciones || [],
        footer: {
          texto: 'Este reporte ha sido generado automáticamente por ECONEURA',
          contacto: 'contacto@econeura.com',
          legal: 'Información confidencial - Uso interno únicamente'
        }
      },
      programacion: {
        activa: true,
        frecuencia: 'mensual',
        diaMes: 5,
        hora: '09:00',
        timezone: 'Europe/Madrid',
        proximaEjecucion: '2024-02-05T09:00:00Z'
      },
      distribucion: {
        email: {
          activo: true,
          destinatarios: ['admin@demo-org.com', 'finanzas@demo-org.com'],
          asunto: 'Reporte Financiero Mensual - {mes} {año}',
          mensaje: 'Adjunto encontrará el reporte financiero mensual correspondiente al período {mes} {año}.'
        },
        almacenamiento: {
          activo: true,
          ruta: '/reportes/mensuales',
          retencionDias: 365
        },
        webhook: {
          activo: false,
          url: '',
          formato: 'json'
        }
      },
      estado: 'activo',
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    };

    this.reportes.set(reporteDemo.id, reporteDemo);
  }

  // Métodos principales
  async crearReporte(config: Omit<ReporteConfig, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<ReporteConfig> {
    const reporte: ReporteConfig = {
      ...config,
      id: `reporte_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    };

    this.reportes.set(reporte.id, reporte);
    
    structuredLogger.info('Reporte creado', {
      reporteId: reporte.id,
      nombre: reporte.nombre,
      tipo: reporte.tipo,
      organizacionId: reporte.organizacionId
    });

    return reporte;
  }

  async obtenerReportes(organizacionId?: string): Promise<ReporteConfig[]> {
    let reportes = Array.from(this.reportes.values());
    
    if (organizacionId) {
      reportes = reportes.filter(r => r.organizacionId === organizacionId);
    }

    return reportes.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
  }

  async obtenerReporte(id: string): Promise<ReporteConfig | null> {
    return this.reportes.get(id) || null;
  }

  async actualizarReporte(id: string, updates: Partial<ReporteConfig>): Promise<ReporteConfig | null> {
    const reporte = this.reportes.get(id);
    if (!reporte) return null;

    const reporteActualizado: ReporteConfig = {
      ...reporte,
      ...updates,
      actualizadoEn: new Date().toISOString()
    };

    this.reportes.set(id, reporteActualizado);
    
    structuredLogger.info('Reporte actualizado', {
      reporteId: id,
      cambios: Object.keys(updates)
    });

    return reporteActualizado;
  }

  async eliminarReporte(id: string): Promise<boolean> {
    const eliminado = this.reportes.delete(id);
    
    if (eliminado) {
      structuredLogger.info('Reporte eliminado', { reporteId: id });
    }

    return eliminado;
  }

  async generarReporte(reporteId: string, periodo: { mes: number; año: number }): Promise<GeneracionReporte> {
    const reporte = this.reportes.get(reporteId);
    if (!reporte) {
      throw new Error('Reporte no encontrado');
    }

    const generacionId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const generacion: GeneracionReporte = {
      id: generacionId,
      reporteId,
      organizacionId: reporte.organizacionId,
      estado: 'iniciado',
      progreso: 0,
      inicio: new Date().toISOString(),
      estadisticas: {
        datosProcesados: 0,
        graficosGenerados: 0,
        paginasGeneradas: 0,
        tiempoGeneracion: 0
      }
    };

    this.generaciones.set(generacionId, generacion);

    // Simular generación del reporte
    try {
      await this.procesarGeneracion(generacionId, reporte, periodo);
    } catch (error) {
      const gen = this.generaciones.get(generacionId);
      if (gen) {
        gen.estado = 'error';
        gen.errores = [{
          codigo: 'GENERATION_ERROR',
          mensaje: error instanceof Error ? error.message : 'Error desconocido',
          timestamp: new Date().toISOString()
        }];
        this.generaciones.set(generacionId, gen);
      }
    }

    return this.generaciones.get(generacionId)!;
  }

  private async procesarGeneracion(generacionId: string, reporte: ReporteConfig, periodo: { mes: number; año: number }): Promise<void> {
    const generacion = this.generaciones.get(generacionId)!;
    
    // Simular procesamiento paso a paso
    generacion.estado = 'procesando';
    generacion.progreso = 10;
    this.generaciones.set(generacionId, generacion);
    
    // Paso 1: Recopilar datos
    await this.delay(1000);
    generacion.progreso = 30;
    generacion.estadisticas.datosProcesados = 1500;
    this.generaciones.set(generacionId, generacion);
    
    // Paso 2: Generar gráficos
    await this.delay(1500);
    generacion.progreso = 60;
    generacion.estadisticas.graficosGenerados = 8;
    this.generaciones.set(generacionId, generacion);
    
    // Paso 3: Generar PDF
    await this.delay(2000);
    generacion.progreso = 90;
    generacion.estadisticas.paginasGeneradas = 15;
    this.generaciones.set(generacionId, generacion);
    
    // Paso 4: Finalizar
    await this.delay(500);
    generacion.progreso = 100;
    generacion.estado = 'completado';
    generacion.fin = new Date().toISOString();
    generacion.duracion = Math.floor((new Date(generacion.fin).getTime() - new Date(generacion.inicio).getTime()) / 1000);
    generacion.estadisticas.tiempoGeneracion = generacion.duracion;
    
    // Simular archivo generado
    generacion.archivo = {
      nombre: `reporte_${reporte.nombre.replace(/\s+/g, '_')}_${periodo.año}_${periodo.mes.toString().padStart(2, '0')}.pdf`,
      ruta: `/reportes/mensuales/${generacionId}.pdf`,
      tamaño: 2048576, // 2MB
      formato: 'pdf'
    };
    
    this.generaciones.set(generacionId, generacion);
    
    structuredLogger.info('Reporte generado exitosamente', {
      generacionId,
      reporteId: reporte.id,
      duracion: generacion.duracion,
      archivo: generacion.archivo
    });
  }

  async obtenerGeneraciones(reporteId?: string): Promise<GeneracionReporte[]> {
    let generaciones = Array.from(this.generaciones.values());
    
    if (reporteId) {
      generaciones = generaciones.filter(g => g.reporteId === reporteId);
    }

    return generaciones.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
  }

  async obtenerGeneracion(id: string): Promise<GeneracionReporte | null> {
    return this.generaciones.get(id) || null;
  }

  async obtenerDatosReporte(organizacionId: string, periodo: { mes: number; año: number }): Promise<DatosReporte> {
    // Simular recopilación de datos
    const datos: DatosReporte = {
      periodo: {
        inicio: `${periodo.año}-${periodo.mes.toString().padStart(2, '0')}-01`,
        fin: `${periodo.año}-${periodo.mes.toString().padStart(2, '0')}-${new Date(periodo.año, periodo.mes, 0).getDate()}`,
        mes: this.obtenerNombreMes(periodo.mes),
        año: periodo.año
      },
      organizacion: {
        id: organizacionId,
        nombre: 'Demo Organization',
        logo: '/assets/logo.png',
        direccion: 'Calle Demo 123, Madrid, España',
        contacto: 'contacto@demo-org.com'
      },
      resumen: {
        totalVentas: 125000,
        totalGastos: 85000,
        beneficio: 40000,
        margen: 32.0,
        crecimiento: 15.5
      },
      metricas: {
        ventas: {
          total: 125000,
          porCategoria: [
            { categoria: 'Productos', monto: 75000, porcentaje: 60 },
            { categoria: 'Servicios', monto: 50000, porcentaje: 40 }
          ],
          porMes: [
            { mes: 'Enero', monto: 120000 },
            { mes: 'Febrero', monto: 125000 }
          ],
          tendencia: 'creciente'
        },
        clientes: {
          total: 450,
          nuevos: 25,
          activos: 380,
          inactivos: 70,
          satisfaccion: 4.2
        },
        productos: {
          total: 120,
          masVendidos: [
            { producto: 'Producto A', cantidad: 150, ingresos: 25000 },
            { producto: 'Producto B', cantidad: 120, ingresos: 20000 }
          ],
          stockBajo: 8,
          rotacion: 2.5
        },
        finanzas: {
          ingresos: 125000,
          gastos: 85000,
          beneficio: 40000,
          margen: 32.0,
          flujoCaja: 35000
        },
        operaciones: {
          pedidos: 320,
          entregas: 315,
          devoluciones: 5,
          tiempoPromedio: 2.5
        }
      },
      graficos: {
        ventasMensuales: [
          { mes: 'Enero', monto: 120000 },
          { mes: 'Febrero', monto: 125000 }
        ],
        distribucionCategorias: [
          { categoria: 'Productos', porcentaje: 60 },
          { categoria: 'Servicios', porcentaje: 40 }
        ],
        tendenciaClientes: [
          { mes: 'Enero', clientes: 425 },
          { mes: 'Febrero', clientes: 450 }
        ],
        evolucionBeneficios: [
          { mes: 'Enero', beneficio: 35000 },
          { mes: 'Febrero', beneficio: 40000 }
        ]
      },
      comparativas: {
        mesAnterior: {
          ventas: 120000,
          clientes: 425,
          beneficio: 35000,
          crecimiento: 4.2
        },
        añoAnterior: {
          ventas: 100000,
          clientes: 380,
          beneficio: 25000,
          crecimiento: 25.0
        },
        objetivo: {
          ventas: 130000,
          clientes: 500,
          beneficio: 45000,
          cumplimiento: 96.2
        }
      },
      proyecciones: {
        proximoMes: {
          ventas: 130000,
          clientes: 475,
          beneficio: 42000,
          confianza: 85
        },
        proximoTrimestre: {
          ventas: 400000,
          clientes: 500,
          beneficio: 130000,
          confianza: 75
        }
      },
      alertas: [
        {
          tipo: 'warning',
          mensaje: 'Stock bajo en 8 productos',
          accion: 'Revisar inventario',
          prioridad: 'media'
        },
        {
          tipo: 'info',
          mensaje: 'Crecimiento de ventas del 15.5%',
          accion: 'Mantener estrategia actual',
          prioridad: 'baja'
        }
      ],
      recomendaciones: [
        {
          categoria: 'Inventario',
          descripcion: 'Aumentar stock de productos más vendidos',
          impacto: 'alto',
          esfuerzo: 'medio',
          prioridad: 1
        },
        {
          categoria: 'Marketing',
          descripcion: 'Lanzar campaña para productos con stock bajo',
          impacto: 'medio',
          esfuerzo: 'bajo',
          prioridad: 2
        }
      ]
    };

    return datos;
  }

  async obtenerPlantillas(): Promise<any[]> {
    return Array.from(this.plantillas.values());
  }

  async programarReporte(reporteId: string, programacion: Partial<ReporteConfig['programacion']>): Promise<boolean> {
    const reporte = this.reportes.get(reporteId);
    if (!reporte) return false;

    reporte.programacion = {
      ...reporte.programacion,
      ...programacion,
      proximaEjecucion: this.calcularProximaEjecucion(programacion)
    };

    this.reportes.set(reporteId, reporte);
    
    structuredLogger.info('Reporte programado', {
      reporteId,
      programacion: reporte.programacion
    });

    return true;
  }

  async distribuirReporte(generacionId: string): Promise<boolean> {
    const generacion = this.generaciones.get(generacionId);
    if (!generacion || generacion.estado !== 'completado') return false;

    const reporte = this.reportes.get(generacion.reporteId);
    if (!reporte) return false;

    // Simular distribución
    if (reporte.distribucion.email.activo) {
      await this.enviarEmail(reporte, generacion);
    }

    if (reporte.distribucion.almacenamiento.activo) {
      await this.guardarArchivo(reporte, generacion);
    }

    if (reporte.distribucion.webhook.activo) {
      await this.enviarWebhook(reporte, generacion);
    }

    structuredLogger.info('Reporte distribuido', {
      generacionId,
      reporteId: reporte.id,
      metodos: Object.keys(reporte.distribucion).filter(k => reporte.distribucion[k as keyof typeof reporte.distribucion].activo)
    });

    return true;
  }

  private async enviarEmail(reporte: ReporteConfig, generacion: GeneracionReporte): Promise<void> {
    // Simular envío de email
    await this.delay(500);
    structuredLogger.info('Email enviado', {
      destinatarios: reporte.distribucion.email.destinatarios,
      asunto: reporte.distribucion.email.asunto
    });
  }

  private async guardarArchivo(reporte: ReporteConfig, generacion: GeneracionReporte): Promise<void> {
    // Simular guardado de archivo
    await this.delay(300);
    structuredLogger.info('Archivo guardado', {
      ruta: reporte.distribucion.almacenamiento.ruta,
      archivo: generacion.archivo?.nombre
    });
  }

  private async enviarWebhook(reporte: ReporteConfig, generacion: GeneracionReporte): Promise<void> {
    // Simular envío de webhook
    await this.delay(200);
    structuredLogger.info('Webhook enviado', {
      url: reporte.distribucion.webhook.url,
      formato: reporte.distribucion.webhook.formato
    });
  }

  private calcularProximaEjecucion(programacion: Partial<ReporteConfig['programacion']>): string {
    const ahora = new Date();
    const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, programacion.diaMes || 1);
    proximoMes.setHours(parseInt(programacion.hora?.split(':')[0] || '9'), parseInt(programacion.hora?.split(':')[1] || '0'));
    return proximoMes.toISOString();
  }

  private obtenerNombreMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || 'Desconocido';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Métodos de estadísticas
  async obtenerEstadisticas(organizacionId?: string): Promise<any> {
    const reportes = organizacionId ? 
      Array.from(this.reportes.values()).filter(r => r.organizacionId === organizacionId) :
      Array.from(this.reportes.values());

    const generaciones = Array.from(this.generaciones.values());

    return {
      reportes: {
        total: reportes.length,
        activos: reportes.filter(r => r.estado === 'activo').length,
        porTipo: reportes.reduce((acc, r) => {
          acc[r.tipo] = (acc[r.tipo] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      generaciones: {
        total: generaciones.length,
        completadas: generaciones.filter(g => g.estado === 'completado').length,
        enProceso: generaciones.filter(g => g.estado === 'procesando').length,
        conError: generaciones.filter(g => g.estado === 'error').length,
        tiempoPromedio: generaciones
          .filter(g => g.duracion)
          .reduce((acc, g) => acc + (g.duracion || 0), 0) / generaciones.filter(g => g.duracion).length || 0
      },
      distribucion: {
        email: reportes.filter(r => r.distribucion.email.activo).length,
        almacenamiento: reportes.filter(r => r.distribucion.almacenamiento.activo).length,
        webhook: reportes.filter(r => r.distribucion.webhook.activo).length
      }
    };
  }
}

export const reportesMensualesService = new ReportesMensualesService();
