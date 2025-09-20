/**
 * PR-66: Dunning Sólido Service
 * 
 * Sistema robusto de dunning con segmentos KPIs y retries DLQ
 * Incluye gestión de colas de mensajes muertos y métricas avanzadas
 */

import { structuredLogger } from './structured-logger.js';

export interface DunningSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    overdueDays: {
      min: number;
      max: number;
    };
    amountRange: {
      min: number;
      max: number;
    };
    customerType: 'individual' | 'business' | 'both';
    riskLevel: 'low' | 'medium' | 'high';
    industry?: string[];
    region?: string[];
  };
  strategy: {
    maxRetries: number;
    retryInterval: number; // en horas
    escalationSteps: number;
    communicationChannels: ('email' | 'sms' | 'call' | 'letter')[];
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  kpis: {
    targetCollectionRate: number; // porcentaje
    targetResponseTime: number; // en horas
    maxDunningDuration: number; // en días
    acceptableFailureRate: number; // porcentaje
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DunningKPI {
  id: string;
  segmentId: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  timestamp: string;
  status: 'on_target' | 'below_target' | 'above_target' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  metadata: Record<string, any>;
}

export interface DLQMessage {
  id: string;
  originalMessageId: string;
  queueName: string;
  messageType: 'dunning_step' | 'escalation' | 'notification' | 'retry';
  payload: Record<string, any>;
  failureReason: string;
  retryCount: number;
  maxRetries: number;
  firstFailureAt: string;
  lastFailureAt: string;
  nextRetryAt: string;
  status: 'pending' | 'processing' | 'retried' | 'dead' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  metadata: Record<string, any>;
}

export interface DunningRetry {
  id: string;
  messageId: string;
  attemptNumber: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryStrategy: 'immediate' | 'exponential_backoff' | 'linear' | 'custom';
  backoffMultiplier: number;
  maxBackoffTime: number; // en minutos
  metadata: Record<string, any>;
}

export interface DunningStats {
  totalInvoices: number;
  overdueInvoices: number;
  collectedAmount: number;
  pendingAmount: number;
  collectionRate: number;
  averageCollectionTime: number;
  segmentStats: Record<string, {
    invoices: number;
    collected: number;
    pending: number;
    rate: number;
    avgTime: number;
  }>;
  dlqStats: {
    totalMessages: number;
    pendingRetries: number;
    deadMessages: number;
    retrySuccessRate: number;
    avgRetryTime: number;
  };
  kpiStats: {
    onTarget: number;
    belowTarget: number;
    aboveTarget: number;
    critical: number;
  };
  lastUpdated: string;
}

export interface DunningConfig {
  enabled: boolean;
  maxRetries: number;
  retryIntervals: number[]; // en horas
  dlqRetentionDays: number;
  kpiCalculationInterval: number; // en minutos
  autoEscalation: boolean;
  escalationThresholds: {
    collectionRate: number;
    responseTime: number;
    failureRate: number;
  };
  notificationEnabled: boolean;
  segments: DunningSegment[];
}

export class DunningSolidService {
  private config: DunningConfig;
  private segments: Map<string, DunningSegment> = new Map();
  private kpis: Map<string, DunningKPI> = new Map();
  private dlqMessages: Map<string, DLQMessage> = new Map();
  private retries: Map<string, DunningRetry> = new Map();
  private stats: DunningStats;
  private kpiCalculationInterval: NodeJS.Timeout | null = null;
  private dlqProcessingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<DunningConfig> = {}) {
    this.config = {
      enabled: true,
      maxRetries: 5,
      retryIntervals: [1, 6, 24, 72, 168], // 1h, 6h, 1d, 3d, 1w
      dlqRetentionDays: 30,
      kpiCalculationInterval: 60, // 1 hora
      autoEscalation: true,
      escalationThresholds: {
        collectionRate: 0.8, // 80%
        responseTime: 24, // 24 horas
        failureRate: 0.1 // 10%
      },
      notificationEnabled: true,
      segments: [],
      ...config
    };

    this.stats = {
      totalInvoices: 0,
      overdueInvoices: 0,
      collectedAmount: 0,
      pendingAmount: 0,
      collectionRate: 0,
      averageCollectionTime: 0,
      segmentStats: {},
      dlqStats: {
        totalMessages: 0,
        pendingRetries: 0,
        deadMessages: 0,
        retrySuccessRate: 0,
        avgRetryTime: 0
      },
      kpiStats: {
        onTarget: 0,
        belowTarget: 0,
        aboveTarget: 0,
        critical: 0
      },
      lastUpdated: new Date().toISOString()
    };

    this.initializeDefaultSegments();
    this.startKpiCalculation();
    this.startDLQProcessing();
    
    // Generar KPIs iniciales
    this.calculateKPIs();
    
    structuredLogger.info('Dunning Solid service initialized', {
      config: this.config,
      requestId: ''
    });
  }

  private initializeDefaultSegments(): void {
    const defaultSegments: DunningSegment[] = [
      {
        id: 'segment_001',
        name: 'Low Risk - Small Amounts',
        description: 'Customers with low risk and small overdue amounts',
        criteria: {
          overdueDays: { min: 1, max: 30 },
          amountRange: { min: 0, max: 1000 },
          customerType: 'both',
          riskLevel: 'low'
        },
        strategy: {
          maxRetries: 3,
          retryInterval: 24,
          escalationSteps: 2,
          communicationChannels: ['email', 'sms'],
          priority: 'low'
        },
        kpis: {
          targetCollectionRate: 0.85,
          targetResponseTime: 48,
          maxDunningDuration: 30,
          acceptableFailureRate: 0.05
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'segment_002',
        name: 'Medium Risk - Medium Amounts',
        description: 'Customers with medium risk and medium overdue amounts',
        criteria: {
          overdueDays: { min: 31, max: 90 },
          amountRange: { min: 1001, max: 10000 },
          customerType: 'both',
          riskLevel: 'medium'
        },
        strategy: {
          maxRetries: 4,
          retryInterval: 12,
          escalationSteps: 3,
          communicationChannels: ['email', 'call', 'sms'],
          priority: 'medium'
        },
        kpis: {
          targetCollectionRate: 0.75,
          targetResponseTime: 24,
          maxDunningDuration: 45,
          acceptableFailureRate: 0.1
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'segment_003',
        name: 'High Risk - Large Amounts',
        description: 'Customers with high risk and large overdue amounts',
        criteria: {
          overdueDays: { min: 91, max: 365 },
          amountRange: { min: 10001, max: 100000 },
          customerType: 'both',
          riskLevel: 'high'
        },
        strategy: {
          maxRetries: 5,
          retryInterval: 6,
          escalationSteps: 4,
          communicationChannels: ['call', 'letter', 'email'],
          priority: 'high'
        },
        kpis: {
          targetCollectionRate: 0.6,
          targetResponseTime: 12,
          maxDunningDuration: 60,
          acceptableFailureRate: 0.15
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultSegments.forEach(segment => {
      this.segments.set(segment.id, segment);
    });

    structuredLogger.info('Default dunning segments initialized', {
      segmentCount: defaultSegments.length,
      requestId: ''
    });
  }

  private startKpiCalculation(): void {
    if (!this.config.enabled) return;

    this.kpiCalculationInterval = setInterval(() => {
      this.calculateKPIs();
    }, this.config.kpiCalculationInterval * 60 * 1000);

    structuredLogger.info('KPI calculation process started', {
      interval: `${this.config.kpiCalculationInterval} minutes`,
      requestId: ''
    });
  }

  private startDLQProcessing(): void {
    if (!this.config.enabled) return;

    this.dlqProcessingInterval = setInterval(() => {
      this.processDLQMessages();
    }, 5 * 60 * 1000); // Cada 5 minutos

    structuredLogger.info('DLQ processing started', {
      interval: '5 minutes',
      requestId: ''
    });
  }

  async createSegment(segment: Omit<DunningSegment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DunningSegment> {
    const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newSegment: DunningSegment = {
      ...segment,
      id: segmentId,
      createdAt: now,
      updatedAt: now
    };

    this.segments.set(segmentId, newSegment);

    structuredLogger.info('Dunning segment created', {
      segmentId,
      name: segment.name,
      requestId: ''
    });

    return newSegment;
  }

  async updateSegment(segmentId: string, updates: Partial<DunningSegment>): Promise<DunningSegment> {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      throw new Error('Segment not found');
    }

    const updatedSegment: DunningSegment = {
      ...segment,
      ...updates,
      id: segmentId,
      updatedAt: new Date().toISOString()
    };

    this.segments.set(segmentId, updatedSegment);

    structuredLogger.info('Dunning segment updated', {
      segmentId,
      updates: Object.keys(updates),
      requestId: ''
    });

    return updatedSegment;
  }

  getSegments(): DunningSegment[] {
    return Array.from(this.segments.values());
  }

  getSegment(segmentId: string): DunningSegment | null {
    return this.segments.get(segmentId) || null;
  }

  async addToDLQ(
    originalMessageId: string,
    queueName: string,
    messageType: DLQMessage['messageType'],
    payload: Record<string, any>,
    failureReason: string,
    organizationId: string,
    priority: DLQMessage['priority'] = 'medium'
  ): Promise<DLQMessage> {
    const dlqId = `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const dlqMessage: DLQMessage = {
      id: dlqId,
      originalMessageId,
      queueName,
      messageType,
      payload,
      failureReason,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      firstFailureAt: now,
      lastFailureAt: now,
      nextRetryAt: this.calculateNextRetryTime(0),
      status: 'pending',
      priority,
      organizationId,
      metadata: {}
    };

    this.dlqMessages.set(dlqId, dlqMessage);
    this.updateDLQStats();

    structuredLogger.info('Message added to DLQ', {
      dlqId,
      originalMessageId,
      queueName,
      messageType,
      failureReason,
      priority,
      requestId: ''
    });

    return dlqMessage;
  }

  async retryDLQMessage(dlqId: string): Promise<DunningRetry> {
    const dlqMessage = this.dlqMessages.get(dlqId);
    if (!dlqMessage) {
      throw new Error('DLQ message not found');
    }

    if (dlqMessage.retryCount >= dlqMessage.maxRetries) {
      dlqMessage.status = 'dead';
      this.updateDLQStats();
      throw new Error('Maximum retries exceeded');
    }

    const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const retry: DunningRetry = {
      id: retryId,
      messageId: dlqId,
      attemptNumber: dlqMessage.retryCount + 1,
      status: 'pending',
      scheduledAt: dlqMessage.nextRetryAt,
      retryStrategy: 'exponential_backoff',
      backoffMultiplier: 2,
      maxBackoffTime: 1440, // 24 horas
      metadata: {}
    };

    this.retries.set(retryId, retry);

    // Actualizar el mensaje DLQ
    dlqMessage.retryCount++;
    dlqMessage.lastFailureAt = now;
    dlqMessage.nextRetryAt = this.calculateNextRetryTime(dlqMessage.retryCount);
    dlqMessage.status = 'processing';

    structuredLogger.info('DLQ message retry scheduled', {
      retryId,
      dlqId,
      attemptNumber: retry.attemptNumber,
      scheduledAt: retry.scheduledAt,
      requestId: ''
    });

    return retry;
  }

  private calculateNextRetryTime(retryCount: number): string {
    const intervalIndex = Math.min(retryCount, this.config.retryIntervals.length - 1);
    const intervalHours = this.config.retryIntervals[intervalIndex];
    const nextRetryTime = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
    return nextRetryTime.toISOString();
  }

  private async processDLQMessages(): Promise<void> {
    const now = new Date();
    const pendingMessages = Array.from(this.dlqMessages.values())
      .filter(msg => msg.status === 'pending' && new Date(msg.nextRetryAt) <= now);

    for (const message of pendingMessages) {
      try {
        await this.retryDLQMessage(message.id);
      } catch (error) {
        structuredLogger.error('Failed to retry DLQ message', {
          dlqId: message.id,
          error: error instanceof Error ? error.message : String(error),
          requestId: ''
        });
      }
    }

    if (pendingMessages.length > 0) {
      structuredLogger.info('DLQ messages processed', {
        processedCount: pendingMessages.length,
        requestId: ''
      });
    }
  }

  private async calculateKPIs(): Promise<void> {
    const now = new Date().toISOString();

    for (const segment of this.segments.values()) {
      if (!segment.isActive) continue;

      // Simular cálculo de KPIs
      const kpis = [
        {
          id: `kpi_${segment.id}_collection_rate_${now}`,
          segmentId: segment.id,
          metric: 'collection_rate',
          value: 0.75 + Math.random() * 0.2, // 75-95%
          target: segment.kpis.targetCollectionRate,
          unit: 'percentage',
          period: 'daily' as const,
          timestamp: now,
          status: 'on_target' as const,
          trend: 'stable' as const,
          metadata: {}
        },
        {
          id: `kpi_${segment.id}_response_time_${now}`,
          segmentId: segment.id,
          metric: 'response_time',
          value: 12 + Math.random() * 24, // 12-36 horas
          target: segment.kpis.targetResponseTime,
          unit: 'hours',
          period: 'daily' as const,
          timestamp: now,
          status: 'on_target' as const,
          trend: 'stable' as const,
          metadata: {}
        },
        {
          id: `kpi_${segment.id}_failure_rate_${now}`,
          segmentId: segment.id,
          metric: 'failure_rate',
          value: Math.random() * 0.2, // 0-20%
          target: segment.kpis.acceptableFailureRate,
          unit: 'percentage',
          period: 'daily' as const,
          timestamp: now,
          status: 'on_target' as const,
          trend: 'stable' as const,
          metadata: {}
        }
      ];

      kpis.forEach(kpi => {
        // Determinar status basado en el valor vs target
        if (kpi.metric === 'failure_rate') {
          kpi.status = kpi.value <= kpi.target ? 'on_target' : 'below_target';
        } else {
          kpi.status = kpi.value >= kpi.target ? 'on_target' : 'below_target';
        }

        this.kpis.set(kpi.id, kpi);
      });
    }

    this.updateKPIStats();
    this.updateOverallStats();

    structuredLogger.info('KPIs calculated', {
      segmentCount: this.segments.size,
      kpiCount: this.kpis.size,
      requestId: ''
    });
  }

  private updateKPIStats(): void {
    const kpiValues = Array.from(this.kpis.values());
    
    this.stats.kpiStats = {
      onTarget: kpiValues.filter(kpi => kpi.status === 'on_target').length,
      belowTarget: kpiValues.filter(kpi => kpi.status === 'below_target').length,
      aboveTarget: kpiValues.filter(kpi => kpi.status === 'above_target').length,
      critical: kpiValues.filter(kpi => kpi.status === 'critical').length
    };
  }

  private updateDLQStats(): void {
    const dlqValues = Array.from(this.dlqMessages.values());
    const retryValues = Array.from(this.retries.values());

    this.stats.dlqStats = {
      totalMessages: dlqValues.length,
      pendingRetries: dlqValues.filter(msg => msg.status === 'pending').length,
      deadMessages: dlqValues.filter(msg => msg.status === 'dead').length,
      retrySuccessRate: retryValues.length > 0 ? 
        retryValues.filter(retry => retry.status === 'success').length / retryValues.length : 0,
      avgRetryTime: retryValues.length > 0 ? 
        retryValues.reduce((sum, retry) => {
          if (retry.completedAt && retry.startedAt) {
            return sum + (new Date(retry.completedAt).getTime() - new Date(retry.startedAt).getTime());
          }
          return sum;
        }, 0) / retryValues.length / 1000 / 60 : 0 // en minutos
    };
  }

  private updateOverallStats(): void {
    // Simular estadísticas generales
    this.stats.totalInvoices = 1000 + Math.floor(Math.random() * 500);
    this.stats.overdueInvoices = Math.floor(this.stats.totalInvoices * 0.3);
    this.stats.collectedAmount = 50000 + Math.random() * 100000;
    this.stats.pendingAmount = 20000 + Math.random() * 50000;
    this.stats.collectionRate = this.stats.collectedAmount / (this.stats.collectedAmount + this.stats.pendingAmount);
    this.stats.averageCollectionTime = 15 + Math.random() * 30; // 15-45 días
    this.stats.lastUpdated = new Date().toISOString();

    // Actualizar estadísticas por segmento
    for (const segment of this.segments.values()) {
      this.stats.segmentStats[segment.id] = {
        invoices: Math.floor(this.stats.overdueInvoices * 0.33),
        collected: Math.floor(this.stats.collectedAmount * 0.33),
        pending: Math.floor(this.stats.pendingAmount * 0.33),
        rate: 0.7 + Math.random() * 0.2,
        avgTime: 10 + Math.random() * 20
      };
    }
  }

  getKPIs(segmentId?: string, period?: string): DunningKPI[] {
    let kpis = Array.from(this.kpis.values());

    if (segmentId) {
      kpis = kpis.filter(kpi => kpi.segmentId === segmentId);
    }

    if (period) {
      kpis = kpis.filter(kpi => kpi.period === period);
    }

    return kpis.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getDLQMessages(status?: string, priority?: string): DLQMessage[] {
    let messages = Array.from(this.dlqMessages.values());

    if (status) {
      messages = messages.filter(msg => msg.status === status);
    }

    if (priority) {
      messages = messages.filter(msg => msg.priority === priority);
    }

    return messages.sort((a, b) => new Date(b.firstFailureAt).getTime() - new Date(a.firstFailureAt).getTime());
  }

  getRetries(messageId?: string, status?: string): DunningRetry[] {
    let retries = Array.from(this.retries.values());

    if (messageId) {
      retries = retries.filter(retry => retry.messageId === messageId);
    }

    if (status) {
      retries = retries.filter(retry => retry.status === status);
    }

    return retries.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }

  getStats(): DunningStats {
    return this.stats;
  }

  updateConfig(newConfig: Partial<DunningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar procesos si cambió la configuración
    if (this.kpiCalculationInterval) {
      clearInterval(this.kpiCalculationInterval);
      this.startKpiCalculation();
    }

    if (this.dlqProcessingInterval) {
      clearInterval(this.dlqProcessingInterval);
      this.startDLQProcessing();
    }
    
    structuredLogger.info('Dunning configuration updated', {
      config: this.config,
      requestId: ''
    });
  }

  stop(): void {
    if (this.kpiCalculationInterval) {
      clearInterval(this.kpiCalculationInterval);
      this.kpiCalculationInterval = null;
    }

    if (this.dlqProcessingInterval) {
      clearInterval(this.dlqProcessingInterval);
      this.dlqProcessingInterval = null;
    }
    
    structuredLogger.info('Dunning Solid service stopped', { requestId: '' });
  }
}

export const dunningSolidService = new DunningSolidService();
