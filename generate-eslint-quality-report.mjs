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
  // Primero intentar con JSON pero con límite de archivos
  let eslintOutput;
  try {
    eslintOutput = execSync('pnpm eslint apps/ --format json --max-warnings 0 --max-errors 1000', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 20 // 20MB buffer
    });
  } catch {
    // Si falla JSON, intentar obtener estadísticas básicas
    console.log('📊 Intentando análisis básico de ESLint...');
    const basicOutput = execSync('pnpm eslint apps/ --max-warnings 0 2>&1', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 5 // 5MB buffer
    });

    // Obtener las últimas líneas usando PowerShell
    const lines = basicOutput.trim().split('\n');
    const lastLines = lines.slice(-5); // Últimas 5 líneas

    // Buscar la línea con estadísticas
    const statsLine = lastLines.find(line => line.includes('problems') && line.includes('errors'));

    if (statsLine) {
      // Buscar patrón como "✖ 8889 problems (6610 errors, 2279 warnings)"
      const match = statsLine.match(/✖\s+(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/);

      if (match) {
        const totalIssues = parseInt(match[1]);
        const totalErrors = parseInt(match[2]);
        const totalWarnings = parseInt(match[3]);

        // Crear reporte básico
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            totalFiles: 0, // No podemos determinar con esta aproximación
            totalErrors: totalErrors,
            totalWarnings: totalWarnings,
            totalIssues: totalIssues,
            qualityScore: Math.max(0, 100 - (totalIssues * 0.01)), // Aproximación
            phase7Ready: totalErrors === 0
          },
          errorBreakdown: {},
          filesWithIssues: 0,
          topErrorTypes: [],
          note: "Análisis básico - estadísticas aproximadas debido al gran volumen de errores"
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
        console.log('📊 REPORTE DE CALIDAD ESLINT (BÁSICO)');
        console.log('='.repeat(50));
        console.log(`❌ Errores totales: ${totalErrors}`);
        console.log(`⚠️  Advertencias totales: ${totalWarnings}`);
        console.log(`🔢 Total de problemas: ${totalIssues}`);
        console.log(`📈 Score de calidad aproximado: ${report.summary.qualityScore.toFixed(2)}%`);
        console.log(`🎯 Listo para Phase 7: ${report.summary.phase7Ready ? '✅ SÍ' : '❌ NO'}`);

        console.log('\n📄 Reporte básico guardado en: artifacts/eslint-quality-report.json');
        console.log('💡 Nota: Para análisis completo, considere arreglar errores primero para reducir el volumen.');

        process.exit(report.summary.phase7Ready ? 0 : 1);
      } else {
        throw new Error('No se pudieron parsear las estadísticas de ESLint');
      }
    } else {
      throw new Error('No se encontraron estadísticas en la salida de ESLint');
    }
  }

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

} catch (jsonError) {
  console.log('⚠️  JSON parsing falló, intentando análisis básico de ESLint...');
  console.log('Detalle del error:', jsonError.message);

    // Ejecutar ESLint sin formato JSON para obtener estadísticas básicas
    let basicOutput = '';
    try {
      basicOutput = execSync('pnpm eslint apps/', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe',
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer
      });
    } catch (eslintError) {
      // Capturar la salida incluso si ESLint falla
      basicOutput = eslintError.stdout || eslintError.stderr || '';
      if (!basicOutput && eslintError.message) {
        // Si no hay stdout/stderr, intentar extraer de message
        const match = eslintError.message.match(/Command failed: (.+)/);
        if (match) {
          basicOutput = match[1];
        }
      }
    }

    // Procesar la salida capturada
    // Obtener las últimas líneas de la salida
    const lines = basicOutput.split('\n');
    const lastLines = lines.slice(-10); // Últimas 10 líneas

    // Buscar la línea con estadísticas
    const statsLine = lastLines.find(line => line.includes('problems') && line.includes('errors'));

    if (statsLine) {
      // Buscar patrón como "✖ 8889 problems (6610 errors, 2279 warnings)"
      const match = statsLine.match(/✖\s+(\d+)\s+problems?\s+\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/);

      if (match) {
        const totalIssues = parseInt(match[1]);
        const totalErrors = parseInt(match[2]);
        const totalWarnings = parseInt(match[3]);

        // Crear reporte básico
        const report = {
          timestamp: new Date().toISOString(),
          summary: {
            totalFiles: 0, // No podemos determinar con esta aproximación
            totalErrors: totalErrors,
            totalWarnings: totalWarnings,
            totalIssues: totalIssues,
            qualityScore: Math.max(0, 100 - (totalIssues * 0.01)), // Aproximación
            phase7Ready: totalErrors === 0
          },
          errorBreakdown: {},
          filesWithIssues: 0,
          topErrorTypes: [],
          note: "Análisis básico - estadísticas aproximadas debido al gran volumen de errores"
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
        console.log('📊 REPORTE DE CALIDAD ESLINT (BÁSICO)');
        console.log('='.repeat(50));
        console.log(`❌ Errores totales: ${totalErrors}`);
        console.log(`⚠️  Advertencias totales: ${totalWarnings}`);
        console.log(`🔢 Total de problemas: ${totalIssues}`);
        console.log(`📈 Score de calidad aproximado: ${report.summary.qualityScore.toFixed(2)}%`);
        console.log(`🎯 Listo para Phase 7: ${report.summary.phase7Ready ? '✅ SÍ' : '❌ NO'}`);

        console.log('\n📄 Reporte básico guardado en: artifacts/eslint-quality-report.json');
        console.log('💡 Nota: Para análisis completo, considere arreglar errores primero para reducir el volumen.');

        process.exit(report.summary.phase7Ready ? 0 : 1);
      } else {
        console.log('No se pudieron parsear las estadísticas. Salida completa:');
        console.log(basicOutput);
        throw new Error('No se pudieron parsear las estadísticas de ESLint');
      }
    } else {
      console.log('No se encontraron estadísticas. Salida completa:');
      console.log(basicOutput);
      throw new Error('No se encontraron estadísticas en la salida de ESLint');
    }
}