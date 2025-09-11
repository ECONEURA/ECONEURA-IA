interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'threshold' | 'anomaly' | 'trend';
  threshold?: number;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';
  window: number; // en segundos
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  labels?: Record<string, string>;
  cooldown: number; // en segundos
}

interface Alert {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'acknowledged';
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  labels?: Record<string, string>;
  context?: Record<string, any>;
}

interface AlertNotification {
  id: string;
  alertId: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  payload: any;
}

class IntelligentAlertSystem {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private notifications: Map<string, AlertNotification> = new Map();
  private alertHistory: Map<string, { count: number; lastAlert: number }> = new Map();
  private readonly MAX_ALERTS = 1000;
  private readonly MAX_NOTIFICATIONS = 1000;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Reglas de error rate
    this.addRule({
      id: 'error-rate-high',
      name: 'High Error Rate',
      description: 'Error rate exceeds 5%',
      metric: 'error_rate',
      condition: 'threshold',
      threshold: 5,
      operator: 'gt',
      window: 300, // 5 minutos
      severity: 'high',
      enabled: true,
      cooldown: 300 // 5 minutos
    });

    // Reglas de latencia
    this.addRule({
      id: 'api-latency-high',
      name: 'High API Latency',
      description: 'API response time exceeds 2 seconds',
      metric: 'http_request_duration_ms',
      condition: 'threshold',
      threshold: 2000,
      operator: 'gt',
      window: 300,
      severity: 'medium',
      enabled: true,
      cooldown: 300
    });

    // Reglas de IA
    this.addRule({
      id: 'ai-cost-high',
      name: 'High AI Cost',
      description: 'AI cost exceeds €10 in the last hour',
      metric: 'ai_cost_total',
      condition: 'threshold',
      threshold: 10,
      operator: 'gt',
      window: 3600, // 1 hora
      severity: 'medium',
      enabled: true,
      cooldown: 1800 // 30 minutos
    });

    // Reglas de memoria
    this.addRule({
      id: 'memory-usage-high',
      name: 'High Memory Usage',
      description: 'Memory usage exceeds 80%',
      metric: 'memory_usage_bytes',
      condition: 'threshold',
      threshold: 0.8, // 80%
      operator: 'gt',
      window: 60,
      severity: 'high',
      enabled: true,
      cooldown: 300
    });

