# Application Insights Configuration - ECONEURA-IA

**Fecha:** 2025-01-09  
**Versión:** 1.0.0  
**Objetivo:** Configuración de Application Insights con endpoints EU y muestreo 10%

## 📋 RESUMEN EJECUTIVO

Este documento describe la configuración de Azure Application Insights para ECONEURA-IA, incluyendo endpoints de la UE, muestreo del 10%, y monitoreo completo de la aplicación.

## 🌍 CONFIGURACIÓN DE ENDPOINTS EU

### Endpoints de Application Insights
```json
{
  "endpoints": {
    "ingestion": "https://westeurope-5.in.applicationinsights.azure.com/",
    "liveMetrics": "https://westeurope-5.livediagnostics.monitor.azure.com/",
    "profiler": "https://westeurope-5.profiler.monitor.azure.com/",
    "snapshot": "https://westeurope-5.snapshot.monitor.azure.com/",
    "telemetry": "https://westeurope-5.dc.applicationinsights.azure.com/"
  },
  "region": "West Europe",
  "dataResidency": "EU",
  "compliance": ["GDPR", "ISO 27001"]
}
```

### Configuración Regional
```javascript
// apps/api/src/monitoring/insights.js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    
    // EU Endpoints
    endpointUrl: 'https://westeurope-5.in.applicationinsights.azure.com/',
    liveMetricsEndpoint: 'https://westeurope-5.livediagnostics.monitor.azure.com/',
    profilerEndpoint: 'https://westeurope-5.profiler.monitor.azure.com/',
    snapshotEndpoint: 'https://westeurope-5.snapshot.monitor.azure.com/',
    
    // Sampling Configuration
    samplingPercentage: 10, // 10% sampling as required
    maxBatchSize: 250,
    maxBatchIntervalMs: 15000,
    
    // Auto Route Tracking
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    maxAjaxCallsPerView: -1,
    
    // Error Tracking
    enableUnhandledPromiseRejectionTracking: true,
    enableErrorTracking: true,
    enableExceptionTracking: true,
    
    // Performance Tracking
    enablePerformanceTracking: true,
    enableDependencyTracking: true,
    enablePageViewTracking: true,
    enablePageViewPerformanceTracking: true,
    
    // Custom Properties
    customProperties: {
      'Application': 'ECONEURA-IA',
      'Version': process.env.npm_package_version || '1.0.0',
      'Environment': process.env.NODE_ENV || 'production',
      'Region': 'West Europe',
      'DataResidency': 'EU'
    }
  }
});

appInsights.loadAppInsights();
appInsights.trackPageView();

export { appInsights };
```

## 📊 CONFIGURACIÓN DE MUESTREO

### Sampling Configuration
```javascript
// apps/api/src/monitoring/sampling.js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class SamplingManager {
  constructor() {
    this.samplingPercentage = 10; // 10% sampling
    this.samplingRules = [
      {
        name: 'HighValueTransactions',
        percentage: 100, // Always sample high-value transactions
        conditions: [
          { field: 'name', operator: 'contains', value: '/api/payments' },
          { field: 'name', operator: 'contains', value: '/api/orders' }
        ]
      },
      {
        name: 'ErrorEvents',
        percentage: 100, // Always sample errors
        conditions: [
          { field: 'success', operator: 'equals', value: false }
        ]
      },
      {
        name: 'SlowRequests',
        percentage: 50, // Sample 50% of slow requests
        conditions: [
          { field: 'duration', operator: 'greaterThan', value: 2000 }
        ]
      },
      {
        name: 'DefaultSampling',
        percentage: 10, // Default 10% sampling
        conditions: []
      }
    ];
  }

  shouldSample(telemetry) {
    for (const rule of this.samplingRules) {
      if (this.matchesConditions(telemetry, rule.conditions)) {
        return Math.random() * 100 < rule.percentage;
      }
    }
    return Math.random() * 100 < this.samplingPercentage;
  }

  matchesConditions(telemetry, conditions) {
    if (conditions.length === 0) return true;
    
    return conditions.every(condition => {
      const value = this.getTelemetryValue(telemetry, condition.field);
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return value && value.toString().includes(condition.value);
        case 'greaterThan':
          return value > condition.value;
        case 'lessThan':
          return value < condition.value;
        default:
          return false;
      }
    });
  }

  getTelemetryValue(telemetry, field) {
    return telemetry[field] || telemetry.properties?.[field];
  }
}

export { SamplingManager };
```

