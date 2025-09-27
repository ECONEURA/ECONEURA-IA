#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 F7-Final Analysis - Report Aggregation & Scoring');
console.log('================================================\n');

// Configuration
const REPORTS_DIR = 'reports';
const WEIGHTS = {
  coverage: 45,    // 45% - Test coverage
  eslint: 25,      // 25% - Code quality (ESLint errors)
  duplication: 15, // 15% - Code duplication
  security: 15     // 15% - Security leaks
};

// Helper functions
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not read ${filePath}:`, error.message);
  }
  return null;
}

function calculateCoverageScore(coverageData) {
  if (!coverageData || !coverageData.total) {
    console.log('❌ No coverage data found');
    return 0;
  }

  const total = coverageData.total;
  const coverage = {
    lines: total.lines?.pct || 0,
    functions: total.functions?.pct || 0,
    branches: total.branches?.pct || 0,
    statements: total.statements?.pct || 0
  };

  // Weighted average: lines 40%, functions 30%, branches 20%, statements 10%
  const score = (
    coverage.lines * 0.4 +
    coverage.functions * 0.3 +
    coverage.branches * 0.2 +
    coverage.statements * 0.1
  );

  console.log(`📊 Coverage Score: ${score.toFixed(1)}%`);
  console.log(`   Lines: ${coverage.lines.toFixed(1)}%, Functions: ${coverage.functions.toFixed(1)}%, Branches: ${coverage.branches.toFixed(1)}%, Statements: ${coverage.statements.toFixed(1)}%`);

  return Math.min(100, Math.max(0, score));
}

function calculateEslintScore(eslintData) {
  if (!Array.isArray(eslintData)) {
    console.log('❌ No ESLint data found');
    return 100; // No errors = perfect score
  }

  const totalErrors = eslintData.reduce((sum, file) => {
    if (file.messages) {
      return sum + file.messages.filter(msg => msg.severity === 2).length; // Only errors, not warnings
    }
    return sum;
  }, 0);

  // Score decreases with errors: 0 errors = 100%, 50+ errors = 0%
  const score = Math.max(0, 100 - (totalErrors * 2));

  console.log(`🔍 ESLint Score: ${score.toFixed(1)}% (${totalErrors} errors found)`);

  return score;
}

function calculateDuplicationScore(jscpdData) {
  if (!jscpdData || !Array.isArray(jscpdData)) {
    console.log('❌ No duplication data found');
    return 100; // No duplication = perfect score
  }

  const totalDuplicates = jscpdData.length;
  const duplicatedLines = jscpdData.reduce((sum, dup) => sum + (dup.lines || 0), 0);

  // Score decreases with duplication: 0 duplicates = 100%, 100+ duplicated lines = 0%
  const score = Math.max(0, 100 - (duplicatedLines * 0.5));

  console.log(`🔄 Duplication Score: ${score.toFixed(1)}% (${totalDuplicates} clones, ${duplicatedLines} duplicated lines)`);

  return score;
}

function calculateSecurityScore(gitleaksData) {
  if (!gitleaksData) {
    console.log('❌ No security scan data found');
    return 100; // No leaks found = perfect score
  }

  // Gitleaks returns an array of findings
  const leaks = Array.isArray(gitleaksData) ? gitleaksData : [];
  const totalLeaks = leaks.length;

  // Critical leaks (high severity)
  const criticalLeaks = leaks.filter(leak =>
    leak.RuleID?.includes('private-key') ||
    leak.RuleID?.includes('azure-client-secret') ||
    leak.RuleID?.includes('jwt-secret') ||
    leak.RuleID?.includes('database-password')
  ).length;

  // Score decreases with leaks: 0 leaks = 100%, 10+ leaks = 0%
  let score = Math.max(0, 100 - (totalLeaks * 5));

  // Critical leaks have higher penalty
  score -= criticalLeaks * 10;

  score = Math.max(0, score);

  console.log(`🔒 Security Score: ${score.toFixed(1)}% (${totalLeaks} total leaks, ${criticalLeaks} critical)`);

  return score;
}

function analyzeDeployCommands() {
  const deployFile = path.join(REPORTS_DIR, 'deploy_cmds.txt');
  try {
    if (fs.existsSync(deployFile)) {
      const content = fs.readFileSync(deployFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      // Analyze for dangerous patterns
      const dangerousPatterns = [
        /\b(rm|remove|delete|destroy|drop|truncate)\b/i,
        /\b(shutdown|stop|kill)\b/i,
        /\b(terraform destroy|kubectl delete)\b/i
      ];

      let dangerousCount = 0;
      const dangerousLines = [];

      lines.forEach(line => {
        const hasDangerous = dangerousPatterns.some(pattern => pattern.test(line));
        if (hasDangerous) {
          dangerousCount++;
          dangerousLines.push(line);
        }
      });

      console.log(`🚀 Deploy Commands Analysis:`);
      console.log(`   Total command lines: ${lines.length}`);
      console.log(`   Dangerous patterns found: ${dangerousCount}`);

      if (dangerousLines.length > 0) {
        console.log(`   ⚠️  Dangerous commands detected:`);
        dangerousLines.slice(0, 5).forEach(line => {
          console.log(`      ${line}`);
        });
        if (dangerousLines.length > 5) {
          console.log(`      ... and ${dangerousLines.length - 5} more`);
        }
      }

      return dangerousCount === 0 ? 100 : Math.max(0, 100 - (dangerousCount * 20));
    }
  } catch (error) {
    console.warn(`⚠️  Warning: Could not analyze deploy commands:`, error.message);
  }

  return 100; // Default to perfect score if analysis fails
}

// Main analysis
async function main() {
  console.log('📂 Reading reports...\n');

  // Read all report files
  const coverageData = readJsonFile(path.join(REPORTS_DIR, 'coverage.json'));
  const eslintData = readJsonFile(path.join(REPORTS_DIR, 'eslint.changed.json'));
  const jscpdData = readJsonFile(path.join(REPORTS_DIR, 'jscpd-report.json'));
  const gitleaksData = readJsonFile(path.join(REPORTS_DIR, 'gitleaks.json'));

  console.log('📈 Calculating scores...\n');

  // Calculate individual scores
  const coverageScore = calculateCoverageScore(coverageData);
  const eslintScore = calculateEslintScore(eslintData);
  const duplicationScore = calculateDuplicationScore(jscpdData);
  const securityScore = calculateSecurityScore(gitleaksData);
  const deployScore = analyzeDeployCommands();

  console.log('\n' + '='.repeat(50));
  console.log('🏆 FINAL F7 ANALYSIS SCORE');
  console.log('='.repeat(50));

  // Calculate weighted final score
  const finalScore = (
    (coverageScore * WEIGHTS.coverage / 100) +
    (eslintScore * WEIGHTS.eslint / 100) +
    (duplicationScore * WEIGHTS.duplication / 100) +
    (securityScore * WEIGHTS.security / 100)
  );

  console.log(`\n📊 Component Scores:`);
  console.log(`   Coverage (45%):     ${coverageScore.toFixed(1)}%`);
  console.log(`   ESLint (25%):       ${eslintScore.toFixed(1)}%`);
  console.log(`   Duplication (15%):  ${duplicationScore.toFixed(1)}%`);
  console.log(`   Security (15%):     ${securityScore.toFixed(1)}%`);
  console.log(`   Deploy Safety:      ${deployScore.toFixed(1)}% (not weighted in final score)`);

  console.log(`\n🎯 FINAL SCORE: ${finalScore.toFixed(1)}%`);

  // Determine readiness
  const PHASE7_THRESHOLD = 85;
  const isReady = finalScore >= PHASE7_THRESHOLD;

  console.log(`\n🎯 Phase 7 Readiness: ${isReady ? '✅ READY' : '❌ NOT READY'}`);
  console.log(`   Threshold: ${PHASE7_THRESHOLD}%`);

  if (isReady) {
    console.log('\n🎉 CONGRATULATIONS! Project is ready for Phase 7 production deployment.');
    console.log('   All quality gates have been met.');
  } else {
    console.log('\n⚠️  IMPROVEMENT NEEDED before Phase 7 deployment.');
    console.log('   Review the scores above and address critical issues.');

    // Generate improvement suggestions
    const suggestions = [];
    if (coverageScore < 80) suggestions.push('Increase test coverage (target: 80%+)');
    if (eslintScore < 90) suggestions.push('Fix ESLint errors and warnings');
    if (duplicationScore < 85) suggestions.push('Reduce code duplication (review JSCPD report)');
    if (securityScore < 95) suggestions.push('Address security leaks (review Gitleaks report)');

    if (suggestions.length > 0) {
      console.log('\n💡 Suggested improvements:');
      suggestions.forEach(suggestion => console.log(`   • ${suggestion}`));
    }
  }

  // Save final report
  const finalReport = {
    timestamp: new Date().toISOString(),
    scores: {
      coverage: coverageScore,
      eslint: eslintScore,
      duplication: duplicationScore,
      security: securityScore,
      deploySafety: deployScore,
      final: finalScore
    },
    weights: WEIGHTS,
    phase7Threshold: PHASE7_THRESHOLD,
    ready: isReady,
    analysis: {
      coverage: coverageData ? 'completed' : 'missing',
      eslint: eslintData ? 'completed' : 'missing',
      duplication: jscpdData ? 'completed' : 'missing',
      security: gitleaksData ? 'completed' : 'missing',
      deployCommands: 'completed'
    }
  };

  fs.writeFileSync(path.join(REPORTS_DIR, 'f7-final-score.json'), JSON.stringify(finalReport, null, 2));
  console.log(`\n💾 Final report saved to: reports/f7-final-score.json`);

  // Create summary markdown
  const summary = `# F7 Final Analysis Report

