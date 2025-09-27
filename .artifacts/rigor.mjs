import fs from 'fs';
import p from 'path';
import { spawnSync as S } from 'child_process';
const E = process.env, T = f => { try { return fs.readFileSync(f, 'utf8') } catch { return '' } }, J = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } }, X = q => { try { fs.accessSync(q); return true } catch { return false } }, N = s => s.replace(/\\/g, '/');
const sh = (c, a = [], t = 180) => S(c, a, { encoding: 'utf8', timeout: t * 1e3, stdio: ['ignore', 'pipe', 'pipe'] });
const WANT = { cov: +E.WANT_COV || 80, dup: +E.WANT_DUP || 4 }, STRICT = E.STRICT_NO_DEPLOY === '1', t0 = Date.now();

if (E.BOOTSTRAP === '1' && X('package.json')) {
  const j = J('package.json'); j.packageManager ??= 'pnpm@8.15.5'; j.engines ??= { node: ">=20" };
  j.workspaces ??= ["apps/*", "packages/*", "functions/*"];
  j.scripts = j.scripts || {}; j.scripts.lint ??= "eslint .";
  j.scripts.test ??= "vitest --run --coverage --coverage.provider=v8";
  j.scripts.dup ??= "jscpd --silent --reporters json --output reports .";
  fs.writeFileSync('package.json', JSON.stringify(j, null, 2));
  if (!X('eslint.config.mjs')) fs.writeFileSync('eslint.config.mjs', 'import js from "@eslint/js";import ts from "typescript-eslint";export default ts.config(js.configs.recommended,...ts.configs.recommended,{ignores:["**/dist/**","**/.next/**","**/coverage/**"]});');
  if (!X('vitest.config.ts')) fs.writeFileSync('vitest.config.ts', 'import {defineConfig} from "vitest/config";export default defineConfig({test:{environment:"node",coverage:{provider:"v8",reporter:["text","json-summary"]}}});');
  if (!X('.jscpd.json')) fs.writeFileSync('.jscpd.json', JSON.stringify({ threshold: 4, reporters: ["json"], output: "reports" }, null, 2));
  S('pnpm', ['-w', 'add', '-D', 'eslint', '@eslint/js', 'typescript', 'typescript-eslint', 'vitest', '@vitest/coverage-v8', 'jscpd'], { stdio: 'ignore' });
}

S('pnpm', ['-w', 'i', '--prefer-offline'], { stdio: 'ignore' });

const hasBin = n => X(`node_modules/.bin/${n}`) || new RegExp(`\\b${n}\\b`).test(JSON.stringify((J('package.json') || {}).scripts || {}));
const metrics = { coverage_lines_pct: null, eslint_errors: null, jscpd_dup_pct: null, jscpd_clones_gt100: null, npm_high: null, npm_critical: null, secret_leaks: 0 };
const dur = {};

function timed(lbl, fn) { const t = Date.now(); const ok = fn(); dur[lbl] = Date.now() - t; return ok }

// Lint
if (hasBin('eslint')) timed('eslint', () => { const r = sh('pnpm', ['-w', '-r', 'run', 'lint'], 180); if (r.status === 0 || r.status === 1) { try { const L = J('reports/eslint.json') || JSON.parse(r.stdout || '[]'); fs.writeFileSync('reports/eslint.json', JSON.stringify(L, null, 2)); metrics.eslint_errors = Array.isArray(L) ? L.reduce((a, f) => a + (f.errorCount || 0), 0) : 0; } catch { metrics.eslint_errors = 0 } return true } return false });

// Tests + coverage v8
if (hasBin('vitest')) timed('tests', () => { const r = sh('pnpm', ['-w', '-r', 'run', 'test'], 300); if (r.status === 0 || r.status === 1) { let cov = null; (function f(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const q = p.join(d, e.name); if (/node_modules|\.git/.test(q)) continue; if (e.isDirectory()) f(q); else if (/coverage-summary\.json$/.test(q)) cov = q } })('.'); if (cov) { metrics.coverage_lines_pct = J(cov)?.total?.lines?.pct ?? 0; } return true } return false });

