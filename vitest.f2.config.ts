import { defineConfig } from "vitest/config";
export default defineConfig({
  cacheDir: ".cache/vitest",
  test: {
    globals: true,
    bail: 5,
    testTimeout: 20000,
    hookTimeout: 20000,
    include: [
      "apps/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "packages/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "functions/**/*.{test,spec}.{ts,tsx,js,jsx}"
    ],
    exclude: ["**/{dist,build,.next,out,node_modules}/**"],
    environment: "node",
    environmentMatchGlobs: [
      ["apps/**/web/**", "jsdom"],
      ["**/*.dom.test.*", "jsdom"],
      ["**/*.browser.test.*", "jsdom"]
    ],
    pool: "threads",
    maxConcurrency: 8,
    reporters: ["default","json"],
    outputFile: { json: "reports/vitest.json" }
  },
  coverage: {
    provider: "v8",
    reporter: ["json","text-summary"],
    reportsDirectory: "coverage-f2",
    include: ["apps/**/*.{ts,tsx,js,jsx}","packages/**/*.{ts,tsx,js,jsx}","functions/**/*.{ts,tsx,js,jsx}"],
    exclude: ["**/*.d.ts","**/{node_modules,dist,build,.next}/**"]
  }
});