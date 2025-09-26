import { Request, Response, NextFunction } from 'express';

import { CompanyRepository } from '../../domain/repositories/company.repository.js';
import { CreateCompanyUseCase } from '../../application/use-cases/company/create-company.use-case.js';
import { UpdateCompanyUseCase } from '../../application/use-cases/company/update-company.use-case.js';
import {
  CompanyResponse,
  CompanyListResponse,
  CompanyStatsResponse,
  ApiResponse,
  validateCreateCompanyRequest,
  validateUpdateCompanyRequest,
  validateDeleteCompanyRequest,
  validateGetCompanyRequest,
  validateSearchCompaniesRequest,
  validateBulkUpdateCompaniesRequest,
  validateBulkDeleteCompaniesRequest,
  transformCompanyToResponse,
  transformCompanyListToResponse,
  transformCompanyStatsToResponse
} from '../dto/company.dto.js';

// ============================================================================
// COMPANY CONTROLLER
// ============================================================================

export class CompanyController {
  private createCompanyUseCase: CreateCompanyUseCase;
  private updateCompanyUseCase: UpdateCompanyUseCase;

  constructor(private companyRepository: CompanyRepository) {
    this.createCompanyUseCase = new CreateCompanyUseCase(companyRepository);
    this.updateCompanyUseCase = new UpdateCompanyUseCase(companyRepository);
  }

