import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
const E = process.env, N = s => s.replace(/\\/g, '/'), X = p => { try { fs.accessSync(p); return true } catch { return false } };
const T = f => { try { return fs.readFileSync(f, 'utf8') } catch { return '' } }, J = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return null } };
const sh = (c, a = [], t = 120) => spawnSync(c, a, { encoding: 'utf8', timeout: t * 1000, stdio: ['ignore', 'pipe', 'pipe'] });
const t0 = Date.now(), DRY = E.DRY_RUN === '1', STRICT = E.STRICT_NO_DEPLOY === '1', FAST = E.FAST === '1';
const WANT = { cov: +E.WANT_COV || 80, dup: +E.WANT_DUP || 4 };

const pkgPath = 'package.json'; const hasPkg = X(pkgPath); const pkg = hasPkg ? J(pkgPath) : {};
const hasBin = n => X(`node_modules/.bin/${n}`) || new RegExp(`\\b${n}\\b`).test(JSON.stringify(pkg?.scripts || {}));
const DETECT = { eslint: hasBin('eslint'), vitest: hasBin('vitest'), jscpd: X('node_modules/.bin/jscpd'), gitleaks: sh('gitleaks', ['version'], 5).status === 0 };
const RUN = {
  LINT: process.env.RUN_LINT ?? (DETECT.eslint ? '1' : '0'),
  TESTS: process.env.RUN_TESTS ?? (DETECT.vitest ? '1' : '0'),
  DUP: process.env.RUN_DUP ?? (DETECT.jscpd ? '1' : '0'),
  LEAKS: process.env.RUN_LEAKS ?? (DETECT.gitleaks ? '1' : '0'),
  AUDIT: process.env.RUN_AUDIT ?? '1'
};