### Adaptive Sampling
```javascript
// apps/api/src/monitoring/adaptive-sampling.js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

class AdaptiveSampling {
  constructor() {
    this.targetSamplingRate = 10; // 10% target
    this.currentSamplingRate = 10;
    this.minSamplingRate = 5;
    this.maxSamplingRate = 20;
    this.adjustmentInterval = 60000; // 1 minute
    this.lastAdjustment = Date.now();
  }

  adjustSamplingRate(telemetryCount, errorCount) {
    const now = Date.now();
    if (now - this.lastAdjustment < this.adjustmentInterval) {
      return;
    }

    const errorRate = errorCount / telemetryCount;
    const volumeRatio = telemetryCount / 1000; // Expected volume

    if (errorRate > 0.05) { // High error rate
      this.currentSamplingRate = Math.min(this.maxSamplingRate, this.currentSamplingRate * 1.2);
    } else if (volumeRatio > 1.5) { // High volume
      this.currentSamplingRate = Math.max(this.minSamplingRate, this.currentSamplingRate * 0.8);
    } else {
      this.currentSamplingRate = this.targetSamplingRate;
    }

    this.lastAdjustment = now;
    console.log(`Adjusted sampling rate to ${this.currentSamplingRate}%`);
  }

  getCurrentSamplingRate() {
    return this.currentSamplingRate;
  }
}

export { AdaptiveSampling };
```

## 🔍 CONFIGURACIÓN DE TELEMETRÍA

### Custom Telemetry
```javascript
// apps/api/src/monitoring/telemetry.js
import { appInsights } from './insights.js';

class TelemetryManager {
  constructor() {
    this.appInsights = appInsights;
  }

  // Track custom events
  trackEvent(name, properties = {}, measurements = {}) {
    this.appInsights.trackEvent({
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      },
      measurements
    });
  }

  // Track custom metrics
  trackMetric(name, value, properties = {}) {
    this.appInsights.trackMetric({
      name,
      value,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track dependencies
  trackDependency(name, commandName, duration, success, properties = {}) {
    this.appInsights.trackDependency({
      name,
      commandName,
      duration,
      success,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track exceptions
  trackException(exception, properties = {}) {
    this.appInsights.trackException({
      exception,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    });
  }

  // Track traces
  trackTrace(message, severityLevel = 1, properties = {}) {
    this.appInsights.trackTrace({
      message,
      severityLevel,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export { TelemetryManager };
```

### Business Metrics
```javascript
// apps/api/src/monitoring/business-metrics.js
import { TelemetryManager } from './telemetry.js';

class BusinessMetrics {
  constructor() {
    this.telemetry = new TelemetryManager();
  }

  // Track user actions
  trackUserAction(userId, action, properties = {}) {
    this.telemetry.trackEvent('UserAction', {
      userId,
      action,
      ...properties
    });
  }

  // Track AI agent usage
  trackAgentUsage(agentId, userId, duration, cost, success) {
    this.telemetry.trackEvent('AgentUsage', {
      agentId,
      userId,
      duration,
      cost,
      success
    }, {
      duration,
      cost
    });
  }

  // Track FinOps events
  trackFinOpsEvent(eventType, orgId, amount, threshold) {
    this.telemetry.trackEvent('FinOpsEvent', {
      eventType,
      orgId,
      amount,
      threshold
    }, {
      amount,
      threshold
    });
  }

  // Track API usage
  trackApiUsage(endpoint, method, duration, statusCode, userId) {
    this.telemetry.trackEvent('ApiUsage', {
      endpoint,
      method,
      statusCode,
      userId
    }, {
      duration
    });
  }

  // Track database operations
  trackDatabaseOperation(operation, table, duration, success) {
    this.telemetry.trackDependency(
      `Database-${operation}`,
      table,
      duration,
      success,
      { operation, table }
    );
  }

  // Track cache operations
  trackCacheOperation(operation, key, hit, duration) {
    this.telemetry.trackDependency(
      `Cache-${operation}`,
      key,
      duration,
      hit,
      { operation, key, hit }
    );
  }
}

export { BusinessMetrics };
```

## 📈 DASHBOARDS Y ALERTAS

### Dashboard Configuration
```json
{
  "dashboards": [
    {
      "name": "ECONEURA-IA Overview",
      "widgets": [
        {
          "type": "metric",
          "title": "Request Rate",
          "metric": "requests/count",
          "aggregation": "sum",
          "timeGrain": "PT1M"
        },
        {
          "type": "metric",
          "title": "Response Time",
          "metric": "requests/duration",
          "aggregation": "avg",
          "timeGrain": "PT1M"
        },
        {
          "type": "metric",
          "title": "Error Rate",
          "metric": "requests/failed",
          "aggregation": "avg",
          "timeGrain": "PT1M"
        },
        {
          "type": "metric",
          "title": "AI Agent Usage",
          "metric": "customEvents/count",
          "aggregation": "sum",
          "timeGrain": "PT1H",
          "filter": "name eq 'AgentUsage'"
        },
        {
          "type": "metric",
          "title": "FinOps Cost",
          "metric": "customEvents/count",
          "aggregation": "sum",
          "timeGrain": "PT1H",
          "filter": "name eq 'FinOpsEvent'"
        }
      ]
    }
  ]
}
```