  // ========================================================================
  // COMPANY MANAGEMENT
  // ========================================================================

  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateCreateCompanyRequest(req.body);
      const createdBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!createdBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.createCompanyUseCase.execute({
        ...requestData,
        createdBy
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<CompanyResponse> = {
        success: true,
        data: transformCompanyToResponse(result.company!),
        message: 'Company created successfully',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.params.companyId;
      const requestData = validateUpdateCompanyRequest(req.body);
      const updatedBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!updatedBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.updateCompanyUseCase.execute({
        companyId,
        ...requestData,
        updatedBy
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<CompanyResponse> = {
        success: true,
        data: transformCompanyToResponse(result.company!),
        message: 'Company updated successfully',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateDeleteCompanyRequest({ companyId: req.params.companyId });

      // Check if company exists
      const company = await this.companyRepository.findById(requestData.companyId);
      if (!company) {
        res.status(404).json({
          success: false,
          error: 'Company not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      await this.companyRepository.delete(requestData.companyId);

      const response: ApiResponse = {
        success: true,
        message: 'Company deleted successfully',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // COMPANY QUERIES
  // ========================================================================

  async getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateGetCompanyRequest({ companyId: req.params.companyId });
      const company = await this.companyRepository.findById(requestData.companyId);

      if (!company) {
        res.status(404).json({
          success: false,
          error: 'Company not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<CompanyResponse> = {
        success: true,
        data: transformCompanyToResponse(company),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCompaniesByOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const companies = await this.companyRepository.findByOrganizationId(organizationId);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async searchCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateSearchCompaniesRequest({
        ...req.query,
        organizationId: req.params.organizationId
      });

      const result = await this.companyRepository.findPaginated(
        requestData.organizationId,
        requestData.page,
        requestData.limit,
        {
          type: requestData.type,
          status: requestData.status,
          size: requestData.size,
          industry: requestData.industry,
          source: requestData.source,
          assignedUserId: requestData.assignedUserId,
          parentCompanyId: requestData.parentCompanyId,
          isActive: requestData.isActive,
          hasParentCompany: requestData.hasParentCompany,
          isAssigned: requestData.isAssigned,
          leadScoreMin: requestData.leadScoreMin,
          leadScoreMax: requestData.leadScoreMax,
          revenueMin: requestData.revenueMin,
          revenueMax: requestData.revenueMax,
          currency: requestData.currency,
          employeeCountMin: requestData.employeeCountMin,
          employeeCountMax: requestData.employeeCountMax,
          foundedYearMin: requestData.foundedYearMin,
          foundedYearMax: requestData.foundedYearMax,
          lastContactAfter: requestData.lastContactAfter,
          lastContactBefore: requestData.lastContactBefore,
          nextFollowUpAfter: requestData.nextFollowUpAfter,
          nextFollowUpBefore: requestData.nextFollowUpBefore,
          createdAfter: requestData.createdAfter,
          createdBefore: requestData.createdBefore,
          updatedAfter: requestData.updatedAfter,
          updatedBefore: requestData.updatedBefore,
          tags: requestData.tags
        }
      );

      const response: ApiResponse<CompanyListResponse> = {
        success: true,
        data: transformCompanyListToResponse(result),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // COMPANY STATISTICS
  // ========================================================================

  async getCompanyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const companies = await this.companyRepository.findByOrganizationId(organizationId);

      const stats = this.calculateCompanyStats(companies);

      const response: ApiResponse<CompanyStatsResponse> = {
        success: true,
        data: transformCompanyStatsToResponse(stats),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // COMPANY FILTERS
  // ========================================================================

  async getCompaniesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const type = req.params.type;
      const companies = await this.companyRepository.findByOrganizationAndType(organizationId, type);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCompaniesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const status = req.params.status;
      const companies = await this.companyRepository.findByOrganizationAndStatus(organizationId, status);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCompaniesByIndustry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const industry = req.params.industry;
      const companies = await this.companyRepository.findByOrganizationAndIndustry(organizationId, industry);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getCompaniesByAssignedUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const userId = req.params.userId;
      const companies = await this.companyRepository.findByOrganizationAndAssignedUser(organizationId, userId);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // FOLLOW-UP QUERIES
  // ========================================================================

  async getOverdueForFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const companies = await this.companyRepository.findOverdueForFollowUp(organizationId);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getScheduledForFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const date = new Date(req.params.date);
      const companies = await this.companyRepository.findScheduledForFollowUp(organizationId, date);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // LEAD SCORING QUERIES
  // ========================================================================

  async getHighScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const minScore = parseInt(req.query.minScore as string) || 70;
      const companies = await this.companyRepository.findHighScoreLeads(organizationId, minScore);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMediumScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const companies = await this.companyRepository.findMediumScoreLeads(organizationId);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getLowScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const companies = await this.companyRepository.findLowScoreLeads(organizationId);

      const response: ApiResponse<CompanyResponse[]> = {
        success: true,
        data: companies.map(transformCompanyToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async bulkUpdateCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateBulkUpdateCompaniesRequest(req.body);
      const updatedBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!updatedBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const companyId of requestData.companyIds) {
        try {
          const result = await this.updateCompanyUseCase.execute({
            companyId,
            ...requestData.updates,
            updatedBy
          });

          if (result.success) {
            successCount++;
            results.push({ companyId, success: true, company: result.company });
          } else {
            errorCount++;
            results.push({ companyId, success: false, error: result.error });
          }
        } catch (error) {
          errorCount++;
          results.push({ 
            companyId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const response: ApiResponse = {
        success: errorCount === 0,
        data: {
          total: requestData.companyIds.length,
          successful: successCount,
          failed: errorCount,
          results
        },
        message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateBulkDeleteCompaniesRequest(req.body);

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const companyId of requestData.companyIds) {
        try {
          const company = await this.companyRepository.findById(companyId);
          if (!company) {
            errorCount++;
            results.push({ companyId, success: false, error: 'Company not found' });
            continue;
          }

          await this.companyRepository.delete(companyId);
          successCount++;
          results.push({ companyId, success: true });
        } catch (error) {
          errorCount++;
          results.push({ 
            companyId, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const response: ApiResponse = {
        success: errorCount === 0,
        data: {
          total: requestData.companyIds.length,
          successful: successCount,
          failed: errorCount,
          results
        },
        message: `Bulk delete completed: ${successCount} successful, ${errorCount} failed`,
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  private calculateCompanyStats(companies: any[]): any {
    const stats = {
      total: companies.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      bySize: {} as Record<string, number>,
      byIndustry: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      active: 0,
      inactive: 0,
      customers: 0,
      suppliers: 0,
      partners: 0,
      prospects: 0,
      leads: 0,
      competitors: 0,
      assigned: 0,
      unassigned: 0,
      withParentCompany: 0,
      overdueForFollowUp: 0,
      highScoreLeads: 0,
      mediumScoreLeads: 0,
      lowScoreLeads: 0,
      averageLeadScore: 0,
      totalAnnualRevenue: 0,
      averageAnnualRevenue: 0,
      totalEmployees: 0,
      averageEmployees: 0,
      companiesByYear: {} as Record<string, number>,
      companiesByMonth: {} as Record<string, number>,
      topIndustries: [] as Array<{ industry: string; count: number }>,
      topSources: [] as Array<{ source: string; count: number }>,
      topAssignedUsers: [] as Array<{ userId: string; count: number }>
    };

    let totalLeadScore = 0;
    let leadScoreCount = 0;
    let totalRevenue = 0;
    let revenueCount = 0;
    let totalEmployeeCount = 0;
    let employeeCountCount = 0;

    for (const company of companies) {
      // Count by type
      stats.byType[company.type] = (stats.byType[company.type] || 0) + 1;
      
      // Count by status
      stats.byStatus[company.status] = (stats.byStatus[company.status] || 0) + 1;
      
      // Count by size
      stats.bySize[company.size] = (stats.bySize[company.size] || 0) + 1;
      
      // Count by industry
      stats.byIndustry[company.industry] = (stats.byIndustry[company.industry] || 0) + 1;
      
      // Count by source
      stats.bySource[company.source] = (stats.bySource[company.source] || 0) + 1;

      // Count active/inactive
      if (company.isActive) {
        stats.active++;
      } else {
        stats.inactive++;
      }

      // Count by type
      if (company.type === 'customer') stats.customers++;
      if (company.type === 'supplier') stats.suppliers++;
      if (company.type === 'partner') stats.partners++;
      if (company.type === 'prospect') stats.prospects++;
      if (company.type === 'competitor') stats.competitors++;

      // Count by status
      if (company.status === 'lead') stats.leads++;

      // Count assigned/unassigned
      if (company.assignedUserId) {
        stats.assigned++;
      } else {
        stats.unassigned++;
      }

      // Count with parent company
      if (company.parentCompanyId) {
        stats.withParentCompany++;
      }

      // Count overdue for follow-up
      if (company.isOverdueForFollowUp) {
        stats.overdueForFollowUp++;
      }

      // Lead score calculations
      if (company.leadScore !== null && company.leadScore !== undefined) {
        totalLeadScore += company.leadScore;
        leadScoreCount++;
        
        if (company.leadScore >= 70) stats.highScoreLeads++;
        else if (company.leadScore >= 30) stats.mediumScoreLeads++;
        else stats.lowScoreLeads++;
      }

      // Revenue calculations
      if (company.annualRevenue) {
        totalRevenue += company.annualRevenue.amount;
        revenueCount++;
      }

      // Employee count calculations
      if (company.employeeCount !== null && company.employeeCount !== undefined) {
        totalEmployeeCount += company.employeeCount;
        employeeCountCount++;
      }

      // Count by year
      const year = new Date(company.createdAt).getFullYear().toString();
      stats.companiesByYear[year] = (stats.companiesByYear[year] || 0) + 1;

      // Count by month
      const month = new Date(company.createdAt).toISOString().substring(0, 7);
      stats.companiesByMonth[month] = (stats.companiesByMonth[month] || 0) + 1;
    }

    // Calculate averages
    stats.averageLeadScore = leadScoreCount > 0 ? totalLeadScore / leadScoreCount : 0;
    stats.totalAnnualRevenue = totalRevenue;
    stats.averageAnnualRevenue = revenueCount > 0 ? totalRevenue / revenueCount : 0;
    stats.totalEmployees = totalEmployeeCount;
    stats.averageEmployees = employeeCountCount > 0 ? totalEmployeeCount / employeeCountCount : 0;

    // Sort top industries
    stats.topIndustries = Object.entries(stats.byIndustry)
      .map(([industry, count]) => ({ industry, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sort top sources
    stats.topSources = Object.entries(stats.bySource)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sort top assigned users
    const userCounts = {} as Record<string, number>;
    for (const company of companies) {
      if (company.assignedUserId) {
        userCounts[company.assignedUserId] = (userCounts[company.assignedUserId] || 0) + 1;
      }
    }
    stats.topAssignedUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }
}
