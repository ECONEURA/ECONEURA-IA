#!/usr/bin/env node
/**
 * Script para verificar que no hay diferencias en OpenAPI
 * Debe retornar 0 diferencias para pasar CI
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

function checkOpenAPIDiff() {
  console.log('🔍 Verificando diferencias en OpenAPI...');
  
  const result = {
    timestamp: new Date().toISOString(),
    differences: 0,
    files: [],
    status: 'PASS'
  };
  
  try {
    // Buscar archivos OpenAPI
    const openApiFiles = [
      'contracts/cockpit.openapi.json',
      'apps/api/openapi.json',
      'apps/web/openapi.json'
    ];
    
    const existingFiles = openApiFiles.filter(file => existsSync(file));
    
    if (existingFiles.length === 0) {
      console.log('⚠️  No se encontraron archivos OpenAPI');
      result.status = 'WARN';
      result.differences = 0;
    } else {
      // Verificar consistencia entre archivos
      for (let i = 0; i < existingFiles.length; i++) {
        for (let j = i + 1; j < existingFiles.length; j++) {
          const file1 = existingFiles[i];
          const file2 = existingFiles[j];
          
          try {
            const content1 = JSON.parse(readFileSync(file1, 'utf8'));
            const content2 = JSON.parse(readFileSync(file2, 'utf8'));
            
            // Comparación simple de estructura
            const paths1 = Object.keys(content1.paths || {});
            const paths2 = Object.keys(content2.paths || {});
            
            if (paths1.length !== paths2.length) {
              result.differences++;
              result.files.push({
                file1,
                file2,
                issue: `Diferente número de paths: ${paths1.length} vs ${paths2.length}`
              });
            }
            
            // Verificar paths comunes
            const commonPaths = paths1.filter(p => paths2.includes(p));
            for (const path of commonPaths) {
              const method1 = Object.keys(content1.paths[path] || {});
              const method2 = Object.keys(content2.paths[path] || {});
              
              if (method1.length !== method2.length) {
                result.differences++;
                result.files.push({
                  file1,
                  file2,
                  issue: `Path ${path} tiene diferentes métodos: ${method1.length} vs ${method2.length}`
                });
              }
            }
            
          } catch (error) {
            console.warn(`⚠️  Error comparando ${file1} con ${file2}: ${error.message}`);
          }
        }
      }
    }
    
    // Verificar rutas públicas /v1/*
    const v1Routes = [
      '/v1/health',
      '/v1/agents',
      '/v1/chat',
      '/v1/budget',
      '/v1/metrics'
    ];
    
    for (const file of existingFiles) {
      try {
        const content = JSON.parse(readFileSync(file, 'utf8'));
        const paths = Object.keys(content.paths || {});
        
        for (const route of v1Routes) {
          if (!paths.includes(route)) {
            result.differences++;
            result.files.push({
              file,
              issue: `Ruta pública ${route} no encontrada`
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error verificando rutas en ${file}: ${error.message}`);
      }
    }
    
    if (result.differences > 0) {
      result.status = 'FAIL';
    }
    
  } catch (error) {
    console.error('❌ Error verificando OpenAPI:', error.message);
    result.status = 'ERROR';
    result.differences = 1;
  }
  
  return result;
}

// Ejecutar verificación
const result = checkOpenAPIDiff();

// Guardar resultado
writeFileSync('reports/openapi-diff.json', JSON.stringify(result, null, 2));

// Mostrar resultado
console.log('\n📊 RESULTADO VERIFICACIÓN OPENAPI');
console.log('==================================');
console.log(`📁 Archivos verificados: ${result.files.length}`);
console.log(`🔍 Diferencias encontradas: ${result.differences}`);
console.log(`📊 Estado: ${result.status}`);

if (result.differences > 0) {
  console.log('\n❌ PROBLEMAS ENCONTRADOS:');
  result.files.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.issue}`);
    if (issue.file1 && issue.file2) {
      console.log(`   ${issue.file1} vs ${issue.file2}`);
    } else if (issue.file) {
      console.log(`   ${issue.file}`);
    }
  });
  
  console.log('\n💡 ACCIONES REQUERIDAS:');
  console.log('1. Sincronizar archivos OpenAPI');
  console.log('2. Verificar rutas públicas /v1/*');
  console.log('3. Actualizar documentación API');
  
  process.exit(1);
} else {
  console.log('\n✅ VERIFICACIÓN EXITOSA');
  console.log('No se encontraron diferencias en OpenAPI');
  process.exit(0);
}
