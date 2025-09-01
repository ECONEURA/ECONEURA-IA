#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import pc from "picocolors";
import YAML from "yaml";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import SwaggerParser from "@apidevtools/swagger-parser";

type Check =
  | { kind: "file_exists"; path: string }
  | { kind: "code_includes"; glob: string; contains: string }
  | { kind: "workflow_includes"; glob: string; contains_any: string[] }
  | { kind: "openapi_route"; path: string; route: string; method: string };

type Obj = { id: string; name: string; weight: number; checks: Check[] };
type Cfg = {
  version: number;
  objective: string;
  target_pr: number;
  weights: { delivery_prs: number; functional: number };
  functional_objectives: Obj[];
};

const ROOT = process.cwd();
const cfgPath = path.join(ROOT, "progress.config.yaml");

function read(p: string) {
  return fs.readFileSync(p, "utf8");
}
function exists(p: string) {
  return fs.existsSync(p);
}

function list(glob: string) {
  return fg.sync(glob, { dot: true, cwd: ROOT });
}

function git(str: string) {
  return execSync(str, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

function calcPrDelivery(target: number) {
  let merged = 0;
  try {
    const log = git(`git log --pretty=%s`);
    const matches = new Set<number>();
    for (const line of log.split("\n")) {
      const m = line.match(/PR[- ]?(\d{1,3})/i);
      if (m) matches.add(parseInt(m[1], 10));
    }
    merged = [...matches].filter(n => n >= 0 && n <= target).length;
  } catch {}
  const pct = Math.max(0, Math.min(1, merged / target));
  return { merged, target, pct };
}

async function checkOpenApiRoute(p: string, route: string, method: string) {
  if (!exists(p)) return false;
  try {
    const api = await SwaggerParser.parse(p);
    const paths = (api as any).paths || {};
    const entry = paths[route];
    if (!entry) return false;
    return !!entry[method.toLowerCase()];
  } catch { return false; }
}

async function evalCheck(ch: Check): Promise<{ok:boolean; reason?:string}> {
  if (ch.kind === "file_exists") {
    const ok = list(ch.path).length > 0;
    return { ok, reason: ok ? undefined : `Missing ${ch.path}` };
  }
  if (ch.kind === "code_includes") {
    const files = list(ch.glob);
    for (const f of files) {
      try {
        const body = read(path.join(ROOT, f));
        if (body.includes(ch.contains)) return { ok: true };
      } catch {}
    }
    return { ok: false, reason: `Not found "${ch.contains}" in ${ch.glob}` };
  }
  if (ch.kind === "workflow_includes") {
    const files = list(ch.glob);
    for (const f of files) {
      try {
        const body = read(path.join(ROOT, f));
        if (ch.contains_any.some(s => body.includes(s))) return { ok: true };
      } catch {}
    }
    return { ok: false, reason: `No workflow contains any of ${ch.contains_any.join(", ")}` };
  }
  if (ch.kind === "openapi_route") {
    const ok = await checkOpenApiRoute(path.join(ROOT, ch.path), ch.route, ch.method);
    return { ok, reason: ok ? undefined : `OpenAPI missing ${ch.method.toUpperCase()} ${ch.route}` };
  }
  return { ok: false, reason: "Unknown check" };
}

function safeRun(cmd: string) {
  try { execSync(cmd, { stdio: "ignore" }); return { ok: true }; }
  catch (e: any) { return { ok: false, err: e?.message?.slice(0,200) }; }
}

async function main() {
  if (!exists(cfgPath)) throw new Error("progress.config.yaml not found");
  const cfg = YAML.parse(read(cfgPath)) as Cfg;

  const pr = calcPrDelivery(cfg.target_pr);

  let sumW = 0, sumScore = 0;
  const objs: any[] = [];
  for (const o of cfg.functional_objectives) {
    let ok = 0;
    const results = [];
    for (const ch of o.checks) {
      const r = await evalCheck(ch as Check);
      results.push(r);
      if (r.ok) ok++;
    }
    const pct = o.checks.length ? ok / o.checks.length : 0;
    sumW += o.weight;
    sumScore += pct * o.weight;
    objs.push({ id: o.id, name: o.name, ok, total: o.checks.length, percent: Math.round(pct*100), results });
  }
  const functionalPct = sumW ? (sumScore / sumW) : 0;

  const build = safeRun("pnpm -w -r build");
  const unit = safeRun("pnpm -w -r test --silent");
  const ciSignal = (build.ok && unit.ok) ? 1 : 0.5;

  const deliveryPct = pr.pct;
  const combined = cfg.weights.delivery_prs * deliveryPct + cfg.weights.functional * (functionalPct * ciSignal);
  const globalPct = Math.round(combined * 100);

  const blocked = [] as string[];
  if (!process.env.REDIS_URL) blocked.push("Redis");
  if (!process.env.AAD_REQUIRED) blocked.push("AAD");
  if (!process.env.MAKE_SIGNING_SECRET) blocked.push("Make");

  const now = new Date().toISOString();
  const model = `v3-${cfg.weights.delivery_prs}-${cfg.weights.functional}`;
  const checksum = crypto.createHash("sha256").update(JSON.stringify({model, objs, pr, functionalPct})).digest("hex");

  const json = {
    date: now,
    objective: cfg.objective,
    model,
    checksum,
    target_pr: cfg.target_pr,
    delivery: { merged: pr.merged, target: pr.target, percent: Math.round(pr.pct*100) },
    functional: { percent: Math.round(functionalPct*100), build_ok: build.ok, unit_ok: unit.ok },
    blocked,
    global_percent: globalPct,
    objectives: objs
  };

  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/progress.json", JSON.stringify(json, null, 2));
  fs.appendFileSync("dist/progress-history.jsonl", JSON.stringify({ ts: now, global: globalPct })+"\n");

  const rows = objs.map(o => `| ${o.name} | ${o.percent}% | ${o.ok}/${o.total} | ${o.id} |`).join("\n");
  const md = `# ECONEURA — Progreso\n\n**Objetivo:** ${cfg.objective}\n\n**Avance global:** **${globalPct}%**  \n` +
  `**Entrega (PRs):** ${Math.round(pr.pct*100)}%  ·  **Funcional:** ${Math.round(functionalPct*100)}%  ·  ` +
  `**Build:** ${build.ok?"✅":"❌"}  **Tests:** ${unit.ok?"✅":"❌"}\n\n` +
  (blocked.length?`> ⚠️ Bloqueado por: ${blocked.join(", ")}\n\n`:"") +
  `| Área | % | Checks OK | Id |\n|---|---:|---:|---|\n${rows}\n\n` +
  `_Última actualización:_ ${now} · _Modelo:_ ${model} · _Checksum:_ \`${checksum.slice(0,12)}\` \n`;
  fs.writeFileSync("PROGRESS.md", md);

  const color = globalPct >= 80 ? "#2ea043" : globalPct >= 50 ? "#dbab09" : "#d73a49";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="190" height="20">
  <linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <rect rx="3" width="190" height="20" fill="#555"/>
  <rect rx="3" x="95" width="95" height="20" fill="${color}"/>
  <path fill="${color}" d="M95 0h4v20h-4z"/>
  <rect rx="3" width="190" height="20" fill="url(#a)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana" font-size="11">
    <text x="47" y="14">progress</text>
    <text x="142" y="14">${globalPct}%</text>
  </g></svg>`;
  fs.writeFileSync("dist/progress-badge.svg", svg);

  console.log(pc.bold(`\nECONEURA — Avance global: ${pc.green(`${globalPct}%`)}  (${now})`));
  console.log(`PRs: ${pr.merged}/${pr.target}  ·  Funcional: ${Math.round(functionalPct*100)}%  ·  Build:${build.ok?"OK":"FAIL"}  Tests:${unit.ok?"OK":"FAIL"}`);
  for (const o of objs) {
    const bar = "█".repeat(Math.round(o.percent/10)) + "░".repeat(10 - Math.round(o.percent/10));
    console.log(`${pc.bold(o.name.padEnd(36))} ${bar} ${String(o.percent).padStart(3)}%`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
