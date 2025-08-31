import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const UpdateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['electronics', 'clothing', 'food', 'books', 'tools', 'furniture', 'other']).optional(),
  unit: z.string().min(1).optional(),
  cost: z.number().positive().optional(),
  price: z.number().positive().optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().positive().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expiryDate: z.string().optional(), // ISO date string
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
// RUTAS DE PRODUCTOS ESPECÍFICOS
// ============================================================================

// GET /api/inventory/products/[id] - Obtener producto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const { id } = params;

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/products/${id}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        const errorResponse = NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
        return addFinOpsHeaders(errorResponse, startTime);
      }
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const product = await response.json();
    
    const nextResponse = NextResponse.json(product);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error fetching product:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// PUT /api/inventory/products/[id] - Actualizar producto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = UpdateProductSchema.parse(body);
    
    // Convertir fecha de expiración si existe
    if (validatedData.expiryDate) {
      validatedData.expiryDate = new Date(validatedData.expiryDate).toISOString();
    }

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/products/${id}`;
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        const errorResponse = NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
        return addFinOpsHeaders(errorResponse, startTime);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.statusText}`);
    }

    const product = await response.json();
    
    const nextResponse = NextResponse.json(product);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// DELETE /api/inventory/products/[id] - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  
  try {
    const { id } = params;

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/products/${id}`;
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        const errorResponse = NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
        return addFinOpsHeaders(errorResponse, startTime);
      }
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const nextResponse = NextResponse.json({ message: 'Product deleted successfully' });
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
