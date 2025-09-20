import { Request, Response, NextFunction } from 'express';
import { ArchitectureRepository } from '../../domain/repositories/architecture.repository.js';
import { BaseController } from './base.controller.js';
export declare class ArchitectureController extends BaseController {
    private architectureRepository;
    private createArchitectureUseCase;
    private analyzeArchitectureUseCase;
    constructor(architectureRepository: ArchitectureRepository);
    createArchitecture(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateArchitecture(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteArchitecture(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchitecture(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchitecturesByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchArchitectures(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchitectureStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchitecturesByType(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchitecturesByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getActiveArchitectures(req: Request, res: Response, next: NextFunction): Promise<void>;
    getArchitecturesWithMetrics(req: Request, res: Response, next: NextFunction): Promise<void>;
    analyzeArchitecture(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdateArchitectures(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeleteArchitectures(req: Request, res: Response, next: NextFunction): Promise<void>;
    private transformArchitectureToResponse;
    private transformStatsToResponse;
}
//# sourceMappingURL=architecture.controller.d.ts.map