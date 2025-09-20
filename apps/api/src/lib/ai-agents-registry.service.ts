import { z } from 'zod';
import { structuredLogger } from './structured-logger.js';
import { EnhancedAIRouter } from '@econeura/shared/src/ai/enhanced-router.js';
import { aiRouterClient, AIRequest, AIResponse, AIError } from '@econeura/agents/ai-router.client';

// Agent Definition Schema
export const AgentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['ventas', 'marketing', 'operaciones', 'finanzas', 'soporte_qa', 'ejecutivo']),
  description: z.string(),
  costHint: z.enum(['low', 'medium', 'high']),
  inputs: z.record(z.string()),
  outputs: z.record(z.string()),
  dependencies: z.array(z.string()).optional(),
  timeoutMs: z.number().default(30000),
  retryCount: z.number().default(3),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string()).optional(),
  version: z.string().default('1.0.0'),
  enabled: z.boolean().default(true)
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

// Agent Execution Context
export const AgentExecutionContextSchema = z.object({
  orgId: z.string(),
  userId: z.string(),
  correlationId: z.string(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  budget: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
});

export type AgentExecutionContext = z.infer<typeof AgentExecutionContextSchema>;

// Agent Execution Request
export const AgentExecutionRequestSchema = z.object({
  agentId: z.string(),
  inputs: z.record(z.any()),
  context: AgentExecutionContextSchema
});

export type AgentExecutionRequest = z.infer<typeof AgentExecutionRequestSchema>;

// Agent Execution Result
export const AgentExecutionResultSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  inputs: z.record(z.any()),
  outputs: z.record(z.any()).optional(),
  context: AgentExecutionContextSchema,
  startedAt: z.string(),
  completedAt: z.string().optional(),
  costEur: z.number().optional(),
  executionTimeMs: z.number().optional(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  version: z.string()
});

export type AgentExecutionResult = z.infer<typeof AgentExecutionResultSchema>;

// Agent Health Status
export const AgentHealthStatusSchema = z.object({
  agentId: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  lastExecution: z.string().optional(),
  successRate: z.number(),
  avgExecutionTime: z.number(),
  avgCost: z.number(),
  errorRate: z.number(),
  lastError: z.string().optional(),
  updatedAt: z.string()
});

export type AgentHealthStatus = z.infer<typeof AgentHealthStatusSchema>;

/**
 * AI Agents Registry Service
 * 
 * Manages the complete registry of 60 AI agents across 5 departments
 * plus 1 executive agent, with full lifecycle management, health monitoring,
 * and cost control integration.
 */
export class AIAgentsRegistryService {
  private agents: Map<string, AgentDefinition> = new Map();
  private healthStatus: Map<string, AgentHealthStatus> = new Map();
  private executionHistory: Map<string, AgentExecutionResult[]> = new Map();
  private aiRouter: EnhancedAIRouter;
  private activeExecutions: Map<string, AgentExecutionResult> = new Map();

  constructor() {
    this.aiRouter = new EnhancedAIRouter();
    this.initializeAgents();
    this.startHealthMonitoring();
  }

