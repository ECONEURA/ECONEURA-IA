import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/e2e/**/*.e2e.{ts,tsx}"],
    setupFiles: ["tests/setup-e2e.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ["default", ["junit", { outputFile: "../../.artifacts/api-e2e.junit.xml" }]],
    env: {
      BASE_URL: process.env.BASE_URL || "http://127.0.0.1:3001",
    },
  },
});
