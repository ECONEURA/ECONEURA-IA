import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      organizationId: string;
      permissions: string[];
      sessionId: string;
      role: string;
      isActive: boolean;
    };
    correlationId?: string;
    orgId?: string;
    requestId?: string;
    traceId?: string;
  }
}
