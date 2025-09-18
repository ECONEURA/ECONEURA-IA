import { PlaybookDefinition } from './dsl.js';
export declare const CFO_COLLECTION_PLAYBOOK: PlaybookDefinition;
export declare class CFOCollectionExecutor {
    private graphClient;
    private aiRouter;
    constructor();
    executeCollectionPlaybook(context: {
        orgId: string;
        userId: string;
        requestId: string;
        cfoUserId: string;
        financeTeamId: string;
        financeChannelId: string;
        financePlanId: string;
        financeManagerId: string;
    }): Promise<{
        success: boolean;
        results: Map<string, any>;
        auditTrail: any[];
        approvalRequired: boolean;
        approvalExpiry: string;
    }>;
    getPlaybookStatus(playbookId: string): Promise<{
        status: 'pending' | 'approved' | 'rejected' | 'expired';
        approvalExpiry: string;
        auditTrail: any[];
    }>;
    approvePlaybook(playbookId: string, approverId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectPlaybook(playbookId: string, rejectorId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare function createCFOCollectionExecutor(): CFOCollectionExecutor;
//# sourceMappingURL=cfo-collection.d.ts.map