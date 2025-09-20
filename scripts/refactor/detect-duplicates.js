#!/usr/bin/env node
/**
 * Script para detectar código duplicado de forma eficiente
 * Enfoque: solo código fuente, sin node_modules
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

function findSourceFiles() {
  try {
    const cmd = `find apps/ packages/ -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | grep -v dist | grep -v build | grep -v coverage`;
    const files = execSync(cmd, { encoding: 'utf8' }).trim().split('\n');
    return files.filter(f => f.length > 0);
  } catch (error) {
    console.error('Error finding source files:', error.message);
    return [];
  }
}

function getFileContent(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function normalizeCode(content) {
  // Normalizar código para comparación
  return content
    .replace(/\s+/g, ' ') // Normalizar espacios
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios de bloque
    .replace(/\/\/.*$/gm, '') // Remover comentarios de línea
    .replace(/['"]/g, '"') // Normalizar comillas
    .trim();
}

function findDuplicates(files) {
  const duplicates = [];
  const contentMap = new Map();
  
  console.log(`🔍 Analizando ${files.length} archivos...`);
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = getFileContent(file);
    
    if (content.length < 100) continue; // Ignorar archivos muy pequeños
    
    const normalized = normalizeCode(content);
    const hash = normalized.substring(0, 200); // Usar primeros 200 chars como hash
    
    if (contentMap.has(hash)) {
      const existing = contentMap.get(hash);
      duplicates.push({
        type: 'duplicate',
        files: [existing.file, file],
        similarity: calculateSimilarity(existing.content, content),
        lines: Math.min(existing.content.split('\n').length, content.split('\n').length)
      });
    } else {
      contentMap.set(hash, { file, content });
    }
    
    if (i % 50 === 0) {
      console.log(`   Procesados ${i}/${files.length} archivos...`);
    }
  }
  
  return duplicates;
}

function calculateSimilarity(content1, content2) {
  const lines1 = content1.split('\n');
  const lines2 = content2.split('\n');
  const maxLines = Math.max(lines1.length, lines2.length);
  const minLines = Math.min(lines1.length, lines2.length);
  
  if (maxLines === 0) return 0;
  return Math.round((minLines / maxLines) * 100);
}

function generateReport(duplicates) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: 0,
      duplicates: duplicates.length,
      totalLines: duplicates.reduce((sum, dup) => sum + dup.lines, 0)
    },
    duplicates: duplicates.map(dup => ({
      type: dup.type,
      files: dup.files,
      similarity: dup.similarity,
      lines: dup.lines,
      recommendation: dup.similarity > 90 ? 'CONSOLIDATE' : 'REVIEW'
    }))
  };
  
  return report;
}

// Ejecutar análisis
console.log('🚀 Iniciando análisis de duplicados...');

const sourceFiles = findSourceFiles();
console.log(`📁 Encontrados ${sourceFiles.length} archivos fuente`);

const duplicates = findDuplicates(sourceFiles);
console.log(`🔍 Encontrados ${duplicates.length} duplicados`);

const report = generateReport(duplicates);
report.summary.totalFiles = sourceFiles.length;

// Guardar reporte
writeFileSync('reports/jscpd.json', JSON.stringify(report, null, 2));

// Mostrar resumen
console.log('\n📊 RESUMEN DE DUPLICADOS');
console.log('========================');
console.log(`📁 Archivos analizados: ${report.summary.totalFiles}`);
console.log(`🔄 Duplicados encontrados: ${report.summary.duplicates}`);
console.log(`📝 Líneas duplicadas: ${report.summary.totalLines}`);

if (duplicates.length > 0) {
  console.log('\n🔍 TOP DUPLICADOS:');
  duplicates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .forEach((dup, i) => {
      console.log(`${i + 1}. ${dup.similarity}% similar (${dup.lines} líneas)`);
      console.log(`   ${dup.files[0]}`);
      console.log(`   ${dup.files[1]}`);
    });
}

console.log(`\n💾 Reporte guardado en: reports/jscpd.json`);
