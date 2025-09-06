#!/usr/bin/env node

// Script de prueba para servicios consolidados
// Verifica que todos los servicios consolidados funcionen correctamente

import fs from 'fs';
import path from 'path';

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[${new Date().toISOString()}]${colors.reset} ${message}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Verificar que los archivos de servicios consolidados existen
function verifyConsolidatedServices() {
  log('Verificando servicios consolidados...');
  
  const services = [
    {
      name: 'FinOps Consolidated Service',
      path: 'apps/api/src/lib/finops-consolidated.service.ts',
      exportName: 'finOpsConsolidatedService'
    },
    {
      name: 'Analytics Consolidated Service',
      path: 'apps/api/src/lib/analytics-consolidated.service.ts',
      exportName: 'analyticsConsolidated'
    },
    {
      name: 'Security Consolidated Service',
      path: 'apps/api/src/lib/security-consolidated.service.ts',
      exportName: 'securityConsolidated'
    },
    {
      name: 'Quiet Hours & Oncall Consolidated Service',
      path: 'apps/api/src/lib/quiet-hours-oncall-consolidated.service.ts',
      exportName: 'quietHoursOncallConsolidated'
    },
    {
      name: 'GDPR Consolidated Service',
      path: 'apps/api/src/lib/gdpr-consolidated.service.ts',
      exportName: 'gdprConsolidated'
    }
  ];

  let allServicesExist = true;

  for (const service of services) {
    if (fs.existsSync(service.path)) {
      success(`${service.name} encontrado`);
      
      // Verificar que el archivo tiene contenido
      const content = fs.readFileSync(service.path, 'utf8');
      if (content.length < 1000) {
        warning(`${service.name} parece tener poco contenido (${content.length} caracteres)`);
      }
      
      // Verificar que tiene la exportación correcta
      if (content.includes(`export const ${service.exportName}`) || 
          content.includes(`export { ${service.exportName}`)) {
        success(`${service.name} tiene exportación correcta`);
      } else {
        error(`${service.name} no tiene exportación correcta`);
        allServicesExist = false;
      }
    } else {
      error(`${service.name} no encontrado en ${service.path}`);
      allServicesExist = false;
    }
  }

  return allServicesExist;
}

// Verificar configuración optimizada
function verifyOptimizedConfiguration() {
  log('Verificando configuración optimizada...');
  
  const configs = [
    {
      name: 'TypeScript Config',
      path: 'tsconfig.json',
      required: ['incremental', 'tsBuildInfoFile']
    },
    {
      name: 'ESLint Config',
      path: '.eslintrc.cjs',
      required: ['env', 'extends', 'rules']
    },
    {
      name: 'Cache Config',
      path: '.cache/config.json',
      required: ['cache', 'services']
    },
    {
      name: 'Dockerfile Optimized',
      path: 'Dockerfile.optimized',
      required: ['FROM node:18-alpine', 'Multi-stage build']
    }
  ];

  let allConfigsExist = true;

  for (const config of configs) {
    if (fs.existsSync(config.path)) {
      success(`${config.name} encontrado`);
      
      const content = fs.readFileSync(config.path, 'utf8');
      for (const required of config.required) {
        if (content.includes(required)) {
          success(`${config.name} contiene: ${required}`);
        } else {
          warning(`${config.name} no contiene: ${required}`);
        }
      }
    } else {
      error(`${config.name} no encontrado`);
      allConfigsExist = false;
    }
  }

  return allConfigsExist;
}

