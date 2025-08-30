import { logger } from "./logger.js";

interface AlertConfig {
  budgetThreshold: number; // Porcentaje del presupuesto
  errorRateThreshold: number; // Porcentaje de errores
  latencyThreshold: number; // Latencia en ms
  rateLimitThreshold: number; // Número de rate limits
}

class AlertSystem {
  private config: AlertConfig = {
    budgetThreshold: 80, // 80% del presupuesto
    errorRateThreshold: 10, // 10% de errores
    latencyThreshold: 5000, // 5 segundos
    rateLimitThreshold: 5 // 5 rate limits por minuto
  };

  private alertHistory: Map<string, { count: number; lastAlert: number }> = new Map();
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutos

  private shouldAlert(alertKey: string): boolean {
    const now = Date.now();
    const alert = this.alertHistory.get(alertKey);
    
    if (!alert) {
      this.alertHistory.set(alertKey, { count: 1, lastAlert: now });
      return true;
    }

    if (now - alert.lastAlert > this.ALERT_COOLDOWN) {
      this.alertHistory.set(alertKey, { count: alert.count + 1, lastAlert: now });
      return true;
    }

    return false;
  }

  budgetAlert(org: string, current: number, limit: number): void {
    const percentage = (current / limit) * 100;
    if (percentage >= this.config.budgetThreshold) {
      const alertKey = `budget:${org}`;
      if (this.shouldAlert(alertKey)) {
        logger.warn(`🚨 BUDGET ALERT: ${org} has used ${percentage.toFixed(1)}% of budget (€${current.toFixed(2)}/${limit.toFixed(2)})`);
        this.sendNotification('budget', {
          org,
          current: current.toFixed(2),
          limit: limit.toFixed(2),
          percentage: percentage.toFixed(1)
        });
      }
    }
  }

  errorRateAlert(errorRate: number): void {
    if (errorRate >= this.config.errorRateThreshold) {
      const alertKey = 'error_rate';
      if (this.shouldAlert(alertKey)) {
        logger.error(`🚨 ERROR RATE ALERT: ${errorRate.toFixed(1)}% error rate detected`);
        this.sendNotification('error_rate', {
          errorRate: errorRate.toFixed(1),
          threshold: this.config.errorRateThreshold
        });
      }
    }
  }

  latencyAlert(latency: number, endpoint: string): void {
    if (latency >= this.config.latencyThreshold) {
      const alertKey = `latency:${endpoint}`;
      if (this.shouldAlert(alertKey)) {
        logger.warn(`🚨 LATENCY ALERT: ${endpoint} took ${latency}ms to respond`);
        this.sendNotification('latency', {
          endpoint,
          latency,
          threshold: this.config.latencyThreshold
        });
      }
    }
  }

  rateLimitAlert(org: string, count: number): void {
    if (count >= this.config.rateLimitThreshold) {
      const alertKey = `rate_limit:${org}`;
      if (this.shouldAlert(alertKey)) {
        logger.warn(`🚨 RATE LIMIT ALERT: ${org} hit rate limit ${count} times`);
        this.sendNotification('rate_limit', {
          org,
          count,
          threshold: this.config.rateLimitThreshold
        });
      }
    }
  }

  private sendNotification(type: string, data: any): void {
    // Aquí se integraría con sistemas de notificación (Slack, email, etc.)
    const notification = {
      type,
      timestamp: new Date().toISOString(),
      data,
      severity: type === 'error_rate' ? 'high' : 'medium'
    };

    // Por ahora solo log, pero se puede extender
    logger.info(`📢 Notification sent: ${JSON.stringify(notification)}`);
    
    // TODO: Integrar con Slack, email, webhook, etc.
    // await this.sendToSlack(notification);
    // await this.sendEmail(notification);
    // await this.sendWebhook(notification);
  }

  // Método para configurar alertas
  updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Alert configuration updated', this.config);
  }

  // Método para obtener estadísticas de alertas
  getAlertStats(): any {
    const stats: any = {};
    for (const [key, value] of this.alertHistory.entries()) {
      stats[key] = {
        count: value.count,
        lastAlert: new Date(value.lastAlert).toISOString()
      };
    }
    return stats;
  }
}

export const alertSystem = new AlertSystem();
