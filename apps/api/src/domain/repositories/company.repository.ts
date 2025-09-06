import { Company } from '../entities/company.entity.js';

// ============================================================================
// COMPANY REPOSITORY INTERFACE
// ============================================================================

export interface CompanyRepository {
  // ========================================================================
  // BASIC CRUD OPERATIONS
  // ========================================================================

  save(company: Company): Promise<Company>;
  findById(id: string): Promise<Company | null>;
  findByOrganizationId(organizationId: string): Promise<Company[]>;
  update(company: Company): Promise<Company>;
  delete(id: string): Promise<void>;

  // ========================================================================
  // QUERY OPERATIONS
  // ========================================================================

  findAll(): Promise<Company[]>;
  findByType(type: string): Promise<Company[]>;
  findByStatus(status: string): Promise<Company[]>;
  findBySize(size: string): Promise<Company[]>;
  findByIndustry(industry: string): Promise<Company[]>;
  findBySource(source: string): Promise<Company[]>;
  findByAssignedUser(userId: string): Promise<Company[]>;
  findByParentCompany(parentCompanyId: string): Promise<Company[]>;

  // ========================================================================
  // ORGANIZATION-SPECIFIC QUERIES
  // ========================================================================

  findByOrganizationAndType(organizationId: string, type: string): Promise<Company[]>;
  findByOrganizationAndStatus(organizationId: string, status: string): Promise<Company[]>;
  findByOrganizationAndSize(organizationId: string, size: string): Promise<Company[]>;
  findByOrganizationAndIndustry(organizationId: string, industry: string): Promise<Company[]>;
  findByOrganizationAndSource(organizationId: string, source: string): Promise<Company[]>;
  findByOrganizationAndAssignedUser(organizationId: string, userId: string): Promise<Company[]>;

  // ========================================================================
  // SEARCH OPERATIONS
  // ========================================================================

  search(query: string, organizationId: string): Promise<Company[]>;
  searchByName(name: string, organizationId: string): Promise<Company[]>;
  searchByEmail(email: string, organizationId: string): Promise<Company[]>;
  searchByPhone(phone: string, organizationId: string): Promise<Company[]>;
  searchByWebsite(website: string, organizationId: string): Promise<Company[]>;
  searchByTaxId(taxId: string, organizationId: string): Promise<Company[]>;
  searchByVatNumber(vatNumber: string, organizationId: string): Promise<Company[]>;

  // ========================================================================
  // ADVANCED QUERIES
  // ========================================================================

  findActiveCompanies(organizationId: string): Promise<Company[]>;
  findInactiveCompanies(organizationId: string): Promise<Company[]>;
  findCustomers(organizationId: string): Promise<Company[]>;
  findSuppliers(organizationId: string): Promise<Company[]>;
  findPartners(organizationId: string): Promise<Company[]>;
  findProspects(organizationId: string): Promise<Company[]>;
  findLeads(organizationId: string): Promise<Company[]>;
  findCompetitors(organizationId: string): Promise<Company[]>;

  // ========================================================================
  // FOLLOW-UP QUERIES
  // ========================================================================

  findOverdueForFollowUp(organizationId: string): Promise<Company[]>;
  findScheduledForFollowUp(organizationId: string, date: Date): Promise<Company[]>;
  findCompaniesNeedingFollowUp(organizationId: string, days: number): Promise<Company[]>;
  findCompaniesByLastContactDate(organizationId: string, fromDate: Date, toDate: Date): Promise<Company[]>;

  // ========================================================================
  // LEAD SCORING QUERIES
  // ========================================================================

  findHighScoreLeads(organizationId: string, minScore: number): Promise<Company[]>;
  findMediumScoreLeads(organizationId: string): Promise<Company[]>;
  findLowScoreLeads(organizationId: string): Promise<Company[]>;
  findCompaniesByLeadScoreRange(organizationId: string, minScore: number, maxScore: number): Promise<Company[]>;

  // ========================================================================
  // REVENUE QUERIES
  // ========================================================================

  findCompaniesByRevenueRange(organizationId: string, minRevenue: number, maxRevenue: number, currency: string): Promise<Company[]>;
  findHighRevenueCompanies(organizationId: string, minRevenue: number, currency: string): Promise<Company[]>;
  findCompaniesByEmployeeCount(organizationId: string, minEmployees: number, maxEmployees: number): Promise<Company[]>;

