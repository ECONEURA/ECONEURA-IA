import fs from "fs";

const J = p => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
};

const cov = J("reports/coverage/coverage-summary.json"), es = J("reports/eslint.json"),
  dup = J("reports/jscpd/jscpd-report.json"), au = J("reports/audit.json"), gl = J("reports/gitleaks.json");

const covPct = cov?.total?.lines?.pct || 0;
const lint = Array.isArray(es) ? es.reduce((a, f) => a + (f.errorCount || 0), 0) : (es.errorCount || 0) || 0;
const dupPct = dup?.statistics?.duplication ?? dup?.statistics?.percentage ?? 0, clones = dup?.statistics?.clones ?? 0;
const high = au?.vulnerabilities?.high ?? 0, crit = au?.vulnerabilities?.critical ?? 0;
const leaks = Array.isArray(gl) ? gl.length : (gl?.findings?.length || 0);

const score = Math.round((Math.min(covPct, 100) * 0.45) + ((lint === 0 ? 100 : Math.max(0, 100 - Math.min(lint, 500))) * 0.25) + ((typeof dupPct === "number" ? Math.max(0, 100 - dupPct * 10) : 50) * 0.15) + ((high + crit + leaks === 0 ? 100 : 20) * 0.15));

const out = { coverage_lines_pct: covPct, eslint_errors: lint, jscpd_dup_pct: dupPct, jscpd_clones: clones, npm_high: high, npm_critical: crit, secret_leaks: leaks, score };

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync("reports/summary.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));

if (leaks > 0) {
  process.exitCode = 9;
}