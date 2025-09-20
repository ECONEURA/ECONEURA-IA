#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      memory: [],
      cpu: [],
      responseTime: [],
      timestamp: Date.now()
    };
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.memory.push({
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      timestamp: Date.now()
    });

    this.metrics.cpu.push({
      user: cpuUsage.user,
      system: cpuUsage.system,
      timestamp: Date.now()
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        memoryPeak: Math.max(...this.metrics.memory.map(m => m.heapUsed)),
        memoryAverage: this.metrics.memory.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memory.length,
        cpuAverage: this.metrics.cpu.reduce((sum, c) => sum + c.user, 0) / this.metrics.cpu.length
      },
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('performance-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Reporte de rendimiento generado: performance-report.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.memory.length > 0) {
      const avgMemory = this.metrics.memory.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memory.length;
      
      if (avgMemory > 100 * 1024 * 1024) { // 100MB
        recommendations.push({
          type: 'memory',
          message: 'Alto uso de memoria detectado. Considerar optimización de caché.',
          priority: 'high'
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        message: 'Rendimiento dentro de parámetros normales.',
        priority: 'low'
      });
    }

    return recommendations;
  }
}

// Ejecutar monitoreo si se llama directamente
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  
  console.log('🔍 Iniciando monitoreo de rendimiento...');
  
  // Recolectar métricas cada 5 segundos
  const interval = setInterval(() => {
    monitor.collectMetrics();
  }, 5000);

  // Generar reporte después de 30 segundos
  setTimeout(() => {
    clearInterval(interval);
    monitor.generateReport();
    process.exit(0);
  }, 30000);
}

module.exports = PerformanceMonitor;
