#!/usr/bin/env node

/**
 * Update Imports Script
 * PR-90: De-duplicación segura (git mv + codemod)
 * 
 * Reescribe imports/exports según RENAME_MAP.csv
 * Actualiza barrels (index.ts) y respeta tsconfig.paths
 * Falla si tsc --noEmit rompe
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

function loadRenameMap() {
  try {
    const csvPath = join(projectRoot, 'docs', 'RENAME_MAP.csv');
    const csvContent = readFileSync(csvPath, 'utf8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    return records;
  } catch (error) {
    console.error(`❌ Error cargando RENAME_MAP.csv: ${error.message}`);
    throw error;
  }
}

function findFilesToUpdate() {
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const files = [];
  
  function scanDirectory(dir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, dist, build, etc.
          if (!['node_modules', 'dist', 'build', '.next', '.git', 'coverage'].includes(entry.name)) {
            scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = entry.name.substring(entry.name.lastIndexOf('.'));
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  // Scan main directories
  const mainDirs = ['apps', 'packages', 'econeura-cockpit'];
  for (const dir of mainDirs) {
    const fullDir = join(projectRoot, dir);
    if (existsSync(fullDir)) {
      scanDirectory(fullDir);
    }
  }
  
  return files;
}

function updateImportsInFile(filePath, renameMap) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    // Create mapping from old to new paths
    const pathMap = new Map();
    for (const record of renameMap) {
      // Remove .ts extension for imports
      const fromPath = record.from.replace(/\.ts$/, '');
      const toPath = record.to.replace(/\.ts$/, '');
      pathMap.set(fromPath, toPath);
    }
    
    // Update import statements
    for (const [fromPath, toPath] of pathMap) {
      // Match various import patterns
      const patterns = [
        // Relative imports
        new RegExp(`from ['"]\\.\\.?/.*${fromPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
        // Absolute imports from packages
        new RegExp(`from ['"]@econeura/.*${fromPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
        // Direct file imports
        new RegExp(`from ['"]${fromPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')
      ];
      
      for (const pattern of patterns) {
        const matches = updatedContent.match(pattern);
        if (matches) {
          for (const match of matches) {
            const newImport = match.replace(fromPath, toPath);
            updatedContent = updatedContent.replace(match, newImport);
            hasChanges = true;
          }
        }
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated imports in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function updateBarrelFiles(renameMap) {
  const barrelFiles = [
    'packages/shared/src/index.ts',
    'packages/shared/schemas/index.ts',
    'packages/shared/utils/index.ts',
    'packages/shared/middleware/index.ts',
    'apps/api/src/lib/index.ts',
    'apps/web/src/lib/index.ts'
  ];
  
  for (const barrelFile of barrelFiles) {
    const fullPath = join(projectRoot, barrelFile);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf8');
        let updatedContent = content;
        let hasChanges = false;
        
        // Update export statements
        for (const record of renameMap) {
          const fromPath = record.from.replace(/\.ts$/, '');
          const toPath = record.to.replace(/\.ts$/, '');
          
          const patterns = [
            new RegExp(`from ['"]\\.\\.?/.*${fromPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
            new RegExp(`from ['"]${fromPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')
          ];
          
          for (const pattern of patterns) {
            const matches = updatedContent.match(pattern);
            if (matches) {
              for (const match of matches) {
                const newExport = match.replace(fromPath, toPath);
                updatedContent = updatedContent.replace(match, newExport);
                hasChanges = true;
              }
            }
          }
        }
        
        if (hasChanges) {
          writeFileSync(fullPath, updatedContent);
          console.log(`✅ Updated barrel file: ${barrelFile}`);
        }
      } catch (error) {
        console.error(`❌ Error updating barrel ${barrelFile}: ${error.message}`);
      }
    }
  }
}

async function main() {
  try {
    console.log(`🔄 Iniciando actualización de imports...`);
    
    // Load rename map
    const renameMap = loadRenameMap();
    console.log(`📊 Mapeo de renombrado cargado: ${renameMap.length} entradas`);
    
    // Find files to update
    const files = findFilesToUpdate();
    console.log(`📁 Archivos encontrados: ${files.length}`);
    
    // Update imports in files
    let updatedFiles = 0;
    for (const file of files) {
      if (updateImportsInFile(file, renameMap)) {
        updatedFiles++;
      }
    }
    
    // Update barrel files
    updateBarrelFiles(renameMap);
    
    console.log(`✅ Archivos actualizados: ${updatedFiles}`);
    console.log(`📊 Total procesados: ${files.length}`);
    
    // Verify TypeScript compilation
    console.log(`🔍 Verificando compilación TypeScript...`);
    
    try {
      execSync('pnpm -w typecheck', { 
        cwd: projectRoot, 
        stdio: 'pipe' 
      });
      console.log(`✅ Compilación TypeScript exitosa`);
    } catch (error) {
      console.error(`❌ Error en compilación TypeScript: ${error.message}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error en actualización de imports: ${error.message}`);
    process.exit(1);
  }
}

main();