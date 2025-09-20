import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { config } from '@econeura/shared/config';

export class AzureOpenAIService {
  private client: OpenAIClient;

  constructor() {
  const cfg = config as unknown as Record<string, any> | { azure?: { endpoint?: string; key?: string } };
  const cfgAny = cfg as Record<string, any>;
  const endpoint = cfgAny.AZURE_OPENAI_API_ENDPOINT || cfg.azure?.endpoint;
  const key = cfgAny.AZURE_OPENAI_API_KEY || cfg.azure?.key;
    this.client = new OpenAIClient(
      endpoint,
      new AzureKeyCredential(key)
    );
  }

  async checkAvailability(): Promise<void> {
    try {
      // Intenta hacer una llamada simple para verificar la conexión
  await this.client?.listDeployments?.();
    } catch (error) {
      throw new Error('Azure OpenAI service is not available');
    }
  }
}
