import { z } from 'zod';
import { AgentDescriptor, AgentContext, AgentResult, AgentCategory } from './types.js';
import { logger } from '@econeura/shared/logging';
import { withRetry } from '@econeura/shared/utils';

// Input/Output schemas for different agent categories

// Ventas (Sales) - 12 agents
const LeadEnrichInputSchema = z.object({
  companyName: z.string(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
});

const LeadEnrichOutputSchema = z.object({
  companyData: z.object({
    industry: z.string().optional(),
    employees: z.number().optional(),
    revenue: z.string().optional(),
    technologies: z.array(z.string()).optional(),
  }),
  contacts: z.array(z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email(),
    linkedIn: z.string().url().optional(),
  })),
  confidence: z.number().min(0).max(1),
});

const ScoreInputSchema = z.object({
  leadId: z.string(),
  companyData: z.record(z.unknown()),
  interactions: z.array(z.record(z.unknown())),
});

const ScoreOutputSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.array(z.object({
    factor: z.string(),
    weight: z.number(),
    value: z.number(),
  })),
  recommendation: z.enum(['hot', 'warm', 'cold']),
});

const NextBestActionInputSchema = z.object({
  dealId: z.string(),
  dealStage: z.string(),
  lastInteraction: z.date(),
  dealValue: z.number(),
});

const NextBestActionOutputSchema = z.object({
  action: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
  timeline: z.string(),
});

// Marketing - 12 agents
const SegmentBuildInputSchema = z.object({
  criteria: z.record(z.unknown()),
  targetSize: z.number().optional(),
});

const SegmentBuildOutputSchema = z.object({
  segment: z.object({
    name: z.string(),
    size: z.number(),
    criteria: z.record(z.unknown()),
  }),
  contacts: z.array(z.string()),
});

const SubjectABInputSchema = z.object({
  campaign: z.string(),
  audience: z.string(),
  variants: z.array(z.string()),
});

const SubjectABOutputSchema = z.object({
  recommendations: z.array(z.object({
    subject: z.string(),
    predictedOpenRate: z.number(),
    reasoning: z.string(),
  })),
});

// Operaciones (Operations) - 12 agents
const TicketTriageInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string().optional(),
  priority: z.string().optional(),
});

const TicketTriageOutputSchema = z.object({
  category: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  assignedTo: z.string().optional(),
  estimatedResolution: z.string(),
  reasoning: z.string(),
});

// Finanzas (Finance) - 12 agents
const InvoiceExtractInputSchema = z.object({
  documentUrl: z.string().url(),
  documentType: z.enum(['pdf', 'image', 'email']),
});

const InvoiceExtractOutputSchema = z.object({
  invoiceNumber: z.string().optional(),
  date: z.date().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  vendor: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })).optional(),
  confidence: z.number().min(0).max(1),
});

// Soporte/QA - 12 agents
const BugTriageInputSchema = z.object({
  title: z.string(),
  description: z.string(),
  logs: z.string().optional(),
  userAgent: z.string().optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
});

const BugTriageOutputSchema = z.object({
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.string(),
  component: z.string().optional(),
  reproducible: z.boolean(),
  priority: z.number().min(1).max(5),
  assignedTo: z.string().optional(),
  reasoning: z.string(),
});

