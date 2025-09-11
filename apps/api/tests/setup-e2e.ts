import nock from "nock";

export function enableExternalMocks() {
  if (process.env.MOCK_EXTERNAL !== "1") {
    console.log("🔓 External mocks disabled - MOCK_EXTERNAL != 1");
    return;
  }
  
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
    /api\.groq\.com/i
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
    /supabase\.com/i
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
enableExternalMocks();

// Limpiar mocks al finalizar el proceso
process.on('exit', cleanupMocks);
process.on('SIGINT', cleanupMocks);
process.on('SIGTERM', cleanupMocks);
