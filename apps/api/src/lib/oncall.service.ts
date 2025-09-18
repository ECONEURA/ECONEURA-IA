/**
 * PR-46: On-Call Management Service
 * 
 * Service for managing on-call schedules, rotations, and shifts
 */

import { 
  OnCallSchedule, 
  OnCallRotation, 
  OnCallShift, 
  OnCallOverride,
  OnCallParticipant,
  RotationPattern,
  CreateOnCallScheduleRequest,
  UpdateOnCallScheduleRequest,
  OnCallStats
} from './quiet-hours-types';

export class OnCallService {
  private schedules: Map<string, OnCallSchedule> = new Map();
  private shifts: Map<string, OnCallShift> = new Map();
  private overrides: Map<string, OnCallOverride> = new Map();
  private participants: Map<string, OnCallParticipant> = new Map();

  constructor() {
    this.initializeDefaultSchedules();
  }

  /**
   * Get all on-call schedules for an organization
   */
  async getOnCallSchedules(organizationId: string): Promise<OnCallSchedule[]> {
    const schedules = Array.from(this.schedules.values())
      .filter(schedule => schedule.organizationId === organizationId);
    
    return schedules;
  }

  /**
   * Get a specific on-call schedule
   */
  async getOnCallSchedule(id: string): Promise<OnCallSchedule | null> {
    return this.schedules.get(id) || null;
  }

  /**
   * Create a new on-call schedule
   */
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

    this.schedules.set(id, schedule);
    
    // Generate initial shifts
    await this.generateShifts(schedule);
    
    return schedule;
  }

  /**
   * Update an existing on-call schedule
   */
  async updateOnCallSchedule(id: string, request: UpdateOnCallScheduleRequest): Promise<OnCallSchedule | null> {
    const schedule = this.schedules.get(id);
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

    this.schedules.set(id, updatedSchedule);
    
    // Regenerate shifts if schedule changed
    if (request.schedule || request.rotationType) {
      await this.generateShifts(updatedSchedule);
    }
    
    return updatedSchedule;
  }

  /**
   * Delete an on-call schedule
   */
  async deleteOnCallSchedule(id: string): Promise<boolean> {
    // Delete associated shifts
    const shiftsToDelete = Array.from(this.shifts.values())
      .filter(shift => shift.scheduleId === id);
    
    shiftsToDelete.forEach(shift => this.shifts.delete(shift.id));
    
    return this.schedules.delete(id);
  }

  /**
   * Get current on-call person for a schedule
   */
  async getCurrentOnCall(scheduleId: string): Promise<OnCallParticipant | null> {
    const now = new Date();
    const currentShift = Array.from(this.shifts.values())
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
    const activeOverride = this.getActiveOverride(scheduleId, now);
    if (activeOverride) {
      return this.participants.get(activeOverride.overrideUserId) || null;
    }

    return this.participants.get(currentShift.userId) || null;
  }

  /**
   * Get on-call history for a schedule
   */
  async getOnCallHistory(scheduleId: string, limit: number = 50): Promise<OnCallShift[]> {
    const history = Array.from(this.shifts.values())
      .filter(shift => shift.scheduleId === scheduleId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);

    return history;
  }

  /**
   * Create an on-call override
   */
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

    this.overrides.set(id, override);
    return override;
  }

  /**
   * Approve or reject an on-call override
   */
  async updateOnCallOverride(
    id: string,
    status: 'approved' | 'rejected',
    approvedBy: string
  ): Promise<OnCallOverride | null> {
    const override = this.overrides.get(id);
    if (!override) {
      return null;
    }

    const updatedOverride: OnCallOverride = {
      ...override,
      status,
      approvedBy,
      updatedAt: new Date()
    };

    this.overrides.set(id, updatedOverride);
    return updatedOverride;
  }

  /**
   * Get on-call statistics
   */
  async getOnCallStats(organizationId: string): Promise<OnCallStats> {
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

  /**
   * Generate shifts for a schedule
   */
  async generateShifts(schedule: OnCallSchedule): Promise<void> {
    const now = new Date();
    const rotation = schedule.schedule.rotationPattern;
    const participants = schedule.schedule.participants;

    if (participants.length === 0) {
      return;
    }

    const currentDate = new Date(rotation.startDate);
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

      this.shifts.set(shift.id, shift);

      // Move to next participant
      participantIndex = (participantIndex + 1) % participants.length;
      currentDate.setDate(currentDate.getDate() + rotation.duration);
    }
  }

  /**
   * Update shift status and metrics
   */
  async updateShiftMetrics(shiftId: string, incidentsHandled: number, responseTime: number): Promise<void> {
    const shift = this.shifts.get(shiftId);
    if (shift) {
      shift.incidentsHandled = incidentsHandled;
      shift.responseTime = responseTime;
      shift.updatedAt = new Date();
    }
  }

  /**
   * Complete a shift
   */
  async completeShift(shiftId: string, handoffNotes?: string): Promise<void> {
    const shift = this.shifts.get(shiftId);
    if (shift) {
      shift.status = 'completed';
      shift.handoffNotes = handoffNotes;
      shift.updatedAt = new Date();
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private initializeDefaultSchedules(): void {
    // Initialize with default participants
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

    // Store participants
    defaultParticipants.forEach(participant => {
      this.participants.set(participant.userId, participant);
    });

    // Create default schedule
    const defaultSchedule: OnCallSchedule = {
      id: 'default-oncall-schedule',
      organizationId: 'org_1',
      teamName: 'Platform Team',
      rotationType: 'weekly',
      schedule: {
        participants: defaultParticipants,
        rotationPattern: {
          type: 'sequential',
          duration: 7, // 7 days
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
    
    // Generate initial shifts
    this.generateShifts(defaultSchedule);
  }

  private generateId(): string {
    return `oc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getActiveOverride(scheduleId: string, now: Date): OnCallOverride | null {
    const overrides = Array.from(this.overrides.values())
      .filter(override => 
        override.scheduleId === scheduleId &&
        override.status === 'active' &&
        now >= override.startTime &&
        now <= override.endTime
      );

    return overrides.length > 0 ? overrides[0] : null;
  }

  private calculateCoveragePercentage(schedules: OnCallSchedule[]): number {
    if (schedules.length === 0) {
      return 0;
    }

    const totalSchedules = schedules.length;
    const activeSchedules = schedules.filter(s => s.enabled).length;
    
    return (activeSchedules / totalSchedules) * 100;
  }
}
