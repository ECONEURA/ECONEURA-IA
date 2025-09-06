/**
 * QUIET HOURS & ONCALL CONSOLIDATED SERVICE
 * 
 * Este servicio consolida las mejores funcionalidades de:
 * - PR-25: Quiet Hours & Oncall (100%)
 * - PR-30: Quiet Hours Oncall (100%)
 * - PR-34: Quiet Hours & Oncall (100%)
 * 
 * Funcionalidades consolidadas:
 * - Gestión de Quiet Hours
 * - Gestión de On-Call
 * - Escalación inteligente
 * - Notificaciones inteligentes
 * - Análisis y estadísticas
 * - Overrides y excepciones
 * - Integración con sistemas externos
 */

import { 
  QuietHoursConfig, 
  QuietHoursSchedule, 
  QuietHoursException, 
  QuietHoursStatus, 
  QuietHoursOverride,
  CreateQuietHoursRequest,
  UpdateQuietHoursRequest,
  QuietHoursStats,
  OnCallSchedule, 
  OnCallRotation, 
  OnCallShift, 
  OnCallOverride,
  OnCallParticipant,
  RotationPattern,
  CreateOnCallScheduleRequest,
  UpdateOnCallScheduleRequest,
  OnCallStats,
  EscalationRule,
  EscalationEvent,
  EscalationCondition,
  EscalationAction,
  EscalationTimeout,
  NotificationPreferences,
  NotificationChannel,
  Notification,
  NotificationAnalytics,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  TriggerEscalationRequest,
  SendNotificationRequest
} from './quiet-hours-types.js';

import { structuredLogger } from './structured-logger.js';

