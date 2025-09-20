import { Deal, DealId, DealStage, DealStatus, DealPriority, OrganizationId, UserId } from '../../../domain/entities/deal.entity.js';
import { DealRepository } from '../../../domain/repositories/deal.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
export interface UpdateDealRequest {
    id: DealId;
    organizationId: OrganizationId;
    userId: UserId;
    updates: {
        name?: string;
        description?: string;
        stage?: DealStage;
        status?: DealStatus;
        priority?: DealPriority;
        value?: number;
        currency?: string;
        probability?: number;
        expectedCloseDate?: Date;
        nextStep?: string;
        nextStepDate?: Date;
        tags?: string[];
        customFields?: Record<string, any>;
        attachments?: string[];
        notes?: string;
        competitors?: string[];
        decisionMakers?: string[];
        budget?: number;
        timeline?: string;
        requirements?: string[];
        objections?: string[];
    };
}
export interface UpdateDealResponse {
    success: true;
    data: {
        deal: Deal;
    };
}
export declare class UpdateDealUseCase {
    private readonly dealRepository;
    private readonly userDomainService;
    constructor(dealRepository: DealRepository, userDomainService: UserDomainService);
    execute(request: UpdateDealRequest): Promise<UpdateDealResponse>;
    updateStage(id: DealId, organizationId: OrganizationId, userId: UserId, stage: DealStage): Promise<UpdateDealResponse>;
    updateStatus(id: DealId, organizationId: OrganizationId, userId: UserId, status: DealStatus): Promise<UpdateDealResponse>;
    updatePriority(id: DealId, organizationId: OrganizationId, userId: UserId, priority: DealPriority): Promise<UpdateDealResponse>;
    updateValue(id: DealId, organizationId: OrganizationId, userId: UserId, value: number, currency?: string): Promise<UpdateDealResponse>;
    updateProbability(id: DealId, organizationId: OrganizationId, userId: UserId, probability: number): Promise<UpdateDealResponse>;
    setExpectedCloseDate(id: DealId, organizationId: OrganizationId, userId: UserId, expectedCloseDate: Date): Promise<UpdateDealResponse>;
    setNextStep(id: DealId, organizationId: OrganizationId, userId: UserId, nextStep: string, nextStepDate?: Date): Promise<UpdateDealResponse>;
    addTag(id: DealId, organizationId: OrganizationId, userId: UserId, tag: string): Promise<UpdateDealResponse>;
    removeTag(id: DealId, organizationId: OrganizationId, userId: UserId, tag: string): Promise<UpdateDealResponse>;
    addCompetitor(id: DealId, organizationId: OrganizationId, userId: UserId, competitor: string): Promise<UpdateDealResponse>;
    removeCompetitor(id: DealId, organizationId: OrganizationId, userId: UserId, competitor: string): Promise<UpdateDealResponse>;
    addDecisionMaker(id: DealId, organizationId: OrganizationId, userId: UserId, decisionMaker: string): Promise<UpdateDealResponse>;
    removeDecisionMaker(id: DealId, organizationId: OrganizationId, userId: UserId, decisionMaker: string): Promise<UpdateDealResponse>;
}
//# sourceMappingURL=update-deal.use-case.d.ts.map