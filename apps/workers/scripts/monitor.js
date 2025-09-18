#!/usr/bin/env node

/**
 * Real-time Monitoring Script for ECONEURA Workers
 * 
 * This script provides real-time monitoring of:
 * - System performance metrics
 * - Email processing statistics
 * - Cron job execution status
 * - Redis connection health
 * - Error rates and trends
 */

import { performance } from 'perf_hooks';
import http from 'http';
import { promisify } from 'util';

class WorkersMonitor {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
    this.interval = options.interval || 5000; // 5 seconds
    this.isRunning = false;
    this.metrics = {
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      emailProcessed: 0,
      cronExecutions: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
    this.alerts = [];
  }

  async start() {
    console.log('🔍 Starting ECONEURA Workers Real-time Monitor...\n');
    console.log(`📡 Monitoring: ${this.baseUrl}`);
    console.log(`⏱️  Interval: ${this.interval}ms`);
    console.log('Press Ctrl+C to stop\n');

    this.isRunning = true;
    this.displayHeader();

    // Start monitoring loop
    while (this.isRunning) {
      try {
        await this.collectMetrics();
        this.displayMetrics();
        this.checkAlerts();
        await this.sleep(this.interval);
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
        this.metrics.errors++;
        await this.sleep(this.interval);
      }
    }
  }

  stop() {
    console.log('\n🛑 Stopping monitor...');
    this.isRunning = false;
    this.displaySummary();
  }