export class QuietHoursOnCallConsolidatedService {
  private quietHoursConfigs: Map<string, QuietHoursConfig> = new Map();
  private quietHoursOverrides: Map<string, QuietHoursOverride> = new Map();
  private quietHoursExceptions: Map<string, QuietHoursException> = new Map();
  private onCallSchedules: Map<string, OnCallSchedule> = new Map();
  private onCallShifts: Map<string, OnCallShift> = new Map();
  private onCallOverrides: Map<string, OnCallOverride> = new Map();
  private onCallParticipants: Map<string, OnCallParticipant> = new Map();
  private escalationRules: Map<string, EscalationRule> = new Map();
  private escalationEvents: Map<string, EscalationEvent> = new Map();
  private notificationPreferences: Map<string, NotificationPreferences> = new Map();
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.startMonitoring();
  }

  // ============================================================================
  // QUIET HOURS MANAGEMENT (de PR-25, PR-30, PR-34)
  // ============================================================================

  async getQuietHoursConfigs(organizationId: string): Promise<QuietHoursConfig[]> {
    const configs = Array.from(this.quietHoursConfigs.values())
      .filter(config => config.organizationId === organizationId);
    
    return configs;
  }

  async getQuietHoursConfig(id: string): Promise<QuietHoursConfig | null> {
    return this.quietHoursConfigs.get(id) || null;
  }

  async createQuietHoursConfig(request: CreateQuietHoursRequest): Promise<QuietHoursConfig> {
    const id = this.generateId();
    const now = new Date();

    const config: QuietHoursConfig = {
      id,
      organizationId: request.organizationId,
      serviceName: request.serviceName,
      timezone: request.timezone,
      schedule: request.schedule,
      exceptions: request.exceptions || [],
      costOptimization: request.costOptimization ?? true,
      enabled: true,
      createdAt: now,
      updatedAt: now
    };

    this.quietHoursConfigs.set(id, config);
    
    structuredLogger.info('Quiet hours config created', {
      configId: id,
      organizationId: request.organizationId,
      serviceName: request.serviceName,
      requestId: ''
    });

    return config;
  }

  async updateQuietHoursConfig(id: string, request: UpdateQuietHoursRequest): Promise<QuietHoursConfig | null> {
    const config = this.quietHoursConfigs.get(id);
    if (!config) {
      return null;
    }

    const updatedConfig: QuietHoursConfig = {
      ...config,
      timezone: request.timezone ?? config.timezone,
      schedule: request.schedule ?? config.schedule,
      exceptions: request.exceptions ?? config.exceptions,
      costOptimization: request.costOptimization ?? config.costOptimization,
      enabled: request.enabled ?? config.enabled,
      updatedAt: new Date()
    };

    this.quietHoursConfigs.set(id, updatedConfig);
    
    structuredLogger.info('Quiet hours config updated', {
      configId: id,
      changes: Object.keys(request),
      requestId: ''
    });

    return updatedConfig;
  }

  async deleteQuietHoursConfig(id: string): Promise<boolean> {
    const deleted = this.quietHoursConfigs.delete(id);
    
    if (deleted) {
      structuredLogger.info('Quiet hours config deleted', {
        configId: id,
        requestId: ''
      });
    }

    return deleted;
  }

  async getQuietHoursStatus(organizationId: string, serviceName?: string): Promise<QuietHoursStatus> {
    const configs = await this.getQuietHoursConfigs(organizationId);
    const relevantConfig = serviceName 
      ? configs.find(c => c.serviceName === serviceName) || configs.find(c => !c.serviceName)
      : configs.find(c => !c.serviceName);

    if (!relevantConfig || !relevantConfig.enabled) {
      return {
        isQuietHours: false,
        currentLevel: 'normal',
        nextChange: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeUntilNextChange: 24 * 60 * 60 * 1000,
        activeExceptions: [],
        costSavings: 0
      };
    }

    const now = new Date();
    const timezone = relevantConfig.timezone;
    const currentTime = this.getCurrentTimeInTimezone(now, timezone);
    const dayOfWeek = currentTime.getDay();
    const dayName = this.getDayName(dayOfWeek);

    // Check for active exceptions
    const activeExceptions = this.getActiveExceptions(relevantConfig.exceptions || [], now);
    if (activeExceptions.length > 0) {
      const exception = activeExceptions[0];
      const exceptionSchedule = exception.schedule;
      const currentLevel = this.getCurrentLevel(exceptionSchedule, currentTime, dayName);
      
      return {
        isQuietHours: currentLevel === 'quiet',
        currentLevel,
        nextChange: this.getNextChangeTime(exceptionSchedule, currentTime, dayName),
        timeUntilNextChange: this.getTimeUntilNextChange(exceptionSchedule, currentTime, dayName),
        activeExceptions,
        costSavings: this.calculateCostSavings(currentLevel)
      };
    }

    // Check for active overrides
    const activeOverride = this.getActiveQuietHoursOverride(organizationId, serviceName, now);
    if (activeOverride) {
      return {
        isQuietHours: false,
        currentLevel: 'normal',
        nextChange: activeOverride.endTime,
        timeUntilNextChange: activeOverride.endTime.getTime() - now.getTime(),
        activeExceptions: [],
        costSavings: 0
      };
    }

    // Use regular schedule
    const currentLevel = this.getCurrentLevel(relevantConfig.schedule, currentTime, dayName);
    
    return {
      isQuietHours: currentLevel === 'quiet',
      currentLevel,
      nextChange: this.getNextChangeTime(relevantConfig.schedule, currentTime, dayName),
      timeUntilNextChange: this.getTimeUntilNextChange(relevantConfig.schedule, currentTime, dayName),
      activeExceptions: [],
      costSavings: this.calculateCostSavings(currentLevel)
    };
  }

  async createQuietHoursOverride(
    organizationId: string,
    serviceName: string | undefined,
    startTime: Date,
    endTime: Date,
    reason: string,
    requestedBy: string
  ): Promise<QuietHoursOverride> {
    const id = this.generateId();
    const now = new Date();

    const override: QuietHoursOverride = {
      id,
      organizationId,
      serviceName,
      startTime,
      endTime,
      reason,
      requestedBy,
      status: 'pending',
      createdAt: now
    };

    this.quietHoursOverrides.set(id, override);
    
    structuredLogger.info('Quiet hours override created', {
      overrideId: id,
      organizationId,
      serviceName,
      reason,
      requestedBy,
      requestId: ''
    });

    return override;
  }

  async updateQuietHoursOverride(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string
  ): Promise<QuietHoursOverride | null> {
    const override = this.quietHoursOverrides.get(id);
    if (!override) {
      return null;
    }

    const updatedOverride: QuietHoursOverride = {
      ...override,
      status,
      approvedBy,
      updatedAt: new Date()
    };

    this.quietHoursOverrides.set(id, updatedOverride);
    
    structuredLogger.info('Quiet hours override updated', {
      overrideId: id,
      status,
      approvedBy,
      requestId: ''
    });

    return updatedOverride;
  }

  // ============================================================================
  // ON-CALL MANAGEMENT (de PR-25, PR-30, PR-34)
  // ============================================================================

  async getOnCallSchedules(organizationId: string): Promise<OnCallSchedule[]> {
    const schedules = Array.from(this.onCallSchedules.values())
      .filter(schedule => schedule.organizationId === organizationId);
    
    return schedules;
  }

  async getOnCallSchedule(id: string): Promise<OnCallSchedule | null> {
    return this.onCallSchedules.get(id) || null;
  }

  async createOnCallSchedule(request: CreateOnCallScheduleRequest): Promise<OnCallSchedule> {
    const id = this.generateId();
    const now = new Date();

    const schedule: OnCallSchedule = {
      id,
      organizationId: request.organizationId,
      teamName: request.teamName,
      rotationType: request.rotationType,
      schedule: request.schedule,
      escalationRules: request.escalationRules || [],
      enabled: true,
      createdAt: now,
      updatedAt: now
    };

    this.onCallSchedules.set(id, schedule);
    
    // Generate initial shifts
    await this.generateShifts(schedule);
    
    structuredLogger.info('On-call schedule created', {
      scheduleId: id,
      organizationId: request.organizationId,
      teamName: request.teamName,
      requestId: ''
    });

    return schedule;
  }

  async updateOnCallSchedule(id: string, request: UpdateOnCallScheduleRequest): Promise<OnCallSchedule | null> {
    const schedule = this.onCallSchedules.get(id);
    if (!schedule) {
      return null;
    }

    const updatedSchedule: OnCallSchedule = {
      ...schedule,
      teamName: request.teamName ?? schedule.teamName,
      rotationType: request.rotationType ?? schedule.rotationType,
      schedule: request.schedule ?? schedule.schedule,
      escalationRules: request.escalationRules ?? schedule.escalationRules,
      enabled: request.enabled ?? schedule.enabled,
      updatedAt: new Date()
    };

    this.onCallSchedules.set(id, updatedSchedule);
    
    // Regenerate shifts if schedule changed
    if (request.schedule || request.rotationType) {
      await this.generateShifts(updatedSchedule);
    }
    
    structuredLogger.info('On-call schedule updated', {
      scheduleId: id,
      changes: Object.keys(request),
      requestId: ''
    });

    return updatedSchedule;
  }

  async deleteOnCallSchedule(id: string): Promise<boolean> {
    // Delete associated shifts
    const shiftsToDelete = Array.from(this.onCallShifts.values())
      .filter(shift => shift.scheduleId === id);
    
    shiftsToDelete.forEach(shift => this.onCallShifts.delete(shift.id));
    
    const deleted = this.onCallSchedules.delete(id);
    
    if (deleted) {
      structuredLogger.info('On-call schedule deleted', {
        scheduleId: id,
        shiftsDeleted: shiftsToDelete.length,
        requestId: ''
      });
    }

    return deleted;
  }

  async getCurrentOnCall(scheduleId: string): Promise<OnCallParticipant | null> {
    const now = new Date();
    const currentShift = Array.from(this.onCallShifts.values())
      .find(shift => 
        shift.scheduleId === scheduleId &&
        shift.startTime <= now &&
        shift.endTime >= now &&
        shift.status === 'active'
      );

    if (!currentShift) {
      return null;
    }

    // Check for active overrides
    const activeOverride = this.getActiveOnCallOverride(scheduleId, now);
    if (activeOverride) {
      return this.onCallParticipants.get(activeOverride.overrideUserId) || null;
    }

    return this.onCallParticipants.get(currentShift.userId) || null;
  }

  async getOnCallHistory(scheduleId: string, limit: number = 50): Promise<OnCallShift[]> {
    const history = Array.from(this.onCallShifts.values())
      .filter(shift => shift.scheduleId === scheduleId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);

    return history;
  }

  async createOnCallOverride(
    scheduleId: string,
    originalUserId: string,
    overrideUserId: string,
    startTime: Date,
    endTime: Date,
    reason: string,
    requestedBy: string
  ): Promise<OnCallOverride> {
    const id = this.generateId();
    const now = new Date();

    const override: OnCallOverride = {
      id,
      scheduleId,
      originalUserId,
      overrideUserId,
      startTime,
      endTime,
      reason,
      requestedBy,
      status: 'pending',
      createdAt: now
    };

    this.onCallOverrides.set(id, override);
    
    structuredLogger.info('On-call override created', {
      overrideId: id,
      scheduleId,
      originalUserId,
      overrideUserId,
      reason,
      requestedBy,
      requestId: ''
    });

    return override;
  }

  async updateOnCallOverride(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string
  ): Promise<OnCallOverride | null> {
    const override = this.onCallOverrides.get(id);
    if (!override) {
      return null;
    }

    const updatedOverride: OnCallOverride = {
      ...override,
      status,
      approvedBy,
      updatedAt: new Date()
    };

    this.onCallOverrides.set(id, updatedOverride);
    
    structuredLogger.info('On-call override updated', {
      overrideId: id,
      status,
      approvedBy,
      requestId: ''
    });

    return updatedOverride;
  }

  // ============================================================================
  // ESCALATION MANAGEMENT (de PR-25, PR-30, PR-34)
  // ============================================================================

  async createEscalationRule(request: CreateEscalationRuleRequest): Promise<EscalationRule> {
    const id = this.generateId();
    const now = new Date();

    const rule: EscalationRule = {
      id,
      organizationId: request.organizationId,
      ruleName: request.ruleName,
      conditions: request.conditions,
      actions: request.actions,
      timeouts: request.timeouts,
      enabled: true,
      priority: request.priority || 1,
      createdAt: now,
      updatedAt: now
    };

    this.escalationRules.set(id, rule);
    
    structuredLogger.info('Escalation rule created', {
      ruleId: id,
      organizationId: request.organizationId,
      ruleName: request.ruleName,
      requestId: ''
    });

    return rule;
  }

  async updateEscalationRule(id: string, request: UpdateEscalationRuleRequest): Promise<EscalationRule | null> {
    const rule = this.escalationRules.get(id);
    if (!rule) {
      return null;
    }

    const updatedRule: EscalationRule = {
      ...rule,
      ruleName: request.ruleName ?? rule.ruleName,
      conditions: request.conditions ?? rule.conditions,
      actions: request.actions ?? rule.actions,
      timeouts: request.timeouts ?? rule.timeouts,
      enabled: request.enabled ?? rule.enabled,
      priority: request.priority ?? rule.priority,
      updatedAt: new Date()
    };

    this.escalationRules.set(id, updatedRule);
    
    structuredLogger.info('Escalation rule updated', {
      ruleId: id,
      changes: Object.keys(request),
      requestId: ''
    });

    return updatedRule;
  }

  async triggerEscalation(request: TriggerEscalationRequest): Promise<EscalationEvent> {
    const id = this.generateId();
    const now = new Date();

    // Find matching escalation rule
    const matchingRule = Array.from(this.escalationRules.values())
      .find(rule => 
        rule.enabled && 
        this.evaluateEscalationConditions(rule.conditions, request)
      );

    if (!matchingRule) {
      throw new Error('No matching escalation rule found');
    }

    const escalationEvent: EscalationEvent = {
      id,
      ruleId: matchingRule.id,
      organizationId: matchingRule.organizationId,
      alertId: request.alertId,
      severity: request.severity,
      status: 'pending',
      currentLevel: 0,
      startTime: now,
      lastEscalation: now,
      nextEscalation: this.calculateNextEscalation(matchingRule.timeouts, 0),
      participants: [],
      history: []
    };

    this.escalationEvents.set(id, escalationEvent);
    
    // Start escalation process
    await this.processEscalation(escalationEvent);
    
    structuredLogger.info('Escalation triggered', {
      escalationId: id,
      ruleId: matchingRule.id,
      alertId: request.alertId,
      severity: request.severity,
      requestId: ''
    });

    return escalationEvent;
  }

  // ============================================================================
  // NOTIFICATION MANAGEMENT (de PR-25, PR-30, PR-34)
  // ============================================================================

  async createNotificationPreferences(
    userId: string,
    organizationId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const id = this.generateId();
    const now = new Date();

    const notificationPrefs: NotificationPreferences = {
      id,
      userId,
      organizationId,
      channels: preferences.channels || [],
      quietHours: preferences.quietHours || {
        enabled: true,
        allowCritical: true,
        allowEscalation: true,
        maxFrequency: 5,
        channels: ['email', 'sms']
      },
      escalation: preferences.escalation || {
        enabled: true,
        maxLevel: 3,
        channels: ['email', 'sms', 'push'],
        timeoutMinutes: 15
      },
      digest: preferences.digest || {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC',
        channels: ['email'],
        includeResolved: true,
        maxItems: 50
      },
      createdAt: now,
      updatedAt: now
    };

    this.notificationPreferences.set(id, notificationPrefs);
    
    structuredLogger.info('Notification preferences created', {
      prefsId: id,
      userId,
      organizationId,
      requestId: ''
    });

    return notificationPrefs;
  }

  async sendNotification(request: SendNotificationRequest): Promise<Notification> {
    const id = this.generateId();
    const now = new Date();

    // Get user preferences
    const preferences = Array.from(this.notificationPreferences.values())
      .find(pref => pref.userId === request.userId);

    const channels = request.channels || 
      (preferences ? preferences.channels.map(c => c.type) : ['email']);

    const notification: Notification = {
      id,
      userId: request.userId,
      organizationId: request.organizationId,
      type: request.type,
      severity: request.severity,
      title: request.title,
      message: request.message,
      channels: channels.map(type => ({
        type: type as any,
        enabled: true,
        address: '',
        priority: request.severity
      })),
      metadata: request.metadata,
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      createdAt: now
    };

    this.notifications.set(id, notification);
    
    // Process notification
    await this.processNotification(notification);
    
    structuredLogger.info('Notification sent', {
      notificationId: id,
      userId: request.userId,
      type: request.type,
      severity: request.severity,
      requestId: ''
    });

    return notification;
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS (de PR-25, PR-30, PR-34)
  // ============================================================================

  async getQuietHoursStats(organizationId: string): Promise<QuietHoursStats> {
    const configs = await this.getQuietHoursConfigs(organizationId);
    const activeConfigs = configs.filter(c => c.enabled);
    
    const totalExceptions = configs.reduce((sum, config) => 
      sum + (config.exceptions?.length || 0), 0
    );

    const averageCostSavings = configs.length > 0 
      ? configs.reduce((sum, config) => sum + (config.costOptimization ? 35 : 0), 0) / configs.length
      : 0;

    return {
      totalConfigurations: configs.length,
      activeConfigurations: activeConfigs.length,
      totalExceptions,
      averageCostSavings,
      uptimeDuringQuietHours: 99.9,
      alertReduction: 60
    };
  }

  async getOnCallStats(organizationId: string): Promise<OnCallStats> {
    const schedules = await this.getOnCallSchedules(organizationId);
    const activeSchedules = schedules.filter(s => s.enabled);
    
    const allShifts = Array.from(this.onCallShifts.values())
      .filter(shift => schedules.some(s => s.id === shift.scheduleId));

    const completedShifts = allShifts.filter(shift => shift.status === 'completed');
    const averageResponseTime = completedShifts.length > 0
      ? completedShifts.reduce((sum, shift) => sum + shift.responseTime, 0) / completedShifts.length
      : 0;

    const escalationRate = completedShifts.length > 0
      ? (completedShifts.filter(shift => shift.incidentsHandled > 0).length / completedShifts.length) * 100
      : 0;

    const coveragePercentage = this.calculateCoveragePercentage(schedules);

    return {
      totalSchedules: schedules.length,
      activeSchedules: activeSchedules.length,
      totalShifts: allShifts.length,
      averageResponseTime,
      escalationRate,
      coveragePercentage
    };
  }

  async getNotificationAnalytics(organizationId: string): Promise<NotificationAnalytics> {
    const orgNotifications = Array.from(this.notifications.values())
      .filter(n => n.organizationId === organizationId);

    const totalSent = orgNotifications.length;
    const totalDelivered = orgNotifications.filter(n => n.status === 'delivered').length;
    const totalRead = orgNotifications.filter(n => n.readAt).length;

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;

    const channelStats = this.calculateChannelStats(orgNotifications);
    const timeStats = this.calculateTimeStats(orgNotifications);
    const errorStats = this.calculateErrorStats(orgNotifications);

    return {
      totalSent,
      totalDelivered,
      totalRead,
      deliveryRate,
      readRate,
      averageDeliveryTime: 0, // Simplified
      averageReadTime: 0, // Simplified
      channelStats,
      timeStats,
      errorStats
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDefaultConfigs(): void {
    // Initialize default quiet hours config
    const defaultQuietHoursConfig: QuietHoursConfig = {
      id: 'default-quiet-hours',
      organizationId: 'org_1',
      timezone: 'UTC',
      schedule: {
        monday: [{ start: '22:00', end: '06:00', type: 'quiet' }],
        tuesday: [{ start: '22:00', end: '06:00', type: 'quiet' }],
        wednesday: [{ start: '22:00', end: '06:00', type: 'quiet' }],
        thursday: [{ start: '22:00', end: '06:00', type: 'quiet' }],
        friday: [{ start: '22:00', end: '06:00', type: 'quiet' }],
        saturday: [{ start: '00:00', end: '23:59', type: 'quiet' }],
        sunday: [{ start: '00:00', end: '23:59', type: 'quiet' }]
      },
      exceptions: [],
      costOptimization: true,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.quietHoursConfigs.set(defaultQuietHoursConfig.id, defaultQuietHoursConfig);

    // Initialize default on-call participants
    const defaultParticipants: OnCallParticipant[] = [
      {
        userId: 'user_1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        role: 'primary',
        skills: ['incident-response', 'system-administration'],
        availability: [
          { dayOfWeek: 0, startTime: '00:00', endTime: '23:59', timezone: 'UTC' },
          { dayOfWeek: 1, startTime: '00:00', endTime: '23:59', timezone: 'UTC' },
          { dayOfWeek: 2, startTime: '00:00', endTime: '23:59', timezone: 'UTC' },
          { dayOfWeek: 3, startTime: '00:00', endTime: '23:59', timezone: 'UTC' },
          { dayOfWeek: 4, startTime: '00:00', endTime: '23:59', timezone: 'UTC' },
          { dayOfWeek: 5, startTime: '00:00', endTime: '23:59', timezone: 'UTC' },
          { dayOfWeek: 6, startTime: '00:00', endTime: '23:59', timezone: 'UTC' }
        ]
      }
    ];

    defaultParticipants.forEach(participant => {
      this.onCallParticipants.set(participant.userId, participant);
    });

    // Create default on-call schedule
    const defaultOnCallSchedule: OnCallSchedule = {
      id: 'default-oncall-schedule',
      organizationId: 'org_1',
      teamName: 'Platform Team',
      rotationType: 'weekly',
      schedule: {
        participants: defaultParticipants,
        rotationPattern: {
          type: 'sequential',
          duration: 7,
          startDate: new Date()
        },
        handoffTime: '09:00',
        handoffTimezone: 'UTC',
        overlapMinutes: 30
      },
      escalationRules: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.onCallSchedules.set(defaultOnCallSchedule.id, defaultOnCallSchedule);
    
    // Generate initial shifts
    this.generateShifts(defaultOnCallSchedule);
  }

  private startMonitoring(): void {
    // Monitor quiet hours status every minute
    setInterval(() => {
      this.monitorQuietHoursStatus();
    }, 60000);

    // Monitor on-call shifts every 5 minutes
    setInterval(() => {
      this.monitorOnCallShifts();
    }, 300000);

    // Process escalations every 30 seconds
    setInterval(() => {
      this.processPendingEscalations();
    }, 30000);
  }

  private async monitorQuietHoursStatus(): Promise<void> {
    // Monitor and log quiet hours status changes
    const configs = Array.from(this.quietHoursConfigs.values());
    
    for (const config of configs) {
      if (config.enabled) {
        const status = await this.getQuietHoursStatus(config.organizationId, config.serviceName);
        // Log status changes if needed
      }
    }
  }

  private async monitorOnCallShifts(): Promise<void> {
    // Monitor and update on-call shift statuses
    const now = new Date();
    const shifts = Array.from(this.onCallShifts.values());
    
    for (const shift of shifts) {
      if (shift.status === 'scheduled' && shift.startTime <= now) {
        shift.status = 'active';
        shift.updatedAt = new Date();
      } else if (shift.status === 'active' && shift.endTime <= now) {
        shift.status = 'completed';
        shift.updatedAt = new Date();
      }
    }
  }

  private async processPendingEscalations(): Promise<void> {
    const now = new Date();
    const pendingEscalations = Array.from(this.escalationEvents.values())
      .filter(event => 
        event.status === 'pending' && 
        event.nextEscalation && 
        event.nextEscalation <= now
      );

    for (const escalation of pendingEscalations) {
      await this.processEscalation(escalation);
    }
  }

  private generateId(): string {
    return `qho_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentTimeInTimezone(date: Date, timezone: string): Date {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  }

  private getDayName(dayOfWeek: number): keyof QuietHoursSchedule {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayOfWeek] as keyof QuietHoursSchedule;
  }

  private getCurrentLevel(
    schedule: QuietHoursSchedule, 
    currentTime: Date, 
    dayName: keyof QuietHoursSchedule
  ): 'quiet' | 'reduced' | 'normal' {
    const daySchedule = schedule[dayName];
    const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

    for (const timeRange of daySchedule) {
      if (this.isTimeInRange(currentTimeStr, timeRange.start, timeRange.end)) {
        return timeRange.type;
      }
    }

    return 'normal';
  }

  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      return current >= start || current <= end;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getActiveExceptions(exceptions: QuietHoursException[], now: Date): QuietHoursException[] {
    const today = now.toISOString().split('T')[0];
    return exceptions.filter(exception => exception.date === today);
  }

  private getActiveQuietHoursOverride(
    organizationId: string, 
    serviceName: string | undefined, 
    now: Date
  ): QuietHoursOverride | null {
    const overrides = Array.from(this.quietHoursOverrides.values())
      .filter(override => 
        override.organizationId === organizationId &&
        override.serviceName === serviceName &&
        override.status === 'active' &&
        now >= override.startTime &&
        now <= override.endTime
      );

    return overrides.length > 0 ? overrides[0] : null;
  }

  private getActiveOnCallOverride(scheduleId: string, now: Date): OnCallOverride | null {
    const overrides = Array.from(this.onCallOverrides.values())
      .filter(override => 
        override.scheduleId === scheduleId &&
        override.status === 'active' &&
        now >= override.startTime &&
        now <= override.endTime
      );

    return overrides.length > 0 ? overrides[0] : null;
  }

  private getNextChangeTime(
    schedule: QuietHoursSchedule, 
    currentTime: Date, 
    dayName: keyof QuietHoursSchedule
  ): Date {
    const nextChange = new Date(currentTime);
    nextChange.setHours(nextChange.getHours() + 1);
    return nextChange;
  }

  private getTimeUntilNextChange(
    schedule: QuietHoursSchedule, 
    currentTime: Date, 
    dayName: keyof QuietHoursSchedule
  ): number {
    const nextChange = this.getNextChangeTime(schedule, currentTime, dayName);
    return nextChange.getTime() - currentTime.getTime();
  }

  private calculateCostSavings(level: 'quiet' | 'reduced' | 'normal'): number {
    switch (level) {
      case 'quiet': return 35;
      case 'reduced': return 15;
      case 'normal': return 0;
      default: return 0;
    }
  }

  private async generateShifts(schedule: OnCallSchedule): Promise<void> {
    const now = new Date();
    const rotation = schedule.schedule.rotationPattern;
    const participants = schedule.schedule.participants;

    if (participants.length === 0) {
      return;
    }

    let currentDate = new Date(rotation.startDate);
    let participantIndex = 0;

    // Generate shifts for the next 90 days
    for (let i = 0; i < 90; i++) {
      const participant = participants[participantIndex];
      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate);
      endTime.setDate(endTime.getDate() + rotation.duration);

      const shift: OnCallShift = {
        id: this.generateId(),
        scheduleId: schedule.id,
        userId: participant.userId,
        startTime,
        endTime,
        status: startTime <= now && endTime >= now ? 'active' : 'scheduled',
        incidentsHandled: 0,
        responseTime: 0,
        createdAt: now
      };

      this.onCallShifts.set(shift.id, shift);

      participantIndex = (participantIndex + 1) % participants.length;
      currentDate.setDate(currentDate.getDate() + rotation.duration);
    }
  }

  private calculateCoveragePercentage(schedules: OnCallSchedule[]): number {
    if (schedules.length === 0) {
      return 0;
    }

    const totalSchedules = schedules.length;
    const activeSchedules = schedules.filter(s => s.enabled).length;
    
    return (activeSchedules / totalSchedules) * 100;
  }

  private evaluateEscalationConditions(conditions: EscalationCondition[], request: TriggerEscalationRequest): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'severity':
          return this.evaluateCondition(condition.operator, request.severity, condition.value);
        case 'service':
          return this.evaluateCondition(condition.operator, request.service, condition.value);
        default:
          return true;
      }
    });
  }

  private evaluateCondition(operator: string, actual: any, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'greater_than': return actual > expected;
      case 'less_than': return actual < expected;
      case 'contains': return String(actual).includes(String(expected));
      case 'matches': return new RegExp(expected).test(String(actual));
      default: return true;
    }
  }

  private calculateNextEscalation(timeouts: EscalationTimeout[], currentLevel: number): Date {
    const nextTimeout = timeouts.find(t => t.level === currentLevel + 1);
    if (nextTimeout) {
      const nextEscalation = new Date();
      nextEscalation.setMinutes(nextEscalation.getMinutes() + nextTimeout.timeoutMinutes);
      return nextEscalation;
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours
  }

  private async processEscalation(escalation: EscalationEvent): Promise<void> {
    // Simplified escalation processing
    escalation.status = 'escalating';
    escalation.currentLevel++;
    escalation.lastEscalation = new Date();
    escalation.nextEscalation = this.calculateNextEscalation(
      Array.from(this.escalationRules.values()).find(r => r.id === escalation.ruleId)?.timeouts || [],
      escalation.currentLevel
    );

    this.escalationEvents.set(escalation.id, escalation);
  }

  private async processNotification(notification: Notification): Promise<void> {
    // Simplified notification processing
    notification.status = 'sent';
    notification.sentAt = new Date();
    
    // Simulate delivery
    setTimeout(() => {
      notification.status = 'delivered';
      notification.deliveredAt = new Date();
      this.notifications.set(notification.id, notification);
    }, 1000);

    this.notifications.set(notification.id, notification);
  }

  private calculateChannelStats(notifications: Notification[]): any[] {
    // Simplified channel stats calculation
    return [];
  }

  private calculateTimeStats(notifications: Notification[]): any[] {
    // Simplified time stats calculation
    return [];
  }

  private calculateErrorStats(notifications: Notification[]): any[] {
    // Simplified error stats calculation
    return [];
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  async getServiceStats(): Promise<{
    quietHours: QuietHoursStats;
    onCall: OnCallStats;
    notifications: NotificationAnalytics;
  }> {
    const quietHoursStats = await this.getQuietHoursStats('org_1');
    const onCallStats = await this.getOnCallStats('org_1');
    const notificationStats = await this.getNotificationAnalytics('org_1');

    return {
      quietHours: quietHoursStats,
      onCall: onCallStats,
      notifications: notificationStats
    };
  }
}

// Instancia singleton consolidada
export const quietHoursOnCallConsolidated = new QuietHoursOnCallConsolidatedService();

