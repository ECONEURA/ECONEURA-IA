import { z } from 'zod';
import { AgentDescriptor, AgentContext, AgentResult, AgentPolicy } from './types.js';

// Common input/output schemas
const TextInputSchema = z.object({
  text: z.string(),
  context: z.string().optional(),
  language: z.string().default('es'),
});

const TextOutputSchema = z.object({
  result: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});

const CompanyDataSchema = z.object({
  name: z.string(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

const ContactDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
});

const DealDataSchema = z.object({
  title: z.string(),
  value: z.number().positive(),
  stage: z.string(),
  probability: z.number().min(0).max(100),
});

// Agent policies by category
const ventasPolicy: AgentPolicy = {
  maxExecutionTimeMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
  requiresApproval: false,
  costCategory: 'medium',
};

const marketingPolicy: AgentPolicy = {
  maxExecutionTimeMs: 45000,
  maxRetries: 2,
  retryDelayMs: 2000,
  requiresApproval: false,
  costCategory: 'medium',
};

const operacionesPolicy: AgentPolicy = {
  maxExecutionTimeMs: 60000,
  maxRetries: 3,
  retryDelayMs: 1500,
  requiresApproval: true,
  costCategory: 'high',
};

const finanzasPolicy: AgentPolicy = {
  maxExecutionTimeMs: 20000,
  maxRetries: 2,
  retryDelayMs: 1000,
  requiresApproval: true,
  costCategory: 'low',
};

const soporteQaPolicy: AgentPolicy = {
  maxExecutionTimeMs: 40000,
  maxRetries: 2,
  retryDelayMs: 2000,
  requiresApproval: false,
  costCategory: 'medium',
};

// Mock agent execution function
async function mockAgentRun(inputs: unknown, context: AgentContext): Promise<AgentResult> {
  const startTime = Date.now();
  
  // Simulate processing time (100-500ms)
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  
  const executionTime = Date.now() - startTime;
  
  return {
    success: true,
    data: { result: "Mock result", inputs, context },
    costEur: Math.random() * 0.05, // Random cost up to 5 cents
    executionTimeMs: executionTime,
    metadata: {
      agentVersion: "1.0.0",
      provider: "mistral-local"
    }
  };
}

// VENTAS AGENTS (12 agents)
const ventasAgents: AgentDescriptor[] = [
  {
    id: 'lead-enrich',
    name: 'Enriquecimiento de Leads',
    description: 'Enriquece información de leads con datos externos',
    category: 'ventas',
    inputs: z.object({
      company: z.string(),
      website: z.string().url().optional(),
    }),
    outputs: CompanyDataSchema,
    policy: ventasPolicy,
    costHint: '€0.02-0.05 por lead',
    run: mockAgentRun,
  },
  {
    id: 'score',
    name: 'Scoring de Leads',
    description: 'Calcula puntuación de calidad del lead',
    category: 'ventas',
    inputs: z.object({
      company: CompanyDataSchema,
      contact: ContactDataSchema,
      interactions: z.array(z.string()),
    }),
    outputs: z.object({
      score: z.number().min(0).max(100),
      factors: z.array(z.string()),
      recommendation: z.string(),
    }),
    policy: ventasPolicy,
    costHint: '€0.01-0.03 por scoring',
    run: mockAgentRun,
  },
  {
    id: 'next-best-action',
    name: 'Próxima Mejor Acción',
    description: 'Sugiere la siguiente acción más efectiva',
    category: 'ventas',
    inputs: z.object({
      deal: DealDataSchema,
      history: z.array(z.string()),
      context: z.string(),
    }),
    outputs: z.object({
      action: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      reasoning: z.string(),
      timeline: z.string(),
    }),
    policy: ventasPolicy,
    costHint: '€0.03-0.08 por sugerencia',
    run: mockAgentRun,
  },
  {
    id: 'email-draft',
    name: 'Borrador de Email',
    description: 'Genera borradores de emails personalizados',
    category: 'ventas',
    inputs: z.object({
      recipient: ContactDataSchema,
      purpose: z.string(),
      tone: z.enum(['formal', 'casual', 'friendly']),
      context: z.string(),
    }),
    outputs: z.object({
      subject: z.string(),
      body: z.string(),
      attachments: z.array(z.string()).optional(),
    }),
    policy: ventasPolicy,
    costHint: '€0.02-0.06 por email',
    run: mockAgentRun,
  },
  {
    id: 'follow-up',
    name: 'Seguimiento Automático',
    description: 'Programa y ejecuta seguimientos automáticos',
    category: 'ventas',
    inputs: z.object({
      deal: DealDataSchema,
      lastContact: z.string(),
      followUpType: z.enum(['email', 'call', 'meeting']),
    }),
    outputs: z.object({
      schedule: z.string(),
      message: z.string(),
      reminders: z.array(z.string()),
    }),
    policy: ventasPolicy,
    costHint: '€0.01-0.04 por seguimiento',
    run: mockAgentRun,
  },
  {
    id: 'quote-gen',
    name: 'Generador de Cotizaciones',
    description: 'Genera cotizaciones personalizadas',
    category: 'ventas',
    inputs: z.object({
      products: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
      })),
      client: CompanyDataSchema,
      terms: z.string().optional(),
    }),
    outputs: z.object({
      quoteId: z.string(),
      total: z.number(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        price: z.number(),
        subtotal: z.number(),
      })),
      validUntil: z.string(),
    }),
    policy: ventasPolicy,
    costHint: '€0.05-0.10 por cotización',
    run: mockAgentRun,
  },
  {
    id: 'churn-risk',
    name: 'Riesgo de Abandono',
    description: 'Identifica clientes en riesgo de abandono',
    category: 'ventas',
    inputs: z.object({
      clientId: z.string(),
      interactions: z.array(z.string()),
      usage: z.record(z.number()),
    }),
    outputs: z.object({
      riskLevel: z.enum(['low', 'medium', 'high']),
      probability: z.number().min(0).max(100),
      factors: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    policy: ventasPolicy,
    costHint: '€0.03-0.07 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'upsell-tip',
    name: 'Oportunidades de Upsell',
    description: 'Identifica oportunidades de venta cruzada',
    category: 'ventas',
    inputs: z.object({
      clientId: z.string(),
      currentProducts: z.array(z.string()),
      usage: z.record(z.number()),
    }),
    outputs: z.object({
      opportunities: z.array(z.object({
        product: z.string(),
        confidence: z.number(),
        reasoning: z.string(),
        potential: z.number(),
      })),
    }),
    policy: ventasPolicy,
    costHint: '€0.04-0.09 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'notes-to-crm',
    name: 'Notas a CRM',
    description: 'Estructura notas de reuniones para CRM',
    category: 'ventas',
    inputs: z.object({
      rawNotes: z.string(),
      participants: z.array(z.string()),
      meetingType: z.string(),
    }),
    outputs: z.object({
      summary: z.string(),
      actionItems: z.array(z.string()),
      nextSteps: z.array(z.string()),
      tags: z.array(z.string()),
    }),
    policy: ventasPolicy,
    costHint: '€0.02-0.05 por nota',
    run: mockAgentRun,
  },
  {
    id: 'summary-call',
    name: 'Resumen de Llamadas',
    description: 'Genera resúmenes de llamadas comerciales',
    category: 'ventas',
    inputs: z.object({
      transcript: z.string(),
      duration: z.number(),
      participants: z.array(z.string()),
    }),
    outputs: z.object({
      summary: z.string(),
      keyPoints: z.array(z.string()),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      followUp: z.string(),
    }),
    policy: ventasPolicy,
    costHint: '€0.03-0.08 por llamada',
    run: mockAgentRun,
  },
  {
    id: 'agenda-gen',
    name: 'Generador de Agendas',
    description: 'Crea agendas para reuniones comerciales',
    category: 'ventas',
    inputs: z.object({
      meetingType: z.string(),
      participants: z.array(z.string()),
      objectives: z.array(z.string()),
      duration: z.number(),
    }),
    outputs: z.object({
      agenda: z.array(z.object({
        topic: z.string(),
        duration: z.number(),
        owner: z.string(),
      })),
      materials: z.array(z.string()),
      preparation: z.array(z.string()),
    }),
    policy: ventasPolicy,
    costHint: '€0.02-0.05 por agenda',
    run: mockAgentRun,
  },
  {
    id: 'nps-insight',
    name: 'Insights de NPS',
    description: 'Analiza feedback de NPS para insights',
    category: 'ventas',
    inputs: z.object({
      responses: z.array(z.object({
        score: z.number().min(0).max(10),
        comment: z.string().optional(),
      })),
      period: z.string(),
    }),
    outputs: z.object({
      npsScore: z.number(),
      trends: z.array(z.string()),
      insights: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    policy: ventasPolicy,
    costHint: '€0.05-0.12 por análisis',
    run: mockAgentRun,
  },
];

// MARKETING AGENTS (12 agents)
const marketingAgents: AgentDescriptor[] = [
  {
    id: 'segment-build',
    name: 'Constructor de Segmentos',
    description: 'Crea segmentos de audiencia inteligentes',
    category: 'marketing',
    inputs: z.object({
      criteria: z.array(z.string()),
      audience: z.array(z.record(z.unknown())),
      objective: z.string(),
    }),
    outputs: z.object({
      segments: z.array(z.object({
        name: z.string(),
        size: z.number(),
        criteria: z.array(z.string()),
        potential: z.number(),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.06-0.15 por segmentación',
    run: mockAgentRun,
  },
  {
    id: 'subject-ab',
    name: 'A/B Test de Asuntos',
    description: 'Genera variantes de asuntos para A/B testing',
    category: 'marketing',
    inputs: z.object({
      baseSubject: z.string(),
      audience: z.string(),
      goal: z.enum(['open_rate', 'click_rate', 'conversion']),
    }),
    outputs: z.object({
      variants: z.array(z.object({
        subject: z.string(),
        reasoning: z.string(),
        expectedPerformance: z.number(),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.03-0.07 por test',
    run: mockAgentRun,
  },
  {
    id: 'copy-rewrite',
    name: 'Reescritura de Copy',
    description: 'Optimiza textos de marketing para conversión',
    category: 'marketing',
    inputs: z.object({
      originalCopy: z.string(),
      objective: z.string(),
      audience: z.string(),
      tone: z.enum(['professional', 'casual', 'urgent', 'friendly']),
    }),
    outputs: z.object({
      optimizedCopy: z.string(),
      improvements: z.array(z.string()),
      expectedLift: z.number(),
    }),
    policy: marketingPolicy,
    costHint: '€0.04-0.10 por reescritura',
    run: mockAgentRun,
  },
  {
    id: 'cta-suggest',
    name: 'Sugerencias de CTA',
    description: 'Genera llamadas a la acción optimizadas',
    category: 'marketing',
    inputs: z.object({
      context: z.string(),
      goal: z.string(),
      audience: z.string(),
      placement: z.enum(['email', 'web', 'social', 'ad']),
    }),
    outputs: z.object({
      suggestions: z.array(z.object({
        text: z.string(),
        style: z.string(),
        reasoning: z.string(),
        confidence: z.number(),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.02-0.06 por sugerencia',
    run: mockAgentRun,
  },
  {
    id: 'utm-audit',
    name: 'Auditoría de UTMs',
    description: 'Revisa y optimiza parámetros UTM',
    category: 'marketing',
    inputs: z.object({
      urls: z.array(z.string().url()),
      campaigns: z.array(z.string()),
    }),
    outputs: z.object({
      issues: z.array(z.string()),
      recommendations: z.array(z.string()),
      optimizedUrls: z.array(z.string()),
    }),
    policy: marketingPolicy,
    costHint: '€0.03-0.08 por auditoría',
    run: mockAgentRun,
  },
  {
    id: 'seo-brief',
    name: 'Brief de SEO',
    description: 'Genera briefs de contenido SEO',
    category: 'marketing',
    inputs: z.object({
      keyword: z.string(),
      competitors: z.array(z.string()),
      intent: z.enum(['informational', 'commercial', 'transactional']),
    }),
    outputs: z.object({
      title: z.string(),
      outline: z.array(z.string()),
      keywords: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    policy: marketingPolicy,
    costHint: '€0.05-0.12 por brief',
    run: mockAgentRun,
  },
  {
    id: 'post-calendar',
    name: 'Calendario de Posts',
    description: 'Planifica contenido para redes sociales',
    category: 'marketing',
    inputs: z.object({
      brand: z.string(),
      platforms: z.array(z.string()),
      frequency: z.string(),
      topics: z.array(z.string()),
    }),
    outputs: z.object({
      calendar: z.array(z.object({
        date: z.string(),
        platform: z.string(),
        content: z.string(),
        hashtags: z.array(z.string()),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.08-0.20 por mes',
    run: mockAgentRun,
  },
  {
    id: 'trend-scan',
    name: 'Scanner de Tendencias',
    description: 'Identifica tendencias relevantes del mercado',
    category: 'marketing',
    inputs: z.object({
      industry: z.string(),
      keywords: z.array(z.string()),
      timeframe: z.string(),
    }),
    outputs: z.object({
      trends: z.array(z.object({
        name: z.string(),
        momentum: z.number(),
        relevance: z.number(),
        opportunity: z.string(),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.10-0.25 por escaneo',
    run: mockAgentRun,
  },
  {
    id: 'outreach-list',
    name: 'Lista de Outreach',
    description: 'Genera listas de contactos para outreach',
    category: 'marketing',
    inputs: z.object({
      criteria: z.object({
        industry: z.string(),
        size: z.string(),
        location: z.string(),
      }),
      purpose: z.string(),
    }),
    outputs: z.object({
      contacts: z.array(z.object({
        name: z.string(),
        company: z.string(),
        email: z.string(),
        relevance: z.number(),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.15-0.40 por lista',
    run: mockAgentRun,
  },
  {
    id: 'persona-synth',
    name: 'Síntesis de Personas',
    description: 'Crea buyer personas basadas en datos',
    category: 'marketing',
    inputs: z.object({
      customerData: z.array(z.record(z.unknown())),
      demographics: z.record(z.unknown()),
      behaviors: z.array(z.string()),
    }),
    outputs: z.object({
      personas: z.array(z.object({
        name: z.string(),
        demographics: z.record(z.unknown()),
        motivations: z.array(z.string()),
        painPoints: z.array(z.string()),
        channels: z.array(z.string()),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.12-0.30 por síntesis',
    run: mockAgentRun,
  },
  {
    id: 'landing-critique',
    name: 'Crítica de Landing',
    description: 'Analiza y mejora páginas de aterrizaje',
    category: 'marketing',
    inputs: z.object({
      url: z.string().url(),
      objective: z.string(),
      audience: z.string(),
    }),
    outputs: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(z.string()),
      recommendations: z.array(z.string()),
      priority: z.array(z.string()),
    }),
    policy: marketingPolicy,
    costHint: '€0.08-0.18 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'faq-gen',
    name: 'Generador de FAQ',
    description: 'Crea FAQs basadas en consultas comunes',
    category: 'marketing',
    inputs: z.object({
      product: z.string(),
      commonQuestions: z.array(z.string()),
      audience: z.string(),
    }),
    outputs: z.object({
      faqs: z.array(z.object({
        question: z.string(),
        answer: z.string(),
        category: z.string(),
        priority: z.number(),
      })),
    }),
    policy: marketingPolicy,
    costHint: '€0.06-0.15 por conjunto',
    run: mockAgentRun,
  },
];

// OPERACIONES AGENTS (12 agents)
const operacionesAgents: AgentDescriptor[] = [
  {
    id: 'ticket-triage',
    name: 'Triaje de Tickets',
    description: 'Clasifica y prioriza tickets de soporte',
    category: 'operaciones',
    inputs: z.object({
      ticket: z.object({
        subject: z.string(),
        description: z.string(),
        sender: z.string(),
        urgency: z.string().optional(),
      }),
    }),
    outputs: z.object({
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      category: z.string(),
      assignee: z.string().optional(),
      estimatedResolution: z.string(),
    }),
    policy: operacionesPolicy,
    costHint: '€0.02-0.05 por ticket',
    run: mockAgentRun,
  },
  {
    id: 'kb-suggest',
    name: 'Sugerencias de KB',
    description: 'Sugiere artículos relevantes de la base de conocimiento',
    category: 'operaciones',
    inputs: z.object({
      query: z.string(),
      context: z.string(),
      userRole: z.string(),
    }),
    outputs: z.object({
      suggestions: z.array(z.object({
        title: z.string(),
        url: z.string(),
        relevance: z.number(),
        summary: z.string(),
      })),
    }),
    policy: operacionesPolicy,
    costHint: '€0.01-0.03 por consulta',
    run: mockAgentRun,
  },
  {
    id: 'sop-draft',
    name: 'Borrador de SOP',
    description: 'Genera borradores de procedimientos operativos',
    category: 'operaciones',
    inputs: z.object({
      process: z.string(),
      stakeholders: z.array(z.string()),
      requirements: z.array(z.string()),
    }),
    outputs: z.object({
      sop: z.object({
        title: z.string(),
        purpose: z.string(),
        steps: z.array(z.string()),
        responsibilities: z.record(z.string()),
        controls: z.array(z.string()),
      }),
    }),
    policy: operacionesPolicy,
    costHint: '€0.10-0.25 por SOP',
    run: mockAgentRun,
  },
  {
    id: 'escalado-policy',
    name: 'Política de Escalado',
    description: 'Define políticas automáticas de escalado',
    category: 'operaciones',
    inputs: z.object({
      service: z.string(),
      metrics: z.array(z.string()),
      thresholds: z.record(z.number()),
    }),
    outputs: z.object({
      policy: z.object({
        triggers: z.array(z.string()),
        actions: z.array(z.string()),
        cooldown: z.string(),
        notifications: z.array(z.string()),
      }),
    }),
    policy: operacionesPolicy,
    costHint: '€0.08-0.20 por política',
    run: mockAgentRun,
  },
  {
    id: 'capacity-plan',
    name: 'Planificación de Capacidad',
    description: 'Planifica necesidades futuras de capacidad',
    category: 'operaciones',
    inputs: z.object({
      currentMetrics: z.record(z.number()),
      growthProjections: z.record(z.number()),
      constraints: z.array(z.string()),
    }),
    outputs: z.object({
      recommendations: z.array(z.object({
        resource: z.string(),
        currentCapacity: z.number(),
        projectedNeed: z.number(),
        timeline: z.string(),
        cost: z.number(),
      })),
    }),
    policy: operacionesPolicy,
    costHint: '€0.15-0.35 por plan',
    run: mockAgentRun,
  },
  {
    id: 'stock-alert',
    name: 'Alertas de Stock',
    description: 'Genera alertas inteligentes de inventario',
    category: 'operaciones',
    inputs: z.object({
      products: z.array(z.object({
        id: z.string(),
        currentStock: z.number(),
        minLevel: z.number(),
        demandForecast: z.number(),
      })),
    }),
    outputs: z.object({
      alerts: z.array(z.object({
        productId: z.string(),
        alertType: z.enum(['low_stock', 'stockout_risk', 'overstock']),
        urgency: z.enum(['low', 'medium', 'high']),
        recommendation: z.string(),
      })),
    }),
    policy: operacionesPolicy,
    costHint: '€0.05-0.12 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'supplier-ping',
    name: 'Ping a Proveedores',
    description: 'Contacta automáticamente con proveedores',
    category: 'operaciones',
    inputs: z.object({
      supplierId: z.string(),
      purpose: z.enum(['quote', 'delivery', 'quality', 'general']),
      urgency: z.enum(['low', 'medium', 'high']),
      details: z.string(),
    }),
    outputs: z.object({
      message: z.string(),
      channel: z.string(),
      expectedResponse: z.string(),
      followUpDate: z.string(),
    }),
    policy: operacionesPolicy,
    costHint: '€0.03-0.08 por contacto',
    run: mockAgentRun,
  },
  {
    id: 'shipment-eta',
    name: 'ETA de Envíos',
    description: 'Calcula tiempos estimados de entrega',
    category: 'operaciones',
    inputs: z.object({
      origin: z.string(),
      destination: z.string(),
      carrier: z.string(),
      serviceType: z.string(),
      weight: z.number(),
    }),
    outputs: z.object({
      estimatedDelivery: z.string(),
      confidence: z.number(),
      factors: z.array(z.string()),
      alternatives: z.array(z.object({
        carrier: z.string(),
        eta: z.string(),
        cost: z.number(),
      })),
    }),
    policy: operacionesPolicy,
    costHint: '€0.02-0.05 por cálculo',
    run: mockAgentRun,
  },
  {
    id: 'sla-watch',
    name: 'Monitor de SLA',
    description: 'Monitorea cumplimiento de SLAs',
    category: 'operaciones',
    inputs: z.object({
      service: z.string(),
      metrics: z.record(z.number()),
      slaTargets: z.record(z.number()),
    }),
    outputs: z.object({
      status: z.enum(['ok', 'warning', 'breach']),
      violations: z.array(z.string()),
      riskFactors: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    policy: operacionesPolicy,
    costHint: '€0.04-0.10 por servicio',
    run: mockAgentRun,
  },
  {
    id: 'task-bundle',
    name: 'Agrupador de Tareas',
    description: 'Agrupa tareas relacionadas para eficiencia',
    category: 'operaciones',
    inputs: z.object({
      tasks: z.array(z.object({
        id: z.string(),
        type: z.string(),
        priority: z.string(),
        estimatedTime: z.number(),
        dependencies: z.array(z.string()),
      })),
    }),
    outputs: z.object({
      bundles: z.array(z.object({
        tasks: z.array(z.string()),
        estimatedTime: z.number(),
        efficiency: z.number(),
        assignee: z.string().optional(),
      })),
    }),
    policy: operacionesPolicy,
    costHint: '€0.06-0.15 por agrupación',
    run: mockAgentRun,
  },
  {
    id: 'meeting-notes',
    name: 'Notas de Reuniones',
    description: 'Estructura notas de reuniones operativas',
    category: 'operaciones',
    inputs: z.object({
      transcript: z.string(),
      attendees: z.array(z.string()),
      meetingType: z.string(),
      agenda: z.array(z.string()).optional(),
    }),
    outputs: z.object({
      summary: z.string(),
      decisions: z.array(z.string()),
      actionItems: z.array(z.object({
        task: z.string(),
        owner: z.string(),
        dueDate: z.string(),
      })),
      nextMeeting: z.string().optional(),
    }),
    policy: operacionesPolicy,
    costHint: '€0.05-0.12 por reunión',
    run: mockAgentRun,
  },
  {
    id: 'action-items',
    name: 'Extractor de Acciones',
    description: 'Extrae elementos de acción de conversaciones',
    category: 'operaciones',
    inputs: z.object({
      text: z.string(),
      context: z.string(),
      participants: z.array(z.string()),
    }),
    outputs: z.object({
      actionItems: z.array(z.object({
        description: z.string(),
        owner: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        dueDate: z.string().optional(),
      })),
    }),
    policy: operacionesPolicy,
    costHint: '€0.03-0.08 por extracción',
    run: mockAgentRun,
  },
];

// FINANZAS AGENTS (12 agents)
const finanzasAgents: AgentDescriptor[] = [
  {
    id: 'invoice-extract',
    name: 'Extractor de Facturas',
    description: 'Extrae datos estructurados de facturas',
    category: 'finanzas',
    inputs: z.object({
      documentUrl: z.string().url(),
      format: z.enum(['pdf', 'image', 'xml']),
    }),
    outputs: z.object({
      invoiceNumber: z.string(),
      date: z.string(),
      amount: z.number(),
      tax: z.number(),
      vendor: z.string(),
      lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        price: z.number(),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.05-0.15 por factura',
    run: mockAgentRun,
  },
  {
    id: 'ar-prioritize',
    name: 'Priorización de Cuentas por Cobrar',
    description: 'Prioriza cobros según probabilidad y valor',
    category: 'finanzas',
    inputs: z.object({
      invoices: z.array(z.object({
        id: z.string(),
        amount: z.number(),
        daysOverdue: z.number(),
        clientHistory: z.string(),
      })),
    }),
    outputs: z.object({
      prioritizedList: z.array(z.object({
        invoiceId: z.string(),
        priority: z.number(),
        strategy: z.string(),
        expectedRecovery: z.number(),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.08-0.20 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'dunning-draft',
    name: 'Borrador de Cobranza',
    description: 'Genera cartas de cobranza personalizadas',
    category: 'finanzas',
    inputs: z.object({
      invoiceId: z.string(),
      amount: z.number(),
      daysOverdue: z.number(),
      clientName: z.string(),
      previousContacts: z.array(z.string()),
      tone: z.enum(['friendly', 'firm', 'legal']),
    }),
    outputs: z.object({
      letter: z.string(),
      subject: z.string(),
      nextAction: z.string(),
      escalationDate: z.string(),
    }),
    policy: finanzasPolicy,
    costHint: '€0.04-0.10 por carta',
    run: mockAgentRun,
  },
  {
    id: 'sepa-reconcile-hint',
    name: 'Pistas de Conciliación SEPA',
    description: 'Sugiere coincidencias para conciliación bancaria',
    category: 'finanzas',
    inputs: z.object({
      bankTransaction: z.object({
        amount: z.number(),
        date: z.string(),
        reference: z.string(),
        description: z.string(),
      }),
      pendingInvoices: z.array(z.object({
        id: z.string(),
        amount: z.number(),
        client: z.string(),
      })),
    }),
    outputs: z.object({
      matches: z.array(z.object({
        invoiceId: z.string(),
        confidence: z.number(),
        reasoning: z.string(),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.02-0.06 por transacción',
    run: mockAgentRun,
  },
  {
    id: 'anomaly-cost',
    name: 'Detector de Anomalías de Costos',
    description: 'Detecta gastos inusuales o sospechosos',
    category: 'finanzas',
    inputs: z.object({
      expenses: z.array(z.object({
        amount: z.number(),
        category: z.string(),
        date: z.string(),
        vendor: z.string(),
      })),
      historicalData: z.array(z.number()),
    }),
    outputs: z.object({
      anomalies: z.array(z.object({
        expenseId: z.string(),
        anomalyType: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
        explanation: z.string(),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.06-0.15 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'forecast-cash',
    name: 'Previsión de Flujo de Caja',
    description: 'Predice flujos de caja futuros',
    category: 'finanzas',
    inputs: z.object({
      historicalCashFlow: z.array(z.number()),
      scheduledPayments: z.array(z.object({
        amount: z.number(),
        date: z.string(),
        type: z.enum(['income', 'expense']),
      })),
      seasonalFactors: z.record(z.number()).optional(),
    }),
    outputs: z.object({
      forecast: z.array(z.object({
        date: z.string(),
        projectedBalance: z.number(),
        confidence: z.number(),
      })),
      risks: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    policy: finanzasPolicy,
    costHint: '€0.10-0.25 por previsión',
    run: mockAgentRun,
  },
  {
    id: 'budget-watch',
    name: 'Monitor de Presupuesto',
    description: 'Monitorea desviaciones presupuestarias',
    category: 'finanzas',
    inputs: z.object({
      budgets: z.record(z.number()),
      actualSpend: z.record(z.number()),
      period: z.string(),
    }),
    outputs: z.object({
      variances: z.array(z.object({
        category: z.string(),
        budgeted: z.number(),
        actual: z.number(),
        variance: z.number(),
        status: z.enum(['ok', 'warning', 'over']),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.04-0.10 por período',
    run: mockAgentRun,
  },
  {
    id: 'fx-rate-note',
    name: 'Notas de Tipos de Cambio',
    description: 'Analiza impacto de fluctuaciones cambiarias',
    category: 'finanzas',
    inputs: z.object({
      baseCurrency: z.string(),
      exposures: z.array(z.object({
        currency: z.string(),
        amount: z.number(),
        type: z.enum(['receivable', 'payable']),
      })),
    }),
    outputs: z.object({
      analysis: z.array(z.object({
        currency: z.string(),
        exposure: z.number(),
        risk: z.enum(['low', 'medium', 'high']),
        recommendation: z.string(),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.03-0.08 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'tax-check-hint',
    name: 'Verificación de Impuestos',
    description: 'Verifica cálculos y cumplimiento fiscal',
    category: 'finanzas',
    inputs: z.object({
      transaction: z.object({
        amount: z.number(),
        type: z.string(),
        jurisdiction: z.string(),
        date: z.string(),
      }),
      taxRules: z.record(z.unknown()),
    }),
    outputs: z.object({
      taxAmount: z.number(),
      taxRate: z.number(),
      compliance: z.boolean(),
      issues: z.array(z.string()),
    }),
    policy: finanzasPolicy,
    costHint: '€0.02-0.05 por verificación',
    run: mockAgentRun,
  },
  {
    id: 'payment-reminder',
    name: 'Recordatorios de Pago',
    description: 'Genera recordatorios personalizados de pago',
    category: 'finanzas',
    inputs: z.object({
      invoice: z.object({
        id: z.string(),
        amount: z.number(),
        dueDate: z.string(),
        clientName: z.string(),
      }),
      clientHistory: z.object({
        paymentPattern: z.string(),
        preferredChannel: z.string(),
      }),
    }),
    outputs: z.object({
      message: z.string(),
      channel: z.string(),
      timing: z.string(),
      followUp: z.string(),
    }),
    policy: finanzasPolicy,
    costHint: '€0.02-0.05 por recordatorio',
    run: mockAgentRun,
  },
  {
    id: 'fee-detect',
    name: 'Detector de Comisiones',
    description: 'Identifica comisiones ocultas o inusuales',
    category: 'finanzas',
    inputs: z.object({
      transactions: z.array(z.object({
        amount: z.number(),
        description: z.string(),
        vendor: z.string(),
      })),
      feePatterns: z.array(z.string()),
    }),
    outputs: z.object({
      detectedFees: z.array(z.object({
        transactionId: z.string(),
        feeAmount: z.number(),
        feeType: z.string(),
        confidence: z.number(),
      })),
    }),
    policy: finanzasPolicy,
    costHint: '€0.04-0.10 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'refund-assist',
    name: 'Asistente de Reembolsos',
    description: 'Automatiza procesamiento de reembolsos',
    category: 'finanzas',
    inputs: z.object({
      refundRequest: z.object({
        orderId: z.string(),
        amount: z.number(),
        reason: z.string(),
        requestDate: z.string(),
      }),
      policies: z.record(z.unknown()),
    }),
    outputs: z.object({
      eligibility: z.boolean(),
      refundAmount: z.number(),
      processing: z.object({
        method: z.string(),
        timeline: z.string(),
        requirements: z.array(z.string()),
      }),
    }),
    policy: finanzasPolicy,
    costHint: '€0.03-0.08 por solicitud',
    run: mockAgentRun,
  },
];

// SOPORTE/QA AGENTS (12 agents)
const soporteQaAgents: AgentDescriptor[] = [
  {
    id: 'bug-triage',
    name: 'Triaje de Bugs',
    description: 'Clasifica y prioriza reportes de bugs',
    category: 'soporte_qa',
    inputs: z.object({
      bugReport: z.object({
        title: z.string(),
        description: z.string(),
        steps: z.array(z.string()),
        environment: z.string(),
      }),
    }),
    outputs: z.object({
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      category: z.string(),
      assignee: z.string().optional(),
      estimatedFix: z.string(),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.03-0.08 por bug',
    run: mockAgentRun,
  },
  {
    id: 'repro-steps',
    name: 'Pasos de Reproducción',
    description: 'Genera pasos detallados para reproducir bugs',
    category: 'soporte_qa',
    inputs: z.object({
      bugDescription: z.string(),
      environment: z.string(),
      userActions: z.array(z.string()),
    }),
    outputs: z.object({
      reproSteps: z.array(z.string()),
      preconditions: z.array(z.string()),
      expectedResult: z.string(),
      actualResult: z.string(),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.04-0.10 por caso',
    run: mockAgentRun,
  },
  {
    id: 'test-case-gen',
    name: 'Generador de Casos de Prueba',
    description: 'Genera casos de prueba automáticamente',
    category: 'soporte_qa',
    inputs: z.object({
      feature: z.string(),
      requirements: z.array(z.string()),
      userStories: z.array(z.string()),
    }),
    outputs: z.object({
      testCases: z.array(z.object({
        id: z.string(),
        title: z.string(),
        steps: z.array(z.string()),
        expectedResult: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.06-0.15 por feature',
    run: mockAgentRun,
  },
  {
    id: 'release-notes',
    name: 'Notas de Release',
    description: 'Genera notas de versión desde commits',
    category: 'soporte_qa',
    inputs: z.object({
      commits: z.array(z.string()),
      version: z.string(),
      audience: z.enum(['technical', 'business', 'end_user']),
    }),
    outputs: z.object({
      releaseNotes: z.object({
        version: z.string(),
        features: z.array(z.string()),
        bugFixes: z.array(z.string()),
        improvements: z.array(z.string()),
        breakingChanges: z.array(z.string()),
      }),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.05-0.12 por release',
    run: mockAgentRun,
  },
  {
    id: 'risk-matrix',
    name: 'Matriz de Riesgos',
    description: 'Evalúa riesgos de cambios y releases',
    category: 'soporte_qa',
    inputs: z.object({
      changes: z.array(z.string()),
      affectedSystems: z.array(z.string()),
      timeline: z.string(),
    }),
    outputs: z.object({
      risks: z.array(z.object({
        risk: z.string(),
        probability: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.08-0.20 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'perf-hint',
    name: 'Pistas de Performance',
    description: 'Identifica cuellos de botella de rendimiento',
    category: 'soporte_qa',
    inputs: z.object({
      metrics: z.record(z.number()),
      logs: z.array(z.string()),
      userComplaints: z.array(z.string()),
    }),
    outputs: z.object({
      bottlenecks: z.array(z.object({
        component: z.string(),
        issue: z.string(),
        impact: z.enum(['low', 'medium', 'high']),
        solution: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.10-0.25 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'a11y-audit',
    name: 'Auditoría de Accesibilidad',
    description: 'Evalúa cumplimiento de accesibilidad web',
    category: 'soporte_qa',
    inputs: z.object({
      url: z.string().url(),
      guidelines: z.enum(['WCAG_2.0', 'WCAG_2.1', 'Section_508']),
      level: z.enum(['A', 'AA', 'AAA']),
    }),
    outputs: z.object({
      score: z.number().min(0).max(100),
      violations: z.array(z.object({
        rule: z.string(),
        severity: z.enum(['minor', 'moderate', 'serious', 'critical']),
        description: z.string(),
        fix: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.12-0.30 por auditoría',
    run: mockAgentRun,
  },
  {
    id: 'xss-scan-hint',
    name: 'Scanner de XSS',
    description: 'Detecta vulnerabilidades XSS potenciales',
    category: 'soporte_qa',
    inputs: z.object({
      code: z.string(),
      framework: z.string(),
      inputFields: z.array(z.string()),
    }),
    outputs: z.object({
      vulnerabilities: z.array(z.object({
        type: z.string(),
        location: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        recommendation: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.08-0.20 por escaneo',
    run: mockAgentRun,
  },
  {
    id: 'content-policy-check',
    name: 'Verificación de Política de Contenido',
    description: 'Verifica cumplimiento de políticas de contenido',
    category: 'soporte_qa',
    inputs: z.object({
      content: z.string(),
      contentType: z.enum(['text', 'image', 'video', 'audio']),
      policies: z.array(z.string()),
    }),
    outputs: z.object({
      compliant: z.boolean(),
      violations: z.array(z.object({
        policy: z.string(),
        severity: z.enum(['warning', 'violation']),
        suggestion: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.04-0.10 por verificación',
    run: mockAgentRun,
  },
  {
    id: 'pii-scrub-hint',
    name: 'Limpieza de PII',
    description: 'Identifica y sugiere limpieza de datos PII',
    category: 'soporte_qa',
    inputs: z.object({
      text: z.string(),
      dataType: z.enum(['logs', 'database', 'document']),
      sensitivity: z.enum(['low', 'medium', 'high']),
    }),
    outputs: z.object({
      piiFound: z.array(z.object({
        type: z.string(),
        location: z.string(),
        confidence: z.number(),
        replacement: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.06-0.15 por análisis',
    run: mockAgentRun,
  },
  {
    id: 'prompt-lint',
    name: 'Linter de Prompts',
    description: 'Analiza y mejora prompts de IA',
    category: 'soporte_qa',
    inputs: z.object({
      prompt: z.string(),
      purpose: z.string(),
      expectedOutput: z.string(),
    }),
    outputs: z.object({
      score: z.number().min(0).max(100),
      improvements: z.array(z.string()),
      optimizedPrompt: z.string(),
      warnings: z.array(z.string()),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.03-0.08 por prompt',
    run: mockAgentRun,
  },
  {
    id: 'red-team-prompt',
    name: 'Red Team de Prompts',
    description: 'Prueba prompts contra ataques adversarios',
    category: 'soporte_qa',
    inputs: z.object({
      prompt: z.string(),
      model: z.string(),
      attackVectors: z.array(z.string()),
    }),
    outputs: z.object({
      vulnerabilities: z.array(z.object({
        attack: z.string(),
        success: z.boolean(),
        severity: z.enum(['low', 'medium', 'high']),
        mitigation: z.string(),
      })),
    }),
    policy: soporteQaPolicy,
    costHint: '€0.10-0.25 por prueba',
    run: mockAgentRun,
  },
];

// Export the complete registry
export const AGENT_REGISTRY: AgentDescriptor[] = [
  ...ventasAgents,
  ...marketingAgents,
  ...operacionesAgents,
  ...finanzasAgents,
  ...soporteQaAgents,
];

// Helper functions
export function getAgentById(id: string): AgentDescriptor | undefined {
  return AGENT_REGISTRY.find(agent => agent.id === id);
}

export function getAgentsByCategory(category: string): AgentDescriptor[] {
  return AGENT_REGISTRY.filter(agent => agent.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(AGENT_REGISTRY.map(agent => agent.category))];
}

export function getAgentCount(): number {
  return AGENT_REGISTRY.length;
}

export function getCategoryCount(): Record<string, number> {
  return AGENT_REGISTRY.reduce((acc, agent) => {
    acc[agent.category] = (acc[agent.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}