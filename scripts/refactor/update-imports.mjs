#!/usr/bin/env node
/**
 * Script para actualizar imports después de consolidación
 * Lee RENAME_MAP.csv y actualiza todos los imports
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { parse } from 'csv-parse/sync';

// Mapeo de renombrado
const renameMap = new Map();

function loadRenameMap() {
  try {
    const csvContent = readFileSync('docs/RENAME_MAP.csv', 'utf8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });
    
    for (const record of records) {
      if (record.action === 'move') {
        renameMap.set(record.old_path, record.new_path);
      } else if (record.action === 'delete') {
        renameMap.set(record.old_path, null); // null = eliminar
      }
    }
    
    console.log(`📋 Cargado mapeo de ${renameMap.size} archivos`);
  } catch (error) {
    console.error('Error cargando RENAME_MAP.csv:', error.message);
  }
}

function findSourceFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Saltar directorios que no nos interesan
        if (!['node_modules', '.git', '.next', 'dist', 'build', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function updateImportsInFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let updated = false;
    let newContent = content;
    
    // Buscar imports que necesiten actualización
    for (const [oldPath, newPath] of renameMap) {
      if (newPath === null) continue; // Saltar archivos eliminados
      
      // Patrones de import a buscar
      const patterns = [
        new RegExp(`from ['"]${oldPath.replace(/\.ts$/, '')}['"]`, 'g'),
        new RegExp(`from ['"]${oldPath.replace(/\.ts$/, '.js')}['"]`, 'g'),
        new RegExp(`import ['"]${oldPath.replace(/\.ts$/, '')}['"]`, 'g'),
        new RegExp(`import ['"]${oldPath.replace(/\.ts$/, '.js')}['"]`, 'g')
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(newContent)) {
          // Calcular ruta relativa
          const relativePath = relative(dirname(filePath), newPath.replace(/\.ts$/, ''));
          const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
          
          newContent = newContent.replace(pattern, (match) => {
            return match.replace(oldPath.replace(/\.ts$/, ''), importPath);
          });
          updated = true;
        }
      }
    }
    
    if (updated) {
      writeFileSync(filePath, newContent);
      console.log(`✅ Actualizado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error actualizando ${filePath}:`, error.message);
    return false;
  }
}

function updateImports() {
  console.log('🚀 Iniciando actualización de imports...');
  
  loadRenameMap();
  
  const sourceFiles = [
    ...findSourceFiles('apps'),
    ...findSourceFiles('packages'),
    ...findSourceFiles('tests')
  ];
  
  console.log(`📁 Encontrados ${sourceFiles.length} archivos fuente`);
  
  let updatedCount = 0;
  
  for (const file of sourceFiles) {
    if (updateImportsInFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n📊 RESUMEN DE ACTUALIZACIÓN`);
  console.log('========================');
  console.log(`📁 Archivos procesados: ${sourceFiles.length}`);
  console.log(`✅ Archivos actualizados: ${updatedCount}`);
  console.log(`📋 Mapeos aplicados: ${renameMap.size}`);
  
  if (updatedCount > 0) {
    console.log('\n💡 Próximos pasos:');
    console.log('1. Verificar que los imports sean correctos');
    console.log('2. Ejecutar tests para verificar funcionalidad');
    console.log('3. Hacer commit de los cambios');
  }
}

// Ejecutar actualización
updateImports();
