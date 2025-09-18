import { Deal, DealId, OrganizationId, ContactId, CompanyId, UserId, DealStage, DealStatus, DealPriority, DealSource } from '../entities/deal.entity.js';

// ============================================================================
// DEAL REPOSITORY INTERFACE
// ============================================================================

export interface DealFilters {
  organizationId?: OrganizationId;
  contactId?: ContactId;
  companyId?: CompanyId;
  userId?: UserId;
  stage?: DealStage;
  status?: DealStatus;
  priority?: DealPriority;
  source?: DealSource;
  valueFrom?: number;
  valueTo?: number;
  probabilityFrom?: number;
  probabilityTo?: number;
  expectedCloseFrom?: Date;
  expectedCloseTo?: Date;
  actualCloseFrom?: Date;
  actualCloseTo?: Date;
  tags?: string[];
  hasNextStep?: boolean;
  overdue?: boolean;
  won?: boolean;
  lost?: boolean;
  active?: boolean;
}

export interface DealSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'expectedCloseDate' | 'actualCloseDate' | 'name' | 'value' | 'probability' | 'priority';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DealStats {
  total: number;
  byStage: Record<DealStage, number>;
  byStatus: Record<DealStatus, number>;
  byPriority: Record<DealPriority, number>;
  bySource: Record<DealSource, number>;
  totalValue: number;
  weightedValue: number;
  wonValue: number;
  lostValue: number;
  activeValue: number;
  averageDealSize: number;
  averageSalesCycle: number;
  winRate: number;
  conversionRate: number;
  overdueCount: number;
  expectedThisMonth: number;
  expectedThisQuarter: number;
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

export interface DealRepository {
  // ========================================================================
  // BASIC CRUD OPERATIONS
  // ========================================================================

