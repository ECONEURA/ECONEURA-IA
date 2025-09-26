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

// Función para arreglar expresiones regulares no terminadas
function fixUnterminatedRegex(content) {
  let lines = content.split('\n');
  let fixed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar expresiones regulares no terminadas
    if (line.startsWith('/') && !line.includes('/g') && !line.includes('/i') &&
        !line.includes('/m') && !line.includes('/;') && !line.includes('/)') &&
        !line.includes('/,') && !line.endsWith('/')) {

      // Buscar en las siguientes líneas el terminador
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine.includes('/g') || nextLine.includes('/i') || nextLine.includes('/m') ||
            nextLine.includes('/;') || nextLine.includes('/)')) {

          // Extraer el terminador
          const terminatorMatch = nextLine.match(/\/[gim]*[;),]/);
          if (terminatorMatch) {
            lines[i] = lines[i] + terminatorMatch[0];
            lines[j] = nextLine.replace(/\/[gim]*[;),]/, '');
            fixed = true;
            break;
          }
        }
      }
    }
  }

  return { content: lines.join('\n'), fixed };
}

// Función principal
async function fixRegexErrors() {
  console.log('🔧 Corrigiendo expresiones regulares no terminadas...\n');

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

      const result = fixUnterminatedRegex(content);

      if (result.fixed) {
        if (writeFileSafe(filePath, result.content)) {
          fixedFiles++;
          console.log(`✅ Corregido: ${filePath}`);
        }
      }
    }
  }

  console.log(`\n📊 Resumen expresiones regulares:`);
  console.log(`   Archivos procesados: ${totalFiles}`);
  console.log(`   Archivos corregidos: ${fixedFiles}`);
  console.log(`   Tasa de corrección: ${((fixedFiles / totalFiles) * 100).toFixed(1)}%`);
}

// Ejecutar la corrección
fixRegexErrors().catch(console.error);