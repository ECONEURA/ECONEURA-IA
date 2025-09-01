import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { config } from '@econeura/shared/config';

export class AzureOpenAIService {
  private client: OpenAIClient;

  constructor() {
    this.client = new OpenAIClient(
  (config as any).AZURE_OPENAI_API_ENDPOINT || (config as any).azure?.endpoint,
  new AzureKeyCredential((config as any).AZURE_OPENAI_API_KEY || (config as any).azure?.key)
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
