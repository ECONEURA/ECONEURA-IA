/**
 * PR-46: Quiet Hours + On-Call Management Types
 *
 * TypeScript interfaces and types for the Quiet Hours and On-Call system
 */

// ============================================================================
// QUIET HOURS TYPES
// ============================================================================

export interface QuietHoursConfig {
  id: string;
  organizationId: string;
  serviceName?: string;
  timezone: string;
  schedule: QuietHoursSchedule;
  exceptions?: QuietHoursException[];
  costOptimization: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuietHoursSchedule {
  monday: TimeRange[];
  tuesday: TimeRange[];
  wednesday: TimeRange[];
  thursday: TimeRange[];
  friday: TimeRange[];
  saturday: TimeRange[];
  sunday: TimeRange[];
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  type: 'quiet' | 'reduced' | 'normal';
}

export interface QuietHoursException {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  type: 'holiday' | 'maintenance' | 'emergency' | 'custom';
  schedule: QuietHoursSchedule;
  description?: string;
}

export interface QuietHoursStatus {
  isQuietHours: boolean;
  currentLevel: 'quiet' | 'reduced' | 'normal';
  nextChange: Date;
  timeUntilNextChange: number; // milliseconds
  activeExceptions: QuietHoursException[];
  costSavings: number;
}

export interface QuietHoursOverride {
  id: string;
  organizationId: string;
  serviceName?: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  createdAt: Date;
}

// ============================================================================
// ON-CALL TYPES
// ============================================================================

export interface OnCallSchedule {
  id: string;
  organizationId: string;
  teamName: string;
  rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule: OnCallRotation;
  escalationRules: EscalationRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnCallRotation {
  participants: OnCallParticipant[];
  rotationPattern: RotationPattern;
  handoffTime: string; // HH:MM format
  handoffTimezone: string;
  overlapMinutes: number;
}

export interface OnCallParticipant {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: 'primary' | 'secondary' | 'escalation';
  skills: string[];
  availability: AvailabilityWindow[];
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;  // HH:MM format
  endTime: string;    // HH:MM format
  timezone: string;
}

export interface RotationPattern {
  type: 'sequential' | 'round_robin' | 'weighted';
  duration: number; // days
  startDate: Date;
  customSchedule?: CustomRotationDay[];
}

export interface CustomRotationDay {
  date: string; // YYYY-MM-DD format
  userId: string;
  role: 'primary' | 'secondary' | 'escalation';
}

export interface OnCallShift {
  id: string;
  scheduleId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  handoffNotes?: string;
  incidentsHandled: number;
  responseTime: number; // average in minutes
  createdAt: Date;
}

export interface OnCallOverride {
  id: string;
  scheduleId: string;
  originalUserId: string;
  overrideUserId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  createdAt: Date;
}

// ============================================================================
// ESCALATION TYPES
// ============================================================================

export interface EscalationRule {
  id: string;
  organizationId: string;
  ruleName: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  timeouts: EscalationTimeout[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationCondition {
  type: 'severity' | 'service' | 'time' | 'count' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches';
  value: any;
  field?: string;
}

export interface EscalationAction {
  type: 'notify' | 'escalate' | 'page' | 'call' | 'webhook' | 'custom';
  target: string;
  message?: string;
  delay?: number; // seconds
  retryCount?: number;
  retryDelay?: number; // seconds
}

export interface EscalationTimeout {
  level: number;
  timeoutMinutes: number;
  action: EscalationAction;
}

export interface EscalationEvent {
  id: string;
  ruleId: string;
  organizationId: string;
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'escalating' | 'resolved' | 'timeout';
  currentLevel: number;
  startTime: Date;
  lastEscalation: Date;
  nextEscalation?: Date;
  resolvedAt?: Date;
  participants: EscalationParticipant[];
  history: EscalationHistoryEntry[];
}

export interface EscalationParticipant {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  level: number;
  notifiedAt?: Date;
  respondedAt?: Date;
  responseTime?: number; // minutes
}

export interface EscalationHistoryEntry {
  timestamp: Date;
  level: number;
  action: string;
  participant?: string;
  result: 'success' | 'failed' | 'timeout';
  details?: string;
}

// ============================================================================
// NOTIFICATION INTELLIGENCE TYPES
// ============================================================================

export interface NotificationPreferences {
  id: string;
  userId: string;
  organizationId: string;
  channels: NotificationChannel[];
  quietHours: QuietHoursNotificationSettings;
  escalation: EscalationNotificationSettings;
  digest: DigestSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'slack' | 'teams' | 'webhook';
  enabled: boolean;
  address: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  filters?: NotificationFilter[];
}

export interface NotificationFilter {
  type: 'service' | 'severity' | 'keyword' | 'custom';
  operator: 'equals' | 'contains' | 'matches' | 'excludes';
  value: any;
}

export interface QuietHoursNotificationSettings {
  enabled: boolean;
  allowCritical: boolean;
  allowEscalation: boolean;
  maxFrequency: number; // notifications per hour
  channels: string[]; // channel types allowed during quiet hours
}

export interface EscalationNotificationSettings {
  enabled: boolean;
  maxLevel: number;
  channels: string[];
  timeoutMinutes: number;
}

export interface DigestSettings {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  time: string; // HH:MM format
  timezone: string;
  channels: string[];
  includeResolved: boolean;
  maxItems: number;
}

export interface Notification {
  id: string;
  userId: string;
  organizationId: string;
  type: 'alert' | 'escalation' | 'digest' | 'system' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
}

export interface NotificationAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number; // seconds
  averageReadTime: number; // seconds
  channelStats: ChannelStats[];
  timeStats: TimeStats[];
  errorStats: ErrorStats[];
}

export interface ChannelStats {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageDeliveryTime: number;
}

export interface TimeStats {
  hour: number;
  sent: number;
  delivered: number;
  read: number;
  deliveryRate: number;
  readRate: number;
}

export interface ErrorStats {
  error: string;
  count: number;
  percentage: number;
  lastOccurred: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateQuietHoursRequest {
  organizationId: string;
  serviceName?: string;
  timezone: string;
  schedule: QuietHoursSchedule;
  exceptions?: QuietHoursException[];
  costOptimization?: boolean;
}

export interface UpdateQuietHoursRequest {
  timezone?: string;
  schedule?: QuietHoursSchedule;
  exceptions?: QuietHoursException[];
  costOptimization?: boolean;
  enabled?: boolean;
}

export interface CreateOnCallScheduleRequest {
  organizationId: string;
  teamName: string;
  rotationType: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule: OnCallRotation;
  escalationRules?: EscalationRule[];
}

export interface UpdateOnCallScheduleRequest {
  teamName?: string;
  rotationType?: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule?: OnCallRotation;
  escalationRules?: EscalationRule[];
  enabled?: boolean;
}

export interface CreateEscalationRuleRequest {
  organizationId: string;
  ruleName: string;
  conditions: EscalationCondition[];
  actions: EscalationAction[];
  timeouts: EscalationTimeout[];
  priority?: number;
}

export interface UpdateEscalationRuleRequest {
  ruleName?: string;
  conditions?: EscalationCondition[];
  actions?: EscalationAction[];
  timeouts?: EscalationTimeout[];
  enabled?: boolean;
  priority?: number;
}

export interface TriggerEscalationRequest {
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service?: string;
  message?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationPreferencesRequest {
  channels?: NotificationChannel[];
  quietHours?: QuietHoursNotificationSettings;
  escalation?: EscalationNotificationSettings;
  digest?: DigestSettings;
}

export interface SendNotificationRequest {
  userId: string;
  type: 'alert' | 'escalation' | 'digest' | 'system' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  channels?: string[];
  metadata?: Record<string, any>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface QuietHoursResponse {
  success: boolean;
  data?: QuietHoursConfig | QuietHoursConfig[];
  message?: string;
  error?: string;
}

export interface OnCallResponse {
  success: boolean;
  data?: OnCallSchedule | OnCallSchedule[] | OnCallShift | OnCallShift[];
  message?: string;
  error?: string;
}

export interface EscalationResponse {
  success: boolean;
  data?: EscalationRule | EscalationRule[] | EscalationEvent | EscalationEvent[];
  message?: string;
  error?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification | Notification[] | NotificationAnalytics;
  message?: string;
  error?: string;
}

export interface QuietHoursStats {
  totalConfigurations: number;
  activeConfigurations: number;
  totalExceptions: number;
  averageCostSavings: number;
  uptimeDuringQuietHours: number;
  alertReduction: number;
}

export interface OnCallStats {
  totalSchedules: number;
  activeSchedules: number;
  totalShifts: number;
  averageResponseTime: number;
  escalationRate: number;
  coveragePercentage: number;
}

export interface EscalationStats {
  totalRules: number;
  activeRules: number;
  totalEvents: number;
  averageEscalationTime: number;
  resolutionRate: number;
  timeoutRate: number;
}

export interface NotificationStats {
  totalNotifications: number;
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number;
  channelEffectiveness: Record<string, number>;
  userSatisfaction: number;
}
