import { NextRequest, NextResponse } from 'next/server';

// Configuración del BFF
const API_BASE_URL = process.env.BFF_TARGET_API || 'http://localhost:4000';
const CONFIG_API_PATH = '/v1/config';

// Headers que se pasan al API
const FORWARD_HEADERS = [
  'x-user-id',
  'x-organization-id',
  'x-correlation-id',
  'authorization',
  'content-type'
];

// Función para hacer proxy de requests al API
async function proxyRequest(
  request: NextRequest,
  path: string,
  method: string = 'GET'
): Promise<NextResponse> {
  try {
    // Construir URL del API
    const apiUrl = `${API_BASE_URL}${CONFIG_API_PATH}${path}`;

    // Headers a enviar
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ECONEURA-Web-BFF/1.0'
    };

    // Copiar headers relevantes
    FORWARD_HEADERS.forEach(headerName => {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        headers[headerName] = headerValue;
      }
    });

    // Obtener body si existe
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch (error) {
        console.warn('Failed to read request body:', error);
      }
    }

    // Hacer request al API
    const response = await fetch(apiUrl, {
      method,
      headers,
      body,
      // Timeout de 30 segundos
      signal: AbortSignal.timeout(30000)
    });

    // Obtener respuesta
    const responseData = await response.text();

    // Headers de respuesta a copiar
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-BFF-Proxy': 'true',
      'X-API-Status': response.status.toString()
    };

    // Copiar headers relevantes de la respuesta
    const copyHeaders = ['x-feature-flags-total', 'x-config-version', 'x-cache-status'];
    copyHeaders.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        responseHeaders[headerName] = headerValue;
      }
    });

    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('BFF Proxy Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to proxy request to configuration API'
    }, {
      status: 500,
      headers: {
        'X-BFF-Proxy': 'true',
        'X-Error': 'proxy-failed'
      }
    });
  }
}

// GET - Obtener recursos
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const fullPath = searchParams ? `${path}?${searchParams}` : path;

  return proxyRequest(request, fullPath, 'GET');
}

// POST - Crear recursos
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/');

  return proxyRequest(request, path, 'POST');
}

// PUT - Actualizar recursos
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/');

  return proxyRequest(request, path, 'PUT');
}

// DELETE - Eliminar recursos
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/');

  return proxyRequest(request, path, 'DELETE');
}

// PATCH - Actualización parcial
export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = '/' + params.path.join('/');

  return proxyRequest(request, path, 'PATCH');
}
