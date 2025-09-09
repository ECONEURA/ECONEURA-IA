export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): void {
  try {
    // Verificar si hay claves de IA configuradas
    const hasAzureOpenAI = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY;

    // Intentar hacer un ping mínimo a Azure OpenAI si las claves están disponibles
    let aiStatus = 'demo';
    if (hasAzureOpenAI) {
      try {
        const response = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'}`, {
          method: 'HEAD',
          headers: {
            'api-key': process.env.AZURE_OPENAI_API_KEY || '',
          },
          signal: AbortSignal.timeout(5000) // 5 segundos timeout
        });

        if (response.ok) {
          aiStatus = 'ok';
        } else {
          aiStatus = 'down';
        }
      } catch (error) {
        aiStatus = 'down';
      }
    }

    const systemMode = aiStatus === 'ok' ? 'ok' : 'demo';

    return Response.json(;
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "web-bff",
        mode: systemMode,
        ai: {
          status: aiStatus,
          provider: "azure-openai"
        }
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
    return Response.json(;
      {
        status: "error",
        timestamp: new Date().toISOString(),
        service: "web-bff",
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

