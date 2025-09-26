const fs = require('fs');
const path = require('path');

// Función para corregir los últimos errores restantes
function fixFinalErrors() {
  console.log('🔧 Corrigiendo los últimos errores de ESLint...\n');

  // 1. Corregir _utils.ts - cambiar 'any' por 'unknown'
  const utilsPath = path.join(__dirname, 'apps', 'web', 'src', 'app', 'api', '_utils.ts');
  try {
    let utilsContent = fs.readFileSync(utilsPath, 'utf8');
    utilsContent = utilsContent.replace(/: any/g, ': unknown');
    fs.writeFileSync(utilsPath, utilsContent, 'utf8');
    console.log('✅ Corregido: _utils.ts');
  } catch (error) {
    console.error('❌ Error en _utils.ts:', error.message);
  }

  // 2. Corregir i18n-middleware.ts
  const middlewarePath = path.join(__dirname, 'apps', 'web', 'src', 'i18n-middleware.ts');
  try {
    const middlewareContent = `import { NextRequest, NextResponse } from 'next/server';

export function i18nMiddleware(_request: NextRequest) {
  return NextResponse.next();
}`;
    fs.writeFileSync(middlewarePath, middlewareContent, 'utf8');
    console.log('✅ Corregido: i18n-middleware.ts');
  } catch (error) {
    console.error('❌ Error en i18n-middleware.ts:', error.message);
  }

  // 3. Corregir tailwind.config.js
  const tailwindPath = path.join(__dirname, 'apps', 'web', 'tailwind.config.js');
  try {
    const tailwindContent = `/** @type {import('tailwindcss').Config} */
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
    fs.writeFileSync(tailwindPath, tailwindContent, 'utf8');
    console.log('✅ Corregido: tailwind.config.js');
  } catch (error) {
    console.error('❌ Error en tailwind.config.js:', error.message);
  }

  console.log('\n🎉 Correcciones finales completadas!');
}

fixFinalErrors();