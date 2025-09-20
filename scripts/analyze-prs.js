#!/usr/bin/env node
/**
 * Script para analizar todos los PRs y generar documentación consolidada
 * FASE 1 - PRs FIRMES
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
        // Saltar directorios que no nos interesan
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

function extractPRInfo(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    
    // Extraer número de PR del nombre del archivo
    const match = filePath.match(/PR-(\d+)-EVIDENCE\.md$/);
    const prNumber = match ? parseInt(match[1]) : 0;
    
    // Extraer información del contenido
    const lines = content.split('\n');
    let title = '';
    let status = 'unknown';
    let completion = 0;
    let evidence = [];
    let issues = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Buscar título
      if (line.startsWith('# PR-') && !title) {
        title = line.replace(/^#\s*/, '');
      }
      
      // Buscar estado
      if (line.includes('Estado:') || line.includes('Status:')) {
        const statusMatch = line.match(/Estado:\s*(\w+)|Status:\s*(\w+)/i);
        if (statusMatch) {
          status = (statusMatch[1] || statusMatch[2]).toLowerCase();
        }
      }
      
      // Buscar porcentaje de completado
      if (line.includes('%') && line.includes('completado')) {
        const percentMatch = line.match(/(\d+)%/);
        if (percentMatch) {
          completion = parseInt(percentMatch[1]);
        }
      }
      
      // Buscar evidencia
      if (line.includes('✅') || line.includes('✓')) {
        evidence.push(line);
      }
      
      // Buscar problemas
      if (line.includes('❌') || line.includes('⚠️') || line.includes('FIXME') || line.includes('TODO')) {
        issues.push(line);
      }
    }
    
    // Determinar estado basado en contenido
    if (completion >= 90 && evidence.length > 0) {
      status = 'completed';
    } else if (completion >= 50) {
      status = 'in_progress';
    } else if (completion > 0) {
      status = 'started';
    } else {
      status = 'not_started';
    }
    
    return {
      prNumber,
      title,
      status,
      completion,
      evidence: evidence.slice(0, 5), // Limitar a 5 evidencias
      issues: issues.slice(0, 3), // Limitar a 3 problemas
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
      filePath
    };
  }
}

function generatePRStatus(prData) {
  const status = {
    timestamp: new Date().toISOString(),
    summary: {
      total: prData.length,
      completed: prData.filter(p => p.status === 'completed').length,
      in_progress: prData.filter(p => p.status === 'in_progress').length,
      started: prData.filter(p => p.status === 'started').length,
      not_started: prData.filter(p => p.status === 'not_started').length,
      errors: prData.filter(p => p.status === 'error').length
    },
    prs: prData.map(pr => ({
      pr: pr.prNumber,
      title: pr.title,
      status: pr.status,
      completion: pr.completion,
      evidenceCount: pr.evidence.length,
      issuesCount: pr.issues.length,
      filePath: pr.filePath
    }))
  };
  
  return status;
}

function generateContradictions(prData) {
  const contradictions = [];
  
  // Buscar PRs con estado inconsistente
  const inconsistentPRs = prData.filter(pr => {
    return (pr.completion >= 90 && pr.status !== 'completed') ||
           (pr.completion < 50 && pr.status === 'completed') ||
           (pr.evidence.length === 0 && pr.completion > 0);
  });
  
  for (const pr of inconsistentPRs) {
    contradictions.push({
      pr: pr.prNumber,
      title: pr.title,
      issue: 'Estado inconsistente',
      details: `Completado: ${pr.completion}%, Estado: ${pr.status}, Evidencias: ${pr.evidence.length}`,
      recommendation: 'Revisar y corregir estado'
    });
  }
  
  // Buscar PRs con problemas pero marcados como completados
  const problematicCompleted = prData.filter(pr => 
    pr.status === 'completed' && pr.issues.length > 0
  );
  
  for (const pr of problematicCompleted) {
    contradictions.push({
      pr: pr.prNumber,
      title: pr.title,
      issue: 'Completado con problemas',
      details: `Problemas encontrados: ${pr.issues.length}`,
      recommendation: 'Resolver problemas antes de marcar como completado'
    });
  }
  
  return contradictions;
}

