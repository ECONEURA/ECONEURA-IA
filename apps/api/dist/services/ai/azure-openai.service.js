import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { config } from '@econeura/shared/config';
export class AzureOpenAIService {
    client;
    constructor() {
        const cfg = config;
        const cfgAny = cfg;
        const endpoint = cfgAny.AZURE_OPENAI_API_ENDPOINT || cfg.azure?.endpoint;
        const key = cfgAny.AZURE_OPENAI_API_KEY || cfg.azure?.key;
        this.client = new OpenAIClient(endpoint, new AzureKeyCredential(key));
    }
    async checkAvailability() {
        try {
            await this.client?.listDeployments?.();
        }
        catch (error) {
            throw new Error('Azure OpenAI service is not available');
        }
    }
}
//# sourceMappingURL=azure-openai.service.js.map