### Alert Rules
```json
{
  "alertRules": [
    {
      "name": "High Error Rate",
      "description": "Alert when error rate exceeds 5%",
      "condition": {
        "metric": "requests/failed",
        "operator": "greaterThan",
        "threshold": 5,
        "timeWindow": "PT5M",
        "frequency": "PT1M"
      },
      "severity": "Warning",
      "actions": [
        {
          "type": "email",
          "recipients": ["alerts@econeura.com"]
        },
        {
          "type": "webhook",
          "url": "https://hooks.slack.com/services/..."
        }
      ]
    },
    {
      "name": "High Response Time",
      "description": "Alert when average response time exceeds 2 seconds",
      "condition": {
        "metric": "requests/duration",
        "operator": "greaterThan",
        "threshold": 2000,
        "timeWindow": "PT5M",
        "frequency": "PT1M"
      },
      "severity": "Warning",
      "actions": [
        {
          "type": "email",
          "recipients": ["alerts@econeura.com"]
        }
      ]
    },
    {
      "name": "FinOps Budget Exceeded",
      "description": "Alert when FinOps budget is exceeded",
      "condition": {
        "metric": "customEvents/count",
        "operator": "greaterThan",
        "threshold": 0,
        "timeWindow": "PT1M",
        "frequency": "PT1M",
        "filter": "name eq 'FinOpsEvent' and properties.eventType eq 'budget_exceeded'"
      },
      "severity": "Critical",
      "actions": [
        {
          "type": "email",
          "recipients": ["alerts@econeura.com", "finance@econeura.com"]
        },
        {
          "type": "webhook",
          "url": "https://hooks.slack.com/services/..."
        }
      ]
    }
  ]
}
```

## 🔧 CONFIGURACIÓN DE PERFORMANCE

### Performance Monitoring
```javascript
// apps/api/src/monitoring/performance.js
import { appInsights } from './insights.js';

class PerformanceMonitor {
  constructor() {
    this.appInsights = appInsights;
    this.startTimes = new Map();
  }

  // Start timing an operation
  startTiming(operationId, operationName) {
    this.startTimes.set(operationId, {
      startTime: Date.now(),
      operationName
    });
  }

  // End timing an operation
  endTiming(operationId, success = true, properties = {}) {
    const timing = this.startTimes.get(operationId);
    if (!timing) return;

    const duration = Date.now() - timing.startTime;
    
    this.appInsights.trackDependency({
      name: timing.operationName,
      commandName: operationId,
      duration,
      success,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    });

    this.startTimes.delete(operationId);
  }

  // Track memory usage
  trackMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    
    this.appInsights.trackMetric({
      name: 'Memory Usage',
      value: memoryUsage.heapUsed,
      properties: {
        type: 'heapUsed',
        timestamp: new Date().toISOString()
      }
    });

    this.appInsights.trackMetric({
      name: 'Memory Usage',
      value: memoryUsage.heapTotal,
      properties: {
        type: 'heapTotal',
        timestamp: new Date().toISOString()
      }
    });

    this.appInsights.trackMetric({
      name: 'Memory Usage',
      value: memoryUsage.external,
      properties: {
        type: 'external',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track CPU usage
  trackCpuUsage() {
    const cpuUsage = process.cpuUsage();
    
    this.appInsights.trackMetric({
      name: 'CPU Usage',
      value: cpuUsage.user,
      properties: {
        type: 'user',
        timestamp: new Date().toISOString()
      }
    });

    this.appInsights.trackMetric({
      name: 'CPU Usage',
      value: cpuUsage.system,
      properties: {
        type: 'system',
        timestamp: new Date().toISOString()
      }
    });
  }
}

export { PerformanceMonitor };
```