function expandWS(def) { const arr = Array.isArray(def) ? def : (def?.packages || []); const exp = p => /\*/.test(p) ? (b => X(b) ? fs.readdirSync(b).map(d => `${b}/${d}`) : []) (p.replace(/\/\*.*/, '')) : [p]; return [...new Set(arr.flatMap(exp))] }
let workspaces = expandWS(pkg?.workspaces);
if (!workspaces.length && X('pnpm-workspace.yaml')) { const y = T('pnpm-workspace.yaml'); const m = [...(y.matchAll(/-\s*([^\n#]+)/g))].map(x => x[1].trim()); const exp = p => /\*/.test(p) ? (b => X(b) ? fs.readdirSync(b).map(d => `${b}/${d}`) : []) (p.replace(/\/\*.*/, '')) : [p]; workspaces = [...new Set(m.flatMap(exp))] }

const inv = d => X(d) ? fs.readdirSync(d).filter(x => fs.statSync(path.join(d, x)).isDirectory()).map(x => ({ dir: N(`${d}/${x}`), name: (J(path.join(d, x, 'package.json')) || {}).name || null })) : [];
const wfDir = '.github/workflows', DANG = /\b(az|azd|terraform|kubectl|helm|docker\s+(build|push))\b/i, ND = /DEPLOY_ENABLED\s*:\s*['"]?false['"]?/i;
const wfList = X(wfDir) ? fs.readdirSync(wfDir).filter(f => /\.(ya?ml)$/i.test(f)).map(f => N(path.join(wfDir, f))) : [];
const wfFlags = wfList.filter(f => ND.test(T(f))), wfDanger = wfList.filter(f => DANG.test(T(f)));
const wfStrict = wfList.filter(f => /^\s*run\s*:/m.test(T(f)) && !ND.test(T(f)));

const IGN = /(^|\/)(node_modules|\.git|\.next|dist|build|coverage|\.cache|out|tmp|\.ignored_node_modules|venv)(\/|$)/;
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.yml', '.yaml', '.css', '.scss', '.html']);
const CODE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const TEST_RE = /\.(test|spec)\.(ts|tsx|js|jsx)$/i, ENDPT = /\/(health|healthz|readyz)\b|\/v1\/progress\b/i;

let files = 0, bytes = 0; const byExt = {}, byDir = {}, largest = [], tests = [], endpoints = [];
function bump(p, s) { largest.push({ path: N(p), size: s }); largest.sort((a, b) => b.size - a.size); if (largest.length > 100) largest.length = 100 }
function scan(fp) { const st = fs.statSync(fp), sz = st.size; files++; bytes += sz; bump(fp, sz); const n = N(fp), top = n.split('/')[0]; byDir[top] = (byDir[top] || 0) + 1; const ext = EXTS.has(path.extname(fp)) ? path.extname(fp) : 'other'; byExt[ext] = (byExt[ext] || 0) + 1; if (sz > 800000) return; const t = T(fp); if (TEST_RE.test(fp)) tests.push(n); if (ENDPT.test(t) && CODE.has(ext)) endpoints.push(n) }
(function walk(d, depth = 0) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name), n = N(p); if (IGN.test(n)) continue; if (e.isDirectory()) { if (depth < 6) walk(p, depth + 1) } else { scan(p) } } })('.');

const durations = {}, metrics = { coverage_lines_pct: null, eslint_errors: null, jscpd_dup_pct: null, jscpd_clones_gt100: null, npm_high: null, npm_critical: null, secret_leaks: null };
const timed = (k, fn) => { const t = Date.now(); const r = fn(); durations[k] = Date.now() - t; return r };
function runIf(flag, label, cmd, args, timeout = 180, parse) { if (flag !== '1' || FAST) return; const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: timeout * 1000 });
  durations[label] = Date.now() - (Date.now() - 0); // marcador
  if (r.status === 0 && parse) parse(r);
}

if (RUN.TESTS === '1' && !FAST) { timed('tests', () => { const r = sh('pnpm', ['-w', '-r', 'exec', 'vitest', '--run', '--coverage', '--coverage.provider=v8'], 180);
  if (r.status === 0) { let cov = null; (function f(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (p.includes('node_modules') || p.includes('.git')) continue; if (e.isDirectory()) f(p); else if (/coverage-summary\.json$/.test(p)) cov = p } })('.'); if (cov) { const j = J(cov); metrics.coverage_lines_pct = j?.total?.lines?.pct ?? null } } }); }
if (RUN.LINT === '1' && !FAST) { timed('eslint', () => { const r = sh('pnpm', ['-w', '-r', 'exec', 'eslint', '.', '-f', 'json'], 180); if (r.status === 0) { const L = JSON.parse(r.stdout || '[]'); fs.writeFileSync('reports/eslint.json', JSON.stringify(L, null, 2)); let e = 0; L.forEach(f => e += (f.errorCount || 0)); metrics.eslint_errors = e } }); }
if (RUN.DUP === '1' && !FAST) { timed('jscpd', () => { const r = sh('npx', ['--yes', 'jscpd', '--silent', '--reporters', 'json', '--output', 'reports', '.'], 180); if (r.status === 0) { const D = J('reports/jscpd.json'); metrics.jscpd_dup_pct = D?.statistics?.percentage ?? null; metrics.jscpd_clones_gt100 = (D?.duplicates || []).filter(d => (d?.lines || 0) > 100).length } }); }
if (RUN.LEAKS === '1' && !FAST) { timed('gitleaks', () => { const r = sh('gitleaks', ['detect', '--no-git', '-r', 'reports/gitleaks.json'], 120); if (r.status === 0) { const G = J('reports/gitleaks.json'); metrics.secret_leaks = Array.isArray(G?.findings) ? G.findings.length : 0 } }); }
if (RUN.AUDIT === '1' && !FAST) { timed('audit', () => { const r = sh('pnpm', ['audit', '--json'], 120); if (r.status === 0) { const A = JSON.parse(r.stdout || '{}'); const v = (A.vulnerabilities || A.metadata?.vulnerabilities || {}); metrics.npm_high = v.high ?? 0; metrics.npm_critical = v.critical ?? 0; fs.writeFileSync('reports/audit.json', JSON.stringify(A, null, 2)) } }); }

const cov = metrics.coverage_lines_pct ?? 0, eslintScore = metrics.eslint_errors === 0 ? 100 : 0, dupScore = metrics.jscpd_dup_pct != null ? Math.max(0, 100 - metrics.jscpd_dup_pct) : 0, secOK = (metrics.npm_high === 0 && metrics.npm_critical === 0 && metrics.secret_leaks === 0), secScore = secOK ? 100 : 0;
const score = +(0.45 * cov + 0.25 * eslintScore + 0.15 * dupScore + 0.15 * secScore).toFixed(2);
const pass = { coverage: cov >= WANT.cov, eslint: metrics.eslint_errors === 0, duplicates: (metrics.jscpd_dup_pct ?? 100) <= WANT.dup && (metrics.jscpd_clones_gt100 ?? 0) === 0, sec: secOK, no_deploy: (wfDanger.length === 0 && wfFlags.length > 0 && (!STRICT || wfStrict.length === 0)) };

const summary = {
  meta: { repo: path.basename(process.cwd()), duration_ms: Date.now() - t0, pm: pkg?.packageManager || null, engines: pkg?.engines || null, private: !!pkg?.private },
  inventory: { workspaces, apps: inv('apps'), packages: inv('packages'), functions: inv('functions') },
  workflows: { count: wfList.length, flags: wfFlags, dangerous: wfDanger, strict_violations: wfStrict, STRICT },
  tests: { count: tests.length, coverage_lines_pct: metrics.coverage_lines_pct },
  endpoints: endpoints.slice(0, 400),
  metrics, durations_ms: durations,
  verdict: { score, GO: pass.coverage && pass.eslint && pass.duplicates && pass.sec && pass.no_deploy, NO_DEPLOY_OK: pass.no_deploy },
  asks: []
};
if (!summary.meta.pm) summary.asks.push('Añadir "packageManager":"pnpm@8.15.5"');
if (!summary.meta.engines) summary.asks.push('Añadir "engines":{"node":">=20"}');
if (!(summary.inventory.workspaces || []).length) summary.asks.push('Declarar workspaces en package.json o pnpm-workspace.yaml');
if (metrics.coverage_lines_pct == null && RUN.TESTS !== '1' && !FAST) summary.asks.push('RUN_TESTS=1 para medir cobertura real');
if (metrics.eslint_errors == null && RUN.LINT !== '1' && !FAST) summary.asks.push('RUN_LINT=1 para ESLint');
if (metrics.jscpd_dup_pct == null && RUN.DUP !== '1' && !FAST) summary.asks.push('RUN_DUP=1 para duplicados');

fs.writeFileSync('reports/GO_EFFICIENT.json', JSON.stringify(summary, null, 2));
const csv = r => r.map(a => a.map(x => String(x).replace(/"/g, '""')).map(x => `"${x}"`).join(',')).join('\n');
fs.writeFileSync('reports/SCORECARD.csv', csv([['metric', 'value'], ['score', score], ['coverage_lines_pct', cov], ['eslint_errors', metrics.eslint_errors ?? 'n/a'], ['jscpd_dup_pct', metrics.jscpd_dup_pct ?? 'n/a'], ['npm_high', metrics.npm_high ?? 'n/a'], ['npm_critical', metrics.npm_critical ?? 'n/a'], ['secret_leaks', metrics.secret_leaks ?? 'n/a']]));
fs.writeFileSync('reports/WF_EVIDENCE.csv', csv([['file', 'has_flag', 'dangerous', 'strict_violation'], ...wfList.map(f => [f, wfFlags.includes(f), wfDanger.includes(f), wfStrict.includes(f)])]));
fs.writeFileSync('reports/DIR_STATS.csv', csv([['dir', 'count'], ...Object.entries(byDir).sort((a, b) => b[1] - a[1])]));
fs.writeFileSync('reports/EXT_STATS.csv', csv([['ext', 'count'], ...Object.entries(byExt).sort((a, b) => b[1] - a[1])]));
fs.writeFileSync('reports/FILES_TOP.csv', csv([['path', 'bytes'], ...largest.map(x => [x.path, x.size])]));
fs.writeFileSync('docs/audit/NO_DEPLOY_EVIDENCE.md', ['# NO_DEPLOY_EVIDENCE', `flags(${wfFlags.length}):`, ...wfFlags, '', `dangerous(${wfDanger.length}):`, ...wfDanger, STRICT ? `\nstrict_violations(${wfStrict.length}):\n${wfStrict.join('\n')}` : ''].join('\n'));
console.log(JSON.stringify({ GO: summary.verdict.GO, NO_DEPLOY_OK: summary.verdict.NO_DEPLOY_OK, score, durations_ms: durations, run_flags: RUN, asks: summary.asks }, null, 2));