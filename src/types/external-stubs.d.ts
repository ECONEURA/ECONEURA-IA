declare module '@prisma/client' {
  export class PrismaClient { any: any; constructor(...args: any[]); }
  export type Prisma = any
}

declare module '@microsoft/microsoft-graph-client' {
  export const Client: any
}

declare module '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials' {
  export const TokenCredentialAuthenticationProvider: any
}

declare module '@azure/msal-node' {
  export const ConfidentialClientApplication: any
}

declare module '@azure/identity' {
  export const ClientSecretCredential: any
}

declare module '@opentelemetry/sdk-trace-node' {
  export const NodeTracerProvider: any
}

declare module '@opentelemetry/sdk-trace-base' {
  export const SimpleSpanProcessor: any
}

declare module '@opentelemetry/api' {
  export const trace: any
  export const context: any
  export const propagation: any
  export type Tracer = any
  export type Span = any
}

// Graph client auth provider
declare module '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials' {
  export const TokenCredentialAuthenticationProvider: any
}

// Minimal shim for internal db package to avoid importing source during workspace typecheck
declare module '@econeura/db' {
  export const db: any
  export const prisma: any
  export const aiCostUsage: any
  export function getPrisma(): any
  export function initPrisma(): void
  export function setOrg(orgId: string): void
  export function seed(...args: any[]): Promise<any>
  export const organizations: any
  export const users: any
  export const companies: any
  export const contacts: any
  export const deals: any
  export const invoices: any
  export const tasks: any
}

export {}
