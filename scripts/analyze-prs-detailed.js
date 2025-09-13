#!/usr/bin/env node
/**
 * Script mejorado para analizar PRs con lógica más inteligente
 * FASE 1 - PRs FIRMES (Versión Detallada)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function findPRFiles() {
  const prFiles = [];
  
  function traverse(dir) {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'docs'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.match(/PR-\d+-EVIDENCE\.md$/)) {
        prFiles.push(fullPath);
      }
    }
  }
  
  traverse('.');
  return prFiles.sort();
}

function extractPRInfoDetailed(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Extraer número de PR del nombre del archivo
    const match = filePath.match(/PR-(\d+)-EVIDENCE\.md$/);
    const prNumber = match ? parseInt(match[1]) : 0;
    
    const lines = content.split('\n');
    let title = '';
    let status = 'unknown';
    let completion = 0;
    let evidence = [];
    let issues = [];
    let hasImplementation = false;
    let hasTests = false;
    let hasDocumentation = false;
    let fileCount = 0;
    
    // Análisis más detallado del contenido
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Buscar título
      if (line.startsWith('# PR-') && !title) {
        title = line.replace(/^#\s*/, '');
      }
      
      // Buscar implementación
      if (line.includes('implementado') || line.includes('implemented') || 
          line.includes('creado') || line.includes('created') ||
          line.includes('agregado') || line.includes('added')) {
        hasImplementation = true;
      }
      
      // Buscar tests
      if (line.includes('test') || line.includes('prueba') || 
          line.includes('spec') || line.includes('.test.')) {
        hasTests = true;
      }
      
      // Buscar documentación
      if (line.includes('documentado') || line.includes('documented') ||
          line.includes('README') || line.includes('docs')) {
        hasDocumentation = true;
      }
      
      // Contar archivos mencionados
      if (line.includes('.ts') || line.includes('.js') || 
          line.includes('.tsx') || line.includes('.jsx')) {
        fileCount++;
      }
      
      // Buscar evidencia
      if (line.includes('✅') || line.includes('✓') || 
          line.includes('completado') || line.includes('completed')) {
        evidence.push(line);
      }
      
      // Buscar problemas
      if (line.includes('❌') || line.includes('⚠️') || 
          line.includes('FIXME') || line.includes('TODO') ||
          line.includes('error') || line.includes('problema')) {
        issues.push(line);
      }
    }
    
    // Lógica mejorada para determinar estado
    if (hasImplementation && hasTests && evidence.length >= 3) {
      status = 'completed';
      completion = 100;
    } else if (hasImplementation && evidence.length >= 2) {
      status = 'completed';
      completion = 90;
    } else if (hasImplementation || evidence.length >= 1) {
      status = 'in_progress';
      completion = Math.min(80, evidence.length * 20);
    } else if (fileCount > 0) {
      status = 'started';
      completion = Math.min(30, fileCount * 5);
    } else {
      status = 'not_started';
      completion = 0;
    }
    
    // Ajustar basado en problemas
    if (issues.length > 3) {
      completion = Math.max(0, completion - 20);
      if (status === 'completed') {
        status = 'in_progress';
      }
    }
    
    return {
      prNumber,
      title,
      status,
      completion,
      evidence: evidence.slice(0, 5),
      issues: issues.slice(0, 3),
      hasImplementation,
      hasTests,
      hasDocumentation,
      fileCount,
      filePath
    };
    
  } catch (error) {
    console.warn(`⚠️  Error procesando ${filePath}: ${error.message}`);
    return {
      prNumber: 0,
      title: 'Error',
      status: 'error',
      completion: 0,
      evidence: [],
      issues: [`Error: ${error.message}`],
      hasImplementation: false,
      hasTests: false,
      hasDocumentation: false,
      fileCount: 0,
      filePath
    };
  }
}

function generateDetailedReport(prData) {
  const status = {
    timestamp: new Date().toISOString(),
    summary: {
      total: prData.length,
      completed: prData.filter(p => p.status === 'completed').length,
      in_progress: prData.filter(p => p.status === 'in_progress').length,
      started: prData.filter(p => p.status === 'started').length,
      not_started: prData.filter(p => p.status === 'not_started').length,
      errors: prData.filter(p => p.status === 'error').length,
      withImplementation: prData.filter(p => p.hasImplementation).length,
      withTests: prData.filter(p => p.hasTests).length,
      withDocumentation: prData.filter(p => p.hasDocumentation).length
    },
    prs: prData.map(pr => ({
      pr: pr.prNumber,
      title: pr.title,
      status: pr.status,
      completion: pr.completion,
      evidenceCount: pr.evidence.length,
      issuesCount: pr.issues.length,
      hasImplementation: pr.hasImplementation,
      hasTests: pr.hasTests,
      hasDocumentation: pr.hasDocumentation,
      fileCount: pr.fileCount,
      filePath: pr.filePath
    }))
  };
  
  return status;
}

