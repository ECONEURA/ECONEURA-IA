export class OnCallService {
    schedules = new Map();
    shifts = new Map();
    overrides = new Map();
    participants = new Map();
    constructor() {
        this.initializeDefaultSchedules();
    }
    async getOnCallSchedules(organizationId) {
        const schedules = Array.from(this.schedules.values())
            .filter(schedule => schedule.organizationId === organizationId);
        return schedules;
    }
    async getOnCallSchedule(id) {
        return this.schedules.get(id) || null;
    }
    async createOnCallSchedule(request) {
        const id = this.generateId();
        const now = new Date();
        const schedule = {
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
        this.schedules.set(id, schedule);
        await this.generateShifts(schedule);
        return schedule;
    }
    async updateOnCallSchedule(id, request) {
        const schedule = this.schedules.get(id);
        if (!schedule) {
            return null;
        }
        const updatedSchedule = {
            ...schedule,
            teamName: request.teamName ?? schedule.teamName,
            rotationType: request.rotationType ?? schedule.rotationType,
            schedule: request.schedule ?? schedule.schedule,
            escalationRules: request.escalationRules ?? schedule.escalationRules,
            enabled: request.enabled ?? schedule.enabled,
            updatedAt: new Date()
        };
        this.schedules.set(id, updatedSchedule);
        if (request.schedule || request.rotationType) {
            await this.generateShifts(updatedSchedule);
        }
        return updatedSchedule;
    }
    async deleteOnCallSchedule(id) {
        const shiftsToDelete = Array.from(this.shifts.values())
            .filter(shift => shift.scheduleId === id);
        shiftsToDelete.forEach(shift => this.shifts.delete(shift.id));
        return this.schedules.delete(id);
    }
    async getCurrentOnCall(scheduleId) {
        const now = new Date();
        const currentShift = Array.from(this.shifts.values())
            .find(shift => shift.scheduleId === scheduleId &&
            shift.startTime <= now &&
            shift.endTime >= now &&
            shift.status === 'active');
        if (!currentShift) {
            return null;
        }
        const activeOverride = this.getActiveOverride(scheduleId, now);
        if (activeOverride) {
            return this.participants.get(activeOverride.overrideUserId) || null;
        }
        return this.participants.get(currentShift.userId) || null;
    }
    async getOnCallHistory(scheduleId, limit = 50) {
        const history = Array.from(this.shifts.values())
            .filter(shift => shift.scheduleId === scheduleId)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
        return history;
    }
    async createOnCallOverride(scheduleId, originalUserId, overrideUserId, startTime, endTime, reason, requestedBy) {
        const id = this.generateId();
        const now = new Date();
        const override = {
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
        this.overrides.set(id, override);
        return override;
    }
    async updateOnCallOverride(id, status, approvedBy) {
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
    async getOnCallStats(organizationId) {
        const schedules = await this.getOnCallSchedules(organizationId);
        const activeSchedules = schedules.filter(s => s.enabled);
        const allShifts = Array.from(this.shifts.values())
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
    async generateShifts(schedule) {
        const now = new Date();
        const rotation = schedule.schedule.rotationPattern;
        const participants = schedule.schedule.participants;
        if (participants.length === 0) {
            return;
        }
        const currentDate = new Date(rotation.startDate);
        let participantIndex = 0;
        for (let i = 0; i < 90; i++) {
            const participant = participants[participantIndex];
            const startTime = new Date(currentDate);
            const endTime = new Date(currentDate);
            endTime.setDate(endTime.getDate() + rotation.duration);
            const shift = {
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
            this.shifts.set(shift.id, shift);
            participantIndex = (participantIndex + 1) % participants.length;
            currentDate.setDate(currentDate.getDate() + rotation.duration);
        }
    }
    async updateShiftMetrics(shiftId, incidentsHandled, responseTime) {
        const shift = this.shifts.get(shiftId);
        if (shift) {
            shift.incidentsHandled = incidentsHandled;
            shift.responseTime = responseTime;
            shift.updatedAt = new Date();
        }
    }
    async completeShift(shiftId, handoffNotes) {
        const shift = this.shifts.get(shiftId);
        if (shift) {
            shift.status = 'completed';
            shift.handoffNotes = handoffNotes;
            shift.updatedAt = new Date();
        }
    }
    initializeDefaultSchedules() {
        const defaultParticipants = [
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
            },
            {
                userId: 'user_2',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+1234567891',
                role: 'secondary',
                skills: ['incident-response', 'database-administration'],
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
            this.participants.set(participant.userId, participant);
        });
        const defaultSchedule = {
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
        this.schedules.set(defaultSchedule.id, defaultSchedule);
        this.generateShifts(defaultSchedule);
    }
    generateId() {
        return `oc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getActiveOverride(scheduleId, now) {
        const overrides = Array.from(this.overrides.values())
            .filter(override => override.scheduleId === scheduleId &&
            override.status === 'active' &&
            now >= override.startTime &&
            now <= override.endTime);
        return overrides.length > 0 ? overrides[0] : null;
    }
    calculateCoveragePercentage(schedules) {
        if (schedules.length === 0) {
            return 0;
        }
        const totalSchedules = schedules.length;
        const activeSchedules = schedules.filter(s => s.enabled).length;
        return (activeSchedules / totalSchedules) * 100;
    }
}
//# sourceMappingURL=oncall.service.js.map