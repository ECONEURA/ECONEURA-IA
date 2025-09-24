const fs = require('fs');
const path = require('path');

function findEconeuraUI(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      const found = findEconeuraUI(fullPath);
      if (found) return found;
    } else if (file === 'EconeuraUI.tsx' || file === 'EconeuraUI.ts' || file === 'EconeuraUI.jsx' || file === 'EconeuraUI.js') {
      return fullPath;
    }
  }
  return null;
}

const uiFile = findEconeuraUI('./apps/web/src');
if (!uiFile) {
  console.log('EconeuraUI component not found');
  process.exit(1);
}

console.log('Found EconeuraUI at:', uiFile);

let content = fs.readFileSync(uiFile, 'utf8');

// Add imports at the top
const importLines = [
  'import { AuthProvider, LoginButton } from "../lib/auth.msal";',
  'import { invokeAgent } from "../lib/econeura-gw";'
];

let lines = content.split('\n');
let firstImportIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('import')) {
    firstImportIndex = i;
    break;
  }
}

if (firstImportIndex === -1) {
  // No imports found, add at the beginning
  lines.unshift(...importLines, '');
} else {
  // Find the last import
  let lastImportIndex = firstImportIndex;
  for (let i = firstImportIndex; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import')) {
      lastImportIndex = i;
    } else if (lines[i].trim() !== '') {
      break;
    }
  }
  lines.splice(lastImportIndex + 1, 0, ...importLines);
}

// Wrap the component with AuthProvider
const componentMatch = content.match(/export (default )?function EconeuraUI|export const EconeuraUI|const EconeuraUI|function EconeuraUI/);
if (componentMatch) {
  const componentLine = componentMatch[0];
  const componentIndex = lines.findIndex(line => line.includes(componentLine));

  if (componentIndex !== -1) {
    // Find the return statement or JSX
    let returnIndex = -1;
    let braceCount = 0;
    for (let i = componentIndex; i < lines.length; i++) {
      if (lines[i].includes('{')) braceCount++;
      if (lines[i].includes('}')) braceCount--;
      if (braceCount === 1 && (lines[i].includes('return') || lines[i].trim().startsWith('<'))) {
        returnIndex = i;
        break;
      }
    }

    if (returnIndex !== -1) {
      // Wrap the return content with AuthProvider
      lines[returnIndex] = lines[returnIndex].replace(/(return\s+|\s*<)/, '$1<AuthProvider>');

      // Find the closing of the return
      braceCount = 0;
      let closeIndex = returnIndex;
      for (let i = returnIndex; i < lines.length; i++) {
        if (lines[i].includes('{')) braceCount++;
        if (lines[i].includes('}')) braceCount--;
        if (braceCount === 0 && lines[i].includes('}')) {
          closeIndex = i;
          break;
        }
      }

      if (closeIndex !== -1 && closeIndex !== returnIndex) {
        lines[closeIndex] = lines[closeIndex].replace('}', '</AuthProvider>}');
      }
    }
  }
}

// Add LoginButton somewhere in the UI
const loginButtonLine = '<LoginButton />';
let addedLoginButton = false;

// Try to add it after the main heading or in a header area
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<h1') || lines[i].includes('<header') || lines[i].includes('className=".*header')) {
    // Find the closing tag
    let closeTagIndex = -1;
    const tagMatch = lines[i].match(/<(\w+)/);
    if (tagMatch) {
      const tagName = tagMatch[1];
      let nestedCount = 0;
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('<' + tagName)) nestedCount++;
        if (lines[j].includes('</' + tagName + '>')) {
          nestedCount--;
          if (nestedCount === 0) {
            closeTagIndex = j;
            break;
          }
        }
      }

      if (closeTagIndex !== -1) {
        lines.splice(closeTagIndex, 0, '        ' + loginButtonLine);
        addedLoginButton = true;
        break;
      }
    }
  }
}

// If we couldn't find a good place, add it at the beginning of the return
if (!addedLoginButton) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return')) {
      lines.splice(i + 1, 0, '    ' + loginButtonLine);
      addedLoginButton = true;
      break;
    }
  }
}

// Add invokeAgent usage example
const invokeExample = '    const handleInvokeAgent = async () => { const result = await invokeAgent("Hello AI"); console.log(result); };';
let addedInvokeExample = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [') || lines[i].includes('const handle') || lines[i].includes('function')) {
    lines.splice(i, 0, invokeExample);
    addedInvokeExample = true;
    break;
  }
}

if (!addedInvokeExample) {
  // Add before the return statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('return')) {
      lines.splice(i, 0, invokeExample);
      break;
    }
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(uiFile, newContent);
console.log('Successfully patched EconeuraUI component');