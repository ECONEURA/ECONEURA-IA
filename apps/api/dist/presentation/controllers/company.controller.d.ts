import { Request, Response, NextFunction } from 'express';
import { CompanyRepository } from '../../domain/repositories/company.repository.js';
export declare class CompanyController {
    private companyRepository;
    private createCompanyUseCase;
    private updateCompanyUseCase;
    constructor(companyRepository: CompanyRepository);
    createCompany(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateCompany(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompaniesByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchCompanies(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompanyStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompaniesByType(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompaniesByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompaniesByIndustry(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCompaniesByAssignedUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOverdueForFollowUp(req: Request, res: Response, next: NextFunction): Promise<void>;
    getScheduledForFollowUp(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHighScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMediumScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLowScoreLeads(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdateCompanies(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeleteCompanies(req: Request, res: Response, next: NextFunction): Promise<void>;
    private calculateCompanyStats;
}
//# sourceMappingURL=company.controller.d.ts.map