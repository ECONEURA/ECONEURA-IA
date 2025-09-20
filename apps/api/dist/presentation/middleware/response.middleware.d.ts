import { Request, Response, NextFunction } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
    requestId?: string;
}
export declare const responseHandler: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=response.middleware.d.ts.map