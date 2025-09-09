/**
 * PR-46: Quiet Hours Management Service
 *
 * Service for managing quiet hours configurations, schedules, and exceptions
 */

import {
  QuietHoursConfig,
  QuietHoursSchedule,
  QuietHoursException,
  QuietHoursStatus,
  QuietHoursOverride,
  CreateQuietHoursRequest,
  UpdateQuietHoursRequest,
  QuietHoursStats
} from './quiet-hours-types';

export class QuietHoursService {
  private quietHoursConfigs: Map<string, QuietHoursConfig> = new Map();
  private overrides: Map<string, QuietHoursOverride> = new Map();
  private exceptions: Map<string, QuietHoursException> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Get all quiet hours configurations for an organization
   */
  async getQuietHoursConfigs(organizationId: string): Promise<QuietHoursConfig[]> {
    const configs = Array.from(this.quietHoursConfigs.values())
      .filter(config => config.organizationId === organizationId);

    return configs;
  }

  /**
   * Get a specific quiet hours configuration
   */
  async getQuietHoursConfig(id: string): Promise<QuietHoursConfig | null> {
    return this.quietHoursConfigs.get(id) || null;
  }

  /**
   * Create a new quiet hours configuration
   */
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
    return config;
  }

  /**
   * Update an existing quiet hours configuration
   */
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
    return updatedConfig;
  }

  /**
   * Delete a quiet hours configuration
   */
  async deleteQuietHoursConfig(id: string): Promise<boolean> {
    return this.quietHoursConfigs.delete(id);
  }

  /**
   * Get current quiet hours status for an organization
   */
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
    const activeOverride = this.getActiveOverride(organizationId, serviceName, now);
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

  /**
   * Create a quiet hours override
   */
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

    this.overrides.set(id, override);
    return override;
  }

  /**
   * Approve or reject a quiet hours override
   */
  async updateQuietHoursOverride(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string
  ): Promise<QuietHoursOverride | null> {
    const override = this.overrides.get(id);
    if (!override) {
      return null;
    }

    const updatedOverride: QuietHoursOverride = {
      ...override,
      status,
      approvedBy,
      updatedAt: new Date()
    };

    this.overrides.set(id, updatedOverride);
    return updatedOverride;
  }

  /**
   * Get quiet hours statistics
   */
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

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDefaultConfigs(): void {
    // Initialize with some default configurations for demo purposes
    const defaultConfig: QuietHoursConfig = {
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

    this.quietHoursConfigs.set(defaultConfig.id, defaultConfig);
  }

  private generateId(): string {
    return `qh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentTimeInTimezone(date: Date, timezone: string): Date {
    // Simplified timezone handling - in production, use a proper timezone library
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
      // Handle overnight ranges (e.g., 22:00 to 06:00)
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

  private getActiveOverride(
    organizationId: string,
    serviceName: string | undefined,
    now: Date
  ): QuietHoursOverride | null {
    const overrides = Array.from(this.overrides.values())
      .filter(override =>
        override.organizationId === organizationId &&
        override.serviceName === serviceName &&
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
    // Simplified implementation - in production, calculate the actual next change time
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
}
