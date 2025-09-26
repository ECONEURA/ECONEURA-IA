const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Función para leer archivo de forma segura
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Función para escribir archivo de forma segura
function writeFileSafe(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

// Función para arreglar punto y coma faltante
function fixMissingSemicolon(content) {
  let lines = content.split('\n');
  let fixed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Agregar punto y coma si la línea parece una declaración pero no termina con ;
    if ((line.startsWith('import') || line.startsWith('export') ||
         line.startsWith('const') || line.startsWith('let') || line.startsWith('var') ||
         line.includes('=') || line.includes('return') || line.includes('throw') ||
         line.includes('break') || line.includes('continue')) &&
        !line.endsWith(';') && !line.endsWith(',') && !line.endsWith('{') &&
        !line.endsWith('}') && !line.endsWith(':') && !line.includes('//') &&
        !line.includes('/*') && line.length > 0 &&
        !line.includes('function') && !line.includes('class') &&
        !line.includes('interface') && !line.includes('type') &&
        !line.includes('if') && !line.includes('for') && !line.includes('while') &&
        !line.includes('try') && !line.includes('catch')) {

      // Verificar que no sea parte de una expresión multilínea
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      if (!nextLine.startsWith('+') && !nextLine.startsWith('-') &&
          !nextLine.startsWith('*') && !nextLine.startsWith('/') &&
          !nextLine.startsWith('.') && !nextLine.startsWith('[') &&
          !nextLine.startsWith('(') && !nextLine.includes('&&') &&
          !nextLine.includes('||') && !nextLine.includes('?')) {

        lines[i] = lines[i] + ';';
        fixed = true;
      }
    }
  }

  return { content: lines.join('\n'), fixed };
}

// Función principal
async function fixSemicolonErrors() {
  console.log('🔧 Corrigiendo punto y coma faltante...\n');

  // Buscar todos los archivos TypeScript/JavaScript
  const patterns = [
    'apps/web/**/*.ts',
    'apps/web/**/*.tsx',
    'apps/web/**/*.js',
    'apps/web/**/*.jsx'
  ];

  let totalFiles = 0;
  let fixedFiles = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: ['**/node_modules/**'] });

    for (const filePath of files) {
      totalFiles++;
      console.log(`📄 Procesando: ${filePath}`);

      const content = readFileSafe(filePath);
      if (!content) continue;

      const result = fixMissingSemicolon(content);

      if (result.fixed) {
        if (writeFileSafe(filePath, result.content)) {
          fixedFiles++;
          console.log(`✅ Corregido: ${filePath}`);
        }
      }
    }
  }

  console.log(`\n📊 Resumen punto y coma:`);
  console.log(`   Archivos procesados: ${totalFiles}`);
  console.log(`   Archivos corregidos: ${fixedFiles}`);
  console.log(`   Tasa de corrección: ${((fixedFiles / totalFiles) * 100).toFixed(1)}%`);
}

// Ejecutar la corrección
fixSemicolonErrors().catch(console.error);