const fs = require('fs');
const path = require('path');

function fixSpecificParsingErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix unterminated string literals (single quotes, double quotes, backticks)
    const stringPatterns = [
      /('[^'\\]*(?:\\.[^'\\]*)*$)/gm,  // single quotes
      /("[^"\\]*(?:\\.[^"\\]*)*$)/gm,  // double quotes
      /(`[^`\\]*(?:\\.[^`\\]*)*$)/gm   // backticks
    ];

    stringPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          const quote = match.charAt(0);
          return match + quote;
        });
        modified = true;
      }
    });

    // Fix unterminated template literals
    const templateLiteralRegex = /`[^`]*$/gm;
    if (templateLiteralRegex.test(content)) {
      content = content.replace(templateLiteralRegex, (match) => match + '`');
      modified = true;
    }

    // Fix unterminated regular expressions
    const regexLiteralRegex = /\/[^\/]*$/gm;
    if (regexLiteralRegex.test(content)) {
      content = content.replace(regexLiteralRegex, (match) => match + '/');
      modified = true;
    }

    // Fix missing semicolons after expressions
    const missingSemicolonRegex = /(\w+)\s*\n\s*}/g;
    if (missingSemicolonRegex.test(content)) {
      content = content.replace(missingSemicolonRegex, '$1;\n}');
      modified = true;
    }

    // Fix missing commas in object literals
    const missingCommaRegex = /(\w+|"[^"]*"|'[^']*'|`[^`]*`)\s*\n\s*(\w+|"[^"]*"|'[^']*'|`[^`]*`)/g;
    if (missingCommaRegex.test(content)) {
      content = content.replace(missingCommaRegex, '$1,\n$2');
      modified = true;
    }

    // Fix incomplete try-catch blocks
    const incompleteTryRegex = /try\s*{\s*$/gm;
    if (incompleteTryRegex.test(content)) {
      content = content.replace(incompleteTryRegex, 'try {\n  // TODO: Add try block logic\n} catch (error) {\n  console.error(error);\n}');
      modified = true;
    }

    // Fix missing closing braces by counting
    const lines = content.split('\n');
    let openBraces = 0;
    let openParens = 0;
    let openBrackets = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      openBraces += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      openParens += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      openBrackets += (line.match(/\[/g) || []).length - (line.match(/\]/g) || []).length;
    }

    if (openBraces > 0) {
      content += '\n}'.repeat(openBraces);
      modified = true;
    }
    if (openParens > 0) {
      content += ')'.repeat(openParens);
      modified = true;
    }
    if (openBrackets > 0) {
      content += ']'.repeat(openBrackets);
      modified = true;
    }

    // Fix missing 'from' in import statements
    const incompleteImportRegex = /import\s+{\s*[^}]*}\s*$/gm;
    if (incompleteImportRegex.test(content)) {
      content = content.replace(incompleteImportRegex, (match) => match + ' from \'\';');
      modified = true;
    }

    // Fix incomplete export statements
    const incompleteExportRegex = /export\s+{\s*[^}]*}\s*$/gm;
    if (incompleteExportRegex.test(content)) {
      content = content.replace(incompleteExportRegex, (match) => match + ';');
      modified = true;
    }

    // Fix missing closing tags in JSX
    const jsxTagRegex = /<[^>]*$/gm;
    if (jsxTagRegex.test(content)) {
      content = content.replace(jsxTagRegex, (match) => {
        if (match.includes('<') && !match.includes('/>') && !match.includes('</')) {
          return match + ' />';
        }
        return match;
      });
      modified = true;
    }

    // Fix array access without arguments
    const arrayAccessRegex = /(\w+)\[\s*\]/g;
    if (arrayAccessRegex.test(content)) {
      content = content.replace(arrayAccessRegex, '$1[0]');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed specific parsing errors in: ${filePath}`);
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
      fixSpecificParsingErrors(fullPath);
    }
  }
}

console.log('Fixing specific parsing errors in apps/web directory...');
processDirectory('apps/web');
console.log('Specific parsing error fixes completed.');