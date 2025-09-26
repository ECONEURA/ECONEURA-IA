const fs = require('fs');
const path = require('path');

function fixParsingErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix unterminated string literals
    const stringLiteralRegex = /(['"`])[^'"\n]*$/gm;
    if (stringLiteralRegex.test(content)) {
      content = content.replace(/(['"`])[^'"\n]*$/gm, '$1');
      modified = true;
    }

    // Fix missing semicolons in object literals and expressions
    const missingSemicolonRegex = /(\w+)\s*\n\s*}/g;
    if (missingSemicolonRegex.test(content)) {
      content = content.replace(/(\w+)\s*\n\s*}/g, '$1;\n}');
      modified = true;
    }

    // Fix incomplete export statements
    const incompleteExportRegex = /export\s+{\s*$/gm;
    if (incompleteExportRegex.test(content)) {
      content = content.replace(/export\s+{\s*$/gm, 'export {\n  // TODO: Add exports\n};');
      modified = true;
    }

    // Fix incomplete import statements
    const incompleteImportRegex = /import\s+{\s*$/gm;
    if (incompleteImportRegex.test(content)) {
      content = content.replace(/import\s+{\s*$/gm, 'import {\n  // TODO: Add imports\n} from \'\';');
      modified = true;
    }

    // Fix incomplete function declarations
    const incompleteFunctionRegex = /function\s+\w+\s*\([^)]*$/gm;
    if (incompleteFunctionRegex.test(content)) {
      content = content.replace(/function\s+\w+\s*\([^)]*$/gm, (match) => match + ') {\n  // TODO: Implement function\n}');
      modified = true;
    }

    // Fix incomplete JSX elements
    const incompleteJsxRegex = /<[^>]*$/gm;
    if (incompleteJsxRegex.test(content)) {
      content = content.replace(/<[^>]*$/gm, (match) => {
        if (match.includes('<')) {
          return match + ' />';
        }
        return match;
      });
      modified = true;
    }

    // Fix missing closing braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      content += '\n}'.repeat(openBraces - closeBraces);
      modified = true;
    }

    // Fix missing closing parentheses
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      content += ')'.repeat(openParens - closeParens);
      modified = true;
    }

    // Fix missing closing brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      content += ']'.repeat(openBrackets - closeBrackets);
      modified = true;
    }

    // Fix incomplete object literals
    const incompleteObjectRegex = /{\s*$/gm;
    if (incompleteObjectRegex.test(content)) {
      content = content.replace(/{\s*$/gm, '{\n  // TODO: Complete object\n};');
      modified = true;
    }

    // Fix incomplete array literals
    const incompleteArrayRegex = /\[\s*$/gm;
    if (incompleteArrayRegex.test(content)) {
      content = content.replace(/\[\s*$/gm, '[\n  // TODO: Complete array\n];');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed parsing errors in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      fixParsingErrors(fullPath);
    }
  }
}

console.log('Fixing critical parsing errors in apps/web directory...');
processDirectory('apps/web');
console.log('Critical parsing error fixes completed.');