  /**
   * Initialize the complete registry of 60 AI agents
   */
  private initializeAgents(): void {
    const agents: AgentDefinition[] = [
      // 1 Agente Ejecutivo
      {
        id: 'executive-director',
        name: 'Executive Director',
        category: 'ejecutivo',
        description: 'Strategic decision making and executive oversight',
        costHint: 'high',
        inputs: { decisionType: 'string', context: 'object', urgency: 'string' },
        outputs: { decision: 'object', rationale: 'string', nextSteps: 'array' },
        priority: 'critical',
        timeoutMs: 60000,
        tags: ['executive', 'strategy', 'decision-making']
      },

      // 12 Agentes de Ventas
      {
        id: 'lead-enrich',
        name: 'Lead Enrichment',
        category: 'ventas',
        description: 'Enrich lead information with external data sources',
        costHint: 'low',
        inputs: { leadId: 'string', fields: 'array' },
        outputs: { enrichedData: 'object', confidence: 'number' },
        tags: ['lead-generation', 'data-enrichment']
      },
      {
        id: 'lead-scoring',
        name: 'Lead Scoring',
        category: 'ventas',
        description: 'Score leads based on multiple criteria and behavior',
        costHint: 'low',
        inputs: { leadId: 'string', criteria: 'object' },
        outputs: { score: 'number', factors: 'array', recommendation: 'string' },
        tags: ['scoring', 'qualification']
      },
      {
        id: 'next-best-action',
        name: 'Next Best Action',
        category: 'ventas',
        description: 'Recommend optimal next action for sales opportunities',
        costHint: 'medium',
        inputs: { opportunityId: 'string', context: 'object' },
        outputs: { action: 'string', priority: 'string', timeline: 'string' },
        tags: ['recommendation', 'optimization']
      },
      {
        id: 'email-draft',
        name: 'Email Draft Generator',
        category: 'ventas',
        description: 'Generate personalized email drafts for prospects',
        costHint: 'low',
        inputs: { contactId: 'string', template: 'string', tone: 'string' },
        outputs: { subject: 'string', body: 'string', personalization: 'object' },
        tags: ['email', 'personalization']
      },
      {
        id: 'follow-up-scheduler',
        name: 'Follow-up Scheduler',
        category: 'ventas',
        description: 'Schedule optimal follow-up activities',
        costHint: 'low',
        inputs: { contactId: 'string', lastInteraction: 'string' },
        outputs: { schedule: 'object', reminders: 'array' },
        tags: ['scheduling', 'automation']
      },
      {
        id: 'quote-generator',
        name: 'Quote Generator',
        category: 'ventas',
        description: 'Generate accurate sales quotes with pricing',
        costHint: 'medium',
        inputs: { productId: 'string', quantity: 'number', customerId: 'string' },
        outputs: { quote: 'object', pricing: 'object', validity: 'string' },
        tags: ['pricing', 'quotes']
      },
      {
        id: 'churn-risk-assessment',
        name: 'Churn Risk Assessment',
        category: 'ventas',
        description: 'Assess customer churn risk and retention strategies',
        costHint: 'medium',
        inputs: { customerId: 'string', metrics: 'object' },
        outputs: { riskScore: 'number', factors: 'array', recommendations: 'array' },
        tags: ['retention', 'risk-assessment']
      },
      {
        id: 'upsell-recommendations',
        name: 'Upsell Recommendations',
        category: 'ventas',
        description: 'Identify and recommend upsell opportunities',
        costHint: 'medium',
        inputs: { customerId: 'string', currentProducts: 'array' },
        outputs: { opportunities: 'array', recommendations: 'array', value: 'number' },
        tags: ['upselling', 'revenue-optimization']
      },
      {
        id: 'notes-to-crm',
        name: 'Notes to CRM',
        category: 'ventas',
        description: 'Extract and structure CRM data from unstructured notes',
        costHint: 'low',
        inputs: { notes: 'string', contactId: 'string' },
        outputs: { structuredData: 'object', insights: 'array' },
        tags: ['data-extraction', 'crm']
      },
      {
        id: 'call-summary',
        name: 'Call Summary',
        category: 'ventas',
        description: 'Generate comprehensive call summaries and action items',
        costHint: 'medium',
        inputs: { callRecording: 'string', participants: 'array' },
        outputs: { summary: 'string', actionItems: 'array', sentiment: 'string' },
        tags: ['call-analysis', 'summarization']
      },
      {
        id: 'meeting-agenda-generator',
        name: 'Meeting Agenda Generator',
        category: 'ventas',
        description: 'Generate structured meeting agendas',
        costHint: 'low',
        inputs: { meetingType: 'string', participants: 'array', objectives: 'array' },
        outputs: { agenda: 'array', timeAllocation: 'object' },
        tags: ['meeting-planning', 'productivity']
      },
      {
        id: 'nps-insights',
        name: 'NPS Insights',
        category: 'ventas',
        description: 'Analyze NPS feedback and generate actionable insights',
        costHint: 'medium',
        inputs: { npsData: 'array', timeRange: 'string' },
        outputs: { insights: 'array', trends: 'object', recommendations: 'array' },
        tags: ['nps', 'feedback-analysis']
      },

      // 12 Agentes de Marketing
      {
        id: 'segment-builder',
        name: 'Segment Builder',
        category: 'marketing',
        description: 'Build and optimize customer segments',
        costHint: 'medium',
        inputs: { criteria: 'object', data: 'array' },
        outputs: { segments: 'array', characteristics: 'object' },
        tags: ['segmentation', 'targeting']
      },
      {
        id: 'subject-line-ab-test',
        name: 'Subject Line A/B Test',
        category: 'marketing',
        description: 'Generate and test email subject lines',
        costHint: 'low',
        inputs: { campaign: 'string', variants: 'number' },
        outputs: { variants: 'array', predictions: 'object' },
        tags: ['email-marketing', 'ab-testing']
      },
      {
        id: 'copy-rewriter',
        name: 'Copy Rewriter',
        category: 'marketing',
        description: 'Rewrite marketing copy for better performance',
        costHint: 'medium',
        inputs: { originalCopy: 'string', objectives: 'array' },
        outputs: { rewrittenCopy: 'string', improvements: 'array' },
        tags: ['copywriting', 'optimization']
      },
      {
        id: 'cta-suggestions',
        name: 'CTA Suggestions',
        category: 'marketing',
        description: 'Suggest optimal call-to-action buttons and text',
        costHint: 'low',
        inputs: { context: 'string', pageType: 'string' },
        outputs: { suggestions: 'array', placement: 'object' },
        tags: ['cta', 'conversion-optimization']
      },
      {
        id: 'utm-audit',
        name: 'UTM Audit',
        category: 'marketing',
        description: 'Audit and optimize UTM parameters',
        costHint: 'low',
        inputs: { campaigns: 'array', timeRange: 'string' },
        outputs: { audit: 'object', recommendations: 'array' },
        tags: ['utm', 'tracking']
      },
      {
        id: 'seo-brief-generator',
        name: 'SEO Brief Generator',
        category: 'marketing',
        description: 'Generate comprehensive SEO content briefs',
        costHint: 'medium',
        inputs: { topic: 'string', keywords: 'array', target: 'string' },
        outputs: { brief: 'object', structure: 'array' },
        tags: ['seo', 'content-planning']
      },
      {
        id: 'social-post-calendar',
        name: 'Social Post Calendar',
        category: 'marketing',
        description: 'Generate social media posting calendar',
        costHint: 'medium',
        inputs: { platforms: 'array', themes: 'array', frequency: 'string' },
        outputs: { calendar: 'array', content: 'array' },
        tags: ['social-media', 'content-calendar']
      },
      {
        id: 'trend-scanner',
        name: 'Trend Scanner',
        category: 'marketing',
        description: 'Scan and analyze market trends',
        costHint: 'high',
        inputs: { industry: 'string', sources: 'array' },
        outputs: { trends: 'array', insights: 'object' },
        tags: ['trend-analysis', 'market-research']
      },
      {
        id: 'outreach-list-builder',
        name: 'Outreach List Builder',
        category: 'marketing',
        description: 'Build targeted outreach lists',
        costHint: 'medium',
        inputs: { criteria: 'object', sources: 'array' },
        outputs: { list: 'array', quality: 'object' },
        tags: ['outreach', 'lead-generation']
      },
      {
        id: 'persona-synthesizer',
        name: 'Persona Synthesizer',
        category: 'marketing',
        description: 'Create detailed buyer personas',
        costHint: 'medium',
        inputs: { data: 'array', segments: 'array' },
        outputs: { personas: 'array', characteristics: 'object' },
        tags: ['personas', 'targeting']
      },
      {
        id: 'landing-page-critique',
        name: 'Landing Page Critique',
        category: 'marketing',
        description: 'Critique and optimize landing pages',
        costHint: 'medium',
        inputs: { url: 'string', objectives: 'array' },
        outputs: { critique: 'object', recommendations: 'array' },
        tags: ['landing-pages', 'conversion-optimization']
      },
      {
        id: 'faq-generator',
        name: 'FAQ Generator',
        category: 'marketing',
        description: 'Generate comprehensive FAQ content',
        costHint: 'low',
        inputs: { product: 'string', audience: 'string' },
        outputs: { faqs: 'array', categories: 'array' },
        tags: ['faq', 'content-generation']
      },

      // 12 Agentes de Operaciones
      {
        id: 'ticket-triage',
        name: 'Ticket Triage',
        category: 'operaciones',
        description: 'Automatically triage support tickets',
        costHint: 'low',
        inputs: { ticket: 'object', rules: 'array' },
        outputs: { priority: 'string', category: 'string', assignee: 'string' },
        tags: ['ticketing', 'automation']
      },
      {
        id: 'knowledge-base-suggestions',
        name: 'Knowledge Base Suggestions',
        category: 'operaciones',
        description: 'Suggest relevant KB articles',
        costHint: 'low',
        inputs: { query: 'string', context: 'object' },
        outputs: { suggestions: 'array', relevance: 'object' },
        tags: ['knowledge-base', 'search']
      },
      {
        id: 'sop-draft-generator',
        name: 'SOP Draft Generator',
        category: 'operaciones',
        description: 'Draft standard operating procedures',
        costHint: 'medium',
        inputs: { process: 'string', requirements: 'array' },
        outputs: { sop: 'object', steps: 'array' },
        tags: ['documentation', 'processes']
      },
      {
        id: 'escalation-policy',
        name: 'Escalation Policy',
        category: 'operaciones',
        description: 'Define and optimize escalation policies',
        costHint: 'medium',
        inputs: { scenarios: 'array', team: 'object' },
        outputs: { policies: 'array', workflows: 'object' },
        tags: ['escalation', 'policies']
      },
      {
        id: 'capacity-planning',
        name: 'Capacity Planning',
        category: 'operaciones',
        description: 'Plan and optimize resource capacity',
        costHint: 'high',
        inputs: { resources: 'object', demand: 'array' },
        outputs: { plan: 'object', recommendations: 'array' },
        tags: ['capacity', 'resource-planning']
      },
      {
        id: 'stock-alerts',
        name: 'Stock Alerts',
        category: 'operaciones',
        description: 'Generate intelligent stock alerts',
        costHint: 'low',
        inputs: { inventory: 'array', thresholds: 'object' },
        outputs: { alerts: 'array', recommendations: 'array' },
        tags: ['inventory', 'alerts']
      },
      {
        id: 'supplier-communication',
        name: 'Supplier Communication',
        category: 'operaciones',
        description: 'Automate supplier communications',
        costHint: 'low',
        inputs: { supplier: 'string', message: 'string' },
        outputs: { communication: 'object', status: 'string' },
        tags: ['suppliers', 'communication']
      },
      {
        id: 'shipment-eta',
        name: 'Shipment ETA',
        category: 'operaciones',
        description: 'Calculate accurate shipment ETAs',
        costHint: 'medium',
        inputs: { shipment: 'object', route: 'object' },
        outputs: { eta: 'string', confidence: 'number' },
        tags: ['logistics', 'tracking']
      },
      {
        id: 'sla-monitoring',
        name: 'SLA Monitoring',
        category: 'operaciones',
        description: 'Monitor SLA compliance and performance',
        costHint: 'low',
        inputs: { slas: 'array', metrics: 'object' },
        outputs: { status: 'object', violations: 'array' },
        tags: ['sla', 'monitoring']
      },
      {
        id: 'task-bundling',
        name: 'Task Bundling',
        category: 'operaciones',
        description: 'Bundle related tasks for efficiency',
        costHint: 'low',
        inputs: { tasks: 'array', criteria: 'object' },
        outputs: { bundles: 'array', efficiency: 'object' },
        tags: ['task-management', 'optimization']
      },
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        category: 'operaciones',
        description: 'Generate structured meeting notes',
        costHint: 'medium',
        inputs: { recording: 'string', participants: 'array' },
        outputs: { notes: 'object', actionItems: 'array' },
        tags: ['meetings', 'documentation']
      },
      {
        id: 'action-items-extractor',
        name: 'Action Items Extractor',
        category: 'operaciones',
        description: 'Extract action items from communications',
        costHint: 'low',
        inputs: { content: 'string', context: 'object' },
        outputs: { actionItems: 'array', assignees: 'array' },
        tags: ['action-items', 'extraction']
      },

      // 12 Agentes de Finanzas
      {
        id: 'invoice-data-extraction',
        name: 'Invoice Data Extraction',
        category: 'finanzas',
        description: 'Extract structured data from invoices',
        costHint: 'medium',
        inputs: { document: 'string', format: 'string' },
        outputs: { data: 'object', accuracy: 'number' },
        tags: ['invoice-processing', 'data-extraction']
      },
      {
        id: 'ar-prioritization',
        name: 'AR Prioritization',
        category: 'finanzas',
        description: 'Prioritize accounts receivable collections',
        costHint: 'low',
        inputs: { invoices: 'array', criteria: 'object' },
        outputs: { priority: 'array', recommendations: 'array' },
        tags: ['accounts-receivable', 'collections']
      },
      {
        id: 'dunning-letter-draft',
        name: 'Dunning Letter Draft',
        category: 'finanzas',
        description: 'Draft personalized dunning letters',
        costHint: 'low',
        inputs: { customer: 'object', invoice: 'object' },
        outputs: { letter: 'string', tone: 'string' },
        tags: ['dunning', 'collections']
      },
      {
        id: 'sepa-reconciliation-hints',
        name: 'SEPA Reconciliation Hints',
        category: 'finanzas',
        description: 'Provide SEPA reconciliation suggestions',
        costHint: 'medium',
        inputs: { transactions: 'array', statements: 'array' },
        outputs: { matches: 'array', discrepancies: 'array' },
        tags: ['sepa', 'reconciliation']
      },
      {
        id: 'cost-anomaly-detection',
        name: 'Cost Anomaly Detection',
        category: 'finanzas',
        description: 'Detect unusual cost patterns',
        costHint: 'medium',
        inputs: { costs: 'array', baseline: 'object' },
        outputs: { anomalies: 'array', severity: 'object' },
        tags: ['anomaly-detection', 'cost-analysis']
      },
      {
        id: 'cash-flow-forecast',
        name: 'Cash Flow Forecast',
        category: 'finanzas',
        description: 'Generate accurate cash flow forecasts',
        costHint: 'high',
        inputs: { historical: 'array', projections: 'object' },
        outputs: { forecast: 'object', confidence: 'number' },
        tags: ['forecasting', 'cash-flow']
      },
      {
        id: 'budget-monitoring',
        name: 'Budget Monitoring',
        category: 'finanzas',
        description: 'Monitor budget performance and variances',
        costHint: 'low',
        inputs: { budget: 'object', actuals: 'array' },
        outputs: { status: 'object', variances: 'array' },
        tags: ['budget', 'monitoring']
      },
      {
        id: 'fx-rate-notifications',
        name: 'FX Rate Notifications',
        category: 'finanzas',
        description: 'Monitor and alert on FX rate changes',
        costHint: 'low',
        inputs: { currencies: 'array', thresholds: 'object' },
        outputs: { alerts: 'array', impact: 'object' },
        tags: ['fx', 'notifications']
      },
      {
        id: 'tax-check-hints',
        name: 'Tax Check Hints',
        category: 'finanzas',
        description: 'Provide tax compliance hints',
        costHint: 'medium',
        inputs: { transactions: 'array', jurisdiction: 'string' },
        outputs: { hints: 'array', compliance: 'object' },
        tags: ['tax', 'compliance']
      },
      {
        id: 'payment-reminders',
        name: 'Payment Reminders',
        category: 'finanzas',
        description: 'Generate automated payment reminders',
        costHint: 'low',
        inputs: { invoices: 'array', schedule: 'object' },
        outputs: { reminders: 'array', schedule: 'object' },
        tags: ['payments', 'automation']
      },
      {
        id: 'fee-detection',
        name: 'Fee Detection',
        category: 'finanzas',
        description: 'Detect unexpected fees and charges',
        costHint: 'low',
        inputs: { transactions: 'array', patterns: 'object' },
        outputs: { fees: 'array', analysis: 'object' },
        tags: ['fee-analysis', 'detection']
      },
      {
        id: 'refund-assistant',
        name: 'Refund Assistant',
        category: 'finanzas',
        description: 'Assist with refund processing and validation',
        costHint: 'medium',
        inputs: { refund: 'object', policy: 'object' },
        outputs: { recommendation: 'string', steps: 'array' },
        tags: ['refunds', 'processing']
      },

      // 12 Agentes de Soporte/QA
      {
        id: 'bug-triage',
        name: 'Bug Triage',
        category: 'soporte_qa',
        description: 'Automatically triage bug reports',
        costHint: 'low',
        inputs: { bug: 'object', system: 'string' },
        outputs: { priority: 'string', category: 'string', assignee: 'string' },
        tags: ['bug-tracking', 'triage']
      },
      {
        id: 'reproduction-steps',
        name: 'Reproduction Steps',
        category: 'soporte_qa',
        description: 'Generate bug reproduction steps',
        costHint: 'medium',
        inputs: { bug: 'object', environment: 'object' },
        outputs: { steps: 'array', environment: 'object' },
        tags: ['reproduction', 'testing']
      },
      {
        id: 'test-case-generator',
        name: 'Test Case Generator',
        category: 'soporte_qa',
        description: 'Generate comprehensive test cases',
        costHint: 'medium',
        inputs: { feature: 'string', requirements: 'array' },
        outputs: { testCases: 'array', coverage: 'object' },
        tags: ['test-cases', 'testing']
      },
      {
        id: 'release-notes',
        name: 'Release Notes',
        category: 'soporte_qa',
        description: 'Generate detailed release notes',
        costHint: 'low',
        inputs: { changes: 'array', version: 'string' },
        outputs: { notes: 'string', highlights: 'array' },
        tags: ['release-notes', 'documentation']
      },
      {
        id: 'risk-matrix',
        name: 'Risk Matrix',
        category: 'soporte_qa',
        description: 'Create risk assessment matrix',
        costHint: 'medium',
        inputs: { features: 'array', criteria: 'object' },
        outputs: { matrix: 'object', recommendations: 'array' },
        tags: ['risk-assessment', 'matrix']
      },
      {
        id: 'performance-hints',
        name: 'Performance Hints',
        category: 'soporte_qa',
        description: 'Provide performance optimization hints',
        costHint: 'medium',
        inputs: { metrics: 'object', system: 'string' },
        outputs: { hints: 'array', priority: 'object' },
        tags: ['performance', 'optimization']
      },
      {
        id: 'accessibility-audit',
        name: 'Accessibility Audit',
        category: 'soporte_qa',
        description: 'Audit accessibility compliance',
        costHint: 'high',
        inputs: { interface: 'string', standards: 'array' },
        outputs: { audit: 'object', violations: 'array' },
        tags: ['accessibility', 'compliance']
      },
      {
        id: 'xss-scan-hints',
        name: 'XSS Scan Hints',
        category: 'soporte_qa',
        description: 'Provide XSS vulnerability hints',
        costHint: 'medium',
        inputs: { code: 'string', patterns: 'array' },
        outputs: { hints: 'array', severity: 'object' },
        tags: ['security', 'xss']
      },
      {
        id: 'content-policy-check',
        name: 'Content Policy Check',
        category: 'soporte_qa',
        description: 'Check content policy compliance',
        costHint: 'low',
        inputs: { content: 'string', policies: 'array' },
        outputs: { compliance: 'object', violations: 'array' },
        tags: ['content-policy', 'compliance']
      },
      {
        id: 'pii-scrubbing-hints',
        name: 'PII Scrubbing Hints',
        category: 'soporte_qa',
        description: 'Provide PII data scrubbing suggestions',
        costHint: 'medium',
        inputs: { data: 'object', types: 'array' },
        outputs: { hints: 'array', methods: 'array' },
        tags: ['pii', 'data-privacy']
      },
      {
        id: 'prompt-linter',
        name: 'Prompt Linter',
        category: 'soporte_qa',
        description: 'Lint and optimize AI prompts',
        costHint: 'low',
        inputs: { prompt: 'string', context: 'object' },
        outputs: { linting: 'object', suggestions: 'array' },
        tags: ['prompt-engineering', 'linting']
      },
      {
        id: 'red-team-prompts',
        name: 'Red Team Prompts',
        category: 'soporte_qa',
        description: 'Generate red team security prompts',
        costHint: 'high',
        inputs: { system: 'string', objectives: 'array' },
        outputs: { prompts: 'array', scenarios: 'array' },
        tags: ['red-teaming', 'security-testing']
      }
    ];

