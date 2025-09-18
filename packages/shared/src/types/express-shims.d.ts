// Augment Express types with application-specific fields used across the API
// This file is a safe shim to reduce `(req as any)` / `(res as any)` casts.
import type * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      logger?: { info?: Function; debug?: Function; error?: Function; request?: Function } | any;
      user?: { oid?: string; roles?: string[] } | any;
      requestId?: string;
      path?: string;
      startTime?: number;
      _rawBody?: string;
      ip?: string;
    }

    interface Response {
  locals?: any;
  setHeader?: (name: string, value: string) => void;
  on?: (event: string, listener: (...args: any[]) => void) => this;
  statusCode?: number;
  getHeader?: (name: string) => string | number | string[] | undefined;
    }
  }
}

export {};
declare namespace Express {
  export interface Request {
    path?: string
    ip?: string
    requestId?: string
    get(headerName: string): string | undefined
    // allow arbitrary properties set by middleware
    [key: string]: any
  }

  export interface Response {
  setHeader(name: string, value: string): void
  send?: (body?: any) => Response
  json?: (body?: any) => Response
  status?: (code: number) => Response
  // allow arbitrary properties
  [key: string]: any
  }
}

declare global {
  // keep module augmentation local
  // Simple NextFunction type used across the codebase
  type NextFunction = (err?: any) => void;
}

export {}

// Also export NextFunction from the 'express' module so files that do
// `import { NextFunction } from 'express'` work with our lightweight shim.
declare module 'express' {
  export type NextFunction = (err?: any) => void;
}
