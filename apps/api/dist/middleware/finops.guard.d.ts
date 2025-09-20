import type { Request, Response, NextFunction } from 'express';
type Deps = {
    getDeptSpendEUR: (dept: string) => number | Promise<number>;
};
export declare function finopsGuard(deps: Deps): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const finopsGuardDefault: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=finops.guard.d.ts.map