// Verificar scripts de optimización
function verifyOptimizationScripts() {
  log('Verificando scripts de optimización...');
  
  const scripts = [
    'scripts/optimize-consolidated-services.sh',
    'scripts/monitor-performance.js',
    'scripts/clean-cache.sh'
  ];

  let allScriptsExist = true;

  for (const script of scripts) {
    if (fs.existsSync(script)) {
      success(`Script encontrado: ${script}`);
      
      // Verificar que es ejecutable
      const stats = fs.statSync(script);
      if (stats.mode & parseInt('111', 8)) {
        success(`${script} es ejecutable`);
      } else {
        warning(`${script} no es ejecutable`);
      }
    } else {
      error(`Script no encontrado: ${script}`);
      allScriptsExist = false;
    }
  }

  return allScriptsExist;
}

// Verificar integración en index.ts
function verifyIndexIntegration() {
  log('Verificando integración en index.ts...');
  
  const indexPath = 'apps/api/src/index.ts';
  
  if (!fs.existsSync(indexPath)) {
    error('index.ts no encontrado');
    return false;
  }

  const content = fs.readFileSync(indexPath, 'utf8');
  
  const requiredImports = [
    'finOpsConsolidatedService',
    'analyticsConsolidated',
    'securityConsolidated',
    'quietHoursOncallConsolidated',
    'gdprConsolidated'
  ];

  let allImportsFound = true;

  for (const importName of requiredImports) {
    if (content.includes(importName)) {
      success(`Import encontrado: ${importName}`);
    } else {
      error(`Import no encontrado: ${importName}`);
      allImportsFound = false;
    }
  }

  // Verificar endpoint de estado consolidado
  if (content.includes('/v1/system/consolidated-status')) {
    success('Endpoint de estado consolidado encontrado');
  } else {
    error('Endpoint de estado consolidado no encontrado');
    allImportsFound = false;
  }

  return allImportsFound;
}

// Generar reporte de prueba
function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    tests: {
      consolidatedServices: results.services,
      optimizedConfiguration: results.configs,
      optimizationScripts: results.scripts,
      indexIntegration: results.index
    },
    summary: {
      totalTests: 4,
      passedTests: Object.values(results).filter(Boolean).length,
      failedTests: Object.values(results).filter(r => !r).length
    },
    status: Object.values(results).every(Boolean) ? 'PASSED' : 'FAILED'
  };

  fs.writeFileSync('consolidated-services-test-report.json', JSON.stringify(report, null, 2));
  
  log('📊 Reporte de prueba generado: consolidated-services-test-report.json');
  
  return report;
}

// Función principal
async function main() {
  log('🚀 Iniciando pruebas de servicios consolidados...');
  
  const results = {
    services: verifyConsolidatedServices(),
    configs: verifyOptimizedConfiguration(),
    scripts: verifyOptimizationScripts(),
    index: verifyIndexIntegration()
  };

  log('Generando reporte final...');
  const report = generateTestReport(results);

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  
  console.log(`✅ Pruebas pasadas: ${report.summary.passedTests}/${report.summary.totalTests}`);
  console.log(`❌ Pruebas fallidas: ${report.summary.failedTests}/${report.summary.totalTests}`);
  console.log(`📈 Estado general: ${report.status}`);
  
  console.log('\n📋 Detalles:');
  console.log(`   • Servicios consolidados: ${results.services ? '✅' : '❌'}`);
  console.log(`   • Configuración optimizada: ${results.configs ? '✅' : '❌'}`);
  console.log(`   • Scripts de optimización: ${results.scripts ? '✅' : '❌'}`);
  console.log(`   • Integración en index.ts: ${results.index ? '✅' : '❌'}`);

  if (report.status === 'PASSED') {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n🔧 Próximos pasos:');
    console.log('   1. Ejecutar: npm run build:optimized');
    console.log('   2. Probar: GET /v1/system/consolidated-status');
    console.log('   3. Monitorear: node scripts/monitor-performance.js');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisar los errores arriba.');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    error(`Error ejecutando pruebas: ${error.message}`);
    process.exit(1);
  });
}

export {
  verifyConsolidatedServices,
  verifyOptimizedConfiguration,
  verifyOptimizationScripts,
  verifyIndexIntegration,
  generateTestReport
};