**Generated:** ${new Date().toISOString()}
**Final Score:** ${finalScore.toFixed(1)}%
**Phase 7 Ready:** ${isReady ? '✅ YES' : '❌ NO'}

## Component Scores

| Component | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Test Coverage | ${coverageScore.toFixed(1)}% | ${WEIGHTS.coverage}% | ${(coverageScore * WEIGHTS.coverage / 100).toFixed(1)}% |
| Code Quality (ESLint) | ${eslintScore.toFixed(1)}% | ${WEIGHTS.eslint}% | ${(eslintScore * WEIGHTS.eslint / 100).toFixed(1)}% |
| Code Duplication | ${duplicationScore.toFixed(1)}% | ${WEIGHTS.duplication}% | ${(duplicationScore * WEIGHTS.duplication / 100).toFixed(1)}% |
| Security Scan | ${securityScore.toFixed(1)}% | ${WEIGHTS.security}% | ${(securityScore * WEIGHTS.security / 100).toFixed(1)}% |
| **FINAL SCORE** | **${finalScore.toFixed(1)}%** | | |

## Analysis Status

- Coverage Analysis: ${coverageData ? '✅ Completed' : '❌ Missing'}
- ESLint Analysis: ${eslintData ? '✅ Completed' : '❌ Missing'}
- Duplication Analysis: ${jscpdData ? '✅ Completed' : '❌ Missing'}
- Security Analysis: ${gitleaksData ? '✅ Completed' : '❌ Missing'}
- Deploy Commands: ✅ Completed

${!isReady ? `
## Required Improvements

${suggestions.map(s => `- ${s}`).join('\n')}
` : ''}

---
*This report was automatically generated by the F7 analysis pipeline.*
`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'F7_ANALYSIS_SUMMARY.md'), summary);
  console.log(`📄 Summary report saved to: reports/F7_ANALYSIS_SUMMARY.md`);

  process.exit(isReady ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
});