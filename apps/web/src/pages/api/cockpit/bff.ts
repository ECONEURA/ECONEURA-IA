/**
 * Backend for Frontend (BFF) para Cockpit
 * FASE 4 - COCKPIT SIN MOCKS EMBEBIDOS
 * 
 * Funcionalidades:
 * - Consume vía BFF (NEXT_PUBLIC_API_URL)
 * - EventSource/WebSocket para progreso
 * - Costes visibles SOLO en IA
 * - Integración con FinOps
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

const AgentConfigSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  dept: z.enum(['ceo', 'ventas', 'marketing', 'operaciones', 'finanzas', 'ia', 'soporte_qa']),
  status: z.enum(['idle', 'running', 'completed', 'error', 'paused']),
  usage: z.object({
    tokens: z.number().min(0),
    cost: z.number().min(0),
    requests: z.number().min(0),
    lastUpdated: z.string(),
  }).optional(),
  progress: z.object({
    current: z.number().min(0),
    total: z.number().min(0),
    message: z.string(),
  }).optional(),
});

const ActivityEventSchema = z.object({
  id: z.string(),
  type: z.enum(['agent_start', 'agent_complete', 'agent_error', 'system_alert', 'user_action']),
  timestamp: z.string(),
  dept: z.enum(['ceo', 'ventas', 'marketing', 'operaciones', 'finanzas', 'ia', 'soporte_qa']),
  agent: z.string().optional(),
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const RunOrderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  dept: z.enum(['ceo', 'ventas', 'marketing', 'operaciones', 'finanzas', 'ia', 'soporte_qa']),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimatedDuration: z.number().min(0),
  progress: z.object({
    current: z.number().min(0),
    total: z.number().min(0),
    message: z.string(),
  }).optional(),
  cost: z.object({
    estimated: z.number().min(0),
    actual: z.number().min(0),
    tokens: z.number().min(0),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
export type RunOrder = z.infer<typeof RunOrderSchema>;

// ============================================================================
// API CLIENT
// ============================================================================

class CockpitAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.apiKey = process.env.API_KEY || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAgents(dept?: string): Promise<AgentConfig[]> {
    const endpoint = dept ? `/v1/agents?dept=${dept}` : '/v1/agents';
    return this.request<AgentConfig[]>(endpoint);
  }

  async getAgent(agentId: string): Promise<AgentConfig> {
    return this.request<AgentConfig>(`/v1/agents/${agentId}`);
  }

  async executeAgent(agentId: string, inputs: unknown): Promise<{
    executionId: string;
    status: string;
    result?: unknown;
    cost?: number;
  }> {
    return this.request(`/v1/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ inputs }),
    });
  }

  async getAgentHealth(agentId: string): Promise<{
    status: string;
    lastChecked: string;
    avgResponseTimeMs: number;
    successCount: number;
    failureCount: number;
    circuitBreakerState: string;
  }> {
    return this.request(`/v1/agents/${agentId}/health`);
  }

  async getTimelineEvents(dept?: string, limit = 50): Promise<ActivityEvent[]> {
    const endpoint = dept ? `/v1/timeline?dept=${dept}&limit=${limit}` : `/v1/timeline?limit=${limit}`;
    return this.request<ActivityEvent[]>(endpoint);
  }

  async getRunOrders(dept?: string): Promise<RunOrder[]> {
    const endpoint = dept ? `/v1/run-orders?dept=${dept}` : '/v1/run-orders';
    return this.request<RunOrder[]>(endpoint);
  }

  async createRunOrder(order: Omit<RunOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<RunOrder> {
    return this.request<RunOrder>('/v1/run-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getCostStatus(orgId: string): Promise<{
    orgId: string;
    currentDaily: number;
    currentMonthly: number;
    limits: {
      dailyLimitEUR: number;
      monthlyLimitEUR: number;
      perRequestLimitEUR: number;
    };
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    killSwitchActive: boolean;
  }> {
    return this.request(`/v1/finops/status/${orgId}`);
  }
}

// ============================================================================
// BFF HANDLERS
// ============================================================================

const apiClient = new CockpitAPIClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { method, query, body } = req;
    const { endpoint } = query;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      return res.status(200).end();
    }

    switch (endpoint) {
      case 'agents':
        if (method === 'GET') {
          const dept = query.dept as string;
          const agents = await apiClient.getAgents(dept);
          return res.status(200).json({ success: true, data: agents });
        }
        break;

      case 'agent':
        if (method === 'GET') {
          const agentId = query.id as string;
          const agent = await apiClient.getAgent(agentId);
          return res.status(200).json({ success: true, data: agent });
        }
        break;

      case 'execute':
        if (method === 'POST') {
          const { agentId, inputs } = body;
          const result = await apiClient.executeAgent(agentId, inputs);
          return res.status(200).json({ success: true, data: result });
        }
        break;

      case 'health':
        if (method === 'GET') {
          const agentId = query.id as string;
          const health = await apiClient.getAgentHealth(agentId);
          return res.status(200).json({ success: true, data: health });
        }
        break;

      case 'timeline':
        if (method === 'GET') {
          const dept = query.dept as string;
          const limit = parseInt(query.limit as string) || 50;
          const events = await apiClient.getTimelineEvents(dept, limit);
          return res.status(200).json({ success: true, data: events });
        }
        break;

      case 'run-orders':
        if (method === 'GET') {
          const dept = query.dept as string;
          const orders = await apiClient.getRunOrders(dept);
          return res.status(200).json({ success: true, data: orders });
        } else if (method === 'POST') {
          const order = RunOrderSchema.parse(body);
          const createdOrder = await apiClient.createRunOrder(order);
          return res.status(201).json({ success: true, data: createdOrder });
        }
        break;

      case 'cost-status':
        if (method === 'GET') {
          const orgId = query.orgId as string;
          const costStatus = await apiClient.getCostStatus(orgId);
          return res.status(200).json({ success: true, data: costStatus });
        }
        break;

      default:
        return res.status(404).json({ 
          success: false, 
          error: 'Endpoint not found',
          availableEndpoints: [
            'agents', 'agent', 'execute', 'health', 
            'timeline', 'run-orders', 'cost-status'
          ]
        });
    }

    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });

  } catch (error) {
    console.error('BFF Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
