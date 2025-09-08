import fs from "node:fs";

// Configuración hardcodeada para evitar dependencias
const cfg = {
  weights: {
    infra: 8,
    observability: 7,
    cicd: 7,
    api: 10,
    webcfg: 5,
    security: 8,
    data: 8,
    typecheck: 7,
    erp: 12,
    crm: 8,
    cockpit: 7,
    agents: 5,
    qa: 4,
    releases: 4
  }
};
const s = JSON.parse(fs.readFileSync(".artifacts/metrics.json", "utf8"));

const weights = cfg.weights;
const sumW = Object.values(weights).reduce((a, b) => a + b, 0);

const areas = {};
for (const k of Object.keys(weights)) {
  areas[k] = Math.max(0, Math.min(1, s[k] ?? 0));
}

const pct = Object.entries(weights).reduce(
  (acc, [k, w]) => acc + (areas[k] * w),
  0
) / sumW * 100;

console.log(JSON.stringify({ ok: true, pct: Number(pct.toFixed(1)), areas }, null, 2));