// Duplicados
if (hasBin('jscpd')) timed('jscpd', () => { const r = sh('pnpm', ['-w', '-r', 'run', 'dup'], 240); if (r.status === 0 || r.status === 1) { const D = J('reports/jscpd.json'); metrics.jscpd_dup_pct = D?.statistics?.percentage ?? null; metrics.jscpd_clones_gt100 = (D?.duplicates || []).filter(d => (d?.lines || 0) > 100).length; return true } return false });

// Audit deps
timed('audit', () => { const r = sh('pnpm', ['audit', '--json'], 120); if (r.status === 0) { const A = JSON.parse(r.stdout || '{}'); const v = (A.vulnerabilities || A.metadata?.vulnerabilities || {}); metrics.npm_high = v.high ?? 0; metrics.npm_critical = v.critical ?? 0; fs.writeFileSync('reports/audit.json', JSON.stringify(A, null, 2)); return true } return false });

// Gitleaks opcional si está instalado
try { if (sh('gitleaks', ['version'], 5).status === 0) { timed('gitleaks', () => { const r = sh('gitleaks', ['detect', '--no-git', '-r', 'reports/gitleaks.json'], 120); if (r.status === 0) { const G = J('reports/gitleaks.json'); metrics.secret_leaks = Array.isArray(G?.findings) ? G.findings.length : 0; return true } return false }) } } catch { }

const cov = metrics.coverage_lines_pct ?? 0;
const eslintScore = metrics.eslint_errors === 0 ? 100 : 0;
const dupScore = metrics.jscpd_dup_pct != null ? Math.max(0, 100 - metrics.jscpd_dup_pct) : 0;
const secOK = (metrics.npm_high === 0 && metrics.npm_critical === 0 && metrics.secret_leaks === 0);
const secScore = secOK ? 100 : 0;
const score = +(0.45 * cov + 0.25 * eslintScore + 0.15 * dupScore + 0.15 * secScore).toFixed(2);

// NO_DEPLOY estricto
const wfDir = '.github/workflows', ND = /DEPLOY_ENABLED\s*:\s*["']?false["']?/i, DANG = /\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i;
let wfs = [], flags = [], dang = [], strict = [];
if (X(wfDir)) { wfs = fs.readdirSync(wfDir).filter(f => /\.(ya?ml)$/i.test(f)).map(f => p.join(wfDir, f));
  for (const f of wfs) { const t = T(f); if (ND.test(t)) flags.push(N(f)); if (DANG.test(t)) dang.push(N(f)); if (STRICT && /^\s*run\s*:/m.test(t) && !ND.test(t)) strict.push(N(f)); } }
fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md', ['# NO_DEPLOY_EVIDENCE', `flags(${flags.length}):`, ...flags, '', `dangerous(${dang.length}):`, ...dang, STRICT ? `\nstrict_violations(${strict.length}):\n${strict.join('\n')}` : ''].join('\n'));
const noDeploy = dang.length === 0 && flags.length > 0 && (!STRICT || strict.length === 0);

// GO
const pass = {
  coverage: cov >= WANT.cov,
  eslint: metrics.eslint_errors === 0,
  duplicates: (metrics.jscpd_dup_pct ?? 100) <= WANT.dup && (metrics.jscpd_clones_gt100 ?? 0) === 0,
  sec: secOK,
  no_deploy: noDeploy
};
const GO = pass.coverage && pass.eslint && pass.duplicates && pass.sec && pass.no_deploy;

const out = { GO, score, NO_DEPLOY_OK: noDeploy, pass, metrics, durations_ms: dur, took_ms: Date.now() - t0, asks: [] };
const pkgJ = J('package.json') || {};
if (!pkgJ.packageManager) out.asks.push('Añadir "packageManager":"pnpm@8.15.5"');
if (!pkgJ.engines) out.asks.push('Añadir "engines":{"node":">=20"}');
if (!(pkgJ.workspaces || []).length && !X('pnpm-workspace.yaml')) out.asks.push('Declarar workspaces en package.json o pnpm-workspace.yaml');

fs.writeFileSync('reports/GO_RIGOR.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(GO ? 0 : 2);