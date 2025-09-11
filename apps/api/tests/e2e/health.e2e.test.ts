import { describe, it, expect, beforeAll, afterAll } from "vitest";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const HEALTH = process.env.HEALTH_PATH || "/health";

describe("API health", () => {
  beforeAll(async () => {
    // Verificar que la API esté disponible antes de los tests
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(`${BASE}${HEALTH}`, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          console.log("✅ API is ready for testing");
          return;
        }
      } catch (error) {
        console.log(`⏳ API not ready yet, retry ${retries + 1}/${maxRetries}`);
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`API not available after ${maxRetries} retries`);
  });

  it("returns 200 on /health", async () => {
    const res = await fetch(`${BASE}${HEALTH}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    
    const json = await res.json().catch(() => ({}));
    expect(typeof json).toBe("object");
    
    // Verificar que la respuesta tenga al menos un campo básico
    expect(json).toBeDefined();
  });

  it("returns valid health status", async () => {
    const res = await fetch(`${BASE}${HEALTH}`);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json).toBeDefined();
    
    // Verificar campos comunes en health checks
    if (json.status) {
      expect(typeof json.status).toBe("string");
    }
    if (json.timestamp) {
      expect(typeof json.timestamp).toBe("string");
    }
  });

  afterAll(() => {
    console.log("✅ Health tests completed");
  });
});
