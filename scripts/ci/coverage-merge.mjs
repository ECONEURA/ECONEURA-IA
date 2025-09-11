#!/usr/bin/env node
import { promises as fs } from "fs";

console.log("📊 Merging coverage reports...");

const paths = [
  "apps/api/coverage/coverage-summary.json",
  "apps/web/coverage/coverage-summary.json"
];

let lines = 0, covered = 0;

for (const p of paths) {
  try {
    const content = await fs.readFile(p, "utf8");
    const j = JSON.parse(content);
    lines += j.total.lines.total;
    covered += j.total.lines.covered;
    console.log(`✅ Found coverage: ${p} - ${j.total.lines.pct}%`);
  } catch (error) {
    console.log(`⚠️ No coverage found: ${p}`);
  }
}

const pct = lines ? Math.round((covered / lines) * 100) : 0;

console.log(`📈 Total coverage: ${covered}/${lines} lines (${pct}%)`);

// Crear directorio de artefactos
await fs.mkdir(".artifacts", { recursive: true });

// Escribir reporte consolidado
const mergedReport = {
  lines,
  covered,
  pct,
  timestamp: new Date().toISOString(),
  breakdown: {
    api: "apps/api/coverage/coverage-summary.json",
    web: "apps/web/coverage/coverage-summary.json"
  }
};

await fs.writeFile(".artifacts/coverage-merged.json", JSON.stringify(mergedReport, null, 2));

// Verificar umbral mínimo
if (pct < 80) {
  console.error(`❌ COVERAGE_BELOW_80: ${pct}%`);
  process.exit(1);
}

console.log(`✅ Coverage check passed: ${pct}% >= 80%`);
