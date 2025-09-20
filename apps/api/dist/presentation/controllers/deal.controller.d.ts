import { Request, Response } from 'express';
import { CreateDealUseCase } from '../../application/use-cases/deal/create-deal.use-case.js';
import { UpdateDealUseCase } from '../../application/use-cases/deal/update-deal.use-case.js';
import { DealRepository } from '../../domain/repositories/deal.repository.js';
export declare class DealController {
    private readonly createDealUseCase;
    private readonly updateDealUseCase;
    private readonly dealRepository;
    constructor(createDealUseCase: CreateDealUseCase, updateDealUseCase: UpdateDealUseCase, dealRepository: DealRepository);
    createDeal(req: Request, res: Response): Promise<void>;
    createLead(req: Request, res: Response): Promise<void>;
    createQualified(req: Request, res: Response): Promise<void>;
    createProposal(req: Request, res: Response): Promise<void>;
    createNegotiation(req: Request, res: Response): Promise<void>;
    updateDeal(req: Request, res: Response): Promise<void>;
    getDealById(req: Request, res: Response): Promise<void>;
    getDealsByOrganization(req: Request, res: Response): Promise<void>;
    getDealsByContact(req: Request, res: Response): Promise<void>;
    getDealsByCompany(req: Request, res: Response): Promise<void>;
    getDealStats(req: Request, res: Response): Promise<void>;
    getPipelineData(req: Request, res: Response): Promise<void>;
    getSalesForecast(req: Request, res: Response): Promise<void>;
    getConversionRates(req: Request, res: Response): Promise<void>;
    getDashboardData(req: Request, res: Response): Promise<void>;
    deleteDeal(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=deal.controller.d.ts.map