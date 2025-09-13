#!/usr/bin/env node
/**
 * Script para analizar código muerto y dependencias no utilizadas
 * Consolida resultados de knip, depcheck y ts-prune
 */

import { readFileSync, writeFileSync } from 'fs';

function loadReport(filename) {
  try {
    const content = readFileSync(filename, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  No se pudo cargar ${filename}: ${error.message}`);
    return {};
  }
}

function analyzeUnused() {
  console.log('🔍 Analizando código muerto y dependencias...');
  
  const knipReport = loadReport('reports/knip.json');
  const depcheckReport = loadReport('reports/depcheck.json');
  const tsPruneReport = loadReport('reports/ts-prune.json');
  
  const analysis = {
    timestamp: new Date().toISOString(),
    summary: {
      unusedFiles: 0,
      unusedDependencies: 0,
      unusedExports: 0,
      missingDependencies: 0
    },
    unused: {
      files: [],
      dependencies: [],
      exports: [],
      missing: []
    },
    recommendations: []
  };
  
  // Analizar knip
  if (knipReport.unused) {
    analysis.unused.files = knipReport.unused;
    analysis.summary.unusedFiles = knipReport.unused.length;
  }
  
  if (knipReport.dependencies) {
    analysis.unused.dependencies = knipReport.dependencies;
    analysis.summary.unusedDependencies = knipReport.dependencies.length;
  }
  
  if (knipReport.exports) {
    analysis.unused.exports = knipReport.exports;
    analysis.summary.unusedExports = knipReport.exports.length;
  }
  
  // Analizar depcheck
  if (depcheckReport.unused) {
    const unusedDeps = Object.keys(depcheckReport.unused);
    analysis.unused.dependencies = [...analysis.unused.dependencies, ...unusedDeps];
    analysis.summary.unusedDependencies += unusedDeps.length;
  }
  
  if (depcheckReport.missing) {
    const missingDeps = Object.keys(depcheckReport.missing);
    analysis.unused.missing = missingDeps;
    analysis.summary.missingDependencies = missingDeps.length;
  }
  
  // Analizar ts-prune
  if (tsPruneReport.unused) {
    analysis.unused.exports = [...analysis.unused.exports, ...tsPruneReport.unused];
    analysis.summary.unusedExports += tsPruneReport.unused.length;
  }
  
  // Generar recomendaciones
  if (analysis.summary.unusedFiles > 0) {
    analysis.recommendations.push({
      type: 'files',
      priority: 'high',
      action: 'Eliminar archivos no utilizados',
      count: analysis.summary.unusedFiles
    });
  }
  
  if (analysis.summary.unusedDependencies > 0) {
    analysis.recommendations.push({
      type: 'dependencies',
      priority: 'medium',
      action: 'Limpiar dependencias no utilizadas',
      count: analysis.summary.unusedDependencies
    });
  }
  
  if (analysis.summary.unusedExports > 0) {
    analysis.recommendations.push({
      type: 'exports',
      priority: 'low',
      action: 'Revisar exports no utilizados',
      count: analysis.summary.unusedExports
    });
  }
  
  if (analysis.summary.missingDependencies > 0) {
    analysis.recommendations.push({
      type: 'missing',
      priority: 'high',
      action: 'Instalar dependencias faltantes',
      count: analysis.summary.missingDependencies
    });
  }
  
  return analysis;
}

function generateReport(analysis) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: analysis.summary,
    unused: analysis.unused,
    recommendations: analysis.recommendations,
    safeToRemove: {
      files: analysis.unused.files.filter(f => 
        !f.includes('test') && 
        !f.includes('spec') && 
        !f.includes('mock') &&
        !f.includes('example')
      ),
      dependencies: analysis.unused.dependencies.filter(d => 
        !d.includes('@types/') && 
        !d.includes('eslint') &&
        !d.includes('prettier')
      )
    }
  };
  
  return report;
}

// Ejecutar análisis
const analysis = analyzeUnused();
const report = generateReport(analysis);

// Guardar reporte
writeFileSync('reports/unused.json', JSON.stringify(report, null, 2));

// Mostrar resumen
console.log('\n📊 ANÁLISIS DE CÓDIGO MUERTO');
console.log('=============================');
console.log(`📁 Archivos no utilizados: ${report.summary.unusedFiles}`);
console.log(`📦 Dependencias no utilizadas: ${report.summary.unusedDependencies}`);
console.log(`📤 Exports no utilizados: ${report.summary.unusedExports}`);
console.log(`❌ Dependencias faltantes: ${report.summary.missingDependencies}`);

if (report.recommendations.length > 0) {
  console.log('\n🎯 RECOMENDACIONES:');
  report.recommendations.forEach((rec, i) => {
    const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
    console.log(`${i + 1}. ${priority} ${rec.action} (${rec.count} items)`);
  });
}

if (report.safeToRemove.files.length > 0) {
  console.log('\n✅ ARCHIVOS SEGUROS PARA ELIMINAR:');
  report.safeToRemove.files.slice(0, 10).forEach(file => {
    console.log(`   - ${file}`);
  });
  if (report.safeToRemove.files.length > 10) {
    console.log(`   ... y ${report.safeToRemove.files.length - 10} más`);
  }
}

if (report.safeToRemove.dependencies.length > 0) {
  console.log('\n✅ DEPENDENCIAS SEGURAS PARA ELIMINAR:');
  report.safeToRemove.dependencies.slice(0, 10).forEach(dep => {
    console.log(`   - ${dep}`);
  });
  if (report.safeToRemove.dependencies.length > 10) {
    console.log(`   ... y ${report.safeToRemove.dependencies.length - 10} más`);
  }
}

console.log(`\n💾 Reporte guardado en: reports/unused.json`);
