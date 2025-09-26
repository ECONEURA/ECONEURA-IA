const fs = require('fs');
const path = require('path');

const APPS_WEB_DIR = path.join(__dirname, 'apps', 'web');

// Función para encontrar archivos TypeScript/JavaScript
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Función para corregir errores de parsing comunes
function fixParsingErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Corregir expresiones regulares sin terminar (común en imports)
    const regexPattern = /import\s+.*from\s+['"`][^'"`]*$/gm;
    if (regexPattern.test(content)) {
      content = content.replace(regexPattern, (match) => {
        return match + '";';
      });
      modified = true;
    }

    // 2. Corregir declaraciones incompletas al inicio de archivos
    if (content.trim().startsWith('import') && !content.includes('\n')) {
      content += '\n\nexport {};\n';
      modified = true;
    }

    // 3. Corregir punto y coma faltante en declaraciones de import
    const importPattern = /(import\s+.*from\s+['"`][^'"`]*['"`])\s*(?=\n|$)/g;
    content = content.replace(importPattern, '$1;');
    modified = true;

    // 4. Corregir export default sin punto y coma
    const exportDefaultPattern = /(export\s+default\s+[^;]+)(?=\n|$)/g;
    content = content.replace(exportDefaultPattern, '$1;');
    modified = true;

    // 5. Corregir declaraciones de función sin punto y coma
    const functionPattern = /(function\s+\w+\s*\([^)]*\)\s*{[^}]*})(?=\n|$)/g;
    content = content.replace(functionPattern, '$1;');
    modified = true;

    // 6. Corregir declaraciones de const/let/var sin punto y coma
    const varPattern = /(const|let|var)\s+\w+\s*=\s*[^;]+(?=\n|$)/g;
    content = content.replace(varPattern, '$1;');
    modified = true;

    // 7. Corregir llamadas a función al final sin punto y coma
    const callPattern = /(\w+\([^)]*\))(?=\n|$)/g;
    content = content.replace(callPattern, '$1;');
    modified = true;

    // 8. Corregir objetos literales sin punto y coma
    const objectPattern = /({[^}]*})(?=\n|$)/g;
    content = content.replace(objectPattern, '$1;');
    modified = true;

    // 9. Corregir arrays literales sin punto y coma
    const arrayPattern = /(\[[^\]]*\])(?=\n|$)/g;
    content = content.replace(arrayPattern, '$1;');
    modified = true;

    // 10. Corregir strings sin terminar
    const stringPattern = /(['"`][^'"`]*$)/gm;
    if (stringPattern.test(content)) {
      content = content.replace(stringPattern, (match) => {
        const quote = match.charAt(0);
        return match + quote + ';';
      });
      modified = true;
    }

    // 11. Corregir comentarios sin cerrar
    const commentPattern = /(\/\*[^]*?)$/;
    if (commentPattern.test(content)) {
      content += ' */\n';
      modified = true;
    }

    // 12. Corregir JSX elements incompletos
    const jsxPattern = /(<\w+[^>]*$)/gm;
    if (jsxPattern.test(content)) {
      content = content.replace(jsxPattern, (match) => {
        return match + ' />';
      });
      modified = true;
    }

    // 13. Agregar export vacío si el archivo está vacío o solo tiene imports
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0 || lines.every(line => line.startsWith('import') || line.startsWith('//') || line.startsWith('/*'))) {
      content += '\n\nexport {};\n';
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Función principal
function main() {
  console.log('🔧 Corrigiendo errores de parsing comunes...');

  const files = findFiles(APPS_WEB_DIR);
  console.log(`📄 Encontrados ${files.length} archivos`);

  let correctedCount = 0;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`📄 Procesando: ${relativePath}`);

    if (fixParsingErrors(file)) {
      correctedCount++;
      console.log(`✅ Corregido: ${relativePath}`);
    }
  }

  console.log(`\n📊 Resumen parsing:`);
  console.log(`   Archivos procesados: ${files.length}`);
  console.log(`   Archivos corregidos: ${correctedCount}`);
  console.log(`   Tasa de corrección: ${((correctedCount / files.length) * 100).toFixed(1)}%`);
}

main();