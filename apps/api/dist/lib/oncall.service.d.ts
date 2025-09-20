import { OnCallSchedule, OnCallShift, OnCallOverride, OnCallParticipant, CreateOnCallScheduleRequest, UpdateOnCallScheduleRequest, OnCallStats } from './quiet-hours-types.js';
export declare class OnCallService {
    private schedules;
    private shifts;
    private overrides;
    private participants;
    constructor();
    getOnCallSchedules(organizationId: string): Promise<OnCallSchedule[]>;
    getOnCallSchedule(id: string): Promise<OnCallSchedule | null>;
    createOnCallSchedule(request: CreateOnCallScheduleRequest): Promise<OnCallSchedule>;
    updateOnCallSchedule(id: string, request: UpdateOnCallScheduleRequest): Promise<OnCallSchedule | null>;
    deleteOnCallSchedule(id: string): Promise<boolean>;
    getCurrentOnCall(scheduleId: string): Promise<OnCallParticipant | null>;
    getOnCallHistory(scheduleId: string, limit?: number): Promise<OnCallShift[]>;
    createOnCallOverride(scheduleId: string, originalUserId: string, overrideUserId: string, startTime: Date, endTime: Date, reason: string, requestedBy: string): Promise<OnCallOverride>;
    updateOnCallOverride(id: string, status: 'approved' | 'rejected', approvedBy: string): Promise<OnCallOverride | null>;
    getOnCallStats(organizationId: string): Promise<OnCallStats>;
    generateShifts(schedule: OnCallSchedule): Promise<void>;
    updateShiftMetrics(shiftId: string, incidentsHandled: number, responseTime: number): Promise<void>;
    completeShift(shiftId: string, handoffNotes?: string): Promise<void>;
    private initializeDefaultSchedules;
    private generateId;
    private getActiveOverride;
    private calculateCoveragePercentage;
}
//# sourceMappingURL=oncall.service.d.ts.map