    // Reglas de health checks
    this.addRule({
      id: 'health-check-failing',
      name: 'Health Check Failing',
      description: 'Health checks are failing',
      metric: 'health_check_total',
      condition: 'threshold',
      threshold: 0,
      operator: 'eq',
      window: 60,
      severity: 'critical',
      enabled: true,
      cooldown: 60
    });
  }

  addRule(rule: AlertRule): void {
    // Validar regla antes de agregarla
    this.validateRule(rule);
    this.rules.set(rule.id, rule);
  }

  private validateRule(rule: AlertRule): void {
    if (!rule.id || !rule.name || !rule.description) {
      throw new Error('Rule must have id, name, and description');
    }
    
    if (!rule.metric) {
      throw new Error('Rule must specify a metric');
    }
    
    if (!['threshold', 'anomaly', 'trend'].includes(rule.condition)) {
      throw new Error('Rule condition must be threshold, anomaly, or trend');
    }
    
    if (!['gt', 'lt', 'gte', 'lte', 'eq', 'ne'].includes(rule.operator)) {
      throw new Error('Rule operator must be gt, lt, gte, lte, eq, or ne');
    }
    
    if (!['low', 'medium', 'high', 'critical'].includes(rule.severity)) {
      throw new Error('Rule severity must be low, medium, high, or critical');
    }
    
    if (rule.window <= 0) {
      throw new Error('Rule window must be greater than 0');
    }
    
    if (rule.cooldown < 0) {
      throw new Error('Rule cooldown must be non-negative');
    }
    
    if (rule.condition === 'threshold' && rule.threshold === undefined) {
      throw new Error('Threshold condition requires a threshold value');
    }
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Evaluar métricas contra reglas
  evaluateMetrics(metrics: any): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const metricValue = this.getMetricValue(metrics, rule.metric);
      if (metricValue === null) continue;

      const shouldAlert = this.evaluateCondition(rule, metricValue);
      
      if (shouldAlert && this.shouldCreateAlert(rule.id)) {
        const alert = this.createAlert(rule, metricValue);
        newAlerts.push(alert);
        this.alerts.set(alert.id, alert);
        
        // Crear notificación
        this.createNotification(alert);
      }
    }

    // Limpiar alertas antiguas
    this.cleanupOldAlerts();

    return newAlerts;
  }

  private getMetricValue(metrics: any, metricName: string): number | null {
    const metric = metrics[metricName];
    if (!metric) return null;

    // Para diferentes tipos de métricas
    if (metric.latest !== undefined) {
      return metric.latest;
    }
    if (metric.value !== undefined) {
      return metric.value;
    }
    if (metric.average !== undefined) {
      return metric.average;
    }

    return null;
  }

  private evaluateCondition(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'threshold':
        return this.evaluateThreshold(rule, value);
      case 'anomaly':
        return this.evaluateAnomaly(rule, value);
      case 'trend':
        return this.evaluateTrend(rule, value);
      default:
        return false;
    }
  }

  private evaluateThreshold(rule: AlertRule, value: number): boolean {
    const threshold = rule.threshold || 0;
    
    switch (rule.operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  private evaluateAnomaly(rule: AlertRule, value: number): boolean {
    // Implementación básica de detección de anomalías
    // En una implementación real, usaríamos algoritmos más sofisticados
    const threshold = rule.threshold || 0;
    const deviation = Math.abs(value - threshold) / threshold;
    
    return deviation > 0.5; // 50% de desviación
  }

  private evaluateTrend(rule: AlertRule, value: number): boolean {
    // Implementación básica de detección de tendencias
    // En una implementación real, usaríamos análisis de series temporales
    const threshold = rule.threshold || 0;
    
    // Simular tendencia creciente
    return value > threshold * 1.2; // 20% de incremento
  }

  private shouldCreateAlert(ruleId: string): boolean {
    const now = Date.now();
    const alert = this.alertHistory.get(ruleId);
    const rule = this.rules.get(ruleId);
    
    if (!rule) return false;

    if (!alert) {
      this.alertHistory.set(ruleId, { count: 1, lastAlert: now });
      return true;
    }

    // Verificar cooldown
    if (now - alert.lastAlert < rule.cooldown * 1000) {
      return false;
    }

    this.alertHistory.set(ruleId, { count: alert.count + 1, lastAlert: now });
    return true;
  }

  private createAlert(rule: AlertRule, value: number): Alert {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: alertId,
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'active',
      metric: rule.metric,
      value,
      threshold: rule.threshold || 0,
      timestamp: new Date().toISOString(),
      labels: rule.labels,
      context: {
        rule: rule.id,
        condition: rule.condition,
        operator: rule.operator,
        window: rule.window
      }
    };
  }

  private createNotification(alert: Alert): void {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: AlertNotification = {
      id: notificationId,
      alertId: alert.id,
      type: 'webhook', // Por defecto webhook, se puede extender
      status: 'pending',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      payload: {
        alert: alert,
        rule: this.rules.get(alert.ruleId),
        timestamp: new Date().toISOString()
      }
    };

    this.notifications.set(notificationId, notification);
    
    // Procesar notificación
    this.processNotification(notification);
  }

  private async processNotification(notification: AlertNotification): Promise<void> {
    try {
      // Simular envío de notificación
      await this.sendNotification(notification);
      
      notification.status = 'sent';
    } catch (error) {
      notification.status = 'failed';
      notification.retryCount++;
      
      // Reintentar si no se ha excedido el máximo
      if (notification.retryCount < notification.maxRetries) {
        setTimeout(() => {
          this.processNotification(notification);
        }, 5000 * notification.retryCount); // Backoff exponencial
      }
    }
  }

  private async sendNotification(notification: AlertNotification): Promise<void> {
    // Simular envío de notificación
    // En una implementación real, aquí se enviaría a Slack, email, webhook, etc.
    
    const alert = this.alerts.get(notification.alertId);
    if (!alert) return;

    const message = `🚨 ALERT: ${alert.name}\n` +
                   `Severity: ${alert.severity.toUpperCase()}\n` +
                   `Metric: ${alert.metric} = ${alert.value}\n` +
                   `Threshold: ${alert.threshold}\n` +
                   `Time: ${alert.timestamp}\n` +
                   `Description: ${alert.description}`;

    
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Métodos para gestionar alertas
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  getAlertsBySeverity(severity: string): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.severity === severity);
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;

    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();

    return true;
  }

  // Métodos para obtener estadísticas
  getAlertStats(): any {
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(a => a.status === 'active');
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged');

    return {
      total: alerts.length,
      active: activeAlerts.length,
      resolved: resolvedAlerts.length,
      acknowledged: acknowledgedAlerts.length,
      bySeverity: {
        low: alerts.filter(a => a.severity === 'low').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        high: alerts.filter(a => a.severity === 'high').length,
        critical: alerts.filter(a => a.severity === 'critical').length
      },
      byStatus: {
        active: activeAlerts.length,
        resolved: resolvedAlerts.length,
        acknowledged: acknowledgedAlerts.length
      }
    };
  }

  getNotificationStats(): any {
    const notifications = Array.from(this.notifications.values());
    
    return {
      total: notifications.length,
      pending: notifications.filter(n => n.status === 'pending').length,
      sent: notifications.filter(n => n.status === 'sent').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      byType: {
        email: notifications.filter(n => n.type === 'email').length,
        slack: notifications.filter(n => n.type === 'slack').length,
        webhook: notifications.filter(n => n.type === 'webhook').length,
        sms: notifications.filter(n => n.type === 'sms').length
      }
    };
  }

  // Limpieza de datos antiguos
  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 horas
    
    for (const [alertId, alert] of this.alerts) {
      const alertTime = new Date(alert.timestamp).getTime();
      if (alertTime < cutoff && alert.status !== 'active') {
        this.alerts.delete(alertId);
      }
    }

    // Limpiar notificaciones antiguas
    for (const [notificationId, notification] of this.notifications) {
      const notificationTime = new Date(notification.timestamp).getTime();
      if (notificationTime < cutoff) {
        this.notifications.delete(notificationId);
      }
    }
  }

  // Método para evaluar métricas en tiempo real
  evaluateMetricsRealtime(metrics: any): Alert[] {
    return this.evaluateMetrics(metrics);
  }

  // Método para configurar reglas dinámicamente
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.set(ruleId, { ...rule, ...updates });
    return true;
  }
}

export const alertSystem = new IntelligentAlertSystem();

