import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const ProductCategorySchema = z.enum(['electronics', 'clothing', 'food', 'books', 'tools', 'furniture', 'other']);

const CreateProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: ProductCategorySchema,
  unit: z.string().min(1),
  cost: z.number().positive(),
  price: z.number().positive(),
  minStock: z.number().min(0),
  maxStock: z.number().min(0),
  currentStock: z.number().min(0),
  reorderPoint: z.number().min(0),
  reorderQuantity: z.number().positive(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  expiryDate: z.string().optional(), // ISO date string
  barcode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateProductSchema = CreateProductSchema.partial();

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
// RUTAS DE PRODUCTOS
// ============================================================================

// GET /api/inventory/products - Listar productos
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Construir filtros
    const filters: any = {};
    const category = searchParams.get('category');
    const supplier = searchParams.get('supplier');
    const location = searchParams.get('location');
    const lowStock = searchParams.get('lowStock');
    const outOfStock = searchParams.get('outOfStock');
    const overstock = searchParams.get('overstock');
    const expiring = searchParams.get('expiring');
    const tags = searchParams.get('tags');

    if (category) filters.category = category;
    if (supplier) filters.supplier = supplier;
    if (location) filters.location = location;
    if (lowStock === 'true') filters.lowStock = true;
    if (outOfStock === 'true') filters.outOfStock = true;
    if (overstock === 'true') filters.overstock = true;
    if (expiring === 'true') filters.expiring = true;
    if (tags) filters.tags = tags.split(',');

    // Llamar al backend
    const apiUrl = new URL('/v1/inventory/products', process.env.API_BASE_URL || 'http://localhost:4000');
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => apiUrl.searchParams.append(key, v));
      } else {
        apiUrl.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const products = await response.json();
    
    const nextResponse = NextResponse.json(products);
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}

// POST /api/inventory/products - Crear producto
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = CreateProductSchema.parse(body);
    
    // Convertir fecha de expiración si existe
    if (validatedData.expiryDate) {
      validatedData.expiryDate = new Date(validatedData.expiryDate).toISOString();
    }

    // Llamar al backend
    const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:4000'}/v1/inventory/products`;
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

    const product = await response.json();
    
    const nextResponse = NextResponse.json(product, { status: 201 });
    return addFinOpsHeaders(nextResponse, startTime);
    
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
      return addFinOpsHeaders(errorResponse, startTime);
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
    return addFinOpsHeaders(errorResponse, startTime);
  }
}
