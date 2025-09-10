#!/usr/bin/env node

/**
 * OpenAPI Diff - Solo /v1/*
 * PR-87: Snapshot runtime + Diff filtrado /v1
 * 
 * Compara openapi.yaml vs snapshots/openapi.runtime.json SOLO en /v1/*
 * Emite reports/openapi-diff.json
 * process.exit(1) si hay diferencias
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

function loadYAMLSpec() {
  try {
    const yamlPath = join(projectRoot, 'apps', 'api', 'openapi', 'openapi.yaml');
    const yamlContent = readFileSync(yamlPath, 'utf8');
    const spec = yaml.load(yamlContent);
    
    // Filtrar solo rutas /v1/*
    const filteredSpec = {
      ...spec,
      paths: Object.fromEntries(
        Object.entries(spec.paths || {}).filter(([path]) => 
          path.startsWith('/v1/') || path.startsWith('/api/v1/')
        )
      )
    };
    
    return filteredSpec;
  } catch (error) {
    console.error(`❌ Error cargando YAML: ${error.message}`);
    throw error;
  }
}

function loadRuntimeSpec() {
  try {
    const runtimePath = join(projectRoot, 'snapshots', 'openapi.runtime.json');
    const runtimeContent = readFileSync(runtimePath, 'utf8');
    return JSON.parse(runtimeContent);
  } catch (error) {
    console.error(`❌ Error cargando runtime: ${error.message}`);
    throw error;
  }
}

function normalizePath(path) {
  // Normalizar rutas para comparación
  return path.replace('/api/v1/', '/v1/');
}

function comparePaths(specPaths, runtimePaths) {
  const differences = [];
  
  // Obtener rutas normalizadas
  const specPathsNormalized = Object.keys(specPaths || {}).map(normalizePath);
  const runtimePathsNormalized = Object.keys(runtimePaths || {}).map(normalizePath);
  
  // Rutas en spec pero no en runtime
  for (const path of specPathsNormalized) {
    if (!runtimePathsNormalized.includes(path)) {
      differences.push({
        type: 'missing_in_runtime',
        path,
        message: `Ruta ${path} definida en spec pero no encontrada en runtime`
      });
    }
  }
  
  // Rutas en runtime pero no en spec
  for (const path of runtimePathsNormalized) {
    if (!specPathsNormalized.includes(path)) {
      differences.push({
        type: 'missing_in_spec',
        path,
        message: `Ruta ${path} encontrada en runtime pero no definida en spec`
      });
    }
  }
  
  // Comparar métodos para rutas comunes
  for (const path of specPathsNormalized) {
    if (runtimePathsNormalized.includes(path)) {
      const specPath = specPaths[path] || specPaths[`/api${path}`];
      const runtimePath = runtimePaths[path] || runtimePaths[`/api${path}`];
      
      if (specPath && runtimePath) {
        const specMethods = Object.keys(specPath);
        const runtimeMethods = Object.keys(runtimePath);
        
        // Métodos en spec pero no en runtime
        for (const method of specMethods) {
          if (!runtimeMethods.includes(method)) {
            differences.push({
              type: 'missing_method_in_runtime',
              path,
              method,
              message: `Método ${method.toUpperCase()} definido en spec pero no encontrado en runtime para ${path}`
            });
          }
        }
        
        // Métodos en runtime pero no en spec
        for (const method of runtimeMethods) {
          if (!specMethods.includes(method)) {
            differences.push({
              type: 'missing_method_in_spec',
              path,
              method,
              message: `Método ${method.toUpperCase()} encontrado en runtime pero no definido en spec para ${path}`
            });
          }
        }
      }
    }
  }
  
  return differences;
}

function compareSchemas(specSchemas, runtimeSchemas) {
  const differences = [];
  
  const specSchemaNames = Object.keys(specSchemas || {});
  const runtimeSchemaNames = Object.keys(runtimeSchemas || {});
  
  // Schemas en spec pero no en runtime
  for (const schemaName of specSchemaNames) {
    if (!runtimeSchemaNames.includes(schemaName)) {
      differences.push({
        type: 'missing_schema_in_runtime',
        schema: schemaName,
        message: `Schema ${schemaName} definido en spec pero no encontrado en runtime`
      });
    }
  }
  
  // Schemas en runtime pero no en spec
  for (const schemaName of runtimeSchemaNames) {
    if (!specSchemaNames.includes(schemaName)) {
      differences.push({
        type: 'missing_schema_in_spec',
        schema: schemaName,
        message: `Schema ${schemaName} encontrado en runtime pero no definido en spec`
      });
    }
  }
  
  return differences;
}

async function main() {
  try {
    console.log(`🔍 Comparando OpenAPI spec vs runtime (solo /v1/*)...`);
    
    // Cargar especificaciones
    const spec = loadYAMLSpec();
    const runtime = loadRuntimeSpec();
    
    console.log(`📊 Spec paths: ${Object.keys(spec.paths || {}).length}`);
    console.log(`📊 Runtime paths: ${Object.keys(runtime.paths || {}).length}`);
    
    // Comparar paths
    const pathDifferences = comparePaths(spec.paths, runtime.paths);
    
    // Comparar schemas
    const schemaDifferences = compareSchemas(spec.components?.schemas, runtime.components?.schemas);
    
    // Combinar diferencias
    const allDifferences = [...pathDifferences, ...schemaDifferences];
    
    // Generar reporte
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_differences: allDifferences.length,
        path_differences: pathDifferences.length,
        schema_differences: schemaDifferences.length
      },
      differences: allDifferences
    };
    
    // Escribir reporte
    const reportPath = join(projectRoot, 'reports', 'openapi-diff.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Diferencias encontradas: ${allDifferences.length}`);
    
    if (allDifferences.length > 0) {
      console.log(`❌ PROBLEMAS ENCONTRADOS:`);
      allDifferences.forEach((diff, index) => {
        console.log(`${index + 1}. ${diff.message}`);
      });
      
      console.log(`\n💡 ACCIONES REQUERIDAS:`);
      console.log(`1. Sincronizar archivos OpenAPI`);
      console.log(`2. Verificar rutas públicas /v1/*`);
      console.log(`3. Actualizar documentación API`);
      
      console.log(`\n📄 Reporte guardado: ${reportPath}`);
      process.exit(1);
    } else {
      console.log(`✅ No se encontraron diferencias en /v1/*`);
      console.log(`📄 Reporte guardado: ${reportPath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error en diff: ${error.message}`);
    process.exit(1);
  }
}

main();
