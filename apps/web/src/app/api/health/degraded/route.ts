export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verificar estado de IA
    let aiStatus = 'demo';
    const hasAzureOpenAI = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY;
    
    if (hasAzureOpenAI) {
      try {
        const response = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'}`, {
          method: 'HEAD',
          headers: {
            'api-key': process.env.AZURE_OPENAI_API_KEY || '',
          },
          signal: AbortSignal.timeout(3000) // 3 segundos timeout
        });
        
        aiStatus = response.ok ? 'ok' : 'down';
      } catch (error) {
        aiStatus = 'down';
      }
    }

    // Verificar estado de búsqueda
    let searchStatus = 'demo';
    const hasBingSearch = process.env.BING_SEARCH_KEY;
    
    if (hasBingSearch) {
      try {
        const response = await fetch(`${process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search'}?q=test&count=1`, {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_KEY || '',
          },
          signal: AbortSignal.timeout(3000)
        });
        
        searchStatus = response.ok ? 'ok' : 'down';
      } catch (error) {
        searchStatus = 'down';
      }
    }

    // Determinar el modo del sistema
    let systemMode = 'ok';
    if (aiStatus === 'down' || searchStatus === 'down') {
      systemMode = 'degraded';
    } else if (aiStatus === 'demo' && searchStatus === 'demo') {
      systemMode = 'demo';
    }

    return Response.json(
      { 
        status: "ok", 
        timestamp: new Date().toISOString(),
        service: "web-bff",
        ia: aiStatus,
        search: searchStatus,
        system_mode: systemMode
      },
      { 
        status: 200,
        headers: {
          'X-System-Mode': systemMode,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return Response.json(
      { 
        status: "error", 
        timestamp: new Date().toISOString(),
        service: "web-bff",
        ia: "down",
        search: "down",
        system_mode: "down",
        error: "Health check failed"
      },
      { 
        status: 503,
        headers: {
          'X-System-Mode': 'down',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

