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

declare module 'helmet' {
  const helmet: any;
  export default helmet;
}

export {};
