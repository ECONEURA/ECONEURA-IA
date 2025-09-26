declare module '@microsoft/microsoft-graph-client' {
  export const Client: any
}
/
declare module '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials' {
  export const TokenCredentialAuthenticationProvider: any
}
/
declare module '@azure/msal-node' {
  export const ConfidentialClientApplication: any
}
/
declare module '@azure/identity' {
  export const ClientSecretCredential: any
}
/
declare module '@opentelemetry/sdk-trace-node' {
  export const NodeTracerProvider: any
}
/
declare module '@opentelemetry/sdk-trace-base' {
  export const SimpleSpanProcessor: any
}
/
declare module '@opentelemetry/api' {
  export const trace: any
  export const context: any
  export const propagation: any
  export type Tracer = any
  export type Span = any
}

export {};
/