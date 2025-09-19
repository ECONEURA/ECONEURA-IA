import { CreateCompanyUseCase } from '../../application/use-cases/company/create-company.use-case.js';
import { UpdateCompanyUseCase } from '../../application/use-cases/company/update-company.use-case.js';
import { validateCreateCompanyRequest, validateUpdateCompanyRequest, validateDeleteCompanyRequest, validateGetCompanyRequest, validateSearchCompaniesRequest, validateBulkUpdateCompaniesRequest, validateBulkDeleteCompaniesRequest, transformCompanyToResponse, transformCompanyListToResponse, transformCompanyStatsToResponse } from '../dto/company.dto.js';
export class CompanyController {
    companyRepository;
    createCompanyUseCase;
    updateCompanyUseCase;
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
        this.createCompanyUseCase = new CreateCompanyUseCase(companyRepository);
        this.updateCompanyUseCase = new UpdateCompanyUseCase(companyRepository);
    }
    async createCompany(req, res, next) {
        try {
            const requestData = validateCreateCompanyRequest(req.body);
            const createdBy = req.user?.id || req.headers['x-user-id'];
            if (!createdBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
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
                });
                return;
            }
            const response = {
                success: true,
                data: transformCompanyToResponse(result.company),
                message: 'Company created successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async updateCompany(req, res, next) {
        try {
            const companyId = req.params.companyId;
            const requestData = validateUpdateCompanyRequest(req.body);
            const updatedBy = req.user?.id || req.headers['x-user-id'];
            if (!updatedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
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
                });
                return;
            }
            const response = {
                success: true,
                data: transformCompanyToResponse(result.company),
                message: 'Company updated successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCompany(req, res, next) {
        try {
            const requestData = validateDeleteCompanyRequest({ companyId: req.params.companyId });
            const company = await this.companyRepository.findById(requestData.companyId);
            if (!company) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found',
                    timestamp: new Date()
                });
                return;
            }
            await this.companyRepository.delete(requestData.companyId);
            const response = {
                success: true,
                message: 'Company deleted successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompanyById(req, res, next) {
        try {
            const requestData = validateGetCompanyRequest({ companyId: req.params.companyId });
            const company = await this.companyRepository.findById(requestData.companyId);
            if (!company) {
                res.status(404).json({
                    success: false,
                    error: 'Company not found',
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: transformCompanyToResponse(company),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompaniesByOrganization(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const companies = await this.companyRepository.findByOrganizationId(organizationId);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async searchCompanies(req, res, next) {
        try {
            const requestData = validateSearchCompaniesRequest({
                ...req.query,
                organizationId: req.params.organizationId
            });
            const result = await this.companyRepository.findPaginated(requestData.organizationId, requestData.page, requestData.limit, {
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
            });
            const response = {
                success: true,
                data: transformCompanyListToResponse(result),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompanyStats(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const companies = await this.companyRepository.findByOrganizationId(organizationId);
            const stats = this.calculateCompanyStats(companies);
            const response = {
                success: true,
                data: transformCompanyStatsToResponse(stats),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompaniesByType(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const type = req.params.type;
            const companies = await this.companyRepository.findByOrganizationAndType(organizationId, type);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompaniesByStatus(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const status = req.params.status;
            const companies = await this.companyRepository.findByOrganizationAndStatus(organizationId, status);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompaniesByIndustry(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const industry = req.params.industry;
            const companies = await this.companyRepository.findByOrganizationAndIndustry(organizationId, industry);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getCompaniesByAssignedUser(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const userId = req.params.userId;
            const companies = await this.companyRepository.findByOrganizationAndAssignedUser(organizationId, userId);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getOverdueForFollowUp(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const companies = await this.companyRepository.findOverdueForFollowUp(organizationId);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getScheduledForFollowUp(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const date = new Date(req.params.date);
            const companies = await this.companyRepository.findScheduledForFollowUp(organizationId, date);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getHighScoreLeads(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const minScore = parseInt(req.query.minScore) || 70;
            const companies = await this.companyRepository.findHighScoreLeads(organizationId, minScore);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getMediumScoreLeads(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const companies = await this.companyRepository.findMediumScoreLeads(organizationId);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getLowScoreLeads(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const companies = await this.companyRepository.findLowScoreLeads(organizationId);
            const response = {
                success: true,
                data: companies.map(transformCompanyToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkUpdateCompanies(req, res, next) {
        try {
            const requestData = validateBulkUpdateCompaniesRequest(req.body);
            const updatedBy = req.user?.id || req.headers['x-user-id'];
            if (!updatedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
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
                    }
                    else {
                        errorCount++;
                        results.push({ companyId, success: false, error: result.error });
                    }
                }
                catch (error) {
                    errorCount++;
                    results.push({
                        companyId,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            const response = {
                success: errorCount === 0,
                data: {
                    total: requestData.companyIds.length,
                    successful: successCount,
                    failed: errorCount,
                    results
                },
                message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkDeleteCompanies(req, res, next) {
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
                }
                catch (error) {
                    errorCount++;
                    results.push({
                        companyId,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            const response = {
                success: errorCount === 0,
                data: {
                    total: requestData.companyIds.length,
                    successful: successCount,
                    failed: errorCount,
                    results
                },
                message: `Bulk delete completed: ${successCount} successful, ${errorCount} failed`,
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    calculateCompanyStats(companies) {
        const stats = {
            total: companies.length,
            byType: {},
            byStatus: {},
            bySize: {},
            byIndustry: {},
            bySource: {},
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
            companiesByYear: {},
            companiesByMonth: {},
            topIndustries: [],
            topSources: [],
            topAssignedUsers: []
        };
        let totalLeadScore = 0;
        let leadScoreCount = 0;
        let totalRevenue = 0;
        let revenueCount = 0;
        let totalEmployeeCount = 0;
        let employeeCountCount = 0;
        for (const company of companies) {
            stats.byType[company.type] = (stats.byType[company.type] || 0) + 1;
            stats.byStatus[company.status] = (stats.byStatus[company.status] || 0) + 1;
            stats.bySize[company.size] = (stats.bySize[company.size] || 0) + 1;
            stats.byIndustry[company.industry] = (stats.byIndustry[company.industry] || 0) + 1;
            stats.bySource[company.source] = (stats.bySource[company.source] || 0) + 1;
            if (company.isActive) {
                stats.active++;
            }
            else {
                stats.inactive++;
            }
            if (company.type === 'customer')
                stats.customers++;
            if (company.type === 'supplier')
                stats.suppliers++;
            if (company.type === 'partner')
                stats.partners++;
            if (company.type === 'prospect')
                stats.prospects++;
            if (company.type === 'competitor')
                stats.competitors++;
            if (company.status === 'lead')
                stats.leads++;
            if (company.assignedUserId) {
                stats.assigned++;
            }
            else {
                stats.unassigned++;
            }
            if (company.parentCompanyId) {
                stats.withParentCompany++;
            }
            if (company.isOverdueForFollowUp) {
                stats.overdueForFollowUp++;
            }
            if (company.leadScore !== null && company.leadScore !== undefined) {
                totalLeadScore += company.leadScore;
                leadScoreCount++;
                if (company.leadScore >= 70)
                    stats.highScoreLeads++;
                else if (company.leadScore >= 30)
                    stats.mediumScoreLeads++;
                else
                    stats.lowScoreLeads++;
            }
            if (company.annualRevenue) {
                totalRevenue += company.annualRevenue.amount;
                revenueCount++;
            }
            if (company.employeeCount !== null && company.employeeCount !== undefined) {
                totalEmployeeCount += company.employeeCount;
                employeeCountCount++;
            }
            const year = new Date(company.createdAt).getFullYear().toString();
            stats.companiesByYear[year] = (stats.companiesByYear[year] || 0) + 1;
            const month = new Date(company.createdAt).toISOString().substring(0, 7);
            stats.companiesByMonth[month] = (stats.companiesByMonth[month] || 0) + 1;
        }
        stats.averageLeadScore = leadScoreCount > 0 ? totalLeadScore / leadScoreCount : 0;
        stats.totalAnnualRevenue = totalRevenue;
        stats.averageAnnualRevenue = revenueCount > 0 ? totalRevenue / revenueCount : 0;
        stats.totalEmployees = totalEmployeeCount;
        stats.averageEmployees = employeeCountCount > 0 ? totalEmployeeCount / employeeCountCount : 0;
        stats.topIndustries = Object.entries(stats.byIndustry)
            .map(([industry, count]) => ({ industry, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        stats.topSources = Object.entries(stats.bySource)
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const userCounts = {};
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
//# sourceMappingURL=company.controller.js.map