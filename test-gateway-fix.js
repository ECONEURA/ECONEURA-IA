#!/usr/bin/env node

// Simple test script to verify gateway fix
try {
  const { apiGateway } = await import('./apps/api/dist/apps/api/src/lib/gateway.js');
  console.log('✅ Gateway imported successfully');
  console.log('Services count:', apiGateway.getAllServices().length);
  console.log('Routes count:', apiGateway.getAllRoutes().length);

  const healthRoute = apiGateway.getAllRoutes().find(r => r.path === '/health');
  console.log('Health route found:', !!healthRoute);

  if (healthRoute) {
    console.log('Health route serviceId:', healthRoute.serviceId);
    const service = apiGateway.getService(healthRoute.serviceId);
    console.log('Health service exists:', !!service);
    if (service) {
      console.log('Health service name:', service.name);
      console.log('Health service URL:', service.url);
    }
  }

  // Test route finding
  const foundRoute = apiGateway.findRoute('/health', 'GET');
  console.log('Route found for /health GET:', !!foundRoute);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}

export {};
