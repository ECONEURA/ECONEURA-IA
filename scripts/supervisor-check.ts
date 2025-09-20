#!/usr/bin/env tsx
import fs from 'node:fs';
import cp from 'node:child_process';
import path from 'node:path';
import fg from 'fast-glob';

const read = (p: string) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const exists = (p: string) => fs.existsSync(p);
const any = (globs: string[]) => fg.sync(globs, { dot: true });
const b = (v: boolean) => v ? 'PASS' : 'FAIL';

try { cp.execSync('pnpm -s progress', { stdio: 'ignore' }); } catch {}

const statusPathCandidates = ['dist/progress.json', 'status/progress.json'];
let status: any = null;
for (const p of statusPathCandidates) {
  if (exists(p)) { try { status = JSON.parse(read(p)); break; } catch {} }
}
const pct = status?.global_percent ?? status?.progress_percent ?? 0;
const ts = new Date().toISOString();

const openapi = exists('.openapi.checksum');
const rl = read('.github/workflows/openapi-check.yml').includes('Route linter');
const ui = any(['tests/ui/**/__screenshots__/**/*.png']).length > 0;
const k6wf = any(['.github/workflows/**/k6-*.yml']).length > 0;
const contractWF = any(['.github/workflows/**/contract-api.yml']).length > 0 && any(['tests/contract/**/*.test.ts']).length > 0;
const prismaSchema = read('apps/api/prisma/schema.prisma');
const hil = /HITL|hitl/i.test(prismaSchema);
const seedTxt = read('seed/agents_master.json');
const seedCount = (seedTxt.match(/"agent_key"/g) || []).length; const seedOK = seedCount >= 60;
const otel = any(['apps/api/src/**/*.ts']).some((f: string) => read(f).includes('opentelemetry'));

let md = read('docs/PROGRESS_PANEL_SUP_v3.md');
md = md.replace('{{ts}}', ts)
  .replace('{{global_pct}}', String(pct))
  .replace('{{ci_build}}', process.env.CI_BUILD_OK ? 'OK' : 'PEND')
  .replace('{{ci_tests}}', process.env.CI_TESTS_OK ? 'OK' : 'PEND')
  .replace('{{openapi_gate}}', openapi ? 'OK' : 'PENDIENTE')
  .replace('{{ui_gate}}', ui ? 'OK' : 'PENDIENTE')
  .replace('{{k6_gate}}', process.env.K6_BASE_URL ? 'OK' : (k6wf ? 'WF_ONLY' : 'PENDIENTE'))
  .replace('{{openapi_checksum}}', b(openapi))
  .replace('{{route_linter}}', b(rl))
  .replace('{{ui_baseline}}', b(ui))
  .replace('{{k6_smoke}}', b(k6wf))
  .replace('{{contract_api}}', b(contractWF))
  .replace('{{hil_core}}', b(hil))
  .replace('{{seed60}}', seedOK ? `PASS (${seedCount}/60)` : `FAIL (${seedCount}/60)`)
  .replace('{{seed_count}}', String(seedCount))
  .replace('{{otel}}', b(otel));

fs.writeFileSync('docs/PROGRESS_PANEL_SUP_v3.md', md);
console.log(`Supervisor: Global=${pct}% · OpenAPI=${b(openapi)} · /v1-only=${b(rl)} · UI=${b(ui)} · k6=${b(k6wf)} · Contracts=${b(contractWF)} · HIL=${b(hil)} · Seed=${seedOK?`PASS(${seedCount})`:`FAIL(${seedCount})`} · OTel=${b(otel)}\n→ docs/PROGRESS_PANEL_SUP_v3.md`);
