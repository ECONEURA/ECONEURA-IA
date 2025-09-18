#!/usr/bin/env node
/**
 * ECONEURA Metrics Collection Script
 * Collects baseline metrics for the entire project
 */

const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', cwd: process.cwd() }).trim();
  } catch (error) {
    return '0';
  }
}

function countFiles(pattern, exclude = []) {
  const excludeStr = exclude.map(e => `-not -path "${e}"`).join(' ');
  const command = `find . -name "${pattern}" ${excludeStr} | wc -l`;
  return parseInt(execCommand(command)) || 0;
}

function countLines(pattern, exclude = []) {
  const excludeStr = exclude.map(e => `-not -path "${e}"`).join(' ');
  const command = `find . -name "${pattern}" ${excludeStr} -exec wc -l {} + | tail -1 | awk '{print $1}'`;
  return parseInt(execCommand(command)) || 0;
}

function countOccurrences(pattern, exclude = []) {
  const excludeStr = exclude.map(e => `-not -path "${e}"`).join(' ');
  const command = `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" ${excludeStr} -exec grep -l "${pattern}" {} + | wc -l`;
  return parseInt(execCommand(command)) || 0;
}

function countEndpoints() {
  const apiEndpoints = countOccurrences('router\\.(get|post|put|delete|patch)', ['node_modules', 'dist', '.next']);
  const webEndpoints = countOccurrences('export.*function.*GET|POST|PUT|DELETE|PATCH', ['node_modules', 'dist', '.next']);
  
  return {
    api: apiEndpoints,
    web: webEndpoints,
    total: apiEndpoints + webEndpoints
  };
}

function countTests() {
  const unitTests = countFiles('*.test.ts', ['node_modules', 'dist', '.next']);
  const integrationTests = countFiles('*.integration.test.ts', ['node_modules', 'dist', '.next']);
  const e2eTests = countFiles('*.e2e.test.ts', ['node_modules', 'dist', '.next']);
  
  return {
    unit: unitTests,
    integration: integrationTests,
    e2e: e2eTests,
    total: unitTests + integrationTests + e2eTests
  };
}

function getBundleSizes() {
  const webSize = execCommand('du -sb apps/web/.next 2>/dev/null | cut -f1') || '0';
  const apiSize = execCommand('du -sb apps/api/dist 2>/dev/null | cut -f1') || '0';
  const workersSize = execCommand('du -sb apps/workers/dist 2>/dev/null | cut -f1') || '0';
  
  return {
    web: parseInt(webSize) || 0,
    api: parseInt(apiSize) || 0,
    workers: parseInt(workersSize) || 0
  };
}

function getDependencies() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const prodDeps = Object.keys(packageJson.dependencies || {}).length;
    const devDeps = Object.keys(packageJson.devDependencies || {}).length;
    
    return {
      production: prodDeps,
      development: devDeps,
      total: prodDeps + devDeps
    };
  } catch {
    return { production: 0, development: 0, total: 0 };
  }
}

function collectMetrics() {
  const excludePaths = ['node_modules', 'dist', '.next', 'coverage'];
  
  return {
    timestamp: new Date().toISOString(),
    files: {
      total: countFiles('*', excludePaths),
      typescript: countFiles('*.ts', excludePaths) + countFiles('*.tsx', excludePaths),
      javascript: countFiles('*.js', excludePaths) + countFiles('*.jsx', excludePaths),
      tests: countFiles('*.test.*', excludePaths),
      configs: countFiles('*.config.*', excludePaths) + countFiles('*.json', excludePaths)
    },
    lines: {
      total: countLines('*', excludePaths),
      typescript: countLines('*.ts', excludePaths) + countLines('*.tsx', excludePaths),
      javascript: countLines('*.js', excludePaths) + countLines('*.jsx', excludePaths),
      tests: countLines('*.test.*', excludePaths),
      comments: countOccurrences('//|/\\*|\\*/', excludePaths)
    },
    imports: {
      total: countOccurrences('import.*from', excludePaths),
      jsImports: countOccurrences('import.*from.*\\.js', excludePaths),
      tsImports: countOccurrences('import.*from.*\\.ts', excludePaths),
      externalImports: countOccurrences('import.*from.*[^./]', excludePaths)
    },
    quality: {
      consoleLogs: countOccurrences('console\\.', excludePaths),
      todoComments: countOccurrences('TODO|FIXME|HACK', excludePaths),
      fixmeComments: countOccurrences('FIXME', excludePaths),
      duplicateImports: countOccurrences('import.*from.*lucide-react', excludePaths)
    },
    endpoints: countEndpoints(),
    tests: countTests(),
    bundles: getBundleSizes(),
    dependencies: getDependencies()
  };
}

function main() {
  console.log('🔍 Collecting ECONEURA project metrics...');
  
  const metrics = collectMetrics();
  
  // Create .artifacts directory if it doesn't exist
  execCommand('mkdir -p .artifacts');
  
  // Write metrics to file
  const outputPath = join(process.cwd(), '.artifacts', 'metrics.json');
  writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
  
  // Print summary
  console.log('\n📊 METRICS SUMMARY:');
  console.log(`📁 Files: ${metrics.files.total} total (${metrics.files.typescript} TS, ${metrics.files.javascript} JS)`);
  console.log(`📝 Lines: ${metrics.lines.total.toLocaleString()} total (${metrics.lines.typescript.toLocaleString()} TS)`);
  console.log(`🔗 Imports: ${metrics.imports.total} total (${metrics.imports.jsImports} .js imports)`);
  console.log(`🧪 Tests: ${metrics.tests.total} total (${metrics.tests.unit} unit, ${metrics.tests.integration} integration, ${metrics.tests.e2e} e2e)`);
  console.log(`🌐 Endpoints: ${metrics.endpoints.total} total (${metrics.endpoints.api} API, ${metrics.endpoints.web} Web)`);
  console.log(`📦 Bundles: ${(metrics.bundles.web / 1024 / 1024).toFixed(1)}MB web, ${(metrics.bundles.api / 1024 / 1024).toFixed(1)}MB api`);
  console.log(`📚 Dependencies: ${metrics.dependencies.total} total (${metrics.dependencies.production} prod, ${metrics.dependencies.development} dev)`);
  
  console.log(`\n❌ QUALITY ISSUES:`);
  console.log(`   Console.logs: ${metrics.quality.consoleLogs} files`);
  console.log(`   TODO/FIXME: ${metrics.quality.todoComments} comments`);
  console.log(`   .js imports: ${metrics.imports.jsImports} files`);
  
  console.log(`\n✅ Metrics saved to: ${outputPath}`);
  
  // Exit with error code if critical issues found
  if (metrics.quality.consoleLogs > 0 || metrics.imports.jsImports > 0) {
    console.log('\n🚨 Critical quality issues detected!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collectMetrics };
