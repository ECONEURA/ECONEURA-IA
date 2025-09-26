const fs = require('fs');
const path = require('path');

function fixSpecificParsingErrors(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true });

  let fixedCount = 0;

  for (const file of files) {
    if (typeof file !== 'string') continue;

    const filePath = path.join(dirPath, file);

    if (!fs.statSync(filePath).isFile()) continue;
    if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js') && !file.endsWith('.jsx')) continue;

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      let modified = false;

      // Fix specific patterns based on ESLint errors

      // Fix missing semicolons after variable declarations
      content = content.replace(/(\b(?:const|let|var)\s+\w+\s*=\s*[^;]+)(?=\s*(?:\b(?:const|let|var|function|class|interface|type|export|import)\b|\}|$))/g, '$1;');

      // Fix missing semicolons after function calls
      content = content.replace(/(\w+\([^)]*\))(?![\s;.,}\]])/g, '$1;');

      // Fix missing semicolons after assignments
      content = content.replace(/(\w+\s*=\s*[^;]+)(?=\s*(?:\b(?:const|let|var|function|class|interface|type|export|import)\b|\}|$))/g, '$1;');

      // Fix incomplete export statements
      content = content.replace(/^export\s+(const|let|var|function|class|interface|type)\s+\w+/gm, (match) => {
        if (!match.includes(';') && !match.includes('{') && !match.includes('=')) {
          return match + ';';
        }
        return match;
      });

      // Fix incomplete import statements
      content = content.replace(/^import\s+.*from\s+['"][^'"]*['"]/gm, (match) => {
        if (!match.includes(';')) {
          return match + ';';
        }
        return match;
      });

      // Fix unterminated regular expressions at line starts
      content = content.replace(/^\/[^\/]*$/gm, (match) => {
        if (!match.endsWith('/')) {
          return match + '/;';
        }
        return match;
      });

      // Fix unterminated strings at line starts
      content = content.replace(/^['"`][^'"`]*$/gm, (match) => {
        if (match.startsWith("'") && !match.endsWith("'")) {
          return match + "';";
        } else if (match.startsWith('"') && !match.endsWith('"')) {
          return match + '";';
        } else if (match.startsWith('`') && !match.endsWith('`')) {
          return match + '`;';
        }
        return match;
      });

      // Fix missing commas in object literals
      content = content.replace(/(\w+:\s*[^,}\n]+)(?=\s*\w+:\s*)/g, '$1,');

      // Fix missing closing braces for objects
      let lines = content.split('\n');
      let braceCount = 0;
      let inString = false;
      let stringChar = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let newLine = '';

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const prevChar = j > 0 ? line[j - 1] : '';

          if (!inString) {
            if (char === '"' || char === "'") {
              inString = true;
              stringChar = char;
            } else if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
            }
          } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
            stringChar = '';
          }

          newLine += char;
        }

        lines[i] = newLine;
      }

      // Add missing closing braces at end if needed
      if (braceCount > 0) {
        lines[lines.length - 1] += '}'.repeat(braceCount);
        modified = true;
      }

      content = lines.join('\n');

      // Fix common incomplete patterns
      content = content.replace(/export\s+default\s*$/gm, 'export default {};');
      content = content.replace(/export\s+\{\s*$/gm, 'export { };');

      // Fix incomplete function declarations
      content = content.replace(/function\s+\w+\s*\([^)]*$/gm, (match) => {
        if (!match.includes(')')) {
          return match + ') {}';
        }
        return match;
      });

      // Fix incomplete arrow functions
      content = content.replace(/(\w+)\s*=>\s*$/gm, '$1 => {};');

      // Fix incomplete class declarations
      content = content.replace(/class\s+\w+\s*$/gm, (match) => {
        return match + ' {}';
      });

      // Fix incomplete interface declarations
      content = content.replace(/interface\s+\w+\s*$/gm, (match) => {
        return match + ' {}';
      });

      // Fix incomplete type declarations
      content = content.replace(/type\s+\w+\s*=\s*$/gm, (match) => {
        return match + ' any;';
      });

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        fixedCount++;
        console.log(`Fixed specific parsing errors in: ${filePath}`);
      }

    } catch (error) {
      console.error(`Error processing ${filePath}: ${error.message}`);
    }
  }

  console.log(`Fixed specific parsing errors in ${fixedCount} files`);
}

const targetDir = process.argv[2] || 'apps/web';
fixSpecificParsingErrors(targetDir);