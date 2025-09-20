import { type RequestHandler } from 'express';
declare global {
    namespace Express {
        interface Request {
            org?: {
                id?: string;
                source: 'aad' | 'header' | 'body' | 'untrusted' | 'none';
            };
        }
    }
}
export declare const attachOrg: RequestHandler;
//# sourceMappingURL=org.d.ts.map