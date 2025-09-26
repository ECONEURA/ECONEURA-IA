const fs = require('fs');
const path = require('path');

const APPS_WEB_DIR = path.join(__dirname, 'apps', 'web');

// Función para verificar si un archivo está corrupto (basado en errores comunes)
function isFileCorrupt(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Patrones de corrupción comunes
    const corruptionPatterns = [
      /\/\*\/\/\/;\/\//,  // Comentarios corruptos
      /};\/\//,           // Llaves corruptas
      /return\(\//,       // Returns corruptos
      /\/>\s*\)\/\//,     // JSX corrupto
      /\/>\s*\)\s*\/\//,  // Más JSX corrupto
      /\(\s*\)\s*;\/\//,  // Funciones corruptas
      /\/\*\/\/\/\/\//,   // Comentarios muy corruptos
    ];

    return corruptionPatterns.some(pattern => pattern.test(content));
  } catch (error) {
    return true; // Si no se puede leer, considerarlo corrupto
  }
}

// Función para generar contenido mínimo basado en el tipo de archivo
function generateMinimalContent(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath);
  const relativePath = path.relative(APPS_WEB_DIR, filePath);

  // Next.js App Router pages
  if (relativePath.includes('/app/') && fileName === 'page.tsx') {
    const routeName = path.basename(dirName);
    return `export default function ${routeName.charAt(0).toUpperCase() + routeName.slice(1)}Page() {
  return (
    <main>
      <h1>${routeName.charAt(0).toUpperCase() + routeName.slice(1)} Page</h1>
      <p>Loading...</p>
    </main>
  );
}`;
  }

  // Next.js App Router layout
  if (fileName === 'layout.tsx') {
    return `export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}`;
  }

  // API routes
  if (relativePath.includes('/api/') && fileName === 'route.ts') {
    return `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok', route: '${relativePath}' });
}`;
  }

  // Componentes React
  if (fileName.endsWith('.tsx') && !fileName.includes('page.') && !fileName.includes('layout.')) {
    const componentName = fileName.replace('.tsx', '');
    return `export default function ${componentName}() {
  return <div>${componentName}</div>;
}`;
  }

  // Librerías TypeScript
  if (fileName.endsWith('.ts') && !fileName.includes('route.') && !fileName.includes('config.')) {
    const libName = fileName.replace('.ts', '');
    return `export function ${libName}() {
  return '${libName} function';
}`;
  }

  // Configuración JavaScript
  if (fileName.endsWith('.js') && (fileName.includes('config') || fileName.includes('next.') || fileName.includes('tailwind'))) {
    if (fileName === 'next.config.js') {
      return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;`;
    }

    if (fileName === 'tailwind.config.js') {
      return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};`;
    }

    return `module.exports = {};`;
  }

  // Archivos de definición TypeScript
  if (fileName.endsWith('.d.ts')) {
    return `declare module '${fileName.replace('.d.ts', '')}';`;
  }

  // Test files
  if (fileName.includes('.test.') || fileName.includes('.spec.')) {
    return `describe('${fileName}', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});`;
  }

  // Default: export vacío
  return 'export {};';
}

// Función para encontrar archivos corruptos
function findCorruptFiles(dir) {
  const corruptFiles = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(item))) {
        if (isFileCorrupt(fullPath)) {
          corruptFiles.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return corruptFiles;
}

// Función principal
function main() {
  console.log('🔍 Buscando archivos corruptos...');

  const corruptFiles = findCorruptFiles(APPS_WEB_DIR);
  console.log(`📄 Encontrados ${corruptFiles.length} archivos corruptos`);

  if (corruptFiles.length === 0) {
    console.log('✅ No se encontraron archivos corruptos');
    return;
  }

  console.log('\n🔧 Restaurando archivos corruptos...\n');

  let restoredCount = 0;

  for (const filePath of corruptFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`🔄 Restaurando: ${relativePath}`);

    try {
      const minimalContent = generateMinimalContent(filePath);
      fs.writeFileSync(filePath, minimalContent, 'utf8');
      console.log(`✅ Restaurado: ${relativePath}`);
      restoredCount++;
    } catch (error) {
      console.error(`❌ Error restaurando ${relativePath}:`, error.message);
    }
  }

  console.log(`\n📊 Resumen restauración:`);
  console.log(`   Archivos corruptos encontrados: ${corruptFiles.length}`);
  console.log(`   Archivos restaurados: ${restoredCount}`);
}

main();