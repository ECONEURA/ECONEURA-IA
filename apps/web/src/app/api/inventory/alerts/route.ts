import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const AlertTypeSchema = z.enum(['low_stock', 'out_of_stock', 'overstock', 'expiry_warning', 'expiry_critical']);
const AlertStatusSchema = z.enum(['active', 'acknowledged', 'resolved', 'dismissed']);
const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

const CreateAlertSchema = z.object({
  productId: z.string().min(1),
  type: AlertTypeSchema,
  status: AlertStatusSchema,
  message: z.string().min(1),
  threshold: z.number(),
  currentValue: z.number(),
  severity: AlertSeveritySchema,
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.string().optional(), // ISO date string
  resolvedAt: z.string().optional(), // ISO date string
  orgId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const UpdateAlertSchema = CreateAlertSchema.partial();

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addFinOpsHeaders(response: NextResponse, startTime: number): NextResponse {
  const latency = Date.now() - startTime;
  
  response.headers.set('X-Request-Id', generateRequestId());
  response.headers.set('X-Org-Id', 'demo-org');
  response.headers.set('X-Latency-ms', latency.toString());
  response.headers.set('X-AI-Provider', 'none');
  response.headers.set('X-AI-Model', 'none');
  response.headers.set('X-Est-Cost-EUR', '0.00');
  
  return response;
}

// ============================================================================
// RUTAS DE ALERTAS
// ============================================================================

// GET /api/inventory/alerts - Listar alertas
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Construir filtros
    const filters: any = {};
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const orgId = searchParams.get('orgId');

    if (productId) filters.productId = productId;
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (orgId) filters.orgId = orgId;

    // Llamar al backend
    const apiUrl = new URL('/v1/inventory/alerts', process.env.API_BASE_URL || 'http://localhost:4000');
    Object.entries(filters).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, String(value));
    });

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const alerts = await response.json();
    
    const nextResponse = NextResponse.json(alerts);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// POST /api/inventory/alerts - Crear alerta
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = CreateAlertSchema.parse(body);

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/alerts`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.statusText}`);
    }

    const alert = await response.json();
    
    const nextResponse = NextResponse.json(alert, { status: 201 });
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error creating alert:', error);
    
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
