import { structuredLogger } from './structured-logger.js';
class ReportesMensualesService {
    reportes = new Map();
    generaciones = new Map();
    plantillas = new Map();
    constructor() {
        this.initializePlantillas();
        this.initializeReportesDemo();
        structuredLogger.info('Reportes Mensuales Service initialized', {
            reportesCount: this.reportes.size,
            plantillasCount: this.plantillas.size
        });
    }
    initializePlantillas() {
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
    initializeReportesDemo() {
        const reporteDemo = {
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
    async crearReporte(config) {
        const reporte = {
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
    async obtenerReportes(organizacionId) {
        let reportes = Array.from(this.reportes.values());
        if (organizacionId) {
            reportes = reportes.filter(r => r.organizacionId === organizacionId);
        }
        return reportes.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
    }
    async obtenerReporte(id) {
        return this.reportes.get(id) || null;
    }
    async actualizarReporte(id, updates) {
        const reporte = this.reportes.get(id);
        if (!reporte)
            return null;
        const reporteActualizado = {
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
    async eliminarReporte(id) {
        const eliminado = this.reportes.delete(id);
        if (eliminado) {
            structuredLogger.info('Reporte eliminado', { reporteId: id });
        }
        return eliminado;
    }
    async generarReporte(reporteId, periodo) {
        const reporte = this.reportes.get(reporteId);
        if (!reporte) {
            throw new Error('Reporte no encontrado');
        }
        const generacionId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const generacion = {
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
        try {
            await this.procesarGeneracion(generacionId, reporte, periodo);
        }
        catch (error) {
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
        return this.generaciones.get(generacionId);
    }
    async procesarGeneracion(generacionId, reporte, periodo) {
        const generacion = this.generaciones.get(generacionId);
        generacion.estado = 'procesando';
        generacion.progreso = 10;
        this.generaciones.set(generacionId, generacion);
        await this.delay(1000);
        generacion.progreso = 30;
        generacion.estadisticas.datosProcesados = 1500;
        this.generaciones.set(generacionId, generacion);
        await this.delay(1500);
        generacion.progreso = 60;
        generacion.estadisticas.graficosGenerados = 8;
        this.generaciones.set(generacionId, generacion);
        await this.delay(2000);
        generacion.progreso = 90;
        generacion.estadisticas.paginasGeneradas = 15;
        this.generaciones.set(generacionId, generacion);
        await this.delay(500);
        generacion.progreso = 100;
        generacion.estado = 'completado';
        generacion.fin = new Date().toISOString();
        generacion.duracion = Math.floor((new Date(generacion.fin).getTime() - new Date(generacion.inicio).getTime()) / 1000);
        generacion.estadisticas.tiempoGeneracion = generacion.duracion;
        generacion.archivo = {
            nombre: `reporte_${reporte.nombre.replace(/\s+/g, '_')}_${periodo.año}_${periodo.mes.toString().padStart(2, '0')}.pdf`,
            ruta: `/reportes/mensuales/${generacionId}.pdf`,
            tamaño: 2048576,
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
    async obtenerGeneraciones(reporteId) {
        let generaciones = Array.from(this.generaciones.values());
        if (reporteId) {
            generaciones = generaciones.filter(g => g.reporteId === reporteId);
        }
        return generaciones.sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
    }
    async obtenerGeneracion(id) {
        return this.generaciones.get(id) || null;
    }
    async obtenerDatosReporte(organizacionId, periodo) {
        const datos = {
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
    async obtenerPlantillas() {
        return Array.from(this.plantillas.values());
    }
    async programarReporte(reporteId, programacion) {
        const reporte = this.reportes.get(reporteId);
        if (!reporte)
            return false;
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
    async distribuirReporte(generacionId) {
        const generacion = this.generaciones.get(generacionId);
        if (!generacion || generacion.estado !== 'completado')
            return false;
        const reporte = this.reportes.get(generacion.reporteId);
        if (!reporte)
            return false;
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
            metodos: Object.keys(reporte.distribucion).filter(k => reporte.distribucion[k].activo)
        });
        return true;
    }
    async enviarEmail(reporte, generacion) {
        await this.delay(500);
        structuredLogger.info('Email enviado', {
            destinatarios: reporte.distribucion.email.destinatarios,
            asunto: reporte.distribucion.email.asunto
        });
    }
    async guardarArchivo(reporte, generacion) {
        await this.delay(300);
        structuredLogger.info('Archivo guardado', {
            ruta: reporte.distribucion.almacenamiento.ruta,
            archivo: generacion.archivo?.nombre
        });
    }
    async enviarWebhook(reporte, generacion) {
        await this.delay(200);
        structuredLogger.info('Webhook enviado', {
            url: reporte.distribucion.webhook.url,
            formato: reporte.distribucion.webhook.formato
        });
    }
    calcularProximaEjecucion(programacion) {
        const ahora = new Date();
        const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, programacion.diaMes || 1);
        proximoMes.setHours(parseInt(programacion.hora?.split(':')[0] || '9'), parseInt(programacion.hora?.split(':')[1] || '0'));
        return proximoMes.toISOString();
    }
    obtenerNombreMes(mes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[mes - 1] || 'Desconocido';
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async obtenerEstadisticas(organizacionId) {
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
                }, {})
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
//# sourceMappingURL=reportes-mensuales.service.js.map