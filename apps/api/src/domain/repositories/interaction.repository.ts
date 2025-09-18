import { Interaction, InteractionId, OrganizationId, ContactId, CompanyId, UserId, InteractionType, InteractionStatus, InteractionPriority } from '../entities/interaction.entity.js';

// ============================================================================
// INTERACTION REPOSITORY INTERFACE
// ============================================================================

export interface InteractionFilters {
  organizationId?: OrganizationId;
  contactId?: ContactId;
  companyId?: CompanyId;
  userId?: UserId;
  type?: InteractionType;
  status?: InteractionStatus;
  priority?: InteractionPriority;
  scheduledFrom?: Date;
  scheduledTo?: Date;
  completedFrom?: Date;
  completedTo?: Date;
  tags?: string[];
  hasOutcome?: boolean;
  hasNextAction?: boolean;
  overdue?: boolean;
  upcoming?: boolean;
}

export interface InteractionSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'scheduledAt' | 'completedAt' | 'subject' | 'priority';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface InteractionStats {
  total: number;
  byType: Record<InteractionType, number>;
  byStatus: Record<InteractionStatus, number>;
  byPriority: Record<InteractionPriority, number>;
  completed: number;
  pending: number;
  overdue: number;
  upcoming: number;
  averageDuration?: number;
  completionRate?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface InteractionRepository {
  // ========================================================================
  // BASIC CRUD OPERATIONS
  // ========================================================================

  findById(id: InteractionId): Promise<Interaction | null>;
  findByOrganizationId(organizationId: OrganizationId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByContactId(contactId: ContactId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByCompanyId(companyId: CompanyId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByUserId(userId: UserId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;

  save(interaction: Interaction): Promise<Interaction>;
  update(interaction: Interaction): Promise<Interaction>;
  delete(id: InteractionId): Promise<void>;

  // ========================================================================
  // SEARCH AND FILTER OPERATIONS
  // ========================================================================

  search(filters: InteractionFilters, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByFilters(filters: InteractionFilters, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  saveMany(interactions: Interaction[]): Promise<Interaction[]>;
  updateMany(interactions: Interaction[]): Promise<Interaction[]>;
  deleteMany(ids: InteractionId[]): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS
  // ========================================================================

  getStats(organizationId: OrganizationId, filters?: InteractionFilters): Promise<InteractionStats>;
  countByOrganizationId(organizationId: OrganizationId): Promise<number>;
  countByContactId(contactId: ContactId): Promise<number>;
  countByCompanyId(companyId: CompanyId): Promise<number>;
  countByUserId(userId: UserId): Promise<number>;

  // ========================================================================
  // TYPE-SPECIFIC QUERIES
  // ========================================================================

  findByType(type: InteractionType, organizationId: OrganizationId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByStatus(status: InteractionStatus, organizationId: OrganizationId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByPriority(priority: InteractionPriority, organizationId: OrganizationId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;

  // ========================================================================
  // SCHEDULING AND TIME-BASED QUERIES
  // ========================================================================

  findScheduled(organizationId: OrganizationId, from?: Date, to?: Date): Promise<Interaction[]>;
  findOverdue(organizationId: OrganizationId): Promise<Interaction[]>;
  findUpcoming(organizationId: OrganizationId, days?: number): Promise<Interaction[]>;
  findCompleted(organizationId: OrganizationId, from?: Date, to?: Date): Promise<Interaction[]>;

  // ========================================================================
  // TASK AND FOLLOW-UP QUERIES
  // ========================================================================

  findTasks(organizationId: OrganizationId, userId?: UserId, status?: InteractionStatus): Promise<Interaction[]>;
  findFollowUps(organizationId: OrganizationId, userId?: UserId): Promise<Interaction[]>;
  findOverdueTasks(organizationId: OrganizationId, userId?: UserId): Promise<Interaction[]>;
  findUpcomingTasks(organizationId: OrganizationId, userId?: UserId, days?: number): Promise<Interaction[]>;

  // ========================================================================
  // CONTACT AND COMPANY RELATIONSHIPS
  // ========================================================================

  findRecentByContact(contactId: ContactId, limit?: number): Promise<Interaction[]>;
  findRecentByCompany(companyId: CompanyId, limit?: number): Promise<Interaction[]>;
  findLastInteraction(contactId: ContactId): Promise<Interaction | null>;
  findLastInteractionByCompany(companyId: CompanyId): Promise<Interaction | null>;

  // ========================================================================
  // USER AND ASSIGNMENT QUERIES
  // ========================================================================

  findByAssignedUser(userId: UserId, organizationId: OrganizationId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findUnassigned(organizationId: OrganizationId): Promise<Interaction[]>;
  findMyTasks(userId: UserId, organizationId: OrganizationId): Promise<Interaction[]>;
  findMyOverdueTasks(userId: UserId, organizationId: OrganizationId): Promise<Interaction[]>;

  // ========================================================================
  // TAGS AND CUSTOM FIELDS
  // ========================================================================

  findByTags(tags: string[], organizationId: OrganizationId, options?: InteractionSearchOptions): Promise<PaginatedResult<Interaction>>;
  findByCustomField(key: string, value: any, organizationId: OrganizationId): Promise<Interaction[]>;
  getAvailableTags(organizationId: OrganizationId): Promise<string[]>;
  getCustomFieldKeys(organizationId: OrganizationId): Promise<string[]>;

  // ========================================================================
  // REPORTING AND ANALYTICS
  // ========================================================================

  getInteractionHistory(contactId: ContactId, from?: Date, to?: Date): Promise<Interaction[]>;
  getInteractionTimeline(organizationId: OrganizationId, from?: Date, to?: Date): Promise<Interaction[]>;
  getProductivityStats(userId: UserId, organizationId: OrganizationId, from?: Date, to?: Date): Promise<{
    totalInteractions: number;
    completedInteractions: number;
    averageDuration: number;
    completionRate: number;
    byType: Record<InteractionType, number>;
  }>;

  // ========================================================================
  // DASHBOARD AND SUMMARY QUERIES
  // ========================================================================

  getDashboardData(organizationId: OrganizationId, userId?: UserId): Promise<{
    todayTasks: number;
    overdueTasks: number;
    upcomingTasks: number;
    completedToday: number;
    recentInteractions: Interaction[];
    upcomingInteractions: Interaction[];
    overdueInteractions: Interaction[];
  }>;

  getContactSummary(contactId: ContactId): Promise<{
    totalInteractions: number;
    lastInteraction: Interaction | null;
    nextScheduled: Interaction | null;
    pendingTasks: number;
    completedTasks: number;
    averageResponseTime?: number;
  }>;

  getCompanySummary(companyId: CompanyId): Promise<{
    totalInteractions: number;
    lastInteraction: Interaction | null;
    nextScheduled: Interaction | null;
    pendingTasks: number;
    completedTasks: number;
    contactsInvolved: number;
    averageResponseTime?: number;
  }>;

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  exists(id: InteractionId): Promise<boolean>;
  existsByContactAndType(contactId: ContactId, type: InteractionType, organizationId: OrganizationId): Promise<boolean>;
  getNextScheduled(organizationId: OrganizationId, userId?: UserId): Promise<Interaction | null>;
  getOverdueCount(organizationId: OrganizationId, userId?: UserId): Promise<number>;
  getUpcomingCount(organizationId: OrganizationId, userId?: UserId, days?: number): Promise<number>;
}
