import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.e2e.{ts,tsx}"],
    setupFiles: ["tests/setup-e2e.ts"],
    testTimeout: 60000, // Aumentado para CI
    hookTimeout: 60000, // Aumentado para CI
    teardownTimeout: 10000,
    reporters: [
      "default", 
      ["junit", { outputFile: "../../.artifacts/api-e2e.junit.xml" }],
      ["json", { outputFile: "../../.artifacts/api-e2e.json" }]
    ],
    env: {
      BASE_URL: process.env.BASE_URL || "http://127.0.0.1:3001",
      HEALTH_PATH: process.env.HEALTH_PATH || "/health",
      MOCK_EXTERNAL: process.env.MOCK_EXTERNAL || "1",
    },
    // Configuración específica para CI
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Retry en caso de fallos temporales
    retry: 2,
    // Configuración de coverage
    coverage: {
      reporter: ["text", "json", "html"],
      reportsDirectory: "../../.artifacts/coverage",
    },
  },
});