function generateCSV(prData) {
  const headers = ['PR', 'Title', 'Status', 'Completion', 'Evidence', 'Issues', 'FilePath'];
  const rows = prData.map(pr => [
    pr.prNumber,
    `"${pr.title}"`,
    pr.status,
    pr.completion,
    pr.evidence.length,
    pr.issues.length,
    pr.filePath
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateMarkdown(prData, contradictions) {
  let md = `# PR Status Firm - ECONEURA

**Fecha:** ${new Date().toISOString()}  
**Fase:** FASE 1 - PRs FIRMES  
**Objetivo:** Estado consolidado de todos los PRs

## 📊 Resumen Ejecutivo

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| ✅ Completados | ${prData.filter(p => p.status === 'completed').length} | ${Math.round((prData.filter(p => p.status === 'completed').length / prData.length) * 100)}% |
| 🔄 En Progreso | ${prData.filter(p => p.status === 'in_progress').length} | ${Math.round((prData.filter(p => p.status === 'in_progress').length / prData.length) * 100)}% |
| 🟡 Iniciados | ${prData.filter(p => p.status === 'started').length} | ${Math.round((prData.filter(p => p.status === 'started').length / prData.length) * 100)}% |
| ⚪ No Iniciados | ${prData.filter(p => p.status === 'not_started').length} | ${Math.round((prData.filter(p => p.status === 'not_started').length / prData.length) * 100)}% |
| ❌ Errores | ${prData.filter(p => p.status === 'error').length} | ${Math.round((prData.filter(p => p.status === 'error').length / prData.length) * 100)}% |

**Total:** ${prData.length} PRs

## 🔍 PRs por Estado

### ✅ Completados (${prData.filter(p => p.status === 'completed').length})

`;

  // Agregar PRs completados
  prData.filter(p => p.status === 'completed').forEach(pr => {
    md += `- **PR-${pr.prNumber}**: ${pr.title} (${pr.completion}%)\n`;
  });

  md += `\n### 🔄 En Progreso (${prData.filter(p => p.status === 'in_progress').length})\n\n`;

  // Agregar PRs en progreso
  prData.filter(p => p.status === 'in_progress').forEach(pr => {
    md += `- **PR-${pr.prNumber}**: ${pr.title} (${pr.completion}%)\n`;
  });

  md += `\n### 🟡 Iniciados (${prData.filter(p => p.status === 'started').length})\n\n`;

  // Agregar PRs iniciados
  prData.filter(p => p.status === 'started').forEach(pr => {
    md += `- **PR-${pr.prNumber}**: ${pr.title} (${pr.completion}%)\n`;
  });

  if (contradictions.length > 0) {
    md += `\n## ⚠️ Contradicciones Identificadas\n\n`;
    contradictions.forEach(cont => {
      md += `### PR-${cont.pr}: ${cont.title}\n`;
      md += `- **Problema:** ${cont.issue}\n`;
      md += `- **Detalles:** ${cont.details}\n`;
      md += `- **Recomendación:** ${cont.recommendation}\n\n`;
    });
  }

  md += `\n## 📋 Lista Completa\n\n`;
  md += `| PR | Título | Estado | Completado | Evidencias | Problemas |\n`;
  md += `|----|--------|--------|------------|------------|----------|\n`;

  prData.forEach(pr => {
    const statusIcon = pr.status === 'completed' ? '✅' : 
                      pr.status === 'in_progress' ? '🔄' : 
                      pr.status === 'started' ? '🟡' : 
                      pr.status === 'not_started' ? '⚪' : '❌';
    
    md += `| PR-${pr.prNumber} | ${pr.title} | ${statusIcon} ${pr.status} | ${pr.completion}% | ${pr.evidence.length} | ${pr.issues.length} |\n`;
  });

  return md;
}

// Ejecutar análisis
console.log('🚀 Iniciando análisis de PRs...');

const prFiles = findPRFiles();
console.log(`📁 Encontrados ${prFiles.length} archivos de evidencia`);

const prData = prFiles.map(extractPRInfo);
console.log(`📊 Procesados ${prData.length} PRs`);

const status = generatePRStatus(prData);
const contradictions = generateContradictions(prData);
const csv = generateCSV(prData);
const markdown = generateMarkdown(prData, contradictions);

// Guardar archivos
writeFileSync('docs/PR_STATUS_FIRM.json', JSON.stringify(status, null, 2));
writeFileSync('docs/PR_STATUS_FIRM.csv', csv);
writeFileSync('docs/PR_STATUS_FIRM.md', markdown);
writeFileSync('docs/PR_CONTRADICCIONES.md', generateMarkdown(prData, contradictions));

// Mostrar resumen
console.log('\n📊 RESUMEN DE PRs');
console.log('==================');
console.log(`📁 Total PRs: ${status.summary.total}`);
console.log(`✅ Completados: ${status.summary.completed} (${Math.round((status.summary.completed / status.summary.total) * 100)}%)`);
console.log(`🔄 En Progreso: ${status.summary.in_progress} (${Math.round((status.summary.in_progress / status.summary.total) * 100)}%)`);
console.log(`🟡 Iniciados: ${status.summary.started} (${Math.round((status.summary.started / status.summary.total) * 100)}%)`);
console.log(`⚪ No Iniciados: ${status.summary.not_started} (${Math.round((status.summary.not_started / status.summary.total) * 100)}%)`);
console.log(`❌ Errores: ${status.summary.errors} (${Math.round((status.summary.errors / status.summary.total) * 100)}%)`);

if (contradictions.length > 0) {
  console.log(`\n⚠️  CONTRADICCIONES: ${contradictions.length}`);
  contradictions.forEach(cont => {
    console.log(`   - PR-${cont.pr}: ${cont.issue}`);
  });
}

console.log(`\n💾 Archivos generados:`);
console.log(`   - docs/PR_STATUS_FIRM.json`);
console.log(`   - docs/PR_STATUS_FIRM.csv`);
console.log(`   - docs/PR_STATUS_FIRM.md`);
console.log(`   - docs/PR_CONTRADICCIONES.md`);
