import { Request, Response, NextFunction } from 'express';
export declare function monitorRequest(): (req: Request, res: Response, next: NextFunction) => void;
export declare function monitorErrors(): (error: Error, req: Request, res: Response, next: NextFunction) => void;
export declare function healthCheck(): (req: Request, res: Response) => void;
//# sourceMappingURL=middleware.d.ts.map