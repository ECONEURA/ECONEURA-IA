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
        diaMes: number;
        hora: string;
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
            porCategoria: Array<{
                categoria: string;
                monto: number;
                porcentaje: number;
            }>;
            porMes: Array<{
                mes: string;
                monto: number;
            }>;
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
            masVendidos: Array<{
                producto: string;
                cantidad: number;
                ingresos: number;
            }>;
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
        ventasMensuales: Array<{
            mes: string;
            monto: number;
        }>;
        distribucionCategorias: Array<{
            categoria: string;
            porcentaje: number;
        }>;
        tendenciaClientes: Array<{
            mes: string;
            clientes: number;
        }>;
        evolucionBeneficios: Array<{
            mes: string;
            beneficio: number;
        }>;
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
    progreso: number;
    inicio: string;
    fin?: string;
    duracion?: number;
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
declare class ReportesMensualesService {
    private reportes;
    private generaciones;
    private plantillas;
    constructor();
    private initializePlantillas;
    private initializeReportesDemo;
    crearReporte(config: Omit<ReporteConfig, 'id' | 'creadoEn' | 'actualizadoEn'>): Promise<ReporteConfig>;
    obtenerReportes(organizacionId?: string): Promise<ReporteConfig[]>;
    obtenerReporte(id: string): Promise<ReporteConfig | null>;
    actualizarReporte(id: string, updates: Partial<ReporteConfig>): Promise<ReporteConfig | null>;
    eliminarReporte(id: string): Promise<boolean>;
    generarReporte(reporteId: string, periodo: {
        mes: number;
        año: number;
    }): Promise<GeneracionReporte>;
    private procesarGeneracion;
    obtenerGeneraciones(reporteId?: string): Promise<GeneracionReporte[]>;
    obtenerGeneracion(id: string): Promise<GeneracionReporte | null>;
    obtenerDatosReporte(organizacionId: string, periodo: {
        mes: number;
        año: number;
    }): Promise<DatosReporte>;
    obtenerPlantillas(): Promise<any[]>;
    programarReporte(reporteId: string, programacion: Partial<ReporteConfig['programacion']>): Promise<boolean>;
    distribuirReporte(generacionId: string): Promise<boolean>;
    private enviarEmail;
    private guardarArchivo;
    private enviarWebhook;
    private calcularProximaEjecucion;
    private obtenerNombreMes;
    private delay;
    obtenerEstadisticas(organizacionId?: string): Promise<any>;
}
export declare const reportesMensualesService: ReportesMensualesService;
export {};
//# sourceMappingURL=reportes-mensuales.service.d.ts.map