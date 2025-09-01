// Temporal ambient declarations to ease migration and iterative fixes.
// Replace with proper types and imports as part of a follow-up PR.

import type { RequestHandler } from 'express';

declare global {
  // Simple NextFunction type to satisfy legacy usages across the codebase
  type NextFunction = (err?: any) => void;
}

declare namespace Express {
  interface Request {
    user?: any;
    params?: Record<string, any>;
    query?: Record<string, any>;
    route?: any;
    path?: string;
  headers?: Record<string, any>;
    requestId?: string;
    orgId?: string | number;
    logger?: any;
    // allow arbitrary extras used across middleware
    [key: string]: any;
  }

  interface Response {
  on?: (...args: any[]) => void;
  locals?: Record<string, any>;
  getHeader?: (name: string) => any;
  setHeader?: (name: string, value: any) => void;
  status?: (code: number) => Response;
    // allow arbitrary extras
    [key: string]: any;
  }
}

export {};
