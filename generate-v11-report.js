import fs from 'fs';

const J = p => {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return {};
  }
};

const cov = J('reports/coverage/coverage-summary.json');
const es = J('reports/eslint.json');
const dup = J('reports/jscpd/jscpd-report.json');
const gl = J('reports/gitleaks.json');

const covPct = cov.total?.lines?.pct ?? 0;
const lint = (Array.isArray(es) ? es.reduce((a, f) => a + (f.errorCount || 0), 0) : (es.errorCount || 0)) || 0;
const dupPct = dup.statistics?.duplication ?? dup.statistics?.percentage ?? 0;
const clones = dup.statistics?.clones ?? 0;
const sec = ((gl?.findings?.length || 0) === 0) ? 100 : 20;
const lintScore = (lint === 0 ? 100 : Math.max(0, 100 - Math.min(lint, 500)));
const dupScore = (typeof dupPct === 'number' ? Math.max(0, 100 - dupPct * 10) : 50);
const score = Math.round(0.45 * Math.min(covPct, 100) + 0.25 * lintScore + 0.15 * dupScore + 0.15 * sec);

const report = {
  coverage_lines_pct: covPct,
  eslint_errors: lint,
  jscpd_dup_pct: dupPct,
  jscpd_clones: clones,
  score,
  formula: '0.45*cov + 0.25*lintScore + 0.15*dupScore + 0.15*sec'
};

fs.writeFileSync('reports/summary.json', JSON.stringify(report, null, 2));
console.log('Quality V11 Blade Report:');
console.log(JSON.stringify(report, null, 2));