  // ========================================================================
  // PAGINATION
  // ========================================================================

  findPaginated(
    organizationId: string,
    page: number,
    limit: number,
    filters?: CompanyFilters
  ): Promise<PaginatedResult<Company>>;

  // ========================================================================
  // COUNTING
  // ========================================================================

  countByOrganization(organizationId: string): Promise<number>;
  countByType(type: string, organizationId: string): Promise<number>;
  countByStatus(status: string, organizationId: string): Promise<number>;
  countBySize(size: string, organizationId: string): Promise<number>;
  countByIndustry(industry: string, organizationId: string): Promise<number>;
  countBySource(source: string, organizationId: string): Promise<number>;
  countByAssignedUser(userId: string, organizationId: string): Promise<number>;
  countActiveCompanies(organizationId: string): Promise<number>;
  countInactiveCompanies(organizationId: string): Promise<number>;
  countCustomers(organizationId: string): Promise<number>;
  countSuppliers(organizationId: string): Promise<number>;
  countPartners(organizationId: string): Promise<number>;
  countProspects(organizationId: string): Promise<number>;
  countLeads(organizationId: string): Promise<number>;
  countOverdueForFollowUp(organizationId: string): Promise<number>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  saveMany(companies: Company[]): Promise<Company[]>;
  updateMany(companies: Company[]): Promise<Company[]>;
  deleteMany(ids: string[]): Promise<void>;

  // ========================================================================
  // TRANSACTION SUPPORT
  // ========================================================================

  withTransaction<T>(callback: (repo: CompanyRepository) => Promise<T>): Promise<T>;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface CompanyFilters {
  type?: string;
  status?: string;
  size?: string;
  industry?: string;
  source?: string;
  assignedUserId?: string;
  parentCompanyId?: string;
  isActive?: boolean;
  hasParentCompany?: boolean;
  isAssigned?: boolean;
  leadScoreMin?: number;
  leadScoreMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  currency?: string;
  employeeCountMin?: number;
  employeeCountMax?: number;
  foundedYearMin?: number;
  foundedYearMax?: number;
  lastContactAfter?: Date;
  lastContactBefore?: Date;
  nextFollowUpAfter?: Date;
  nextFollowUpBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CompanySearchOptions {
  organizationId: string;
  query?: string;
  type?: string;
  status?: string;
  size?: string;
  industry?: string;
  source?: string;
  assignedUserId?: string;
  parentCompanyId?: string;
  isActive?: boolean;
  hasParentCompany?: boolean;
  isAssigned?: boolean;
  leadScoreMin?: number;
  leadScoreMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  currency?: string;
  employeeCountMin?: number;
  employeeCountMax?: number;
  foundedYearMin?: number;
  foundedYearMax?: number;
  lastContactAfter?: Date;
  lastContactBefore?: Date;
  nextFollowUpAfter?: Date;
  nextFollowUpBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  tags?: string[];
  customFields?: Record<string, any>;
  sortBy?: 'name' | 'type' | 'status' | 'size' | 'industry' | 'source' | 'leadScore' | 'annualRevenue' | 'employeeCount' | 'foundedYear' | 'lastContactDate' | 'nextFollowUpDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CompanyStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  bySize: Record<string, number>;
  byIndustry: Record<string, number>;
  bySource: Record<string, number>;
  active: number;
  inactive: number;
  customers: number;
  suppliers: number;
  partners: number;
  prospects: number;
  leads: number;
  competitors: number;
  assigned: number;
  unassigned: number;
  withParentCompany: number;
  overdueForFollowUp: number;
  highScoreLeads: number;
  mediumScoreLeads: number;
  lowScoreLeads: number;
  averageLeadScore: number;
  totalAnnualRevenue: number;
  averageAnnualRevenue: number;
  totalEmployees: number;
  averageEmployees: number;
  companiesByYear: Record<number, number>;
  companiesByMonth: Record<string, number>;
  topIndustries: Array<{ industry: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
  topAssignedUsers: Array<{ userId: string; count: number }>;
}
