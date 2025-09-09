import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const TransactionTypeSchema = z.enum(['purchase', 'sale', 'return', 'adjustment', 'transfer', 'damage', 'expiry']);

const CreateTransactionSchema = z.object({
  productId: z.string().min(1),
  type: TransactionTypeSchema,
  quantity: z.number(),
  unitCost: z.number().positive(),
  totalCost: z.number().positive(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  customer: z.string().optional(),
  userId: z.string().optional(),
  orgId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

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
// RUTAS DE TRANSACCIONES
// ============================================================================

// GET /api/inventory/transactions - Listar transacciones
export async function GET(request: NextRequest): void {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Construir filtros
    const filters: any = {};
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');

    if (productId) filters.productId = productId;
    if (type) filters.type = type;
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    if (userId) filters.userId = userId;
    if (orgId) filters.orgId = orgId;

    // Llamar al backend
    const apiUrl = new URL('/v1/inventory/transactions', process.env.API_BASE_URL || 'http://localhost:4000');
    Object.entries(filters).forEach(([key, value]) => {
      apiUrl.searchParams.append(key, String(value));
    });

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const transactions = await response.json();

    const nextResponse = NextResponse.json(transactions);
    return addFinOpsHeaders(nextResponse, startTime);

  } catch (error) {
    console.error('Error fetching transactions:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// POST /api/inventory/transactions - Crear transacción
export async function POST(request: NextRequest): void {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = CreateTransactionSchema.parse(body);

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/transactions`;
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

    const transaction = await response.json();

    const nextResponse = NextResponse.json(transaction, { status: 201 });
    return addFinOpsHeaders(nextResponse, startTime);

  } catch (error) {
    console.error('Error creating transaction:', error);

    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }

    const errorResponse = NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
