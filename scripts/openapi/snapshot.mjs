#!/usr/bin/env node

/**
 * OpenAPI Runtime Snapshot
 * PR-87: Snapshot runtime + Diff filtrado /v1
 * 
 * Intenta GET http://localhost:3001/v1/openapi.json
 * Si no existe, importa el builder y genera JSON
 * Escribe snapshots/openapi.runtime.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

async function fetchRuntimeOpenAPI() {
  const runtimeUrl = 'http://localhost:3001/v1/openapi.json';
  
  try {
    console.log(`🔍 Intentando obtener OpenAPI desde runtime: ${runtimeUrl}`);
    
    const response = await fetch(runtimeUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const runtimeSpec = await response.json();
    console.log(`✅ OpenAPI obtenido desde runtime (${Object.keys(runtimeSpec.paths || {}).length} paths)`);
    
    return runtimeSpec;
    
  } catch (error) {
    console.log(`⚠️  No se pudo obtener desde runtime: ${error.message}`);
    return null;
  }
}

async function generateFromBuilder() {
  try {
    console.log(`🔧 Generando OpenAPI desde builder...`);
    
    // Intentar importar el builder de OpenAPI
    const builderPath = join(projectRoot, 'apps', 'api', 'src', 'lib', 'openapi-builder.js');
    
    try {
      const { generateOpenAPISpec } = await import(builderPath);
      const spec = await generateOpenAPISpec();
      console.log(`✅ OpenAPI generado desde builder (${Object.keys(spec.paths || {}).length} paths)`);
      return spec;
    } catch (importError) {
      console.log(`⚠️  Builder no encontrado: ${importError.message}`);
    }
    
    // Fallback: usar el archivo estático existente
    const staticPath = join(projectRoot, 'apps', 'api', 'openapi.json');
    const staticSpec = JSON.parse(readFileSync(staticPath, 'utf8'));
    console.log(`✅ Usando OpenAPI estático (${Object.keys(staticSpec.paths || {}).length} paths)`);
    
    return staticSpec;
    
  } catch (error) {
    console.error(`❌ Error generando OpenAPI: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    console.log(`📸 Iniciando snapshot de OpenAPI runtime...`);
    
    // Intentar obtener desde runtime
    let runtimeSpec = await fetchRuntimeOpenAPI();
    
    // Si falla, generar desde builder o usar estático
    if (!runtimeSpec) {
      runtimeSpec = await generateFromBuilder();
    }
    
    // Filtrar solo rutas /v1/*
    const filteredSpec = {
      ...runtimeSpec,
      paths: Object.fromEntries(
        Object.entries(runtimeSpec.paths || {}).filter(([path]) => 
          path.startsWith('/v1/') || path.startsWith('/api/v1/')
        )
      )
    };
    
    const v1Paths = Object.keys(filteredSpec.paths || {});
    console.log(`📊 Rutas /v1/* encontradas: ${v1Paths.length}`);
    v1Paths.forEach(path => console.log(`  - ${path}`));
    
    // Escribir snapshot
    const snapshotPath = join(projectRoot, 'snapshots', 'openapi.runtime.json');
    writeFileSync(snapshotPath, JSON.stringify(filteredSpec, null, 2));
    
    console.log(`✅ Snapshot guardado: ${snapshotPath}`);
    console.log(`📊 Total paths: ${v1Paths.length}`);
    
  } catch (error) {
    console.error(`❌ Error en snapshot: ${error.message}`);
    process.exit(1);
  }
}

main();
