#!/usr/bin/env node

/**
 * Script de inicialización para las funcionalidades avanzadas del PR-13
 * Configura todas las nuevas características del sistema de inteligencia de negocios
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Inicializando funcionalidades avanzadas del PR-13...\n');

// Configuración de variables de entorno
const envConfig = `
# ========================================
# CONFIGURACIÓN AVANZADA - PR-13
# ========================================

# APIs Externas
SHIPPING_API_URL=https://api.shipping-provider.com
SHIPPING_API_KEY=your_shipping_api_key_here
PAYMENT_API_URL=https://api.payment-provider.com
PAYMENT_API_KEY=your_payment_api_key_here
MARKET_DATA_API_URL=https://api.market-data.com
MARKET_DATA_API_KEY=your_market_data_api_key_here
WEATHER_API_URL=https://api.weather.com
WEATHER_API_KEY=your_weather_api_key_here

# Configuración del Sistema Avanzado
ORG_ID=org-123
AUDIT_ENABLED=true
NOTIFICATIONS_ENABLED=true
AI_PREDICTIONS_ENABLED=true
METRICS_ENABLED=true
EXTERNAL_INTEGRATIONS_ENABLED=true

# Configuración de Performance
CACHE_TTL=3600
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuración de Logging
LOG_LEVEL=info
AUDIT_LOG_LEVEL=debug
`;

// Verificar si existe .env
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creando archivo .env con configuración avanzada...');
  fs.writeFileSync(envPath, envConfig);
  console.log('✅ Archivo .env creado exitosamente');
} else {
  console.log('📝 Actualizando archivo .env con nuevas configuraciones...');
  const existingEnv = fs.readFileSync(envPath, 'utf8');
  if (!existingEnv.includes('SHIPPING_API_URL')) {
    fs.appendFileSync(envPath, envConfig);
    console.log('✅ Configuraciones avanzadas agregadas al .env');
  } else {
    console.log('ℹ️  Las configuraciones avanzadas ya están presentes');
  }
}

// Crear directorios necesarios
const directories = [
  'logs',
  'logs/audit',
  'logs/metrics',
  'logs/ai',
  'data/exports',
  'data/cache'
];

directories.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Directorio creado: ${dir}`);
  }
});

// Crear archivo de configuración de servicios
const servicesConfig = {
  ai: {
    enabled: true,
    predictionModels: ['demand', 'inventory', 'seasonality'],
    confidenceThreshold: 0.85,
    updateInterval: 3600000 // 1 hora
  },
  metrics: {
    enabled: true,
    kpiCategories: ['inventory', 'financial', 'supplier', 'operational'],
    calculationInterval: 300000, // 5 minutos
    retentionDays: 90
  },
  integrations: {
    enabled: true,
    providers: {
      shipping: ['fedex', 'ups', 'dhl'],
      payment: ['stripe', 'paypal', 'bank_transfer'],
      market: ['competitor_prices', 'market_trends'],
      weather: ['forecast', 'current']
    },
    rateLimits: {
      shipping: { requests: 100, window: 60000 },
      payment: { requests: 50, window: 60000 },
      market: { requests: 200, window: 60000 },
      weather: { requests: 1000, window: 60000 }
    }
  },
  audit: {
    enabled: true,
    logLevels: ['data_access', 'data_modification', 'system_change', 'security'],
    retentionDays: 365,
    complianceRules: [
      {
        id: 'rule_001',
        name: 'Sensitive Data Access',
        type: 'data_access',
        severity: 'high',
        enabled: true
      },
      {
        id: 'rule_002',
        name: 'Bulk Data Export',
        type: 'data_access',
        severity: 'medium',
        enabled: true
      },
      {
        id: 'rule_003',
        name: 'System Configuration Changes',
        type: 'system_change',
        severity: 'critical',
        enabled: true
      }
    ]
  },
  notifications: {
    enabled: true,
    channels: ['email', 'sms', 'push', 'in_app'],
    templates: [
      {
        id: 'inventory_low_stock',
        name: 'Low Stock Alert',
        type: 'in_app',
        priority: 'high'
      },
      {
        id: 'inventory_stockout',
        name: 'Stockout Alert',
        type: 'in_app',
        priority: 'urgent'
      },
      {
        id: 'financial_low_margin',
        name: 'Low Profit Margin Alert',
        type: 'in_app',
        priority: 'medium'
      }
    ],
    rules: [
      {
        id: 'rule_stockout',
        name: 'Stockout Detection',
        conditions: [{ metric: 'stockout_rate', operator: 'gt', value: 0 }],
        actions: [{ template_id: 'inventory_stockout', channels: ['in_app', 'email'] }]
      },
      {
        id: 'rule_low_margin',
        name: 'Low Profit Margin',
        conditions: [{ metric: 'profit_margin', operator: 'lt', value: 15 }],
        actions: [{ template_id: 'financial_low_margin', channels: ['in_app'] }]
      }
    ]
  }
};

const configPath = path.join(process.cwd(), 'config', 'advanced-services.json');
if (!fs.existsSync(path.dirname(configPath))) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
}
fs.writeFileSync(configPath, JSON.stringify(servicesConfig, null, 2));
console.log('⚙️  Configuración de servicios avanzados creada');

console.log('\n🎉 ¡Inicialización completada exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('1. Configurar las claves de API en el archivo .env');
console.log('2. Ejecutar: npm run dev (para desarrollo)');
console.log('3. Acceder al dashboard en: http://localhost:3000/dashboard-advanced');
console.log('\n🚀 ¡El sistema de inteligencia de negocios está listo para usar!');