function generateContradictionsDetailed(prData) {
  const contradictions = [];
  
  // PRs con implementación pero marcados como no iniciados
  const implementedNotStarted = prData.filter(pr => 
    pr.hasImplementation && pr.status === 'not_started'
  );
  
  for (const pr of implementedNotStarted) {
    contradictions.push({
      pr: pr.prNumber,
      title: pr.title,
      issue: 'Implementado pero marcado como no iniciado',
      details: `Tiene implementación pero estado: ${pr.status}`,
      recommendation: 'Actualizar estado a in_progress o completed'
    });
  }
  
  // PRs completados sin tests
  const completedWithoutTests = prData.filter(pr => 
    pr.status === 'completed' && !pr.hasTests
  );
  
  for (const pr of completedWithoutTests) {
    contradictions.push({
      pr: pr.prNumber,
      title: pr.title,
      issue: 'Completado sin tests',
      details: 'Marcado como completado pero no tiene tests',
      recommendation: 'Agregar tests o revisar criterios de completado'
    });
  }
  
  // PRs con alta evidencia pero bajo porcentaje
  const highEvidenceLowCompletion = prData.filter(pr => 
    pr.evidence.length >= 3 && pr.completion < 50
  );
  
  for (const pr of highEvidenceLowCompletion) {
    contradictions.push({
      pr: pr.prNumber,
      title: pr.title,
      issue: 'Alta evidencia, bajo porcentaje',
      details: `${pr.evidence.length} evidencias pero ${pr.completion}% completado`,
      recommendation: 'Revisar cálculo de porcentaje'
    });
  }
  
  return contradictions;
}

function generateDetailedMarkdown(prData, contradictions) {
  let md = `# PR Status Firm - ECONEURA (Análisis Detallado)

**Fecha:** ${new Date().toISOString()}  
**Fase:** FASE 1 - PRs FIRMES  
**Objetivo:** Estado consolidado de todos los PRs con análisis inteligente

## 📊 Resumen Ejecutivo

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| ✅ Completados | ${prData.filter(p => p.status === 'completed').length} | ${Math.round((prData.filter(p => p.status === 'completed').length / prData.length) * 100)}% |
| 🔄 En Progreso | ${prData.filter(p => p.status === 'in_progress').length} | ${Math.round((prData.filter(p => p.status === 'in_progress').length / prData.length) * 100)}% |
| 🟡 Iniciados | ${prData.filter(p => p.status === 'started').length} | ${Math.round((prData.filter(p => p.status === 'started').length / prData.length) * 100)}% |
| ⚪ No Iniciados | ${prData.filter(p => p.status === 'not_started').length} | ${Math.round((prData.filter(p => p.status === 'not_started').length / prData.length) * 100)}% |
| ❌ Errores | ${prData.filter(p => p.status === 'error').length} | ${Math.round((prData.filter(p => p.status === 'error').length / prData.length) * 100)}% |

**Total:** ${prData.length} PRs

## 🔍 Análisis de Calidad

| Aspecto | Cantidad | Porcentaje |
|---------|----------|------------|
| 🏗️ Con Implementación | ${prData.filter(p => p.hasImplementation).length} | ${Math.round((prData.filter(p => p.hasImplementation).length / prData.length) * 100)}% |
| 🧪 Con Tests | ${prData.filter(p => p.hasTests).length} | ${Math.round((prData.filter(p => p.hasTests).length / prData.length) * 100)}% |
| 📚 Con Documentación | ${prData.filter(p => p.hasDocumentation).length} | ${Math.round((prData.filter(p => p.hasDocumentation).length / prData.length) * 100)}% |

## 🔍 PRs por Estado

### ✅ Completados (${prData.filter(p => p.status === 'completed').length})

`;

  // Agregar PRs completados con detalles
  prData.filter(p => p.status === 'completed').forEach(pr => {
    const tests = pr.hasTests ? '🧪' : '❌';
    const docs = pr.hasDocumentation ? '📚' : '❌';
    md += `- **PR-${pr.prNumber}**: ${pr.title} (${pr.completion}%) ${tests} ${docs}\n`;
  });

  md += `\n### 🔄 En Progreso (${prData.filter(p => p.status === 'in_progress').length})\n\n`;

  // Agregar PRs en progreso
  prData.filter(p => p.status === 'in_progress').forEach(pr => {
    const impl = pr.hasImplementation ? '🏗️' : '❌';
    const tests = pr.hasTests ? '🧪' : '❌';
    md += `- **PR-${pr.prNumber}**: ${pr.title} (${pr.completion}%) ${impl} ${tests}\n`;
  });

  md += `\n### 🟡 Iniciados (${prData.filter(p => p.status === 'started').length})\n\n`;

  // Agregar PRs iniciados
  prData.filter(p => p.status === 'started').forEach(pr => {
    md += `- **PR-${pr.prNumber}**: ${pr.title} (${pr.completion}%)\n`;
  });

  if (contradictions.length > 0) {
    md += `\n## ⚠️ Contradicciones Identificadas (${contradictions.length})\n\n`;
    contradictions.forEach(cont => {
      md += `### PR-${cont.pr}: ${cont.title}\n`;
      md += `- **Problema:** ${cont.issue}\n`;
      md += `- **Detalles:** ${cont.details}\n`;
      md += `- **Recomendación:** ${cont.recommendation}\n\n`;
    });
  }

  md += `\n## 📋 Lista Completa Detallada\n\n`;
  md += `| PR | Título | Estado | Completado | Evidencias | Problemas | 🏗️ | 🧪 | 📚 |\n`;
  md += `|----|--------|--------|------------|------------|----------|----|----|----|\n`;

  prData.forEach(pr => {
    const statusIcon = pr.status === 'completed' ? '✅' : 
                      pr.status === 'in_progress' ? '🔄' : 
                      pr.status === 'started' ? '🟡' : 
                      pr.status === 'not_started' ? '⚪' : '❌';
    
    const impl = pr.hasImplementation ? '✅' : '❌';
    const tests = pr.hasTests ? '✅' : '❌';
    const docs = pr.hasDocumentation ? '✅' : '❌';
    
    md += `| PR-${pr.prNumber} | ${pr.title} | ${statusIcon} ${pr.status} | ${pr.completion}% | ${pr.evidence.length} | ${pr.issues.length} | ${impl} | ${tests} | ${docs} |\n`;
  });

  return md;
}

