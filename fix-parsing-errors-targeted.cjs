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

// Función para corregir errores de parsing específicos
function fixParsingErrors(content, filePath) {
  let fixed = content;
  let hasChanges = false;

  // 1. Corregir strings sin cerrar que empiezan con comillas simples o dobles
  const stringLiteralRegex = /^(\s*)(["'])((?:\\.|(?!\2)[^\\])*?)\2?$/gm;
  fixed = fixed.replace(stringLiteralRegex, (match, indent, quote, content) => {
    if (!content.endsWith(quote)) {
      hasChanges = true;
      return indent + quote + content + quote;
    }
    return match;
  });

  // 2. Corregir expresiones regulares sin cerrar
  const regexLiteralRegex = /^(\s*)\/((?:\\.|(?![\/*])[^\\/])*?)\/?$/gm;
  fixed = fixed.replace(regexLiteralRegex, (match, indent, content) => {
    if (!content.endsWith('/')) {
      hasChanges = true;
      return indent + '/' + content + '/';
    }
    return match;
  });

  // 3. Corregir líneas que terminan con operadores sin completar
  const incompleteOperatorsRegex = /^(\s*)([^\/\n]*?)([+\-*/=<>!&|]+)\s*$/gm;
  fixed = fixed.replace(incompleteOperatorsRegex, (match, indent, before, operator) => {
    // Solo agregar punto y coma si no hay nada después del operador
    if (!before.trim().endsWith(';') && !before.trim().endsWith(',')) {
      hasChanges = true;
      return indent + before.trim() + operator + ';';
    }
    return match;
  });

  // 4. Corregir declaraciones incompletas que empiezan con export/import
  const incompleteDeclarationsRegex = /^(\s*)(export|import|const|let|var|function|class|interface|type)\s+([^;{}=>\n]*?)\s*$/gm;
  fixed = fixed.replace(incompleteDeclarationsRegex, (match, indent, keyword, rest) => {
    if (!rest.includes('{') && !rest.includes('=') && !rest.includes('>') && !rest.trim().endsWith(';')) {
      hasChanges = true;
      return indent + keyword + ' ' + rest.trim() + ';';
    }
    return match;
  });

  // 5. Corregir llamadas a funciones incompletas
  const incompleteFunctionCallsRegex = /^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*([^)]*?)\s*$/gm;
  fixed = fixed.replace(incompleteFunctionCallsRegex, (match, indent, funcName, params) => {
    if (!params.includes(')')) {
      hasChanges = true;
      return indent + funcName + '(' + params + ');';
    }
    return match;
  });

  // 6. Corregir objetos incompletos
  const incompleteObjectsRegex = /^(\s*)\{\s*([^}]*?)\s*$/gm;
  fixed = fixed.replace(incompleteObjectsRegex, (match, indent, content) => {
    if (!content.includes('}')) {
      hasChanges = true;
      return indent + '{' + content + '}';
    }
    return match;
  });

  // 7. Corregir arrays incompletos
  const incompleteArraysRegex = /^(\s*)\[\s*([^\]]*?)\s*$/gm;
  fixed = fixed.replace(incompleteArraysRegex, (match, indent, content) => {
    if (!content.includes(']')) {
      hasChanges = true;
      return indent + '[' + content + ']';
    }
    return match;
  });

  // 8. Corregir JSX incompleto
  const incompleteJsxRegex = /^(\s*)<([a-zA-Z][a-zA-Z0-9]*)\s*([^>]*?)\s*$/gm;
  fixed = fixed.replace(incompleteJsxRegex, (match, indent, tagName, attrs) => {
    if (!attrs.includes('>') && !attrs.includes('/>')) {
      hasChanges = true;
      return indent + '<' + tagName + ' ' + attrs + ' />';
    }
    return match;
  });

  return { content: fixed, hasChanges };
}

// Función principal
async function main() {
  console.log('🔍 Buscando archivos con errores de parsing...');

  const files = await findFilesWithParsingErrors();
  console.log(`📁 Encontrados ${files.length} archivos para procesar`);

  let processedCount = 0;
  let fixedCount = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { content: fixedContent, hasChanges } = fixParsingErrors(content, filePath);

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