import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        organizationId: string;
        roles: string[];
        permissions: string[];
    };
}
export declare class BasicAIController {
    generateResponse(req: AuthenticatedRequest, res: Response): Promise<void>;
    createSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSessionHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    clearSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    getHealthStatus(req: Request, res: Response): Promise<void>;
    getCapabilities(req: Request, res: Response): Promise<void>;
}
export declare const basicAIController: BasicAIController;
export {};
//# sourceMappingURL=basic-ai.controller.d.ts.map