// Generic agent execution function
async function executeAgent(
  agentId: string,
  inputs: unknown,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();
  
  try {
    // Simulate agent execution with proper error handling and retries
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Mock successful execution
    return {
      success: true,
      data: { result: `Agent ${agentId} executed successfully` },
      costEur: Math.random() * 0.1,
      executionTimeMs: Date.now() - startTime,
      metadata: {
        agentId,
        orgId: context.orgId,
        userId: context.userId,
      },
    };
  } catch (error) {
    logger.error('Agent execution failed', {
      agentId,
      orgId: context.orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// 60 Agents Registry - 5 categories × 12 agents each
export const AGENT_REGISTRY: AgentDescriptor[] = [
  // VENTAS (Sales) - 12 agents
  {
    id: 'lead-enrich',
    name: 'Lead Enrichment',
    description: 'Enriches lead data with company and contact information',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: LeadEnrichInputSchema,
    outputs: LeadEnrichOutputSchema,
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 3,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.15 per enrichment',
    tags: ['lead', 'enrichment', 'sales'],
    run: (inputs, context) => executeAgent('lead-enrich', inputs, context),
  },
  {
    id: 'score',
    name: 'Lead Scoring',
    description: 'Scores leads based on multiple factors and interactions',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: ScoreInputSchema,
    outputs: ScoreOutputSchema,
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.08 per scoring',
    tags: ['scoring', 'lead', 'ml'],
    run: (inputs, context) => executeAgent('score', inputs, context),
  },
  {
    id: 'next-best-action',
    name: 'Next Best Action',
    description: 'Recommends the next best action for a deal or lead',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: NextBestActionInputSchema,
    outputs: NextBestActionOutputSchema,
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.03-0.12 per recommendation',
    tags: ['recommendation', 'sales', 'ai'],
    run: (inputs, context) => executeAgent('next-best-action', inputs, context),
  },
  {
    id: 'email-draft',
    name: 'Email Draft Generator',
    description: 'Generates personalized email drafts for sales outreach',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      recipientName: z.string(),
      companyName: z.string(),
      context: z.string(),
      tone: z.enum(['formal', 'casual', 'friendly']),
    }),
    outputs: z.object({
      subject: z.string(),
      body: z.string(),
      callToAction: z.string(),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per draft',
    tags: ['email', 'content', 'personalization'],
    run: (inputs, context) => executeAgent('email-draft', inputs, context),
  },
  {
    id: 'follow-up',
    name: 'Follow-up Scheduler',
    description: 'Schedules and suggests follow-up actions',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      lastInteraction: z.date(),
      interactionType: z.string(),
      dealStage: z.string(),
    }),
    outputs: z.object({
      nextFollowUp: z.date(),
      method: z.enum(['email', 'call', 'meeting']),
      message: z.string(),
    }),
    policy: {
      maxExecutionTimeMs: 10000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.01-0.05 per follow-up',
    tags: ['follow-up', 'scheduling', 'automation'],
    run: (inputs, context) => executeAgent('follow-up', inputs, context),
  },
  {
    id: 'quote-gen',
    name: 'Quote Generator',
    description: 'Generates quotes based on products and pricing rules',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      products: z.array(z.object({
        id: z.string(),
        quantity: z.number(),
      })),
      customerId: z.string(),
      discount: z.number().optional(),
    }),
    outputs: z.object({
      quoteNumber: z.string(),
      items: z.array(z.object({
        product: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        total: z.number(),
      })),
      subtotal: z.number(),
      tax: z.number(),
      total: z.number(),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per quote',
    tags: ['quote', 'pricing', 'generation'],
    run: (inputs, context) => executeAgent('quote-gen', inputs, context),
  },
  {
    id: 'churn-risk',
    name: 'Churn Risk Assessment',
    description: 'Assesses customer churn risk based on behavior patterns',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      customerId: z.string(),
      interactions: z.array(z.record(z.unknown())),
      usage: z.record(z.number()),
    }),
    outputs: z.object({
      riskScore: z.number().min(0).max(1),
      riskLevel: z.enum(['low', 'medium', 'high']),
      factors: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.15 per assessment',
    tags: ['churn', 'risk', 'analytics'],
    run: (inputs, context) => executeAgent('churn-risk', inputs, context),
  },
  {
    id: 'upsell-tip',
    name: 'Upsell Opportunity',
    description: 'Identifies upsell opportunities for existing customers',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      customerId: z.string(),
      currentProducts: z.array(z.string()),
      usage: z.record(z.number()),
    }),
    outputs: z.object({
      opportunities: z.array(z.object({
        product: z.string(),
        confidence: z.number(),
        reasoning: z.string(),
        potentialValue: z.number(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 18000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.12 per analysis',
    tags: ['upsell', 'opportunity', 'revenue'],
    run: (inputs, context) => executeAgent('upsell-tip', inputs, context),
  },
  {
    id: 'notes-to-crm',
    name: 'Notes to CRM',
    description: 'Extracts structured data from meeting notes for CRM',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      notes: z.string(),
      meetingType: z.enum(['discovery', 'demo', 'negotiation', 'follow-up']),
    }),
    outputs: z.object({
      summary: z.string(),
      actionItems: z.array(z.string()),
      nextSteps: z.array(z.string()),
      sentiment: z.enum(['positive', 'neutral', 'negative']),
      keyPoints: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.08 per extraction',
    tags: ['notes', 'extraction', 'crm'],
    run: (inputs, context) => executeAgent('notes-to-crm', inputs, context),
  },
  {
    id: 'summary-call',
    name: 'Call Summary',
    description: 'Generates call summaries from transcripts',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      transcript: z.string(),
      participants: z.array(z.string()),
      duration: z.number(),
    }),
    outputs: z.object({
      summary: z.string(),
      keyDiscussionPoints: z.array(z.string()),
      decisions: z.array(z.string()),
      actionItems: z.array(z.object({
        item: z.string(),
        assignee: z.string(),
        dueDate: z.date().optional(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.12 per summary',
    tags: ['call', 'summary', 'transcript'],
    run: (inputs, context) => executeAgent('summary-call', inputs, context),
  },
  {
    id: 'agenda-gen',
    name: 'Meeting Agenda Generator',
    description: 'Generates meeting agendas based on context and objectives',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      meetingType: z.string(),
      participants: z.array(z.string()),
      objectives: z.array(z.string()),
      duration: z.number(),
    }),
    outputs: z.object({
      agenda: z.array(z.object({
        item: z.string(),
        duration: z.number(),
        owner: z.string(),
      })),
      preparationNotes: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 12000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per agenda',
    tags: ['agenda', 'meeting', 'planning'],
    run: (inputs, context) => executeAgent('agenda-gen', inputs, context),
  },
  {
    id: 'nps-insight',
    name: 'NPS Insights',
    description: 'Analyzes NPS feedback and provides actionable insights',
    category: AgentCategory.enum.ventas,
    version: '1.0.0',
    inputs: z.object({
      responses: z.array(z.object({
        score: z.number().min(0).max(10),
        feedback: z.string().optional(),
      })),
      timeframe: z.string(),
    }),
    outputs: z.object({
      npsScore: z.number(),
      trend: z.enum(['improving', 'stable', 'declining']),
      insights: z.array(z.string()),
      recommendations: z.array(z.string()),
      segments: z.array(z.object({
        name: z.string(),
        score: z.number(),
        count: z.number(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.06-0.15 per analysis',
    tags: ['nps', 'feedback', 'analytics'],
    run: (inputs, context) => executeAgent('nps-insight', inputs, context),
  },

  // MARKETING - 12 agents
  {
    id: 'segment-build',
    name: 'Segment Builder',
    description: 'Builds customer segments based on criteria',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: SegmentBuildInputSchema,
    outputs: SegmentBuildOutputSchema,
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.12 per segment',
    tags: ['segmentation', 'targeting', 'marketing'],
    run: (inputs, context) => executeAgent('segment-build', inputs, context),
  },
  {
    id: 'subject-ab',
    name: 'Subject Line A/B Testing',
    description: 'Generates and tests email subject line variants',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: SubjectABInputSchema,
    outputs: SubjectABOutputSchema,
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.08 per test',
    tags: ['email', 'ab-testing', 'optimization'],
    run: (inputs, context) => executeAgent('subject-ab', inputs, context),
  },
  {
    id: 'copy-rewrite',
    name: 'Copy Rewriter',
    description: 'Rewrites marketing copy for different audiences and channels',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      originalCopy: z.string(),
      targetAudience: z.string(),
      channel: z.enum(['email', 'social', 'web', 'print']),
      tone: z.enum(['professional', 'casual', 'urgent', 'friendly']),
    }),
    outputs: z.object({
      rewrittenCopy: z.string(),
      changes: z.array(z.string()),
      reasoning: z.string(),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per rewrite',
    tags: ['copywriting', 'content', 'optimization'],
    run: (inputs, context) => executeAgent('copy-rewrite', inputs, context),
  },
  {
    id: 'cta-suggest',
    name: 'CTA Suggestions',
    description: 'Suggests call-to-action improvements',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      currentCTA: z.string(),
      context: z.string(),
      goal: z.enum(['conversion', 'engagement', 'awareness']),
    }),
    outputs: z.object({
      suggestions: z.array(z.object({
        cta: z.string(),
        reasoning: z.string(),
        expectedImprovement: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per suggestion',
    tags: ['cta', 'optimization', 'conversion'],
    run: (inputs, context) => executeAgent('cta-suggest', inputs, context),
  },
  {
    id: 'utm-audit',
    name: 'UTM Parameter Audit',
    description: 'Audits and suggests UTM parameter improvements',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      campaigns: z.array(z.object({
        name: z.string(),
        url: z.string(),
        utmParams: z.record(z.string()),
      })),
    }),
    outputs: z.object({
      issues: z.array(z.object({
        campaign: z.string(),
        issue: z.string(),
        severity: z.enum(['high', 'medium', 'low']),
        suggestion: z.string(),
      })),
      recommendations: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.07 per audit',
    tags: ['utm', 'tracking', 'analytics'],
    run: (inputs, context) => executeAgent('utm-audit', inputs, context),
  },
  {
    id: 'seo-brief',
    name: 'SEO Content Brief',
    description: 'Generates SEO-optimized content briefs',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      keyword: z.string(),
      targetAudience: z.string(),
      contentType: z.enum(['blog', 'landing', 'product']),
    }),
    outputs: z.object({
      title: z.string(),
      outline: z.array(z.string()),
      keywords: z.array(z.string()),
      metaDescription: z.string(),
      wordCount: z.number(),
    }),
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.12 per brief',
    tags: ['seo', 'content', 'optimization'],
    run: (inputs, context) => executeAgent('seo-brief', inputs, context),
  },
  {
    id: 'post-calendar',
    name: 'Social Media Calendar',
    description: 'Generates social media posting calendar',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      brand: z.string(),
      platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram'])),
      themes: z.array(z.string()),
      frequency: z.string(),
    }),
    outputs: z.object({
      calendar: z.array(z.object({
        date: z.date(),
        platform: z.string(),
        content: z.string(),
        hashtags: z.array(z.string()),
        mediaType: z.enum(['text', 'image', 'video']),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 35000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'high',
    },
    costHint: '€0.08-0.20 per calendar',
    tags: ['social-media', 'calendar', 'content-planning'],
    run: (inputs, context) => executeAgent('post-calendar', inputs, context),
  },
  {
    id: 'trend-scan',
    name: 'Trend Scanner',
    description: 'Scans and analyzes market trends',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      industry: z.string(),
      keywords: z.array(z.string()),
      timeframe: z.enum(['week', 'month', 'quarter']),
    }),
    outputs: z.object({
      trends: z.array(z.object({
        trend: z.string(),
        momentum: z.enum(['rising', 'stable', 'declining']),
        relevance: z.number().min(0).max(1),
        sources: z.array(z.string()),
      })),
      opportunities: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 40000,
      maxRetries: 2,
      retryDelayMs: 2000,
      requiresApproval: false,
      costCategory: 'high',
    },
    costHint: '€0.10-0.25 per scan',
    tags: ['trends', 'market-research', 'intelligence'],
    run: (inputs, context) => executeAgent('trend-scan', inputs, context),
  },
  {
    id: 'outreach-list',
    name: 'Outreach List Builder',
    description: 'Builds targeted outreach lists',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      criteria: z.record(z.unknown()),
      size: z.number(),
      industry: z.string(),
    }),
    outputs: z.object({
      contacts: z.array(z.object({
        name: z.string(),
        email: z.string(),
        company: z.string(),
        title: z.string(),
        relevanceScore: z.number(),
      })),
      totalFound: z.number(),
    }),
    policy: {
      maxExecutionTimeMs: 45000,
      maxRetries: 2,
      retryDelayMs: 2000,
      requiresApproval: true,
      costCategory: 'high',
    },
    costHint: '€0.12-0.30 per list',
    tags: ['outreach', 'prospecting', 'lead-generation'],
    run: (inputs, context) => executeAgent('outreach-list', inputs, context),
  },
  {
    id: 'persona-synth',
    name: 'Persona Synthesizer',
    description: 'Synthesizes customer personas from data',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      customerData: z.array(z.record(z.unknown())),
      segments: z.array(z.string()),
    }),
    outputs: z.object({
      personas: z.array(z.object({
        name: z.string(),
        demographics: z.record(z.unknown()),
        psychographics: z.record(z.unknown()),
        painPoints: z.array(z.string()),
        goals: z.array(z.string()),
        channels: z.array(z.string()),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 35000,
      maxRetries: 2,
      retryDelayMs: 1500,
      requiresApproval: false,
      costCategory: 'high',
    },
    costHint: '€0.08-0.18 per synthesis',
    tags: ['persona', 'customer-research', 'segmentation'],
    run: (inputs, context) => executeAgent('persona-synth', inputs, context),
  },
  {
    id: 'landing-critique',
    name: 'Landing Page Critique',
    description: 'Provides detailed critique of landing pages',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      url: z.string().url(),
      goal: z.enum(['conversion', 'lead-gen', 'awareness']),
      targetAudience: z.string(),
    }),
    outputs: z.object({
      score: z.number().min(0).max(100),
      critiques: z.array(z.object({
        element: z.string(),
        issue: z.string(),
        suggestion: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
      })),
      recommendations: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.06-0.14 per critique',
    tags: ['landing-page', 'conversion', 'optimization'],
    run: (inputs, context) => executeAgent('landing-critique', inputs, context),
  },
  {
    id: 'faq-gen',
    name: 'FAQ Generator',
    description: 'Generates FAQ sections from content and support data',
    category: AgentCategory.enum.marketing,
    version: '1.0.0',
    inputs: z.object({
      content: z.string(),
      supportTickets: z.array(z.string()).optional(),
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
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per FAQ set',
    tags: ['faq', 'content', 'support'],
    run: (inputs, context) => executeAgent('faq-gen', inputs, context),
  },

  // OPERACIONES (Operations) - 12 agents
  {
    id: 'ticket-triage',
    name: 'Ticket Triage',
    description: 'Triages support tickets automatically',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: TicketTriageInputSchema,
    outputs: TicketTriageOutputSchema,
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 3,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per triage',
    tags: ['support', 'triage', 'automation'],
    run: (inputs, context) => executeAgent('ticket-triage', inputs, context),
  },
  {
    id: 'kb-suggest',
    name: 'Knowledge Base Suggestions',
    description: 'Suggests knowledge base articles for tickets',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      ticketContent: z.string(),
      category: z.string().optional(),
    }),
    outputs: z.object({
      suggestions: z.array(z.object({
        title: z.string(),
        url: z.string(),
        relevance: z.number(),
        excerpt: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 10000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.01-0.04 per suggestion',
    tags: ['knowledge-base', 'support', 'search'],
    run: (inputs, context) => executeAgent('kb-suggest', inputs, context),
  },
  {
    id: 'sop-draft',
    name: 'SOP Draft Generator',
    description: 'Drafts Standard Operating Procedures',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      process: z.string(),
      steps: z.array(z.string()),
      stakeholders: z.array(z.string()),
    }),
    outputs: z.object({
      sop: z.object({
        title: z.string(),
        purpose: z.string(),
        scope: z.string(),
        procedure: z.array(z.object({
          step: z.number(),
          action: z.string(),
          responsible: z.string(),
          notes: z.string().optional(),
        })),
        references: z.array(z.string()),
      }),
    }),
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.12 per SOP',
    tags: ['sop', 'documentation', 'process'],
    run: (inputs, context) => executeAgent('sop-draft', inputs, context),
  },
  {
    id: 'escalado-policy',
    name: 'Escalation Policy',
    description: 'Creates escalation policies for incidents',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      incidentType: z.string(),
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      teams: z.array(z.string()),
    }),
    outputs: z.object({
      policy: z.object({
        triggers: z.array(z.string()),
        escalationPath: z.array(z.object({
          level: z.number(),
          team: z.string(),
          timeoutMinutes: z.number(),
        })),
        notifications: z.array(z.string()),
      }),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.08 per policy',
    tags: ['escalation', 'incident', 'policy'],
    run: (inputs, context) => executeAgent('escalado-policy', inputs, context),
  },
  {
    id: 'capacity-plan',
    name: 'Capacity Planning',
    description: 'Plans capacity based on usage patterns',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      currentUsage: z.record(z.number()),
      growthRate: z.number(),
      timeframe: z.string(),
    }),
    outputs: z.object({
      recommendations: z.array(z.object({
        resource: z.string(),
        currentCapacity: z.number(),
        recommendedCapacity: z.number(),
        reasoning: z.string(),
        timeline: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.06-0.14 per plan',
    tags: ['capacity', 'planning', 'resources'],
    run: (inputs, context) => executeAgent('capacity-plan', inputs, context),
  },
  {
    id: 'stock-alert',
    name: 'Stock Alert Generator',
    description: 'Generates stock level alerts and recommendations',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      inventory: z.array(z.object({
        sku: z.string(),
        currentStock: z.number(),
        reorderPoint: z.number(),
        leadTime: z.number(),
      })),
    }),
    outputs: z.object({
      alerts: z.array(z.object({
        sku: z.string(),
        alertType: z.enum(['low', 'out', 'overstock']),
        currentStock: z.number(),
        recommendedAction: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per alert batch',
    tags: ['inventory', 'alerts', 'stock'],
    run: (inputs, context) => executeAgent('stock-alert', inputs, context),
  },
  {
    id: 'supplier-ping',
    name: 'Supplier Communication',
    description: 'Generates supplier communication templates',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      supplierName: z.string(),
      purpose: z.enum(['order', 'inquiry', 'complaint', 'payment']),
      context: z.string(),
    }),
    outputs: z.object({
      subject: z.string(),
      message: z.string(),
      tone: z.string(),
      followUpActions: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 18000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.03-0.08 per message',
    tags: ['supplier', 'communication', 'procurement'],
    run: (inputs, context) => executeAgent('supplier-ping', inputs, context),
  },
  {
    id: 'shipment-eta',
    name: 'Shipment ETA Predictor',
    description: 'Predicts shipment arrival times',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      trackingNumber: z.string(),
      carrier: z.string(),
      origin: z.string(),
      destination: z.string(),
    }),
    outputs: z.object({
      estimatedArrival: z.date(),
      confidence: z.number().min(0).max(1),
      factors: z.array(z.string()),
      alternatives: z.array(z.object({
        date: z.date(),
        probability: z.number(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 3,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per prediction',
    tags: ['shipping', 'eta', 'prediction'],
    run: (inputs, context) => executeAgent('shipment-eta', inputs, context),
  },
  {
    id: 'sla-watch',
    name: 'SLA Monitor',
    description: 'Monitors SLA compliance and generates alerts',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      tickets: z.array(z.object({
        id: z.string(),
        createdAt: z.date(),
        priority: z.string(),
        status: z.string(),
      })),
      slaRules: z.record(z.number()),
    }),
    outputs: z.object({
      violations: z.array(z.object({
        ticketId: z.string(),
        violationType: z.string(),
        timeOverdue: z.number(),
        severity: z.enum(['critical', 'high', 'medium']),
      })),
      atRisk: z.array(z.object({
        ticketId: z.string(),
        timeRemaining: z.number(),
        riskLevel: z.number(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 12000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.05 per monitoring cycle',
    tags: ['sla', 'monitoring', 'compliance'],
    run: (inputs, context) => executeAgent('sla-watch', inputs, context),
  },
  {
    id: 'task-bundle',
    name: 'Task Bundler',
    description: 'Bundles related tasks for efficiency',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      tasks: z.array(z.object({
        id: z.string(),
        type: z.string(),
        priority: z.number(),
        estimatedTime: z.number(),
        dependencies: z.array(z.string()),
      })),
    }),
    outputs: z.object({
      bundles: z.array(z.object({
        id: z.string(),
        tasks: z.array(z.string()),
        totalTime: z.number(),
        priority: z.number(),
        reasoning: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.07 per bundling',
    tags: ['tasks', 'optimization', 'efficiency'],
    run: (inputs, context) => executeAgent('task-bundle', inputs, context),
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes Processor',
    description: 'Processes and structures meeting notes',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      rawNotes: z.string(),
      attendees: z.array(z.string()),
      meetingType: z.string(),
    }),
    outputs: z.object({
      summary: z.string(),
      keyPoints: z.array(z.string()),
      actionItems: z.array(z.object({
        item: z.string(),
        assignee: z.string(),
        dueDate: z.date().optional(),
        status: z.enum(['pending', 'in-progress', 'completed']),
      })),
      decisions: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.09 per processing',
    tags: ['meetings', 'notes', 'structure'],
    run: (inputs, context) => executeAgent('meeting-notes', inputs, context),
  },
  {
    id: 'action-items',
    name: 'Action Item Tracker',
    description: 'Tracks and manages action items',
    category: AgentCategory.enum.operaciones,
    version: '1.0.0',
    inputs: z.object({
      actionItems: z.array(z.object({
        id: z.string(),
        description: z.string(),
        assignee: z.string(),
        dueDate: z.date(),
        status: z.string(),
      })),
    }),
    outputs: z.object({
      overdue: z.array(z.string()),
      dueSoon: z.array(z.string()),
      recommendations: z.array(z.object({
        itemId: z.string(),
        recommendation: z.string(),
        reasoning: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 10000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.05 per tracking cycle',
    tags: ['action-items', 'tracking', 'management'],
    run: (inputs, context) => executeAgent('action-items', inputs, context),
  },

  // FINANZAS (Finance) - 12 agents
  {
    id: 'invoice-extract',
    name: 'Invoice Data Extractor',
    description: 'Extracts structured data from invoice documents',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: InvoiceExtractInputSchema,
    outputs: InvoiceExtractOutputSchema,
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.15 per extraction',
    tags: ['invoice', 'extraction', 'ocr'],
    run: (inputs, context) => executeAgent('invoice-extract', inputs, context),
  },
  {
    id: 'ar-prioritize',
    name: 'AR Prioritization',
    description: 'Prioritizes accounts receivable collection efforts',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      accounts: z.array(z.object({
        customerId: z.string(),
        amount: z.number(),
        daysPastDue: z.number(),
        paymentHistory: z.array(z.record(z.unknown())),
      })),
    }),
    outputs: z.object({
      prioritizedAccounts: z.array(z.object({
        customerId: z.string(),
        priority: z.number(),
        riskScore: z.number(),
        recommendedAction: z.string(),
        reasoning: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.12 per prioritization',
    tags: ['accounts-receivable', 'prioritization', 'collections'],
    run: (inputs, context) => executeAgent('ar-prioritize', inputs, context),
  },
  {
    id: 'dunning-draft',
    name: 'Dunning Letter Draft',
    description: 'Drafts dunning letters for overdue accounts',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      customerId: z.string(),
      amount: z.number(),
      daysPastDue: z.number(),
      dunningLevel: z.enum(['first', 'second', 'final']),
    }),
    outputs: z.object({
      subject: z.string(),
      body: z.string(),
      tone: z.enum(['friendly', 'firm', 'urgent']),
      nextAction: z.string(),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.03-0.08 per draft',
    tags: ['dunning', 'collections', 'communication'],
    run: (inputs, context) => executeAgent('dunning-draft', inputs, context),
  },
  {
    id: 'sepa-reconcile-hint',
    name: 'SEPA Reconciliation Helper',
    description: 'Provides hints for SEPA transaction reconciliation',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      transaction: z.object({
        amount: z.number(),
        reference: z.string(),
        counterparty: z.string(),
        date: z.date(),
      }),
      openInvoices: z.array(z.object({
        id: z.string(),
        amount: z.number(),
        customerId: z.string(),
      })),
    }),
    outputs: z.object({
      matches: z.array(z.object({
        invoiceId: z.string(),
        confidence: z.number(),
        reasoning: z.string(),
      })),
      suggestions: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per hint',
    tags: ['sepa', 'reconciliation', 'matching'],
    run: (inputs, context) => executeAgent('sepa-reconcile-hint', inputs, context),
  },
  {
    id: 'anomaly-cost',
    name: 'Cost Anomaly Detection',
    description: 'Detects anomalies in cost patterns',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      expenses: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        date: z.date(),
        vendor: z.string(),
      })),
      timeframe: z.string(),
    }),
    outputs: z.object({
      anomalies: z.array(z.object({
        expense: z.string(),
        anomalyType: z.string(),
        severity: z.enum(['high', 'medium', 'low']),
        deviation: z.number(),
        explanation: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per analysis',
    tags: ['anomaly', 'cost', 'detection'],
    run: (inputs, context) => executeAgent('anomaly-cost', inputs, context),
  },
  {
    id: 'forecast-cash',
    name: 'Cash Flow Forecast',
    description: 'Forecasts cash flow based on historical data',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      historicalData: z.array(z.object({
        date: z.date(),
        inflow: z.number(),
        outflow: z.number(),
      })),
      forecastPeriod: z.number(),
    }),
    outputs: z.object({
      forecast: z.array(z.object({
        date: z.date(),
        predictedInflow: z.number(),
        predictedOutflow: z.number(),
        netCashFlow: z.number(),
        confidence: z.number(),
      })),
      insights: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'high',
    },
    costHint: '€0.08-0.20 per forecast',
    tags: ['cash-flow', 'forecast', 'prediction'],
    run: (inputs, context) => executeAgent('forecast-cash', inputs, context),
  },
  {
    id: 'budget-watch',
    name: 'Budget Monitor',
    description: 'Monitors budget performance and alerts',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      budgets: z.array(z.object({
        category: z.string(),
        budgetAmount: z.number(),
        spentAmount: z.number(),
        period: z.string(),
      })),
    }),
    outputs: z.object({
      alerts: z.array(z.object({
        category: z.string(),
        alertType: z.enum(['over-budget', 'approaching-limit', 'under-utilized']),
        variance: z.number(),
        recommendation: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 12000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.05 per monitoring cycle',
    tags: ['budget', 'monitoring', 'alerts'],
    run: (inputs, context) => executeAgent('budget-watch', inputs, context),
  },
  {
    id: 'fx-rate-note',
    name: 'FX Rate Notifier',
    description: 'Notifies about favorable exchange rate movements',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      currencyPairs: z.array(z.string()),
      thresholds: z.record(z.number()),
      positions: z.array(z.object({
        currency: z.string(),
        amount: z.number(),
        direction: z.enum(['long', 'short']),
      })),
    }),
    outputs: z.object({
      notifications: z.array(z.object({
        currencyPair: z.string(),
        currentRate: z.number(),
        threshold: z.number(),
        recommendation: z.string(),
        impact: z.number(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 3,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.03-0.08 per notification cycle',
    tags: ['forex', 'rates', 'notifications'],
    run: (inputs, context) => executeAgent('fx-rate-note', inputs, context),
  },
  {
    id: 'tax-check-hint',
    name: 'Tax Compliance Checker',
    description: 'Checks transactions for tax compliance issues',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      transactions: z.array(z.object({
        amount: z.number(),
        type: z.string(),
        jurisdiction: z.string(),
        date: z.date(),
      })),
      taxRules: z.record(z.unknown()),
    }),
    outputs: z.object({
      issues: z.array(z.object({
        transactionId: z.string(),
        issueType: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        recommendation: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.12 per check',
    tags: ['tax', 'compliance', 'checking'],
    run: (inputs, context) => executeAgent('tax-check-hint', inputs, context),
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder Generator',
    description: 'Generates personalized payment reminders',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      customerId: z.string(),
      invoiceAmount: z.number(),
      dueDate: z.date(),
      paymentHistory: z.array(z.record(z.unknown())),
    }),
    outputs: z.object({
      reminder: z.object({
        subject: z.string(),
        message: z.string(),
        tone: z.enum(['friendly', 'neutral', 'firm']),
        urgency: z.enum(['low', 'medium', 'high']),
      }),
      followUpSchedule: z.array(z.date()),
    }),
    policy: {
      maxExecutionTimeMs: 18000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.07 per reminder',
    tags: ['payment', 'reminder', 'communication'],
    run: (inputs, context) => executeAgent('payment-reminder', inputs, context),
  },
  {
    id: 'fee-detect',
    name: 'Fee Detection',
    description: 'Detects and categorizes fees in financial transactions',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      transactions: z.array(z.object({
        description: z.string(),
        amount: z.number(),
        date: z.date(),
        account: z.string(),
      })),
    }),
    outputs: z.object({
      detectedFees: z.array(z.object({
        transactionId: z.string(),
        feeType: z.string(),
        amount: z.number(),
        confidence: z.number(),
        reasoning: z.string(),
      })),
      summary: z.object({
        totalFees: z.number(),
        feesByType: z.record(z.number()),
      }),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.09 per detection batch',
    tags: ['fees', 'detection', 'categorization'],
    run: (inputs, context) => executeAgent('fee-detect', inputs, context),
  },
  {
    id: 'refund-assist',
    name: 'Refund Assistant',
    description: 'Assists with refund processing and documentation',
    category: AgentCategory.enum.finanzas,
    version: '1.0.0',
    inputs: z.object({
      refundRequest: z.object({
        amount: z.number(),
        reason: z.string(),
        originalTransaction: z.string(),
        customerId: z.string(),
      }),
    }),
    outputs: z.object({
      eligibility: z.object({
        eligible: z.boolean(),
        reasoning: z.string(),
        conditions: z.array(z.string()),
      }),
      processing: z.object({
        method: z.string(),
        timeframe: z.string(),
        documentation: z.array(z.string()),
      }),
    }),
    policy: {
      maxExecutionTimeMs: 22000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per assistance',
    tags: ['refund', 'processing', 'assistance'],
    run: (inputs, context) => executeAgent('refund-assist', inputs, context),
  },

  // SOPORTE/QA - 12 agents
  {
    id: 'bug-triage',
    name: 'Bug Triage',
    description: 'Triages bug reports and assigns severity',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: BugTriageInputSchema,
    outputs: BugTriageOutputSchema,
    policy: {
      maxExecutionTimeMs: 18000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.07 per triage',
    tags: ['bug', 'triage', 'qa'],
    run: (inputs, context) => executeAgent('bug-triage', inputs, context),
  },
  {
    id: 'repro-steps',
    name: 'Reproduction Steps Generator',
    description: 'Generates reproduction steps from bug descriptions',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      bugDescription: z.string(),
      environment: z.string(),
      expectedBehavior: z.string(),
      actualBehavior: z.string(),
    }),
    outputs: z.object({
      steps: z.array(z.object({
        step: z.number(),
        action: z.string(),
        expectedResult: z.string(),
      })),
      prerequisites: z.array(z.string()),
      testData: z.array(z.string()),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.06 per generation',
    tags: ['reproduction', 'testing', 'qa'],
    run: (inputs, context) => executeAgent('repro-steps', inputs, context),
  },
  {
    id: 'test-case-gen',
    name: 'Test Case Generator',
    description: 'Generates test cases from requirements',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      requirements: z.string(),
      feature: z.string(),
      testType: z.enum(['unit', 'integration', 'e2e', 'performance']),
    }),
    outputs: z.object({
      testCases: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        steps: z.array(z.string()),
        expectedResult: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.05-0.12 per generation',
    tags: ['test-cases', 'testing', 'qa'],
    run: (inputs, context) => executeAgent('test-case-gen', inputs, context),
  },
  {
    id: 'release-notes',
    name: 'Release Notes Generator',
    description: 'Generates release notes from commit messages and PRs',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      commits: z.array(z.string()),
      pullRequests: z.array(z.string()),
      version: z.string(),
    }),
    outputs: z.object({
      releaseNotes: z.object({
        version: z.string(),
        date: z.date(),
        features: z.array(z.string()),
        bugFixes: z.array(z.string()),
        improvements: z.array(z.string()),
        breaking: z.array(z.string()),
      }),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: true,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per release',
    tags: ['release-notes', 'documentation', 'changelog'],
    run: (inputs, context) => executeAgent('release-notes', inputs, context),
  },
  {
    id: 'risk-matrix',
    name: 'Risk Matrix Generator',
    description: 'Generates risk matrices for projects',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      project: z.string(),
      risks: z.array(z.object({
        description: z.string(),
        category: z.string(),
        impact: z.number(),
        probability: z.number(),
      })),
    }),
    outputs: z.object({
      matrix: z.array(z.array(z.number())),
      riskLevels: z.array(z.object({
        risk: z.string(),
        level: z.enum(['low', 'medium', 'high', 'critical']),
        mitigation: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 18000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.09 per matrix',
    tags: ['risk', 'matrix', 'assessment'],
    run: (inputs, context) => executeAgent('risk-matrix', inputs, context),
  },
  {
    id: 'perf-hint',
    name: 'Performance Hints',
    description: 'Provides performance optimization hints',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      metrics: z.record(z.number()),
      codeSnippet: z.string().optional(),
      framework: z.string().optional(),
    }),
    outputs: z.object({
      hints: z.array(z.object({
        type: z.string(),
        description: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
        effort: z.enum(['high', 'medium', 'low']),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.03-0.07 per analysis',
    tags: ['performance', 'optimization', 'hints'],
    run: (inputs, context) => executeAgent('perf-hint', inputs, context),
  },
  {
    id: 'a11y-audit',
    name: 'Accessibility Audit',
    description: 'Audits accessibility compliance',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      html: z.string(),
      url: z.string().url().optional(),
      wcagLevel: z.enum(['A', 'AA', 'AAA']),
    }),
    outputs: z.object({
      violations: z.array(z.object({
        rule: z.string(),
        severity: z.enum(['critical', 'serious', 'moderate', 'minor']),
        description: z.string(),
        fix: z.string(),
      })),
      score: z.number().min(0).max(100),
    }),
    policy: {
      maxExecutionTimeMs: 30000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.06-0.14 per audit',
    tags: ['accessibility', 'audit', 'wcag'],
    run: (inputs, context) => executeAgent('a11y-audit', inputs, context),
  },
  {
    id: 'xss-scan-hint',
    name: 'XSS Scan Hints',
    description: 'Provides hints for XSS vulnerability scanning',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      code: z.string(),
      framework: z.string().optional(),
      inputFields: z.array(z.string()),
    }),
    outputs: z.object({
      vulnerabilities: z.array(z.object({
        type: z.string(),
        location: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        recommendation: z.string(),
      })),
    }),
    policy: {
      maxExecutionTimeMs: 25000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'high',
    },
    costHint: '€0.08-0.18 per scan',
    tags: ['security', 'xss', 'vulnerability'],
    run: (inputs, context) => executeAgent('xss-scan-hint', inputs, context),
  },
  {
    id: 'content-policy-check',
    name: 'Content Policy Checker',
    description: 'Checks content against policy guidelines',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      content: z.string(),
      contentType: z.enum(['text', 'image', 'video', 'audio']),
      policies: z.array(z.string()),
    }),
    outputs: z.object({
      violations: z.array(z.object({
        policy: z.string(),
        violation: z.string(),
        severity: z.enum(['high', 'medium', 'low']),
        recommendation: z.string(),
      })),
      approved: z.boolean(),
    }),
    policy: {
      maxExecutionTimeMs: 20000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.04-0.10 per check',
    tags: ['content', 'policy', 'compliance'],
    run: (inputs, context) => executeAgent('content-policy-check', inputs, context),
  },
  {
    id: 'pii-scrub-hint',
    name: 'PII Scrubbing Hints',
    description: 'Provides hints for PII detection and scrubbing',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      text: z.string(),
      dataTypes: z.array(z.enum(['email', 'phone', 'ssn', 'credit-card', 'name'])),
    }),
    outputs: z.object({
      detectedPII: z.array(z.object({
        type: z.string(),
        value: z.string(),
        confidence: z.number(),
        location: z.object({
          start: z.number(),
          end: z.number(),
        }),
      })),
      scrubbedText: z.string(),
    }),
    policy: {
      maxExecutionTimeMs: 15000,
      maxRetries: 2,
      retryDelayMs: 1000,
      requiresApproval: false,
      costCategory: 'medium',
    },
    costHint: '€0.03-0.08 per scrubbing',
    tags: ['pii', 'privacy', 'scrubbing'],
    run: (inputs, context) => executeAgent('pii-scrub-hint', inputs, context),
  },
  {
    id: 'prompt-lint',
    name: 'Prompt Linter',
    description: 'Lints AI prompts for best practices',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      prompt: z.string(),
      model: z.string(),
      purpose: z.string(),
    }),
    outputs: z.object({
      issues: z.array(z.object({
        rule: z.string(),
        message: z.string(),
        severity: z.enum(['error', 'warning', 'info']),
        suggestion: z.string(),
      })),
      score: z.number().min(0).max(100),
    }),
    policy: {
      maxExecutionTimeMs: 12000,
      maxRetries: 2,
      retryDelayMs: 500,
      requiresApproval: false,
      costCategory: 'low',
    },
    costHint: '€0.02-0.05 per lint',
    tags: ['prompt', 'linting', 'ai'],
    run: (inputs, context) => executeAgent('prompt-lint', inputs, context),
  },
  {
    id: 'red-team-prompt',
    name: 'Red Team Prompt Testing',
    description: 'Tests prompts for adversarial attacks',
    category: AgentCategory.enum.soporte_qa,
    version: '1.0.0',
    inputs: z.object({
      prompt: z.string(),
      model: z.string(),
      testScenarios: z.array(z.string()),
    }),
    outputs: z.object({
      vulnerabilities: z.array(z.object({
        scenario: z.string(),
        attack: z.string(),
        success: z.boolean(),
        risk: z.enum(['critical', 'high', 'medium', 'low']),
        mitigation: z.string(),
      })),
      overallRisk: z.enum(['critical', 'high', 'medium', 'low']),
    }),
    policy: {
      maxExecutionTimeMs: 35000,
      maxRetries: 2,
      retryDelayMs: 1500,
      requiresApproval: true,
      costCategory: 'high',
    },
    costHint: '€0.10-0.25 per test',
    tags: ['security', 'red-team', 'prompt-injection'],
    run: (inputs, context) => executeAgent('red-team-prompt', inputs, context),
  },
];

// Agent Registry Manager
export class AgentRegistryManager {
  private agents: Map<string, AgentDescriptor> = new Map();

  constructor() {
    this.loadAgents();
  }

  private loadAgents(): void {
    AGENT_REGISTRY.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
    
    logger.info('Agent registry loaded', {
      totalAgents: this.agents.size,
      categories: this.getCategoryCounts(),
    });
  }

  getAgent(id: string): AgentDescriptor | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  getAgentsByCategory(category: AgentCategoryType): AgentDescriptor[] {
    return Array.from(this.agents.values()).filter(
      agent => agent.category === category
    );
  }

  getCategoryCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    
    Array.from(this.agents.values()).forEach(agent => {
      counts[agent.category] = (counts[agent.category] || 0) + 1;
    });
    
    return counts;
  }

  async executeAgent(
    agentId: string,
    inputs: unknown,
    context: AgentContext
  ): Promise<AgentResult> {
    const agent = this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Validate inputs
    try {
      agent.inputs.parse(inputs);
    } catch (error) {
      return {
        success: false,
        error: `Invalid inputs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTimeMs: 0,
      };
    }

    // Execute with retry logic
    return withRetry(
      () => agent.run(inputs, context),
      agent.policy.maxRetries,
      agent.policy.retryDelayMs
    );
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistryManager();