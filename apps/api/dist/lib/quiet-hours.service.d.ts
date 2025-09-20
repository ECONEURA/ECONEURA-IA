import { QuietHoursConfig, QuietHoursStatus, QuietHoursOverride, CreateQuietHoursRequest, UpdateQuietHoursRequest, QuietHoursStats } from './quiet-hours-types.js';
export declare class QuietHoursService {
    private quietHoursConfigs;
    private overrides;
    private exceptions;
    constructor();
    getQuietHoursConfigs(organizationId: string): Promise<QuietHoursConfig[]>;
    getQuietHoursConfig(id: string): Promise<QuietHoursConfig | null>;
    createQuietHoursConfig(request: CreateQuietHoursRequest): Promise<QuietHoursConfig>;
    updateQuietHoursConfig(id: string, request: UpdateQuietHoursRequest): Promise<QuietHoursConfig | null>;
    deleteQuietHoursConfig(id: string): Promise<boolean>;
    getQuietHoursStatus(organizationId: string, serviceName?: string): Promise<QuietHoursStatus>;
    createQuietHoursOverride(organizationId: string, serviceName: string | undefined, startTime: Date, endTime: Date, reason: string, requestedBy: string): Promise<QuietHoursOverride>;
    updateQuietHoursOverride(id: string, status: 'approved' | 'rejected', approvedBy: string): Promise<QuietHoursOverride | null>;
    getQuietHoursStats(organizationId: string): Promise<QuietHoursStats>;
    private initializeDefaultConfigs;
    private generateId;
    private getCurrentTimeInTimezone;
    private getDayName;
    private getCurrentLevel;
    private isTimeInRange;
    private timeToMinutes;
    private getActiveExceptions;
    private getActiveOverride;
    private getNextChangeTime;
    private getTimeUntilNextChange;
    private calculateCostSavings;
}
//# sourceMappingURL=quiet-hours.service.d.ts.map