#!/usr/bin/env node
/**
 * Script para recopilar métricas del proyecto ECONEURA
 * Genera baseline de LOC, tests, endpoints, bundle size
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Metrics {
  timestamp: string;
  typescript: {
    files: number;
    lines: number;
    linesOfCode: number;
  };
  tests: {
    unit: number;
    integration: number;
    e2e: number;
    total: number;
  };
  endpoints: {
    api: number;
    web: number;
    total: number;
  };
  bundle: {
    size: number;
    chunks: number;
  };
  dependencies: {
    total: number;
    dev: number;
    prod: number;
  };
}

function countFiles(pattern: string, exclude: string[] = []): number {
  try {
    const excludeStr = exclude.map(e => `-not -path "${e}"`).join(' ');
    const cmd = `find . -name "${pattern}" ${excludeStr} | wc -l`;
    return parseInt(execSync(cmd, { encoding: 'utf8' }).trim());
  } catch {
    return 0;
  }
}

function countLines(pattern: string, exclude: string[] = []): number {
  try {
    const excludeStr = exclude.map(e => `--exclude-dir=${e}`).join(' ');
    const cmd = `find . -name "${pattern}" ${excludeStr} -exec wc -l {} + | tail -1 | awk '{print $1}'`;
    const result = execSync(cmd, { encoding: 'utf8' }).trim();
    return parseInt(result) || 0;
  } catch {
    return 0;
  }
}

function countEndpoints(): { api: number; web: number; total: number } {
  let api = 0;
  let web = 0;

  try {
    // Contar rutas API
    const apiFiles = execSync('find . -name "*.routes.ts" -o -name "*.controller.ts"', { encoding: 'utf8' });
    api = (apiFiles.match(/\.routes\.ts|\.controller\.ts/g) || []).length;
  } catch {
    // Fallback: buscar patrones en archivos
    api = countFiles('*.routes.ts') + countFiles('*.controller.ts');
  }

  try {
    // Contar páginas web
    const webFiles = execSync('find . -path "*/pages/api/*" -name "*.ts"', { encoding: 'utf8' });
    web = (webFiles.match(/\.ts$/g) || []).length;
  } catch {
    web = countFiles('*.ts', ['node_modules', '.git', '.next', 'dist', 'build']);
  }

  return { api, web, total: api + web };
}

function getBundleSize(): { size: number; chunks: number } {
  try {
    if (existsSync('apps/web/.next/static/chunks')) {
      const size = execSync('du -sb apps/web/.next/static/chunks', { encoding: 'utf8' }).split('\t')[0];
      const chunks = execSync('find apps/web/.next/static/chunks -name "*.js" | wc -l', { encoding: 'utf8' }).trim();
      return { size: parseInt(size) || 0, chunks: parseInt(chunks) || 0 };
    }
  } catch {
    // Fallback
  }
  return { size: 0, chunks: 0 };
}

function getDependencies(): { total: number; dev: number; prod: number } {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const total = Object.keys(packageJson.dependencies || {}).length + Object.keys(packageJson.devDependencies || {}).length;
    const dev = Object.keys(packageJson.devDependencies || {}).length;
    const prod = Object.keys(packageJson.dependencies || {}).length;
    return { total, dev, prod };
  } catch {
    return { total: 0, dev: 0, prod: 0 };
  }
}

function collectMetrics(): Metrics {
  const exclude = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
  
  const tsFiles = countFiles('*.ts', exclude);
  const tsxFiles = countFiles('*.tsx', exclude);
  const tsLines = countLines('*.ts', exclude);
  const tsxLines = countLines('*.tsx', exclude);
  
  const unitTests = countFiles('*.test.ts', exclude) + countFiles('*.test.tsx', exclude);
  const integrationTests = countFiles('*.integration.test.ts', exclude);
  const e2eTests = countFiles('*.spec.ts', exclude) + countFiles('*.e2e.test.ts', exclude);
  
  const endpoints = countEndpoints();
  const bundle = getBundleSize();
  const dependencies = getDependencies();

  return {
    timestamp: new Date().toISOString(),
    typescript: {
      files: tsFiles + tsxFiles,
      lines: tsLines + tsxLines,
      linesOfCode: tsLines + tsxLines // Simplified - could use cloc for more accuracy
    },
    tests: {
      unit: unitTests,
      integration: integrationTests,
      e2e: e2eTests,
      total: unitTests + integrationTests + e2eTests
    },
    endpoints: endpoints,
    bundle: bundle,
    dependencies: dependencies
  };
}

// Ejecutar recolección
const metrics = collectMetrics();

// Guardar en archivo
writeFileSync('.artifacts/metrics.json', JSON.stringify(metrics, null, 2));

// Mostrar resumen
console.log('📊 MÉTRICAS BASELINE ECONEURA');
console.log('==============================');
console.log(`📁 Archivos TypeScript: ${metrics.typescript.files}`);
console.log(`📝 Líneas de código: ${metrics.typescript.lines.toLocaleString()}`);
console.log(`🧪 Tests totales: ${metrics.tests.total} (unit: ${metrics.tests.unit}, integration: ${metrics.tests.integration}, e2e: ${metrics.tests.e2e})`);
console.log(`🔗 Endpoints: ${metrics.endpoints.total} (API: ${metrics.endpoints.api}, Web: ${metrics.endpoints.web})`);
console.log(`📦 Bundle: ${(metrics.bundle.size / 1024 / 1024).toFixed(2)}MB, ${metrics.bundle.chunks} chunks`);
console.log(`📚 Dependencias: ${metrics.dependencies.total} (prod: ${metrics.dependencies.prod}, dev: ${metrics.dependencies.dev})`);
console.log(`\n💾 Guardado en: .artifacts/metrics.json`);
