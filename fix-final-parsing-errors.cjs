const fs = require('fs');
const path = require('path');

function fixParsingErrors(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true });

  files.forEach(file => {
    const filePath = path.join(dirPath, file);

    // Skip if file doesn't exist or is not accessible
    try {
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return;
      }
    } catch (error) {
      return; // Skip inaccessible files
    }

    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {

      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Fix unterminated regular expressions
        const regexPattern = /\/[^\/]*$/gm;
        if (regexPattern.test(content)) {
          content = content.replace(/\/([^\/]*)$/gm, '/$1/');
          modified = true;
        }

        // Fix unterminated strings - look for lines ending with quotes but not properly closed
        const lines = content.split('\n');
        const fixedLines = lines.map((line, index) => {
          // Check for unterminated single quotes
          const singleQuoteCount = (line.match(/'/g) || []).length;
          if (singleQuoteCount % 2 !== 0 && !line.trim().endsWith(';') && !line.trim().endsWith(',')) {
            return line + "';";
          }

          // Check for unterminated double quotes
          const doubleQuoteCount = (line.match(/"/g) || []).length;
          if (doubleQuoteCount % 2 !== 0 && !line.trim().endsWith(';') && !line.trim().endsWith(',')) {
            return line + '";';
          }

          return line;
        });

        if (fixedLines.join('\n') !== content) {
          content = fixedLines.join('\n');
          modified = true;
        }

        // Fix missing semicolons after imports/exports
        content = content.replace(/^(import|export)\s+.*$/gm, (match) => {
          if (!match.trim().endsWith(';')) {
            return match + ';';
          }
          return match;
        });

        // Fix missing semicolons after variable declarations
        content = content.replace(/^(\s*)(const|let|var)\s+.*$/gm, (match) => {
          if (!match.trim().endsWith(';') && !match.trim().endsWith(',')) {
            return match + ';';
          }
          return match;
        });

        // Fix incomplete function calls or declarations
        content = content.replace(/^(\s*)[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*$/gm, (match) => {
          if (!match.includes(')') && !match.trim().endsWith('{')) {
            return match + ');';
          }
          return match;
        });

        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Fixed parsing errors in: ${filePath}`);
        }

      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
      }
    }
  });
}

// Process the web app directory
const webDir = path.join(__dirname, 'apps', 'web');
if (fs.existsSync(webDir)) {
  console.log('Starting parsing error fixes...');
  fixParsingErrors(webDir);
  console.log('Parsing error fixes completed.');
} else {
  console.error('Web directory not found');
}