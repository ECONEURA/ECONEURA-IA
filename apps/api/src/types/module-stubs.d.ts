declare module '@azure/openai' {
  export class OpenAIClient {
    constructor(endpoint: string, credential: any);
    // minimal stub
  listModels?: () => Promise<any>;
  getCompletions?: (...args: any[]) => Promise<any>;
  listDeployments?: () => Promise<any>;
  }
  export class AzureKeyCredential {
    constructor(key: string);
  }
}

declare module '@econeura/shared/config' {
  export const config: any;
}

declare module 'helmet' {
  const helmet: any;
  export default helmet;
}

export {};
