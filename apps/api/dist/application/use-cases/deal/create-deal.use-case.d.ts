import { Deal, DealStage, DealPriority, DealSource, OrganizationId, ContactId, UserId, CompanyId } from '../../../domain/entities/deal.entity.js';
import { DealRepository } from '../../../domain/repositories/deal.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
export interface CreateDealRequest {
    organizationId: OrganizationId;
    contactId: ContactId;
    userId: UserId;
    name: string;
    description?: string;
    stage?: DealStage;
    priority?: DealPriority;
    source?: DealSource;
    value: number;
    currency?: string;
    probability?: number;
    companyId?: CompanyId;
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
}
export interface CreateDealResponse {
    success: true;
    data: {
        deal: Deal;
    };
}
export declare class CreateDealUseCase {
    private readonly dealRepository;
    private readonly userDomainService;
    constructor(dealRepository: DealRepository, userDomainService: UserDomainService);
    execute(request: CreateDealRequest): Promise<CreateDealResponse>;
    createLead(organizationId: OrganizationId, contactId: ContactId, userId: UserId, name: string, value: number, currency?: string, source?: DealSource, companyId?: CompanyId): Promise<CreateDealResponse>;
    createQualified(organizationId: OrganizationId, contactId: ContactId, userId: UserId, name: string, value: number, currency?: string, source?: DealSource, companyId?: CompanyId): Promise<CreateDealResponse>;
    createProposal(organizationId: OrganizationId, contactId: ContactId, userId: UserId, name: string, value: number, currency?: string, source?: DealSource, companyId?: CompanyId): Promise<CreateDealResponse>;
    createNegotiation(organizationId: OrganizationId, contactId: ContactId, userId: UserId, name: string, value: number, currency?: string, source?: DealSource, companyId?: CompanyId): Promise<CreateDealResponse>;
    private getDefaultProbability;
}
//# sourceMappingURL=create-deal.use-case.d.ts.map