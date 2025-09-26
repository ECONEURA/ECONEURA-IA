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

// Función para arreglar errores de sintaxis específicos
function fixSyntaxErrors(content, filePath) {
  let fixed = false;
  let lines = content.split('\n');

  // 1. Arreglar expresiones regulares no terminadas
  // Patrón: líneas que empiezan con regex pero no terminan
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detectar expresiones regulares no terminadas
    if (line.startsWith('/') && !line.includes('/;') && !line.includes('/)') && !line.includes('/,') &&
        !line.includes('/g') && !line.includes('/i') && !line.includes('/m') && !line.endsWith('/')) {
      // Buscar la siguiente línea que pueda completar el regex
      let j = i + 1;
      let foundEnd = false;
      while (j < lines.length && !foundEnd) {
        const nextLine = lines[j].trim();
        if (nextLine.includes('/g') || nextLine.includes('/i') || nextLine.includes('/m') ||
            nextLine.includes('/;') || nextLine.includes('/)')) {
          // Mover el terminador a la línea anterior
          const match = nextLine.match(/\/[gim]*[;),]/);
          if (match) {
            lines[i] = lines[i] + match[0];
            lines[j] = nextLine.replace(/\/[gim]*[;),]/, '');
            foundEnd = true;
            fixed = true;
          }
        }
        j++;
      }
    }
  }

  // 2. Arreglar literales de cadena no terminados
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar comillas simples o dobles no cerradas
    const singleQuoteCount = (line.match(/'/g) || []).length;
    const doubleQuoteCount = (line.match(/"/g) || []).length;

    if (singleQuoteCount % 2 === 1 || doubleQuoteCount % 2 === 1) {
      // Buscar en las siguientes líneas para cerrar la cadena
      let j = i + 1;
      let foundEnd = false;
      while (j < lines.length && !foundEnd) {
        const nextLine = lines[j];
        const nextSingleCount = (nextLine.match(/'/g) || []).length;
        const nextDoubleCount = (nextLine.match(/"/g) || []).length;

        if ((singleQuoteCount % 2 === 1 && nextSingleCount > 0) ||
            (doubleQuoteCount % 2 === 1 && nextDoubleCount > 0)) {
          // Cerrar la cadena en la línea actual
          const quoteChar = singleQuoteCount % 2 === 1 ? "'" : '"';
          lines[i] = lines[i] + quoteChar;
          foundEnd = true;
          fixed = true;
        }
        j++;
      }
    }
  }

  // 3. Arreglar punto y coma faltante
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Agregar punto y coma si la línea parece una declaración pero no termina con ;
    if ((line.startsWith('import') || line.startsWith('export') || line.startsWith('const') ||
         line.startsWith('let') || line.startsWith('var') || line.startsWith('function') ||
         line.includes('=') || line.includes('return')) &&
        !line.endsWith(';') && !line.endsWith(',') && !line.endsWith('{') &&
        !line.endsWith('}') && !line.includes('//') && line.length > 0) {

      // Verificar que no sea una función o bloque
      if (!line.includes('function') || line.endsWith(')')) {
        lines[i] = lines[i] + ';';
        fixed = true;
      }
    }
  }

  // 4. Arreglar declaraciones esperadas (agregar export default si falta)
  const contentJoined = lines.join('\n');
  if (!contentJoined.includes('export default') && !contentJoined.includes('export {') &&
      (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx'))) {

    // Buscar la última declaración de función o clase
    const lastFunctionMatch = contentJoined.match(/^(?:export\s+)?(?:function|class|const|let)\s+\w+/gm);
    if (lastFunctionMatch) {
      const lastDeclaration = lastFunctionMatch[lastFunctionMatch.length - 1];
      const declarationName = lastDeclaration.match(/(?:function|class|const|let)\s+(\w+)/)[1];

      // Agregar export default
      lines.push('');
      lines.push(`export default ${declarationName};`);
      fixed = true;
    }
  }

  // 5. Arreglar shebang al inicio del archivo
  if (lines.length > 0 && lines[0].includes('#!')) {
    // El shebang ya está al inicio, no hacer nada
  } else if (lines.length > 1 && lines[1].includes('#!')) {
    // Mover shebang al inicio
    const shebang = lines[1];
    lines[1] = lines[0];
    lines[0] = shebang;
    fixed = true;
  }

  return { content: lines.join('\n'), fixed };
}

// Función principal
async function fixAllSyntaxErrors() {
  console.log('🔧 Iniciando corrección de errores de sintaxis...\n');

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

      const result = fixSyntaxErrors(content, filePath);

      if (result.fixed) {
        if (writeFileSafe(filePath, result.content)) {
          fixedFiles++;
          console.log(`✅ Corregido: ${filePath}`);
        }
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos procesados: ${totalFiles}`);
  console.log(`   Archivos corregidos: ${fixedFiles}`);
  console.log(`   Tasa de corrección: ${((fixedFiles / totalFiles) * 100).toFixed(1)}%`);
}

// Ejecutar la corrección
fixAllSyntaxErrors().catch(console.error);