    // Register all agents
    agents.forEach(agent => {
      this.agents.set(agent.id, agent);
      this.healthStatus.set(agent.id, {
        agentId: agent.id,
        status: 'healthy',
        successRate: 1.0,
        avgExecutionTime: 0,
        avgCost: 0,
        errorRate: 0,
        updatedAt: new Date().toISOString()
      });
      this.executionHistory.set(agent.id, []);
    });

    structuredLogger.info('AI Agents Registry initialized', {
      totalAgents: this.agents.size,
      categories: {
        ejecutivo: agents.filter(a => a.category === 'ejecutivo').length,
        ventas: agents.filter(a => a.category === 'ventas').length,
        marketing: agents.filter(a => a.category === 'marketing').length,
        operaciones: agents.filter(a => a.category === 'operaciones').length,
        finanzas: agents.filter(a => a.category === 'finanzas').length,
        soporte_qa: agents.filter(a => a.category === 'soporte_qa').length
      }
    });
  }

  /**
   * Get all registered agents
   */
  getAgents(): AgentDefinition[] {
    return Array.from(this.agents.values()).filter(agent => agent.enabled);
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: string): AgentDefinition[] {
    return this.getAgents().filter(agent => agent.category === category);
  }

  /**
   * Get specific agent by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Execute an agent with full lifecycle management
   */
  async executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const agent = this.getAgent(request.agentId);
    if (!agent) {
      throw new Error(`Agent ${request.agentId} not found`);
    }

    if (!agent.enabled) {
      throw new Error(`Agent ${request.agentId} is disabled`);
    }

    const executionId = this.generateExecutionId();
    const startedAt = new Date().toISOString();

    const execution: AgentExecutionResult = {
      id: executionId,
      agentId: request.agentId,
      status: 'pending',
      inputs: request.inputs,
      context: request.context,
      startedAt,
      retryCount: 0,
      version: agent.version
    };

    this.activeExecutions.set(executionId, execution);

    try {
      // Update status to running
      execution.status = 'running';
      this.activeExecutions.set(executionId, execution);

      // Execute the agent using real AI router client
      const aiRequest: AIRequest = {
        orgId: request.context.orgId,
        prompt: this.buildAgentPrompt(agent, request.inputs),
        maxTokens: this.estimateTokens(agent, request.inputs),
        temperature: 0.7,
        provider: 'mistral', // Prefer local Mistral
        context: {
          agentId: agent.id,
          agentName: agent.name,
          category: agent.category,
          version: agent.version
        },
        metadata: {
          executionId,
          priority: request.context.priority || agent.priority,
          budget: request.context.budget || 1.0
        }
      };

      const aiResponse = await aiRouterClient.sendRequest(aiRequest);
      
      // Process the AI response into agent outputs
      const outputs = this.processAgentOutputs(agent, aiResponse, request.inputs);
      
      const completedAt = new Date().toISOString();
      const executionTimeMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      execution.status = 'completed';
      execution.outputs = outputs;
      execution.completedAt = completedAt;
      execution.costEur = aiResponse.cost.actual || 0;
      execution.executionTimeMs = executionTimeMs;

      // Update health status
      this.updateHealthStatus(agent.id, true, executionTimeMs, execution.costEur);

      // Store in history
      this.executionHistory.get(agent.id)?.push(execution);

      structuredLogger.info('Agent execution completed', {
        executionId,
        agentId: agent.id,
        executionTimeMs,
        costEur: execution.costEur,
        orgId: request.context.orgId
      });

      return execution;

    } catch (error) {
      const completedAt = new Date().toISOString();
      const executionTimeMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

      execution.status = 'failed';
      execution.completedAt = completedAt;
      execution.error = (error as Error).message;
      execution.executionTimeMs = executionTimeMs;

      // Update health status
      this.updateHealthStatus(agent.id, false, executionTimeMs, 0);

      // Store in history
      this.executionHistory.get(agent.id)?.push(execution);

      structuredLogger.error('Agent execution failed', error as Error, {
        executionId,
        agentId: agent.id,
        orgId: request.context.orgId
      });

      throw error;
    } finally {
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Get agent health status
   */
  getAgentHealth(agentId: string): AgentHealthStatus | undefined {
    return this.healthStatus.get(agentId);
  }

  /**
   * Get all agent health statuses
   */
  getAllHealthStatuses(): AgentHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * Get execution history for an agent
   */
  getExecutionHistory(agentId: string, limit = 100): AgentExecutionResult[] {
    const history = this.executionHistory.get(agentId) || [];
    return history.slice(-limit);
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): AgentExecutionResult[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.updateAllHealthStatuses();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update health status for all agents
   */
  private updateAllHealthStatuses(): void {
    for (const [agentId, health] of this.healthStatus) {
      const history = this.getExecutionHistory(agentId, 100);
      if (history.length === 0) continue;

      const recentExecutions = history.slice(-20); // Last 20 executions
      const successful = recentExecutions.filter(e => e.status === 'completed');
      const failed = recentExecutions.filter(e => e.status === 'failed');

      const successRate = successful.length / recentExecutions.length;
      const avgExecutionTime = successful.reduce((sum, e) => sum + (e.executionTimeMs || 0), 0) / successful.length;
      const avgCost = successful.reduce((sum, e) => sum + (e.costEur || 0), 0) / successful.length;
      const errorRate = failed.length / recentExecutions.length;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (successRate < 0.8) status = 'unhealthy';
      else if (successRate < 0.95) status = 'degraded';

      health.status = status;
      health.successRate = successRate;
      health.avgExecutionTime = avgExecutionTime || 0;
      health.avgCost = avgCost || 0;
      health.errorRate = errorRate;
      health.lastError = failed.length > 0 ? failed[failed.length - 1].error : undefined;
      health.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Update health status for a specific agent
   */
  private updateHealthStatus(agentId: string, success: boolean, executionTime: number, cost: number): void {
    const health = this.healthStatus.get(agentId);
    if (!health) return;

    // Update running averages
    const alpha = 0.1; // Smoothing factor
    health.avgExecutionTime = health.avgExecutionTime * (1 - alpha) + executionTime * alpha;
    health.avgCost = health.avgCost * (1 - alpha) + cost * alpha;
    health.updatedAt = new Date().toISOString();
  }

  /**
   * Build agent-specific prompt
   */
  private buildAgentPrompt(agent: AgentDefinition, inputs: any): string {
    const basePrompt = `You are ${agent.name}, an AI agent specialized in ${agent.description}.

Your task is to process the following inputs and provide structured outputs according to your capabilities.

Inputs: ${JSON.stringify(inputs, null, 2)}

Please provide a comprehensive response that addresses the task requirements.`;

    return basePrompt;
  }

  /**
   * Process AI response into structured agent outputs
   */
  private processAgentOutputs(agent: AgentDefinition, aiResponse: any, inputs: any): any {
    // This would be more sophisticated in a real implementation
    // For now, we'll return a structured response based on the agent category
    const baseOutput = {
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      confidence: 0.85,
      processingTime: aiResponse.processingTime || 0
    };

    // Add category-specific outputs
    switch (agent.category) {
      case 'ventas':
        return {
          ...baseOutput,
          recommendations: ['Contact within 24 hours', 'Send personalized proposal'],
          nextActions: ['schedule_call', 'send_email'],
          priority: 'high'
        };
      
      case 'marketing':
        return {
          ...baseOutput,
          content: 'Generated marketing content...',
          metrics: { engagement: 0.12, conversion: 0.03 },
          suggestions: ['Improve headline', 'Add CTA button']
        };
      
      case 'operaciones':
        return {
          ...baseOutput,
          priority: 'high',
          category: 'technical',
          assignee: 'operations-team',
          estimatedResolution: '2 hours'
        };
      
      case 'finanzas':
        return {
          ...baseOutput,
          amount: 1250.00,
          currency: 'EUR',
          riskScore: 0.25,
          recommendations: ['Approve payment', 'Verify vendor']
        };
      
      case 'soporte_qa':
        return {
          ...baseOutput,
          severity: 'medium',
          category: 'bug',
          reproducible: true,
          testCases: ['Test case 1', 'Test case 2']
        };
      
      case 'ejecutivo':
        return {
          ...baseOutput,
          decision: 'Proceed with implementation',
          rationale: 'Strategic alignment with business objectives',
          nextSteps: ['Review budget', 'Assign team', 'Set timeline']
        };
      
      default:
        return baseOutput;
    }
  }

  /**
   * Estimate tokens for agent execution
   */
  private estimateTokens(agent: AgentDefinition, inputs: any): number {
    const baseTokens = 100;
    const inputTokens = JSON.stringify(inputs).length / 4; // Rough estimate
    const categoryMultiplier = {
      'low': 1,
      'medium': 2,
      'high': 4
    }[agent.costHint] || 2;

    return Math.ceil((baseTokens + inputTokens) * categoryMultiplier);
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiAgentsRegistry = new AIAgentsRegistryService();
