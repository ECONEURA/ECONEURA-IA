#!/usr/bin/env node

/**
 * ESLint Quality Verification Script
 * Generates comprehensive quality metrics for ECONEURA-IA project
 */

/* eslint-disable no-console, no-undef, @typescript-eslint/no-var-requires */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verificando estado de ESLint en ECONEURA-IA...\n');

// Ejecutar ESLint con formato JSON para análisis detallado
try {
  const eslintOutput = execSync('pnpm eslint --format json --max-warnings 0', {
    encoding: 'utf8',
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  const results = JSON.parse(eslintOutput);

  // Análisis de resultados
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalFiles = 0;
  const errorTypes = {};
  const fileErrors = {};

  results.forEach(result => {
    if (result.messages && result.messages.length > 0) {
      totalFiles++;
      fileErrors[result.filePath] = {
        errors: 0,
        warnings: 0,
        messages: []
      };

      result.messages.forEach(message => {
        if (message.severity === 2) { // Error
          totalErrors++;
          fileErrors[result.filePath].errors++;
          errorTypes[message.ruleId] = (errorTypes[message.ruleId] || 0) + 1;
        } else if (message.severity === 1) { // Warning
          totalWarnings++;
          fileErrors[result.filePath].warnings++;
        }
        fileErrors[result.filePath].messages.push({
          rule: message.ruleId,
          severity: message.severity,
          message: message.message,
          line: message.line,
          column: message.column
        });
      });
    }
  });

  // Calcular score de calidad
  const totalIssues = totalErrors + totalWarnings;
  const qualityScore = Math.max(0, 100 - (totalIssues * 0.1));

  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: totalFiles,
      totalErrors: totalErrors,
      totalWarnings: totalWarnings,
      totalIssues: totalIssues,
      qualityScore: Math.round(qualityScore * 100) / 100,
      phase7Ready: totalErrors === 0 && qualityScore >= 85
    },
    errorBreakdown: errorTypes,
    filesWithIssues: Object.keys(fileErrors).length,
    topErrorTypes: Object.entries(errorTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([rule, count]) => ({ rule, count }))
  };

  // Guardar reporte
  const reportsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'eslint-quality-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Mostrar resultados
  console.log('📊 REPORTE DE CALIDAD ESLINT');
  console.log('='.repeat(50));
  console.log(`📁 Archivos analizados: ${totalFiles}`);
  console.log(`❌ Errores totales: ${totalErrors}`);
  console.log(`⚠️  Advertencias totales: ${totalWarnings}`);
  console.log(`🔢 Total de problemas: ${totalIssues}`);
  console.log(`📈 Score de calidad: ${report.summary.qualityScore}%`);
  console.log(`🎯 Listo para Phase 7: ${report.summary.phase7Ready ? '✅ SÍ' : '❌ NO'}`);

  if (report.topErrorTypes.length > 0) {
    console.log('\n🔍 Top 10 tipos de errores:');
    report.topErrorTypes.forEach(({ rule, count }, index) => {
      console.log(`  ${index + 1}. ${rule}: ${count} ocurrencias`);
    });
  }

  console.log('\n📄 Reporte completo guardado en: artifacts/eslint-quality-report.json');

  // Exit code basado en si está listo para Phase 7
  process.exit(report.summary.phase7Ready ? 0 : 1);

} catch (error) {
  console.error('❌ Error ejecutando ESLint:', error.message);

  // Si ESLint falló completamente, intentar ejecutar sin formato JSON
  try {
    console.log('\n🔄 Intentando ejecución básica de ESLint...');
    const basicOutput = execSync('pnpm eslint --max-warnings 0 2>&1', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    console.log('Resultado básico:');
    console.log(basicOutput);
  } catch (basicError) {
    console.error('❌ ESLint falló completamente:', basicError.message);
  }

  process.exit(1);
}