  async collectMetrics() {
    const startTime = performance.now();
    
    try {
      // Collect health metrics
      const healthData = await this.fetchEndpoint('/health');
      if (healthData.success) {
        this.metrics.uptime = healthData.data.uptime;
        this.metrics.redis = healthData.data.redis;
        this.metrics.jobQueue = healthData.data.jobQueue;
      }

      // Collect cron job statistics
      const cronStats = await this.fetchEndpoint('/cron/stats');
      if (cronStats.success) {
        this.metrics.cronStats = cronStats.data.stats;
      }

      // Collect Prometheus metrics
      const prometheusMetrics = await this.fetchEndpoint('/metrics');
      if (prometheusMetrics) {
        this.parsePrometheusMetrics(prometheusMetrics);
      }

      // Calculate response time
      const responseTime = performance.now() - startTime;
      this.metrics.responseTimes.push(responseTime);
      this.metrics.averageResponseTime = this.calculateAverage(this.metrics.responseTimes);
      
      // Keep only last 100 response times
      if (this.metrics.responseTimes.length > 100) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
      }

      this.metrics.requests++;

    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  async fetchEndpoint(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const startTime = performance.now();

      const req = http.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const responseTime = performance.now() - startTime;
          
          try {
            if (path === '/metrics') {
              resolve(data);
            } else {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            }
          } catch (error) {
            reject(new Error(`Failed to parse response from ${path}: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed for ${path}: ${error.message}`));
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error(`Request timeout for ${path}`));
      });
    });
  }

  parsePrometheusMetrics(metricsText) {
    const lines = metricsText.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('econeura_emails_processed_total')) {
        const match = line.match(/econeura_emails_processed_total\{[^}]*\} (\d+)/);
        if (match) {
          this.metrics.emailProcessed = parseInt(match[1]);
        }
      }
      
      if (line.startsWith('econeura_cron_jobs_executed_total')) {
        const match = line.match(/econeura_cron_jobs_executed_total\{[^}]*\} (\d+)/);
        if (match) {
          this.metrics.cronExecutions = parseInt(match[1]);
        }
      }
    }
  }

  calculateAverage(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  displayHeader() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ECONEURA WORKERS REAL-TIME MONITOR                      ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log('║  Status: 🟢 Running  |  Uptime: Calculating...  |  Last Update: Now        ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  }

  displayMetrics() {
    const now = new Date();
    const uptime = this.metrics.uptime ? Math.floor(this.metrics.uptime) : 0;
    const errorRate = this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0;
    
    // Clear screen and display updated metrics
    process.stdout.write('\x1B[2J\x1B[0f');
    
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ECONEURA WORKERS REAL-TIME MONITOR                      ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  Status: 🟢 Running  |  Uptime: ${uptime}s  |  Last Update: ${now.toLocaleTimeString()}  ║`);
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

    // System Metrics
    console.log('📊 SYSTEM METRICS');
    console.log('─────────────────');
    console.log(`Requests: ${this.metrics.requests} | Errors: ${this.metrics.errors} | Error Rate: ${errorRate}%`);
    console.log(`Avg Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Redis Status: ${this.metrics.redis || 'Unknown'}`);
    console.log('');

    // Job Queue Metrics
    if (this.metrics.jobQueue) {
      console.log('🔄 JOB QUEUE');
      console.log('────────────');
      console.log(`Total: ${this.metrics.jobQueue.total} | Pending: ${this.metrics.jobQueue.pending} | Processing: ${this.metrics.jobQueue.processing}`);
      console.log(`Completed: ${this.metrics.jobQueue.completed} | Failed: ${this.metrics.jobQueue.failed}`);
      console.log('');
    }

    // Cron Job Metrics
    if (this.metrics.cronStats) {
      console.log('⏰ CRON JOBS');
      console.log('────────────');
      console.log(`Total: ${this.metrics.cronStats.total} | Enabled: ${this.metrics.cronStats.enabled} | Disabled: ${this.metrics.cronStats.disabled}`);
      console.log(`Total Runs: ${this.metrics.cronStats.totalRuns} | Total Errors: ${this.metrics.cronStats.totalErrors}`);
      console.log('');
    }

    // Email Processing Metrics
    console.log('📧 EMAIL PROCESSING');
    console.log('───────────────────');
    console.log(`Emails Processed: ${this.metrics.emailProcessed}`);
    console.log(`Cron Executions: ${this.metrics.cronExecutions}`);
    console.log('');

    // Alerts
    if (this.alerts.length > 0) {
      console.log('🚨 ACTIVE ALERTS');
      console.log('────────────────');
      this.alerts.slice(-5).forEach(alert => {
        const timestamp = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`[${timestamp}] ${alert.message}`);
      });
      console.log('');
    }

    // Performance Graph (simple ASCII)
    this.displayPerformanceGraph();
  }

  displayPerformanceGraph() {
    console.log('📈 RESPONSE TIME TREND (last 20 samples)');
    console.log('─────────────────────────────────────────');
    
    const recentTimes = this.metrics.responseTimes.slice(-20);
    if (recentTimes.length === 0) {
      console.log('No data available');
      return;
    }

    const maxTime = Math.max(...recentTimes);
    const minTime = Math.min(...recentTimes);
    const range = maxTime - minTime || 1;

    const graph = recentTimes.map(time => {
      const normalized = (time - minTime) / range;
      const barLength = Math.floor(normalized * 20);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      return `${time.toFixed(1)}ms │${bar}│`;
    });

    graph.forEach(line => console.log(line));
    console.log('');
  }

  checkAlerts() {
    const now = Date.now();

    // High error rate alert
    if (this.metrics.requests > 10) {
      const errorRate = (this.metrics.errors / this.metrics.requests) * 100;
      if (errorRate > 10) {
        this.addAlert('High error rate detected', 'error', errorRate.toFixed(2) + '%');
      }
    }

    // High response time alert
    if (this.metrics.averageResponseTime > 1000) {
      this.addAlert('High response time detected', 'warning', this.metrics.averageResponseTime.toFixed(2) + 'ms');
    }

    // Redis connection alert
    if (this.metrics.redis && this.metrics.redis !== 'connected') {
      this.addAlert('Redis connection issue', 'error', this.metrics.redis);
    }

    // Job queue backlog alert
    if (this.metrics.jobQueue && this.metrics.jobQueue.pending > 100) {
      this.addAlert('Job queue backlog', 'warning', this.metrics.jobQueue.pending + ' pending jobs');
    }

    // Clean old alerts (older than 5 minutes)
    this.alerts = this.alerts.filter(alert => now - alert.timestamp < 5 * 60 * 1000);
  }

  addAlert(message, type, value) {
    const alert = {
      timestamp: Date.now(),
      message: `${type.toUpperCase()}: ${message} (${value})`,
      type,
      value
    };

    // Avoid duplicate alerts
    const recentAlert = this.alerts.find(a => 
      a.message === alert.message && 
      Date.now() - a.timestamp < 30000 // 30 seconds
    );

    if (!recentAlert) {
      this.alerts.push(alert);
    }
  }

  displaySummary() {
    const totalTime = Date.now() - this.metrics.startTime;
    const totalMinutes = Math.floor(totalTime / 60000);
    const totalSeconds = Math.floor((totalTime % 60000) / 1000);
    
    console.log('\n📊 MONITORING SESSION SUMMARY');
    console.log('═══════════════════════════════');
    console.log(`Duration: ${totalMinutes}m ${totalSeconds}s`);
    console.log(`Total Requests: ${this.metrics.requests}`);
    console.log(`Total Errors: ${this.metrics.errors}`);
    console.log(`Error Rate: ${this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0}%`);
    console.log(`Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Emails Processed: ${this.metrics.emailProcessed}`);
    console.log(`Cron Executions: ${this.metrics.cronExecutions}`);
    console.log(`Alerts Generated: ${this.alerts.length}`);
    console.log('\n👋 Monitoring session ended. Goodbye!');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  if (global.monitor) {
    global.monitor.stop();
  }
  process.exit(0);
});

// Run monitor if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = {
    baseUrl: process.env.WORKERS_URL || 'http://localhost:3001',
    interval: parseInt(process.env.MONITOR_INTERVAL) || 5000
  };

  const monitor = new WorkersMonitor(options);
  global.monitor = monitor;
  monitor.start().catch(console.error);
}

export default WorkersMonitor;
