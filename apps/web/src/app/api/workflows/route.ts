import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const WorkflowTypeSchema = z.enum(['bpmn', 'state_machine']);
const WorkflowStatusSchema = z.enum(['draft', 'active', 'inactive', 'archived']);
const InstanceStatusSchema = z.enum(['running', 'completed', 'failed', 'paused', 'cancelled']);
const ActionTypeSchema = z.enum(['function', 'http', 'delay', 'condition', 'notification']);

const BpmnElementSchema = z.object({
  id: z.string(),
  type: z.enum(['startEvent', 'endEvent', 'task', 'gateway', 'subprocess']),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  properties: z.record(z.any()).optional(),
  actions: z.array(z.string()).optional(),
  conditions: z.record(z.string()).optional(),
});

const BpmnFlowSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional(),
});

const BpmnWorkflowSchema = z.object({
  elements: z.array(BpmnElementSchema),
  flows: z.array(BpmnFlowSchema),
  startElement: z.string(),
  endElements: z.array(z.string()),
});

const StateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['initial', 'intermediate', 'final', 'error']),
  actions: z.array(z.string()).optional(),
  timeout: z.number().optional(),
  properties: z.record(z.any()).optional(),
});

const TransitionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  event: z.string().optional(),
  condition: z.string().optional(),
});

const StateMachineWorkflowSchema = z.object({
  states: z.array(StateSchema),
  transitions: z.array(TransitionSchema),
  initialState: z.string(),
  finalStates: z.array(z.string()),
});

const ActionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ActionTypeSchema,
  config: z.record(z.any()),
  order: z.number(),
  timeout: z.number().optional(),
  retry: z.object({
    maxAttempts: z.number(),
    strategy: z.enum(['fixed', 'exponential', 'linear']),
    delay: z.number(),
  }).optional(),
});

const WorkflowMetadataSchema = z.object({
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.number().optional(),
  timeout: z.number().optional(),
  description: z.string().optional(),
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  type: WorkflowTypeSchema,
  status: WorkflowStatusSchema,
  version: z.number().positive(),
  definition: z.union([BpmnWorkflowSchema, StateMachineWorkflowSchema]),
  actions: z.array(ActionSchema),
  metadata: WorkflowMetadataSchema.optional(),
});

const UpdateWorkflowSchema = CreateWorkflowSchema.partial();

const StartWorkflowSchema = z.object({
  context: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addFinOpsHeaders(response: NextResponse, startTime: number): NextResponse {
  const endTime = Date.now();
  const latency = endTime - startTime;

  response.headers.set('X-Request-Id', generateRequestId());
  response.headers.set('X-Latency-ms', latency.toString());
  response.headers.set('X-Workflow-Engine', 'web-bff');

  return response;
}

// ============================================================================
// ENDPOINTS
// ============================================================================

// GET /api/workflows - Listar workflows
export async function GET(request: NextRequest): void {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Extraer filtros de query params
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const tags = searchParams.getAll('tags');

    // Construir URL para la API
    const apiUrl = new URL('/v1/workflows', process.env.API_BASE_URL || 'http://localhost:4000');
    if (type) apiUrl.searchParams.set('type', type);
    if (status) apiUrl.searchParams.set('status', status);
    if (category) apiUrl.searchParams.set('category', category);
    tags.forEach(tag => apiUrl.searchParams.append('tags', tag));

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'X-Request-Id': generateRequestId(),
        'X-Org-Id': request.headers.get('X-Org-Id') || 'demo',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const workflows = await response.json();

    const nextResponse = NextResponse.json({
      ok: true,
      data: workflows,
      message: 'Workflows retrieved successfully',
    });

    return addFinOpsHeaders(nextResponse, startTime);

  } catch (error) {
    console.error('Error fetching workflows:', error);

    const errorResponse = NextResponse.json({
      ok: false,
      error: 'Failed to fetch workflows',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });

    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// POST /api/workflows - Crear workflow
export async function POST(request: NextRequest): void {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validar payload
    const validatedData = CreateWorkflowSchema.parse(body);

    // Llamar a la API
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/workflows`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': generateRequestId(),
        'X-Org-Id': request.headers.get('X-Org-Id') || 'demo',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API responded with status: ${response.status}`);
    }

    const workflow = await response.json();

    const nextResponse = NextResponse.json({
      ok: true,
      data: workflow,
      message: 'Workflow created successfully',
    }, { status: 201 });

    return addFinOpsHeaders(nextResponse, startTime);

  } catch (error) {
    console.error('Error creating workflow:', error);

    let status = 500;
    let message = 'Failed to create workflow';

    if (error instanceof z.ZodError) {
      status = 400;
      message = 'Invalid workflow data';
    }

    const errorResponse = NextResponse.json({
      ok: false,
      error: message,
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status });

    return addFinOpsHeaders(errorResponse, startTime);
  }
}
