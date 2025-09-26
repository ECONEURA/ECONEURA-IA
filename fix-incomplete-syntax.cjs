const fs = require('fs');
const path = require('path');

function fixIncompleteFiles(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix incomplete metadata export
    content = content.replace(/export const _metadata: _Metadata =\s*$/gm, 'export const metadata: Metadata = {\n  title: "AI Playground",\n};');

    // Fix incomplete className
    content = content.replace(/<div _className =\s*$/gm, '<div className="container mx-auto p-4">');

    // Fix incomplete JSX elements
    content = content.replace(/}\s*$/, '\n  );\n}');

    // Fix incomplete function calls
    content = content.replace(/,\s*$/gm, ',\n  },\n};');

    // Fix unterminated string literals
    content = content.replace(/"[^"]*$/gm, (match) => {
      if (!match.endsWith('"')) {
        return match + '",';
      }
      return match;
    });

    // Fix missing semicolons
    content = content.replace(/(\w+)\s*$/gm, '$1;');

    // Fix incomplete imports
    content = content.replace(/import\s+{\s*$/gm, 'import { Metadata } from \'next\';');

    // Fix incomplete JSX
    content = content.replace(/<(\w+)\s*$/gm, '<$1></$1>');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed incomplete syntax in: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
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
      fixIncompleteFiles(fullPath);
    }
  }
}

// Process the apps/web directory
const webDir = path.join(__dirname, 'apps', 'web');
if (fs.existsSync(webDir)) {
  console.log('Fixing incomplete syntax in apps/web directory...');
  processDirectory(path.join(webDir, 'src'));
} else {
  console.log('apps/web directory not found');
}

console.log('Incomplete syntax fixes completed.');