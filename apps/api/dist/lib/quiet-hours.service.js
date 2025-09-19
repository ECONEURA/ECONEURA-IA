export class QuietHoursService {
    quietHoursConfigs = new Map();
    overrides = new Map();
    exceptions = new Map();
    constructor() {
        this.initializeDefaultConfigs();
    }
    async getQuietHoursConfigs(organizationId) {
        const configs = Array.from(this.quietHoursConfigs.values())
            .filter(config => config.organizationId === organizationId);
        return configs;
    }
    async getQuietHoursConfig(id) {
        return this.quietHoursConfigs.get(id) || null;
    }
    async createQuietHoursConfig(request) {
        const id = this.generateId();
        const now = new Date();
        const config = {
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
    async updateQuietHoursConfig(id, request) {
        const config = this.quietHoursConfigs.get(id);
        if (!config) {
            return null;
        }
        const updatedConfig = {
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
    async deleteQuietHoursConfig(id) {
        return this.quietHoursConfigs.delete(id);
    }
    async getQuietHoursStatus(organizationId, serviceName) {
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
    async createQuietHoursOverride(organizationId, serviceName, startTime, endTime, reason, requestedBy) {
        const id = this.generateId();
        const now = new Date();
        const override = {
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
    async updateQuietHoursOverride(id, status, approvedBy) {
        const override = this.overrides.get(id);
        if (!override) {
            return null;
        }
        const updatedOverride = {
            ...override,
            status,
            approvedBy,
            updatedAt: new Date()
        };
        this.overrides.set(id, updatedOverride);
        return updatedOverride;
    }
    async getQuietHoursStats(organizationId) {
        const configs = await this.getQuietHoursConfigs(organizationId);
        const activeConfigs = configs.filter(c => c.enabled);
        const totalExceptions = configs.reduce((sum, config) => sum + (config.exceptions?.length || 0), 0);
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
    initializeDefaultConfigs() {
        const defaultConfig = {
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
    generateId() {
        return `qh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getCurrentTimeInTimezone(date, timezone) {
        return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    }
    getDayName(dayOfWeek) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayOfWeek];
    }
    getCurrentLevel(schedule, currentTime, dayName) {
        const daySchedule = schedule[dayName];
        const currentTimeStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        for (const timeRange of daySchedule) {
            if (this.isTimeInRange(currentTimeStr, timeRange.start, timeRange.end)) {
                return timeRange.type;
            }
        }
        return 'normal';
    }
    isTimeInRange(currentTime, startTime, endTime) {
        const current = this.timeToMinutes(currentTime);
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);
        if (start <= end) {
            return current >= start && current <= end;
        }
        else {
            return current >= start || current <= end;
        }
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    getActiveExceptions(exceptions, now) {
        const today = now.toISOString().split('T')[0];
        return exceptions.filter(exception => exception.date === today);
    }
    getActiveOverride(organizationId, serviceName, now) {
        const overrides = Array.from(this.overrides.values())
            .filter(override => override.organizationId === organizationId &&
            override.serviceName === serviceName &&
            override.status === 'active' &&
            now >= override.startTime &&
            now <= override.endTime);
        return overrides.length > 0 ? overrides[0] : null;
    }
    getNextChangeTime(schedule, currentTime, dayName) {
        const nextChange = new Date(currentTime);
        nextChange.setHours(nextChange.getHours() + 1);
        return nextChange;
    }
    getTimeUntilNextChange(schedule, currentTime, dayName) {
        const nextChange = this.getNextChangeTime(schedule, currentTime, dayName);
        return nextChange.getTime() - currentTime.getTime();
    }
    calculateCostSavings(level) {
        switch (level) {
            case 'quiet': return 35;
            case 'reduced': return 15;
            case 'normal': return 0;
            default: return 0;
        }
    }
}
//# sourceMappingURL=quiet-hours.service.js.map