#!/usr/bin/env node

/**
 * Script de prueba para verificar funcionalidades avanzadas del PR-13
 */

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name, url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${url}`, options);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name}: OK`);
      return { success: true, data };
    } else {
      console.log(`❌ ${name}: ERROR - ${response.status} ${response.statusText}`);
      return { success: false, error: response.statusText };
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de funcionalidades avanzadas...\n');

  const tests = [
    {
      name: 'Sistema Principal',
      url: '/health',
      method: 'GET'
    },
    {
      name: 'IA - Predicción de Demanda',
      url: '/api/advanced/ai/predict-demand/org-123',
      method: 'POST',
      body: { productIds: ['product-1', 'product-2'] }
    },
    {
      name: 'IA - Optimización de Inventario',
      url: '/api/advanced/ai/optimize-inventory/org-123',
      method: 'POST'
    },
    {
      name: 'IA - Análisis de Estacionalidad',
      url: '/api/advanced/ai/analyze-seasonality/org-123',
      method: 'POST'
    },
    {
      name: 'IA - Recomendaciones',
      url: '/api/advanced/ai/recommendations/org-123',
      method: 'POST'
    },
    {
      name: 'Métricas - Scorecard KPIs',
      url: '/api/advanced/metrics/kpi-scorecard/org-123?period=30d',
      method: 'GET'
    },
    {
      name: 'Integraciones - Estado de Salud',
      url: '/api/advanced/integrations/health',
      method: 'GET'
    },
    {
      name: 'Integraciones - Proveedores de Envío',
      url: '/api/advanced/integrations/shipping/providers',
      method: 'POST',
      body: { origin: 'Madrid', destination: 'Barcelona', weight: 5 }
    },
    {
      name: 'Integraciones - Datos de Mercado',
      url: '/api/advanced/integrations/market-data',
      method: 'POST',
      body: { productIds: ['product-1', 'product-2'] }
    },
    {
      name: 'Integraciones - Pronóstico Meteorológico',
      url: '/api/advanced/integrations/weather/forecast?location=Madrid&days=7',
      method: 'GET'
    },
    {
      name: 'Auditoría - Eventos',
      url: '/api/advanced/audit/events/org-123?limit=10',
      method: 'GET'
    },
    {
      name: 'Auditoría - Reporte',
      url: '/api/advanced/audit/report/org-123?period=30d',
      method: 'GET'
    },
    {
      name: 'Dashboard - Datos Completos',
      url: '/api/advanced/dashboard/data/org-123?period=30d',
      method: 'GET'
    },
    {
      name: 'Sistema - Estado General',
      url: '/api/advanced/system/status',
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, test.method, test.body);
    if (result.success) {
      passedTests++;
    }
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Resultados de las Pruebas:');
  console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ¡Todas las funcionalidades avanzadas están operacionales!');
    console.log('\n🚀 El sistema de inteligencia de negocios está listo para producción.');
  } else {
    console.log('\n⚠️  Algunas funcionalidades necesitan atención.');
    console.log('📋 Revisa los logs del servidor para más detalles.');
  }

  console.log('\n📱 Accede al dashboard en: http://localhost:3000/dashboard-advanced');
  console.log('📚 Documentación disponible en: docs/advanced-api.md');
}

// Esperar un poco para que el servidor esté listo
console.log('⏳ Esperando que el servidor esté listo...');
setTimeout(runTests, 3000);
