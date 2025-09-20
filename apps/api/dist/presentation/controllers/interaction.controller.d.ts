import { Request, Response } from 'express';
import { CreateInteractionUseCase } from '../../application/use-cases/interaction/create-interaction.use-case.js';
import { UpdateInteractionUseCase } from '../../application/use-cases/interaction/update-interaction.use-case.js';
import { InteractionRepository } from '../../domain/repositories/interaction.repository.js';
export declare class InteractionController {
    private readonly createInteractionUseCase;
    private readonly updateInteractionUseCase;
    private readonly interactionRepository;
    constructor(createInteractionUseCase: CreateInteractionUseCase, updateInteractionUseCase: UpdateInteractionUseCase, interactionRepository: InteractionRepository);
    createInteraction(req: Request, res: Response): Promise<void>;
    createScheduledInteraction(req: Request, res: Response): Promise<void>;
    createTask(req: Request, res: Response): Promise<void>;
    createNote(req: Request, res: Response): Promise<void>;
    createFollowUp(req: Request, res: Response): Promise<void>;
    updateInteraction(req: Request, res: Response): Promise<void>;
    getInteractionById(req: Request, res: Response): Promise<void>;
    getInteractionsByOrganization(req: Request, res: Response): Promise<void>;
    getInteractionsByContact(req: Request, res: Response): Promise<void>;
    getInteractionsByCompany(req: Request, res: Response): Promise<void>;
    getInteractionStats(req: Request, res: Response): Promise<void>;
    getDashboardData(req: Request, res: Response): Promise<void>;
    deleteInteraction(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=interaction.controller.d.ts.map