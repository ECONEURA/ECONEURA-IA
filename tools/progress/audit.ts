import fs from "node:fs";
import yaml from "yaml";

const cfg = yaml.parse(fs.readFileSync("progress.config.yaml", "utf8"));
const s = JSON.parse(fs.readFileSync(".artifacts/metrics.json", "utf8"));

const weights = cfg.weights;
const sumW = Object.values(weights).reduce((a: number, b: number) => a + b, 0);

const areas: Record<string, number> = {};
for (const k of Object.keys(weights)) {
  areas[k] = Math.max(0, Math.min(1, s[k] ?? 0));
}

const pct = Object.entries(weights).reduce(
  (acc, [k, w]) => acc + (areas[k] * w),
  0
) / sumW * 100;

console.log(JSON.stringify({ ok: true, pct: Number(pct.toFixed(1)), areas }, null, 2));
