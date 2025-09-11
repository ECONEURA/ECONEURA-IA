import nock from "nock";

// Mock externos para CI - deshabilitar todas las conexiones excepto localhost
if (process.env.MOCK_EXTERNAL === "1") {
  console.log("🔒 Enabling external mocks for CI environment");
  
  // Deshabilitar todas las conexiones de red excepto localhost
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
  nock.enableNetConnect("localhost");

  // Patrones para servicios de IA
  const aiPatterns = [
    /openai\.com/i,
    /api\.openai\.com/i,
    /azure\.openai\.com/i,
    /anthropic\.com/i,
    /api\.anthropic\.com/i,
    /microsoft\.com/i,
    /vertex\.ai/i,
    /groq\.com/i,
    /api\.groq\.com/i,
    /mistral\.ai/i,
    /api\.mistral\.ai/i,
    /cohere\.ai/i,
    /api\.cohere\.ai/i,
    /perplexity\.ai/i,
    /api\.perplexity\.ai/i
  ];

  // Mock para servicios de IA
  aiPatterns.forEach(pattern => {
    nock(pattern)
      .persist()
      .post(/.*/)
      .reply(200, {
        id: "mock-response",
        data: {},
        choices: [{ text: "Mocked response" }],
        usage: { total_tokens: 10 }
      });

    nock(pattern)
      .persist()
      .get(/.*/)
      .reply(200, {
        ok: true,
        status: "mocked",
        data: { mocked: true }
      });
  });

  // Mock para servicios de base de datos externos
  const dbPatterns = [
    /mongodb\.com/i,
    /firebase\.com/i,
    /supabase\.com/i,
    /planetscale\.com/i
  ];

  dbPatterns.forEach(pattern => {
    nock(pattern)
      .persist()
      .reply(200, { mocked: true });
  });

  console.log("✅ External mocks enabled successfully");
}

// Limpiar mocks al finalizar
export function cleanupMocks() {
  if (process.env.MOCK_EXTERNAL === "1") {
    nock.cleanAll();
    console.log("🧹 Mocks cleaned up");
  }
}

// Habilitar mocks al inicio
if (process.env.MOCK_EXTERNAL === "1") {
  // Limpiar mocks al finalizar el proceso
  process.on('exit', cleanupMocks);
  process.on('SIGINT', cleanupMocks);
  process.on('SIGTERM', cleanupMocks);
}
