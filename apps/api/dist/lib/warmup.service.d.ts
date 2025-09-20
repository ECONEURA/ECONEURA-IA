import { WarmupSchedule, WarmupStatus, WarmupMetrics, CreateWarmupScheduleRequest, UpdateWarmupScheduleRequest, TriggerWarmupRequest, WarmupStats } from './warmup-types.js';
export declare class WarmupService {
    private schedules;
    private warmupStatuses;
    private runningWarmups;
    constructor();
    getWarmupSchedules(organizationId: string): Promise<WarmupSchedule[]>;
    getWarmupSchedule(id: string): Promise<WarmupSchedule | null>;
    createWarmupSchedule(request: CreateWarmupScheduleRequest): Promise<WarmupSchedule>;
    updateWarmupSchedule(id: string, request: UpdateWarmupScheduleRequest): Promise<WarmupSchedule | null>;
    deleteWarmupSchedule(id: string): Promise<boolean>;
    triggerWarmup(request: TriggerWarmupRequest): Promise<WarmupStatus>;
    getWarmupStatus(warmupId: string): Promise<WarmupStatus | null>;
    getWarmupMetrics(organizationId: string): Promise<WarmupMetrics>;
    getWarmupStats(organizationId: string): Promise<WarmupStats>;
    shouldRunDuringQuietHours(scheduleId: string): Promise<boolean>;
    private executeWarmup;
    private getServicesToWarmup;
    private warmupService;
    private simulateWarmupProcess;
    private calculateAverageLatency;
    private getCurrentMemoryUsage;
    private getCurrentCpuUsage;
    private getCurrentCacheHitRate;
    private getCurrentResourceUtilization;
    private getDefaultServices;
    private initializeDefaultSchedules;
    private generateId;
}
//# sourceMappingURL=warmup.service.d.ts.map