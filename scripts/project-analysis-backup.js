#!/usr/bin/env node

/**
 * ECONEURA-IA Project Analysis & Backup Script
 * Fecha: 27 de septiembre de 2025
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = `backups/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}`;

console.log('🔍 ECONEURA-IA Project Analysis & Backup Starting...\n');
console.log(`📅 Timestamp: ${new Date().toLocaleString('es-ES')}`);
console.log(`📁 Backup Directory: ${backupDir}\n`);

// Crear directorio de backup si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const analysis = {
  timestamp: new Date().toISOString(),
  project: {
    name: 'ECONEURA-IA',
    version: '1.0.0',
    description: 'Production-ready ERP+CRM cockpit with AI Router'
  },
  system: {},
  git: {},
  dependencies: {},
  structure: {},
  configuration: {},
  health: {}
};

// 1. Información del Sistema
console.log('🖥️  Analyzing System Information...');
try {
  analysis.system.nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  analysis.system.npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  analysis.system.pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
  analysis.system.os = process.platform;
  analysis.system.arch = process.arch;
  console.log('✅ System info collected');
} catch (error) {
  console.log('⚠️  Some system info not available');
}

// 2. Información de Git
console.log('📋 Analyzing Git Status...');
try {
  analysis.git.branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  analysis.git.commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  analysis.git.status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  analysis.git.remotes = execSync('git remote -v', { encoding: 'utf8' }).trim();
  console.log('✅ Git info collected');
} catch (error) {
  console.log('⚠️  Git info not available');
}

// 3. Estructura del Proyecto
console.log('🏗️  Analyzing Project Structure...');
try {
  const structure = {};
  const dirs = ['apps', 'packages', 'scripts', 'docs', 'tests', 'config'];

  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      structure[dir] = items.filter(item => !item.startsWith('.'));
    }
  });

  analysis.structure = structure;
  console.log('✅ Project structure analyzed');
} catch (error) {
  console.log('⚠️  Structure analysis failed');
}

// 4. Dependencias
console.log('📦 Analyzing Dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  analysis.dependencies.total = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
  analysis.dependencies.runtime = Object.keys(pkg.dependencies || {});
  analysis.dependencies.dev = Object.keys(pkg.devDependencies || {});
  console.log('✅ Dependencies analyzed');
} catch (error) {
  console.log('⚠️  Dependencies analysis failed');
}

// 5. Configuración
console.log('⚙️  Analyzing Configuration...');
try {
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'vitest.config.ts',
    'eslint.config.mjs',
    '.gitignore',
    'pnpm-workspace.yaml'
  ];

  const config = {};
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      config[file] = {
        exists: true,
        size: stats.size,
        modified: stats.mtime.toISOString()
      };
    } else {
      config[file] = { exists: false };
    }
  });

  analysis.configuration = config;
  console.log('✅ Configuration analyzed');
} catch (error) {
  console.log('⚠️  Configuration analysis failed');
}

// 6. Health Check
console.log('🏥 Running Health Checks...');
try {
  const health = {};

  // TypeScript check
  try {
    execSync('pnpm typecheck', { stdio: 'pipe', timeout: 30000 });
    health.typescript = '✅ Pass';
  } catch {
    health.typescript = '❌ Fail';
  }

  // Lint check
  try {
    execSync('pnpm lint', { stdio: 'pipe', timeout: 30000 });
    health.eslint = '✅ Pass';
  } catch {
    health.eslint = '❌ Fail';
  }

  // Test check
  try {
    execSync('pnpm test --run', { stdio: 'pipe', timeout: 60000 });
    health.tests = '✅ Pass';
  } catch {
    health.tests = '❌ Fail';
  }

  analysis.health = health;
  console.log('✅ Health checks completed');
} catch (error) {
  console.log('⚠️  Health checks failed');
}

// 7. Backup de archivos críticos
console.log('💾 Creating Backup...');
try {
  const criticalFiles = [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'tsconfig.json',
    'README.md',
    '.gitignore',
    '.github/workflows/ci-improvements.yml'
  ];

  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const dest = path.join(backupDir, path.basename(file));
      fs.copyFileSync(file, dest);
    }
  });

  // Backup de scripts
  if (fs.existsSync('scripts')) {
    const scriptFiles = fs.readdirSync('scripts');
    scriptFiles.forEach(file => {
      const src = path.join('scripts', file);
      const dest = path.join(backupDir, 'scripts', file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    });
  }

  console.log('✅ Critical files backed up');
} catch (error) {
  console.log('⚠️  Backup failed');
}

// 8. Generar reporte
console.log('📊 Generating Analysis Report...');
const reportPath = path.join(backupDir, 'project-analysis.json');
fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

const summaryPath = path.join(backupDir, 'ANALYSIS_SUMMARY.md');
const summary = `# ECONEURA-IA Project Analysis & Backup
**Fecha:** ${new Date().toLocaleString('es-ES')}
**Timestamp:** ${timestamp}
**Branch:** ${analysis.git.branch || 'Unknown'}
**Commit:** ${analysis.git.commit || 'Unknown'}

## 📊 Resumen Ejecutivo

### Sistema
- **Node.js:** ${analysis.system.nodeVersion || 'Unknown'}
- **pnpm:** ${analysis.system.pnpmVersion || 'Unknown'}
- **OS:** ${analysis.system.os || 'Unknown'}

### Dependencias
- **Total:** ${analysis.dependencies.total || 0}
- **Runtime:** ${analysis.dependencies.runtime?.length || 0}
- **Dev:** ${analysis.dependencies.dev?.length || 0}

### Salud del Proyecto
- **TypeScript:** ${analysis.health.typescript || 'Unknown'}
- **ESLint:** ${analysis.health.eslint || 'Unknown'}
- **Tests:** ${analysis.health.tests || 'Unknown'}

### Estructura
${Object.entries(analysis.structure).map(([dir, items]) =>
  `- **${dir}:** ${Array.isArray(items) ? items.length : 0} items`
).join('\n')}

## 📁 Archivos Respaldados
- package.json, package-lock.json, pnpm-lock.yaml
- tsconfig.json, README.md, .gitignore
- Scripts personalizados
- Configuración de CI/CD

## 🎯 Estado del Proyecto
**ECONEURA-IA** es un ERP+CRM de nueva generación impulsado por IA, con arquitectura monorepo usando pnpm workspaces.

**Estado Actual:** ${analysis.git.status ? 'Cambios pendientes' : 'Limpio'}
**Último Commit:** ${analysis.git.commit?.slice(0, 8) || 'Unknown'}

---
*Backup generado automáticamente por el sistema de análisis de ECONEURA-IA*
`;

fs.writeFileSync(summaryPath, summary);

console.log('\n🎉 Analysis & Backup Complete!');
console.log(`📁 Backup saved to: ${backupDir}`);
console.log(`📊 Report: ${reportPath}`);
console.log(`📋 Summary: ${summaryPath}`);

// Mostrar resumen en consola
console.log('\n' + '='.repeat(60));
console.log('📊 PROJECT ANALYSIS SUMMARY');
console.log('='.repeat(60));
console.log(`Branch: ${analysis.git.branch || 'Unknown'}`);
console.log(`Node.js: ${analysis.system.nodeVersion || 'Unknown'}`);
console.log(`Dependencies: ${analysis.dependencies.total || 0}`);
console.log(`TypeScript: ${analysis.health.typescript || 'Unknown'}`);
console.log(`ESLint: ${analysis.health.eslint || 'Unknown'}`);
console.log(`Tests: ${analysis.health.tests || 'Unknown'}`);
console.log('='.repeat(60));

process.exit(0);