const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Función para encontrar archivos con errores de parsing
async function findFilesWithParsingErrors() {
  const patterns = [
    'apps/web/**/*.ts',
    'apps/web/**/*.tsx',
    'apps/web/**/*.js',
    'apps/web/**/*.jsx'
  ];

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern, { ignore: ['**/node_modules/**'] });
    files.push(...matches);
  }

  return files;
}

// Función para corregir archivos corruptos por scripts anteriores
function fixCorruptedFiles(content, filePath) {
  let fixed = content;
  let hasChanges = false;

  // 1. Corregir líneas corruptas con 'use client' malformadas
  const corruptedUseClientRegex = /^(\s*)'use client',',',?\s*$/gm;
  fixed = fixed.replace(corruptedUseClientRegex, (match, indent) => {
    hasChanges = true;
    return indent + "'use client';\n";
  });

  // 2. Corregir imports malformados
  const corruptedImportRegex = /^(\s*)import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]([^'"]*)['"]'',',;\s*$/gm;
  fixed = fixed.replace(corruptedImportRegex, (match, indent, imports, module) => {
    hasChanges = true;
    return indent + `import { ${imports.trim()} } from '${module}';\n`;
  });

  // 3. Corregir imports simples malformados
  const corruptedSimpleImportRegex = /^(\s*)import\s*([^'"]+?)\s*from\s*['"]([^'"]*)['"]',;\s*$/gm;
  fixed = fixed.replace(corruptedSimpleImportRegex, (match, indent, importName, module) => {
    hasChanges = true;
    return indent + `import ${importName.trim()} from '${module}';\n`;
  });

  // 4. Corregir líneas vacías corruptas
  const corruptedEmptyLinesRegex = /^(\s*)'',?\s*$/gm;
  fixed = fixed.replace(corruptedEmptyLinesRegex, (match, indent) => {
    hasChanges = true;
    return '';
  });

  // 5. Corregir exports malformados
  const corruptedExportRegex = /^(\s*)export\s+(const|function|class|interface|type)\s+([^=;{]+?)\s*=\s*([^;]+?),;\s*$/gm;
  fixed = fixed.replace(corruptedExportRegex, (match, indent, keyword, name, value) => {
    hasChanges = true;
    return indent + `export ${keyword} ${name.trim()} = ${value.trim()};\n`;
  });

  // 6. Corregir objetos malformados
  const corruptedObjectRegex = /^(\s*)\{\s*([^}]*?)\s*\},?\s*$/gm;
  fixed = fixed.replace(corruptedObjectRegex, (match, indent, content) => {
    if (content.includes(':')) {
      hasChanges = true;
      return indent + `{ ${content.trim()} },\n`;
    }
    return match;
  });

  // 7. Corregir arrays malformados
  const corruptedArrayRegex = /^(\s*)\[\s*([^\]]*?)\s*\],?\s*$/gm;
  fixed = fixed.replace(corruptedArrayRegex, (match, indent, content) => {
    if (content.trim()) {
      hasChanges = true;
      return indent + `[ ${content.trim()} ],\n`;
    }
    return match;
  });

  // 8. Corregir líneas con comas sueltas
  const corruptedCommasRegex = /^(\s*)([^,]+?),,?\s*$/gm;
  fixed = fixed.replace(corruptedCommasRegex, (match, indent, content) => {
    if (!content.includes('(') && !content.includes('{') && !content.includes('[')) {
      hasChanges = true;
      return indent + content.trim() + ',\n';
    }
    return match;
  });

  // 9. Corregir líneas con punto y coma mal colocado
  const corruptedSemicolonRegex = /^(\s*)([^;]+?);,?\s*$/gm;
  fixed = fixed.replace(corruptedSemicolonRegex, (match, indent, content) => {
    if (!content.includes('(') && !content.includes('{') && !content.includes('[')) {
      hasChanges = true;
      return indent + content.trim() + ';\n';
    }
    return match;
  });

  // 10. Limpiar líneas completamente vacías o con solo espacios
  fixed = fixed.replace(/^\s*$/gm, '');

  // 11. Corregir múltiples líneas vacías consecutivas
  fixed = fixed.replace(/\n{3,}/g, '\n\n');

  return { content: fixed.trim() + '\n', hasChanges };
}

// Función principal
async function main() {
  console.log('🔧 Corrigiendo archivos corruptos por scripts anteriores...');

  const files = await findFilesWithParsingErrors();
  console.log(`📁 Encontrados ${files.length} archivos para procesar`);

  let processedCount = 0;
  let fixedCount = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, hasChanges } = fixCorruptedFiles(content, filePath);

      if (hasChanges) {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`✅ Corregido: ${filePath}`);
        fixedCount++;
      }

      processedCount++;
      if (processedCount % 50 === 0) {
        console.log(`📊 Procesados ${processedCount}/${files.length} archivos...`);
      }
    } catch (error) {
      console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
  }

  console.log(`\n🎉 Proceso completado:`);
  console.log(`   📁 Archivos procesados: ${processedCount}`);
  console.log(`   ✅ Archivos corregidos: ${fixedCount}`);
  console.log(`   🔄 Tasa de corrección: ${((fixedCount / processedCount) * 100).toFixed(1)}%`);
}

main().catch(console.error);