// Ejecutar análisis detallado
console.log('🚀 Iniciando análisis detallado de PRs...');

const prFiles = findPRFiles();
console.log(`📁 Encontrados ${prFiles.length} archivos de evidencia`);

const prData = prFiles.map(extractPRInfoDetailed);
console.log(`📊 Procesados ${prData.length} PRs`);

const status = generateDetailedReport(prData);
const contradictions = generateContradictionsDetailed(prData);
const markdown = generateDetailedMarkdown(prData, contradictions);

// Guardar archivos
writeFileSync('docs/PR_STATUS_FIRM_DETAILED.json', JSON.stringify(status, null, 2));
writeFileSync('docs/PR_STATUS_FIRM_DETAILED.md', markdown);
writeFileSync('docs/PR_CONTRADICCIONES_DETAILED.md', generateDetailedMarkdown(prData, contradictions));

// Mostrar resumen
console.log('\n📊 RESUMEN DETALLADO DE PRs');
console.log('============================');
console.log(`📁 Total PRs: ${status.summary.total}`);
console.log(`✅ Completados: ${status.summary.completed} (${Math.round((status.summary.completed / status.summary.total) * 100)}%)`);
console.log(`🔄 En Progreso: ${status.summary.in_progress} (${Math.round((status.summary.in_progress / status.summary.total) * 100)}%)`);
console.log(`🟡 Iniciados: ${status.summary.started} (${Math.round((status.summary.started / status.summary.total) * 100)}%)`);
console.log(`⚪ No Iniciados: ${status.summary.not_started} (${Math.round((status.summary.not_started / status.summary.total) * 100)}%)`);
console.log(`❌ Errores: ${status.summary.errors} (${Math.round((status.summary.errors / status.summary.total) * 100)}%)`);

console.log('\n🔍 ANÁLISIS DE CALIDAD:');
console.log(`🏗️ Con Implementación: ${status.summary.withImplementation} (${Math.round((status.summary.withImplementation / status.summary.total) * 100)}%)`);
console.log(`🧪 Con Tests: ${status.summary.withTests} (${Math.round((status.summary.withTests / status.summary.total) * 100)}%)`);
console.log(`📚 Con Documentación: ${status.summary.withDocumentation} (${Math.round((status.summary.withDocumentation / status.summary.total) * 100)}%)`);

if (contradictions.length > 0) {
  console.log(`\n⚠️  CONTRADICCIONES: ${contradictions.length}`);
  contradictions.forEach(cont => {
    console.log(`   - PR-${cont.pr}: ${cont.issue}`);
  });
}

console.log(`\n💾 Archivos generados:`);
console.log(`   - docs/PR_STATUS_FIRM_DETAILED.json`);
console.log(`   - docs/PR_STATUS_FIRM_DETAILED.md`);
console.log(`   - docs/PR_CONTRADICCIONES_DETAILED.md`);