### Health Check Monitoring
```javascript
// apps/api/src/monitoring/health-check.js
import { TelemetryManager } from './telemetry.js';

class HealthCheckMonitor {
  constructor() {
    this.telemetry = new TelemetryManager();
    this.healthChecks = new Map();
  }

  // Register a health check
  registerHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
  }

  // Run all health checks
  async runHealthChecks() {
    const results = {};
    
    for (const [name, checkFunction] of this.healthChecks) {
      try {
        const startTime = Date.now();
        const result = await checkFunction();
        const duration = Date.now() - startTime;
        
        results[name] = {
          status: result.status,
          duration,
          timestamp: new Date().toISOString()
        };

        this.telemetry.trackEvent('HealthCheck', {
          name,
          status: result.status,
          duration
        });

        if (result.status !== 'healthy') {
          this.telemetry.trackException(new Error(`Health check failed: ${name}`), {
            healthCheck: name,
            status: result.status,
            message: result.message
          });
        }
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };

        this.telemetry.trackException(error, {
          healthCheck: name,
          status: 'error'
        });
      }
    }

    return results;
  }
}

export { HealthCheckMonitor };
```

## 📊 CONFIGURACIÓN DE LOGS

### Structured Logging
```javascript
// apps/api/src/monitoring/structured-logging.js
import { TelemetryManager } from './telemetry.js';

class StructuredLogger {
  constructor() {
    this.telemetry = new TelemetryManager();
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  log(level, message, properties = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...properties
    };

    // Send to Application Insights
    this.telemetry.trackTrace(message, this.getSeverityLevel(level), logEntry);

    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  getSeverityLevel(level) {
    const severityMap = {
      error: 4,
      warn: 3,
      info: 1,
      debug: 0
    };
    return severityMap[level] || 1;
  }

  error(message, properties = {}) {
    this.log('error', message, properties);
  }

  warn(message, properties = {}) {
    this.log('warn', message, properties);
  }

  info(message, properties = {}) {
    this.log('info', message, properties);
  }

  debug(message, properties = {}) {
    this.log('debug', message, properties);
  }
}

export { StructuredLogger };
```

## 🔍 CONFIGURACIÓN DE QUERIES

### KQL Queries
```kql
// Common queries for Application Insights

// Request rate over time
requests
| where timestamp > ago(1h)
| summarize count() by bin(timestamp, 1m)
| render timechart

// Response time percentiles
requests
| where timestamp > ago(1h)
| summarize percentiles(duration, 50, 90, 95, 99) by bin(timestamp, 1m)
| render timechart

// Error rate
requests
| where timestamp > ago(1h)
| summarize 
    total = count(),
    errors = countif(success == false)
| extend errorRate = errors * 100.0 / total
| render timechart

// AI Agent usage
customEvents
| where name == "AgentUsage"
| where timestamp > ago(24h)
| summarize count() by tostring(customDimensions.agentId)
| render piechart

// FinOps events
customEvents
| where name == "FinOpsEvent"
| where timestamp > ago(24h)
| summarize count() by tostring(customDimensions.eventType)
| render piechart

// Database performance
dependencies
| where type == "SQL"
| where timestamp > ago(1h)
| summarize avg(duration) by name
| render barchart

// Cache performance
dependencies
| where type == "Redis"
| where timestamp > ago(1h)
| summarize 
    avg(duration),
    count() by name
| render barchart

// User activity
customEvents
| where name == "UserAction"
| where timestamp > ago(24h)
| summarize count() by tostring(customDimensions.action)
| render barchart
```

## 🚀 DEPLOYMENT

### Azure CLI Configuration
```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app econeura-ia-insights \
  --location westeurope \
  --resource-group econeura-ia-rg \
  --application-type web \
  --kind web \
  --retention-time 90

# Get connection string
az monitor app-insights component show \
  --app econeura-ia-insights \
  --resource-group econeura-ia-rg \
  --query connectionString \
  --output tsv

# Configure sampling
az monitor app-insights component update \
  --app econeura-ia-insights \
  --resource-group econeura-ia-rg \
  --sampling-percentage 10
```

### ARM Template
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appInsightsName": {
      "type": "string",
      "defaultValue": "econeura-ia-insights"
    },
    "location": {
      "type": "string",
      "defaultValue": "West Europe"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Insights/components",
      "apiVersion": "2020-02-02",
      "name": "[parameters('appInsightsName')]",
      "location": "[parameters('location')]",
      "kind": "web",
      "properties": {
        "Application_Type": "web",
        "Request_Source": "rest",
        "RetentionInDays": 90,
        "SamplingPercentage": 10,
        "IngestionMode": "LogAnalytics"
      }
    }
  ]
}
```

## 📚 REFERENCIAS

- [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Application Insights EU Endpoints](https://docs.microsoft.com/en-us/azure/azure-monitor/app/custom-endpoints)
- [Sampling in Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/sampling)
- [Custom Events and Metrics](https://docs.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics)
- [KQL Query Language](https://docs.microsoft.com/en-us/azure/data-explorer/kusto/query/)
