import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { config } from '@econeura/shared/config';

export class AzureOpenAIService {
  private client: OpenAIClient;

  constructor() {
    this.client = new OpenAIClient(
      config.AZURE_OPENAI_ENDPOINT,
      new AzureKeyCredential(config.AZURE_OPENAI_API_KEY)
    );
  }

  async checkAvailability(): Promise<void> {
    try {
      // Intenta hacer una llamada simple para verificar la conexión
      await this.client.listDeployments();
    } catch (error) {
      throw new Error('Azure OpenAI service is not available');
    }
  }
}
