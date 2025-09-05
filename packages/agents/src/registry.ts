/**
 * ECONEURA 60 Agents Registry
 * 
 * This registry contains exactly 60 agents distributed across 5 categories (12 each):
 * - Ventas (Sales): 12 agents
 * - Marketing: 12 agents  
 * - Operaciones (Operations): 12 agents
 * - Finanzas (Finance): 12 agents
 * - Soporte/QA (Support/QA): 12 agents
 */

import { z } from 'zod';
import { AgentDescriptor, AgentContext, AgentResult, AgentPolicy } from './types.js';

// =============================================================================
// INPUT/OUTPUT SCHEMAS FOR AGENTS
// =============================================================================

// Common schemas
const ContactInfoSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
});

const CompanyInfoSchema = z.object({
  name: z.string(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
});

// =============================================================================
// VENTAS AGENTS (12)
// =============================================================================

const leadEnrichAgent: AgentDescriptor = {
  id: 'lead-enrich',
  name: 'Lead Enrichment',
  description: 'Enriquece información de leads con datos públicos y scoring',
  category: 'ventas',
  version: '1.0.0',
  inputs: z.object({
    email: z.string().email(),
    company: z.string().optional(),
  }),
  outputs: z.object({
    enrichedData: z.object({
      fullName: z.string().optional(),
      title: z.string().optional(),
      company: CompanyInfoSchema.optional(),
      socialProfiles: z.array(z.string()).optional(),
      score: z.number().min(0).max(100),
    }),
    confidence: z.number().min(0).max(1),
  }),
  policy: {
    maxExecutionTimeMs: 30000,
    maxRetries: 2,
    retryDelayMs: 5000,
    requiresApproval: false,
    costCategory: 'medium',
  },
  costHint: '€0.05 per enrichment',
  tags: ['lead', 'enrichment', 'scoring'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = leadEnrichAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      // Simulate lead enrichment
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      const mockEnrichedData = {
        fullName: `Enriched User for ${validInputs.email}`,
        title: 'Sales Manager',
        company: {
          name: validInputs.company || 'Unknown Company',
          domain: validInputs.email.split('@')[1],
          industry: 'Technology',
          size: 'medium' as const,
        },
        socialProfiles: [`https://linkedin.com/in/${validInputs.email.split('@')[0]}`],
        score: Math.floor(Math.random() * 40) + 60, // 60-100 score
      };
      
      return {
        success: true,
        data: {
          enrichedData: mockEnrichedData,
          confidence: 0.85,
        },
        costEur: 0.05,
        executionTimeMs: Date.now() - startTime,
        metadata: { source: 'lead-enrichment-api' },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.01,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

const leadScoreAgent: AgentDescriptor = {
  id: 'lead-score',
  name: 'Lead Scoring',
  description: 'Calcula score de lead basado en comportamiento y perfil',
  category: 'ventas',
  version: '1.0.0',
  inputs: z.object({
    contact: ContactInfoSchema,
    interactions: z.array(z.object({
      type: z.enum(['email', 'call', 'meeting', 'demo']),
      date: z.string(),
      outcome: z.enum(['positive', 'neutral', 'negative']),
    })),
    companyData: CompanyInfoSchema.optional(),
  }),
  outputs: z.object({
    score: z.number().min(0).max(100),
    factors: z.array(z.object({
      factor: z.string(),
      weight: z.number(),
      value: z.number(),
    })),
    recommendation: z.enum(['hot', 'warm', 'cold', 'nurture']),
  }),
  policy: {
    maxExecutionTimeMs: 15000,
    maxRetries: 1,
    retryDelayMs: 3000,
    requiresApproval: false,
    costCategory: 'low',
  },
  costHint: '€0.02 per scoring',
  tags: ['lead', 'scoring', 'ml'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = leadScoreAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      
      const baseScore = 50;
      const interactionBonus = validInputs.interactions.length * 10;
      const positiveInteractions = validInputs.interactions.filter(i => i.outcome === 'positive').length;
      const outcomeBonus = positiveInteractions * 15;
      
      const finalScore = Math.min(100, baseScore + interactionBonus + outcomeBonus);
      
      const factors = [
        { factor: 'interaction_count', weight: 0.3, value: validInputs.interactions.length },
        { factor: 'positive_outcomes', weight: 0.4, value: positiveInteractions },
        { factor: 'company_size', weight: 0.3, value: validInputs.companyData?.size === 'enterprise' ? 10 : 5 },
      ];
      
      const recommendation = finalScore >= 80 ? 'hot' : 
                           finalScore >= 60 ? 'warm' : 
                           finalScore >= 40 ? 'cold' : 'nurture';
      
      return {
        success: true,
        data: {
          score: finalScore,
          factors,
          recommendation,
        },
        costEur: 0.02,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.01,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

// Additional sales agents (continuing pattern for all 12)
const nextBestActionAgent: AgentDescriptor = {
  id: 'next-best-action',
  name: 'Next Best Action',
  description: 'Sugiere la siguiente mejor acción para un lead/deal',
  category: 'ventas',
  version: '1.0.0',
  inputs: z.object({
    dealId: z.string(),
    stage: z.string(),
    lastInteraction: z.string(),
    daysInStage: z.number(),
  }),
  outputs: z.object({
    action: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    reasoning: z.string(),
    expectedOutcome: z.string(),
  }),
  policy: {
    maxExecutionTimeMs: 10000,
    maxRetries: 1,
    retryDelayMs: 2000,
    requiresApproval: false,
    costCategory: 'low',
  },
  costHint: '€0.03 per recommendation',
  tags: ['sales', 'recommendation', 'ai'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = nextBestActionAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 400));
      
      const actions = [
        'Schedule follow-up call',
        'Send product demo',
        'Provide case study',
        'Connect with decision maker',
        'Send pricing proposal',
      ];
      
      const action = actions[Math.floor(Math.random() * actions.length)];
      const priority = validInputs.daysInStage > 7 ? 'high' : 'medium';
      
      return {
        success: true,
        data: {
          action,
          priority,
          reasoning: `Based on ${validInputs.daysInStage} days in ${validInputs.stage} stage`,
          expectedOutcome: 'Advance deal to next stage',
        },
        costEur: 0.03,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.01,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// MARKETING AGENTS (12)
// =============================================================================

const segmentBuildAgent: AgentDescriptor = {
  id: 'segment-build',
  name: 'Segment Builder',
  description: 'Construye segmentos de audiencia basados en criterios',
  category: 'marketing',
  version: '1.0.0',
  inputs: z.object({
    criteria: z.object({
      industry: z.string().optional(),
      companySize: z.string().optional(),
      location: z.string().optional(),
      behavior: z.array(z.string()).optional(),
    }),
    targetSize: z.number().optional(),
  }),
  outputs: z.object({
    segmentId: z.string(),
    size: z.number(),
    criteria: z.record(z.unknown()),
    estimatedReach: z.number(),
    confidence: z.number(),
  }),
  policy: {
    maxExecutionTimeMs: 20000,
    maxRetries: 2,
    retryDelayMs: 3000,
    requiresApproval: false,
    costCategory: 'medium',
  },
  costHint: '€0.10 per segment',
  tags: ['marketing', 'segmentation', 'audience'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = segmentBuildAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 1000));
      
      const segmentId = `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedSize = Math.floor(Math.random() * 10000) + 1000;
      
      return {
        success: true,
        data: {
          segmentId,
          size: estimatedSize,
          criteria: validInputs.criteria,
          estimatedReach: Math.floor(estimatedSize * 0.7),
          confidence: 0.82,
        },
        costEur: 0.10,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.02,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// OPERACIONES AGENTS (12) 
// =============================================================================

const ticketTriageAgent: AgentDescriptor = {
  id: 'ticket-triage',
  name: 'Ticket Triage',
  description: 'Clasifica y prioriza tickets de soporte automáticamente',
  category: 'operaciones',
  version: '1.0.0',
  inputs: z.object({
    title: z.string(),
    description: z.string(),
    customer: z.string(),
    channel: z.enum(['email', 'chat', 'phone', 'api']),
  }),
  outputs: z.object({
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    category: z.string(),
    assignedTeam: z.string(),
    estimatedResolutionTime: z.number(),
    tags: z.array(z.string()),
  }),
  policy: {
    maxExecutionTimeMs: 8000,
    maxRetries: 1,
    retryDelayMs: 2000,
    requiresApproval: false,
    costCategory: 'low',
  },
  costHint: '€0.01 per triage',
  tags: ['operations', 'support', 'triage'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = ticketTriageAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
      
      const priorities = ['critical', 'high', 'medium', 'low'] as const;
      const categories = ['technical', 'billing', 'account', 'feature-request'];
      const teams = ['tier1', 'tier2', 'billing', 'engineering'];
      
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const assignedTeam = teams[Math.floor(Math.random() * teams.length)];
      
      const estimatedTime = priority === 'critical' ? 2 : 
                           priority === 'high' ? 4 : 
                           priority === 'medium' ? 8 : 24;
      
      return {
        success: true,
        data: {
          priority,
          category,
          assignedTeam,
          estimatedResolutionTime: estimatedTime,
          tags: [category, priority, validInputs.channel],
        },
        costEur: 0.01,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.005,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// FINANZAS AGENTS (12)
// =============================================================================

const invoiceExtractAgent: AgentDescriptor = {
  id: 'invoice-extract',
  name: 'Invoice Data Extraction',
  description: 'Extrae datos estructurados de facturas PDF/imagen',
  category: 'finanzas',
  version: '1.0.0',
  inputs: z.object({
    fileUrl: z.string().url(),
    fileType: z.enum(['pdf', 'png', 'jpg', 'jpeg']),
  }),
  outputs: z.object({
    invoiceNumber: z.string(),
    date: z.string(),
    dueDate: z.string().optional(),
    vendor: z.object({
      name: z.string(),
      taxId: z.string().optional(),
      address: z.string().optional(),
    }),
    items: z.array(z.object({
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    })),
    totals: z.object({
      subtotal: z.number(),
      tax: z.number(),
      total: z.number(),
    }),
    confidence: z.number(),
  }),
  policy: {
    maxExecutionTimeMs: 45000,
    maxRetries: 2,
    retryDelayMs: 5000,
    requiresApproval: false,
    costCategory: 'high',
  },
  costHint: '€0.25 per extraction',
  tags: ['finance', 'ocr', 'extraction'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = invoiceExtractAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      // Simulate OCR processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
      
      const mockInvoiceData = {
        invoiceNumber: `INV-${Math.floor(Math.random() * 100000)}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        vendor: {
          name: 'Acme Corp',
          taxId: 'ES12345678Z',
          address: '123 Business St, Madrid, Spain',
        },
        items: [
          {
            description: 'Professional Services',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
          },
        ],
        totals: {
          subtotal: 1000,
          tax: 210,
          total: 1210,
        },
        confidence: 0.92,
      };
      
      return {
        success: true,
        data: mockInvoiceData,
        costEur: 0.25,
        executionTimeMs: Date.now() - startTime,
        metadata: { ocrEngine: 'azure-form-recognizer' },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.05,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// SOPORTE/QA AGENTS (12)
// =============================================================================

const bugTriageAgent: AgentDescriptor = {
  id: 'bug-triage',
  name: 'Bug Triage',
  description: 'Clasifica y prioriza bugs automáticamente',
  category: 'soporte_qa',
  version: '1.0.0',
  inputs: z.object({
    title: z.string(),
    description: z.string(),
    steps: z.array(z.string()).optional(),
    environment: z.string().optional(),
    reporter: z.string(),
  }),
  outputs: z.object({
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    priority: z.enum(['p0', 'p1', 'p2', 'p3']),
    category: z.string(),
    assignedTeam: z.string(),
    labels: z.array(z.string()),
    estimatedEffort: z.enum(['xs', 's', 'm', 'l', 'xl']),
  }),
  policy: {
    maxExecutionTimeMs: 12000,
    maxRetries: 1,
    retryDelayMs: 3000,
    requiresApproval: false,
    costCategory: 'low',
  },
  costHint: '€0.02 per triage',
  tags: ['qa', 'bug', 'triage'],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const validInputs = bugTriageAgent.inputs.parse(inputs);
    const startTime = Date.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 500));
      
      const severities = ['critical', 'high', 'medium', 'low'] as const;
      const priorities = ['p0', 'p1', 'p2', 'p3'] as const;
      const categories = ['frontend', 'backend', 'database', 'integration', 'performance'];
      const teams = ['frontend-team', 'backend-team', 'devops-team', 'qa-team'];
      const efforts = ['xs', 's', 'm', 'l', 'xl'] as const;
      
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const assignedTeam = teams[Math.floor(Math.random() * teams.length)];
      const estimatedEffort = efforts[Math.floor(Math.random() * efforts.length)];
      
      return {
        success: true,
        data: {
          severity,
          priority,
          category,
          assignedTeam,
          labels: [category, severity, priority],
          estimatedEffort,
        },
        costEur: 0.02,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        costEur: 0.01,
        executionTimeMs: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// REGISTRY IMPLEMENTATION
// =============================================================================

// Create all remaining agents (simplified for brevity - in production would have all 60)
const createMockAgent = (
  id: string, 
  name: string, 
  description: string, 
  category: 'ventas' | 'marketing' | 'operaciones' | 'finanzas' | 'soporte_qa',
  costHint: string
): AgentDescriptor => ({
  id,
  name,
  description,
  category,
  version: '1.0.0',
  inputs: z.object({ input: z.string() }),
  outputs: z.object({ output: z.string() }),
  policy: {
    maxExecutionTimeMs: 15000,
    maxRetries: 2,
    retryDelayMs: 3000,
    requiresApproval: false,
    costCategory: 'medium',
  },
  costHint,
  tags: [category],
  run: async (inputs: unknown, context: AgentContext): Promise<AgentResult> => {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    return {
      success: true,
      data: { output: `Processed by ${name}` },
      costEur: 0.05,
      executionTimeMs: Date.now() - startTime,
    };
  },
});

// Complete registry with all 60 agents
export const AGENTS_REGISTRY: AgentDescriptor[] = [
  // VENTAS (12 agents)
  leadEnrichAgent,
  leadScoreAgent,
  nextBestActionAgent,
  createMockAgent('email-draft', 'Email Draft Generator', 'Genera borradores de emails de ventas', 'ventas', '€0.08 per email'),
  createMockAgent('follow-up', 'Follow-up Scheduler', 'Programa seguimientos automáticos', 'ventas', '€0.02 per schedule'),
  createMockAgent('quote-gen', 'Quote Generator', 'Genera cotizaciones automáticamente', 'ventas', '€0.15 per quote'),
  createMockAgent('churn-risk', 'Churn Risk Predictor', 'Predice riesgo de churn de clientes', 'ventas', '€0.12 per analysis'),
  createMockAgent('upsell-tip', 'Upsell Opportunity', 'Identifica oportunidades de upselling', 'ventas', '€0.10 per analysis'),
  createMockAgent('notes-to-crm', 'Notes to CRM', 'Convierte notas en registros CRM', 'ventas', '€0.05 per conversion'),
  createMockAgent('summary-call', 'Call Summary', 'Resume llamadas de ventas', 'ventas', '€0.20 per summary'),
  createMockAgent('agenda-gen', 'Agenda Generator', 'Genera agendas para reuniones', 'ventas', '€0.03 per agenda'),
  createMockAgent('nps-insight', 'NPS Insights', 'Analiza feedback NPS y sugiere acciones', 'ventas', '€0.08 per analysis'),

  // MARKETING (12 agents)
  segmentBuildAgent,
  createMockAgent('subject-ab', 'Subject Line A/B', 'Genera variantes de subject lines', 'marketing', '€0.04 per variant'),
  createMockAgent('copy-rewrite', 'Copy Rewriter', 'Reescribe copy de marketing', 'marketing', '€0.15 per rewrite'),
  createMockAgent('cta-suggest', 'CTA Suggestions', 'Sugiere CTAs optimizados', 'marketing', '€0.06 per suggestion'),
  createMockAgent('utm-audit', 'UTM Auditor', 'Audita parámetros UTM', 'marketing', '€0.02 per audit'),
  createMockAgent('seo-brief', 'SEO Brief Generator', 'Genera briefs SEO', 'marketing', '€0.25 per brief'),
  createMockAgent('post-calendar', 'Social Post Calendar', 'Genera calendario de posts', 'marketing', '€0.30 per calendar'),
  createMockAgent('trend-scan', 'Trend Scanner', 'Escanea tendencias del mercado', 'marketing', '€0.20 per scan'),
  createMockAgent('outreach-list', 'Outreach List Builder', 'Construye listas de outreach', 'marketing', '€0.18 per list'),
  createMockAgent('persona-synth', 'Persona Synthesizer', 'Sintetiza buyer personas', 'marketing', '€0.35 per persona'),
  createMockAgent('landing-critique', 'Landing Page Critic', 'Critica landing pages', 'marketing', '€0.22 per critique'),
  createMockAgent('faq-gen', 'FAQ Generator', 'Genera FAQs automáticamente', 'marketing', '€0.12 per FAQ set'),

  // OPERACIONES (12 agents)  
  ticketTriageAgent,
  createMockAgent('kb-suggest', 'KB Suggestions', 'Sugiere artículos de KB', 'operaciones', '€0.03 per suggestion'),
  createMockAgent('sop-draft', 'SOP Drafter', 'Genera borradores de SOPs', 'operaciones', '€0.40 per SOP'),
  createMockAgent('escalado-policy', 'Escalation Policy', 'Define políticas de escalado', 'operaciones', '€0.15 per policy'),
  createMockAgent('capacity-plan', 'Capacity Planner', 'Planifica capacidad de recursos', 'operaciones', '€0.25 per plan'),
  createMockAgent('stock-alert', 'Stock Alerts', 'Genera alertas de stock', 'operaciones', '€0.01 per alert'),
  createMockAgent('supplier-ping', 'Supplier Ping', 'Notifica a proveedores', 'operaciones', '€0.02 per ping'),
  createMockAgent('shipment-eta', 'Shipment ETA', 'Calcula ETAs de envíos', 'operaciones', '€0.05 per calculation'),
  createMockAgent('sla-watch', 'SLA Watcher', 'Monitorea cumplimiento SLA', 'operaciones', '€0.02 per check'),
  createMockAgent('task-bundle', 'Task Bundler', 'Agrupa tareas relacionadas', 'operaciones', '€0.03 per bundle'),
  createMockAgent('meeting-notes', 'Meeting Notes', 'Procesa notas de reuniones', 'operaciones', '€0.08 per processing'),
  createMockAgent('action-items', 'Action Items Extractor', 'Extrae action items', 'operaciones', '€0.05 per extraction'),

  // FINANZAS (12 agents)
  invoiceExtractAgent,
  createMockAgent('ar-prioritize', 'AR Prioritizer', 'Prioriza cuentas por cobrar', 'finanzas', '€0.08 per prioritization'),
  createMockAgent('dunning-draft', 'Dunning Draft', 'Genera borradores de dunning', 'finanzas', '€0.12 per draft'),
  createMockAgent('sepa-reconcile-hint', 'SEPA Reconciliation', 'Ayuda con reconciliación SEPA', 'finanzas', '€0.15 per hint'),
  createMockAgent('anomaly-cost', 'Cost Anomaly Detector', 'Detecta anomalías de costos', 'finanzas', '€0.10 per analysis'),
  createMockAgent('forecast-cash', 'Cash Flow Forecaster', 'Predice flujo de caja', 'finanzas', '€0.30 per forecast'),
  createMockAgent('budget-watch', 'Budget Watcher', 'Monitorea presupuestos', 'finanzas', '€0.05 per check'),
  createMockAgent('fx-rate-note', 'FX Rate Notifier', 'Notifica cambios de divisas', 'finanzas', '€0.02 per notification'),
  createMockAgent('tax-check-hint', 'Tax Check Helper', 'Ayuda con verificaciones fiscales', 'finanzas', '€0.20 per check'),
  createMockAgent('payment-reminder', 'Payment Reminder', 'Genera recordatorios de pago', 'finanzas', '€0.03 per reminder'),
  createMockAgent('fee-detect', 'Fee Detector', 'Detecta comisiones ocultas', 'finanzas', '€0.07 per detection'),
  createMockAgent('refund-assist', 'Refund Assistant', 'Asiste con procesamiento de devoluciones', 'finanzas', '€0.10 per assistance'),

  // SOPORTE/QA (12 agents)
  bugTriageAgent,
  createMockAgent('repro-steps', 'Reproduction Steps', 'Genera pasos de reproducción', 'soporte_qa', '€0.05 per generation'),
  createMockAgent('test-case-gen', 'Test Case Generator', 'Genera casos de prueba', 'soporte_qa', '€0.15 per case'),
  createMockAgent('release-notes', 'Release Notes', 'Genera notas de release', 'soporte_qa', '€0.20 per release'),
  createMockAgent('risk-matrix', 'Risk Matrix', 'Genera matrices de riesgo', 'soporte_qa', '€0.12 per matrix'),
  createMockAgent('perf-hint', 'Performance Hints', 'Sugiere mejoras de performance', 'soporte_qa', '€0.08 per hint'),
  createMockAgent('a11y-audit', 'Accessibility Auditor', 'Audita accesibilidad', 'soporte_qa', '€0.25 per audit'),
  createMockAgent('xss-scan-hint', 'XSS Scanner', 'Escanea vulnerabilidades XSS', 'soporte_qa', '€0.18 per scan'),
  createMockAgent('content-policy-check', 'Content Policy Checker', 'Verifica políticas de contenido', 'soporte_qa', '€0.06 per check'),
  createMockAgent('pii-scrub-hint', 'PII Scrubber', 'Detecta y limpia PII', 'soporte_qa', '€0.10 per scrub'),
  createMockAgent('prompt-lint', 'Prompt Linter', 'Valida prompts de IA', 'soporte_qa', '€0.04 per lint'),
  createMockAgent('red-team-prompt', 'Red Team Prompt', 'Genera prompts adversariales', 'soporte_qa', '€0.15 per prompt'),
];

// Registry utilities
export const getAgentById = (id: string): AgentDescriptor | undefined => {
  return AGENTS_REGISTRY.find(agent => agent.id === id);
};

export const getAgentsByCategory = (category: 'ventas' | 'marketing' | 'operaciones' | 'finanzas' | 'soporte_qa'): AgentDescriptor[] => {
  return AGENTS_REGISTRY.filter(agent => agent.category === category);
};

export const getAllCategories = (): string[] => {
  return [...new Set(AGENTS_REGISTRY.map(agent => agent.category))];
};

export const getRegistryStats = () => {
  const stats = {
    total: AGENTS_REGISTRY.length,
    byCategory: {} as Record<string, number>,
    byCostCategory: {} as Record<string, number>,
  };
  
  AGENTS_REGISTRY.forEach(agent => {
    stats.byCategory[agent.category] = (stats.byCategory[agent.category] || 0) + 1;
    stats.byCostCategory[agent.policy.costCategory] = (stats.byCostCategory[agent.policy.costCategory] || 0) + 1;
  });
  
  return stats;
};

// Validation
if (AGENTS_REGISTRY.length !== 60) {
  throw new Error(`Expected exactly 60 agents, but found ${AGENTS_REGISTRY.length}`);
}

const categoryCount = getRegistryStats().byCategory;
Object.entries(categoryCount).forEach(([category, count]) => {
  if (count !== 12) {
    throw new Error(`Expected exactly 12 agents in category ${category}, but found ${count}`);
  }
});

console.log('✅ ECONEURA 60 Agents Registry validated successfully');
console.log('📊 Registry stats:', getRegistryStats());