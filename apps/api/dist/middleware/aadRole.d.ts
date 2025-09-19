import type { Request, Response, NextFunction } from "express";
export declare function requireAADRole(role: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=aadRole.d.ts.map