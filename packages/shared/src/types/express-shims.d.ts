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
