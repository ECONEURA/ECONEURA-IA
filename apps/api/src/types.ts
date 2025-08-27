// Type extensions for the API
declare module '@econeura/shared/logging' {
  interface LogContext {
    [key: string]: unknown; // Allow any additional properties
  }
}

export {};