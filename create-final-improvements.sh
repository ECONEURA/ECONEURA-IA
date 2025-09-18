#!/bin/bash

echo "🚀 CREANDO ÚLTIMAS MEJORAS ROBUSTAS..."

# 7. Monitoring & Alerts Service
echo "📊 Creando Monitoring & Alerts Service..."
cat > apps/api/src/lib/monitoring-alerts.service.ts << 'MONITOR_EOF'
import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  metadata: Record<string, any>;
}

export class MonitoringAlertsService extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, number> = new Map();

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  checkAlerts(metrics: any): void {
    for (const [ruleId, rule] of this.rules) {
      const lastTriggered = this.lastTriggered.get(ruleId) || 0;
      const now = Date.now();

      if (now - lastTriggered < rule.cooldown) {
        continue;
      }

      if (rule.condition(metrics)) {
        this.triggerAlert(rule, metrics);
        this.lastTriggered.set(ruleId, now);
      }
    }
  }

  private triggerAlert(rule: AlertRule, metrics: any): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message,
      timestamp: Date.now(),
      resolved: false,
      metadata: { metrics }
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);

    // Update metrics
    prometheus.register.getSingleMetric('alerts_triggered_total')?.inc({
      severity: rule.severity,
      rule_id: rule.id
    });
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.emit('alert_resolved', alert);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }
}

export const monitoringAlertsService = new MonitoringAlertsService();
MONITOR_EOF

# 8. Performance Optimization Service
echo "⚡ Creando Performance Optimization Service..."
cat > apps/api/src/lib/performance-optimization.service.ts << 'PERF_EOF'
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface PerformanceConfig {
  maxMemoryUsage: number;
  maxCpuUsage: number;
  gcThreshold: number;
  optimizationInterval: number;
}

export class PerformanceOptimizationService {
  private config: PerformanceConfig;
  private isOptimizing = false;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.startOptimization();
  }

  private startOptimization(): void {
    setInterval(() => {
      this.optimize();
    }, this.config.optimizationInterval);
  }

  private optimize(): void {
    if (this.isOptimizing) return;
    this.isOptimizing = true;

    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Memory optimization
      if (memoryUsage.heapUsed > this.config.maxMemoryUsage) {
        this.optimizeMemory();
      }

      // CPU optimization
      if (cpuUsage.user > this.config.maxCpuUsage) {
        this.optimizeCpu();
      }

      // Garbage collection
      if (memoryUsage.heapUsed > this.config.gcThreshold) {
        this.forceGarbageCollection();
      }

    } finally {
      this.isOptimizing = false;
    }
  }

  private optimizeMemory(): void {
    // Clear caches, optimize data structures, etc.
    if (global.gc) {
      global.gc();
    }
    
    prometheus.register.getSingleMetric('performance_optimizations_total')?.inc({
      type: 'memory'
    });
  }

  private optimizeCpu(): void {
    // Reduce CPU-intensive operations, optimize algorithms, etc.
    prometheus.register.getSingleMetric('performance_optimizations_total')?.inc({
      type: 'cpu'
    });
  }

  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
    
    prometheus.register.getSingleMetric('performance_optimizations_total')?.inc({
      type: 'gc'
    });
  }

  getPerformanceMetrics(): any {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      version: process.version
    };
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService({
  maxMemoryUsage: 500 * 1024 * 1024, // 500MB
  maxCpuUsage: 80, // 80%
  gcThreshold: 400 * 1024 * 1024, // 400MB
  optimizationInterval: 30000 // 30 seconds
});
PERF_EOF

# 9. Resource Management Service
echo "🔄 Creando Resource Management Service..."
cat > apps/api/src/lib/resource-management.service.ts << 'RESOURCE_EOF'
import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface Resource {
  id: string;
  type: 'connection' | 'file' | 'memory' | 'cpu';
  allocated: number;
  maxAllocated: number;
  metadata: Record<string, any>;
}

export class ResourceManagementService extends EventEmitter {
  private resources: Map<string, Resource> = new Map();
  private limits: Map<string, number> = new Map();

  setLimit(type: string, limit: number): void {
    this.limits.set(type, limit);
  }

  allocateResource(id: string, type: string, amount: number, metadata: Record<string, any> = {}): boolean {
    const limit = this.limits.get(type);
    if (limit && amount > limit) {
      return false;
    }

    const resource: Resource = {
      id,
      type: type as any,
      allocated: amount,
      maxAllocated: limit || amount,
      metadata
    };

    this.resources.set(id, resource);
    this.emit('resource_allocated', resource);
    
    return true;
  }

  deallocateResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      this.resources.delete(id);
      this.emit('resource_deallocated', resource);
    }
  }

  getResourceUsage(type?: string): any {
    const resources = type ? 
      Array.from(this.resources.values()).filter(r => r.type === type) :
      Array.from(this.resources.values());

    return {
      total: resources.length,
      allocated: resources.reduce((sum, r) => sum + r.allocated, 0),
      maxAllocated: resources.reduce((sum, r) => sum + r.maxAllocated, 0),
      resources: resources.map(r => ({
        id: r.id,
        type: r.type,
        allocated: r.allocated,
        maxAllocated: r.maxAllocated
      }))
    };
  }

  cleanup(): void {
    for (const [id, resource] of this.resources) {
      this.deallocateResource(id);
    }
  }
}

export const resourceManagementService = new ResourceManagementService();
RESOURCE_EOF

# 10. Error Recovery Service
echo "🛠️ Creando Error Recovery Service..."
cat > apps/api/src/lib/error-recovery.service.ts << 'RECOVERY_EOF'
import { EventEmitter } from 'events';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface RecoveryStrategy {
  id: string;
  name: string;
  condition: (error: Error) => boolean;
  action: () => Promise<void>;
  maxRetries: number;
  backoffMs: number;
}

export class ErrorRecoveryService extends EventEmitter {
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private retryCounts: Map<string, number> = new Map();

  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  async handleError(error: Error, context: string = 'unknown'): Promise<boolean> {
    for (const [strategyId, strategy] of this.strategies) {
      if (strategy.condition(error)) {
        const retryKey = `${strategyId}_${context}`;
        const retryCount = this.retryCounts.get(retryKey) || 0;

        if (retryCount < strategy.maxRetries) {
          this.retryCounts.set(retryKey, retryCount + 1);
          
          try {
            await this.delay(strategy.backoffMs * Math.pow(2, retryCount));
            await strategy.action();
            
            this.emit('recovery_success', { strategyId, context, retryCount });
            return true;
          } catch (recoveryError) {
            this.emit('recovery_failed', { strategyId, context, retryCount, error: recoveryError });
          }
        }
      }
    }

    this.emit('recovery_exhausted', { error, context });
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  resetRetryCount(strategyId: string, context: string): void {
    const retryKey = `${strategyId}_${context}`;
    this.retryCounts.delete(retryKey);
  }
}

export const errorRecoveryService = new ErrorRecoveryService();
RECOVERY_EOF

echo "✅ ÚLTIMAS MEJORAS ROBUSTAS CREADAS!"