  findById(id: DealId): Promise<Deal | null>;
  findByOrganizationId(organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByContactId(contactId: ContactId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByCompanyId(companyId: CompanyId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByUserId(userId: UserId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;

  save(deal: Deal): Promise<Deal>;
  update(deal: Deal): Promise<Deal>;
  delete(id: DealId): Promise<void>;

  // ========================================================================
  // SEARCH AND FILTER OPERATIONS
  // ========================================================================

  search(filters: DealFilters, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByFilters(filters: DealFilters, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  saveMany(deals: Deal[]): Promise<Deal[]>;
  updateMany(deals: Deal[]): Promise<Deal[]>;
  deleteMany(ids: DealId[]): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS
  // ========================================================================

  getStats(organizationId: OrganizationId, filters?: DealFilters): Promise<DealStats>;
  countByOrganizationId(organizationId: OrganizationId): Promise<number>;
  countByContactId(contactId: ContactId): Promise<number>;
  countByCompanyId(companyId: CompanyId): Promise<number>;
  countByUserId(userId: UserId): Promise<number>;

  // ========================================================================
  // STAGE-SPECIFIC QUERIES
  // ========================================================================

  findByStage(stage: DealStage, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByStatus(status: DealStatus, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByPriority(priority: DealPriority, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findBySource(source: DealSource, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;

  // ========================================================================
  // VALUE AND PROBABILITY QUERIES
  // ========================================================================

  findByValueRange(minValue: number, maxValue: number, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByProbabilityRange(minProbability: number, maxProbability: number, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findHighValueDeals(organizationId: OrganizationId, minValue?: number, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findHighProbabilityDeals(organizationId: OrganizationId, minProbability?: number, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;

  // ========================================================================
  // TIME-BASED QUERIES
  // ========================================================================

  findExpectedToClose(from: Date, to: Date, organizationId: OrganizationId): Promise<Deal[]>;
  findOverdue(organizationId: OrganizationId): Promise<Deal[]>;
  findExpectedThisMonth(organizationId: OrganizationId): Promise<Deal[]>;
  findExpectedThisQuarter(organizationId: OrganizationId): Promise<Deal[]>;
  findExpectedThisYear(organizationId: OrganizationId): Promise<Deal[]>;
  findClosedInPeriod(from: Date, to: Date, organizationId: OrganizationId): Promise<Deal[]>;

  // ========================================================================
  // CONTACT AND COMPANY RELATIONSHIPS
  // ========================================================================

  findRecentByContact(contactId: ContactId, limit?: number): Promise<Deal[]>;
  findRecentByCompany(companyId: CompanyId, limit?: number): Promise<Deal[]>;
  findLastDeal(contactId: ContactId): Promise<Deal | null>;
  findLastDealByCompany(companyId: CompanyId): Promise<Deal | null>;
  findWonDealsByContact(contactId: ContactId): Promise<Deal[]>;
  findWonDealsByCompany(companyId: CompanyId): Promise<Deal[]>;

  // ========================================================================
  // USER AND ASSIGNMENT QUERIES
  // ========================================================================

  findByAssignedUser(userId: UserId, organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findUnassigned(organizationId: OrganizationId): Promise<Deal[]>;
  findMyDeals(userId: UserId, organizationId: OrganizationId): Promise<Deal[]>;
  findMyOverdueDeals(userId: UserId, organizationId: OrganizationId): Promise<Deal[]>;
  findMyWonDeals(userId: UserId, organizationId: OrganizationId, from?: Date, to?: Date): Promise<Deal[]>;
  findMyLostDeals(userId: UserId, organizationId: OrganizationId, from?: Date, to?: Date): Promise<Deal[]>;

  // ========================================================================
  // TAGS AND CUSTOM FIELDS
  // ========================================================================

  findByTags(tags: string[], organizationId: OrganizationId, options?: DealSearchOptions): Promise<PaginatedResult<Deal>>;
  findByCustomField(key: string, value: any, organizationId: OrganizationId): Promise<Deal[]>;
  getAvailableTags(organizationId: OrganizationId): Promise<string[]>;
  getCustomFieldKeys(organizationId: OrganizationId): Promise<string[]>;

  // ========================================================================
  // PIPELINE AND SALES QUERIES
  // ========================================================================

  getPipelineData(organizationId: OrganizationId, userId?: UserId): Promise<{
    byStage: Record<DealStage, { count: number; value: number; weightedValue: number }>;
    totalValue: number;
    totalWeightedValue: number;
    averageDealSize: number;
    averageSalesCycle: number;
  }>;

  getSalesForecast(organizationId: OrganizationId, userId?: UserId, months?: number): Promise<{
    monthly: Array<{ month: string; value: number; weightedValue: number; count: number }>;
    quarterly: Array<{ quarter: string; value: number; weightedValue: number; count: number }>;
    yearly: Array<{ year: string; value: number; weightedValue: number; count: number }>;
  }>;

  getConversionRates(organizationId: OrganizationId, userId?: UserId, from?: Date, to?: Date): Promise<{
    byStage: Record<DealStage, { entered: number; converted: number; rate: number }>;
    overall: { entered: number; won: number; rate: number };
  }>;

  // ========================================================================
  // REPORTING AND ANALYTICS
  // ========================================================================

  getDealHistory(contactId: ContactId, from?: Date, to?: Date): Promise<Deal[]>;
  getDealTimeline(organizationId: OrganizationId, from?: Date, to?: Date): Promise<Deal[]>;
  getSalesPerformance(userId: UserId, organizationId: OrganizationId, from?: Date, to?: Date): Promise<{
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    lostValue: number;
    averageDealSize: number;
    averageSalesCycle: number;
    winRate: number;
    byStage: Record<DealStage, number>;
    bySource: Record<DealSource, number>;
  }>;

  // ========================================================================
  // DASHBOARD AND SUMMARY QUERIES
  // ========================================================================

  getDashboardData(organizationId: OrganizationId, userId?: UserId): Promise<{
    totalDeals: number;
    activeDeals: number;
    wonDeals: number;
    lostDeals: number;
    overdueDeals: number;
    expectedThisMonth: number;
    totalValue: number;
    weightedValue: number;
    recentDeals: Deal[];
    upcomingDeals: Deal[];
    overdueDeals: Deal[];
    topDeals: Deal[];
  }>;

  getContactSummary(contactId: ContactId): Promise<{
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    lastDeal: Deal | null;
    averageDealSize: number;
    averageSalesCycle: number;
  }>;

  getCompanySummary(companyId: CompanyId): Promise<{
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    lastDeal: Deal | null;
    averageDealSize: number;
    averageSalesCycle: number;
    contactsInvolved: number;
  }>;

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  exists(id: DealId): Promise<boolean>;
  existsByContactAndName(contactId: ContactId, name: string, organizationId: OrganizationId): Promise<boolean>;
  getNextExpectedClose(organizationId: OrganizationId, userId?: UserId): Promise<Deal | null>;
  getOverdueCount(organizationId: OrganizationId, userId?: UserId): Promise<number>;
  getExpectedThisMonthCount(organizationId: OrganizationId, userId?: UserId): Promise<number>;
  getExpectedThisQuarterCount(organizationId: OrganizationId, userId?: UserId): Promise<number>;
  getWonCount(organizationId: OrganizationId, userId?: UserId, from?: Date, to?: Date): Promise<number>;
  getLostCount(organizationId: OrganizationId, userId?: UserId, from?: Date, to?: Date): Promise<number>;
  getTotalValue(organizationId: OrganizationId, userId?: UserId, filters?: DealFilters): Promise<number>;
  getWeightedValue(organizationId: OrganizationId, userId?: UserId, filters?: DealFilters): Promise<number>;
  getAverageDealSize(organizationId: OrganizationId, userId?: UserId, filters?: DealFilters): Promise<number>;
  getAverageSalesCycle(organizationId: OrganizationId, userId?: UserId, filters?: DealFilters): Promise<number>;
  getWinRate(organizationId: OrganizationId, userId?: UserId, from?: Date, to?: Date): Promise<number>;
  getConversionRate(organizationId: OrganizationId, userId?: UserId, from?: Date, to?: Date): Promise<number>;
}
