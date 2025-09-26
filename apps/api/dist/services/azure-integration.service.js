import { env } from '@econeura/shared/env';

import { structuredLogger } from '../lib/structured-logger.js';
export class AzureIntegrationService {
    config;
    isInitialized = false;
    healthCache = new Map();
    lastHealthCheck = new Date(0);
    constructor() {
        this.config = this.loadConfiguration();
        this.initializeService();
    }
    loadConfiguration() {
        const config = {
            endpoint: env().AZURE_OPENAI_ENDPOINT || '',
            apiKey: env().AZURE_OPENAI_API_KEY || '',
            apiVersion: env().AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
            chatDeployment: env().AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
            imageDeployment: process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT,
            speechKey: process.env.AZURE_SPEECH_KEY,
            speechRegion: process.env.AZURE_SPEECH_REGION
        };
        if (!config.endpoint || !config.apiKey) {
            structuredLogger.warn('Azure OpenAI configuration incomplete, running in demo mode');
        }
        return config;
    }
    async initializeService() {
        try {
            structuredLogger.info('Initializing Azure OpenAI Integration Service', {
                service: 'AzureIntegrationService',
                endpoint: this.config.endpoint ? 'configured' : 'demo mode',
                timestamp: new Date().toISOString()
            });
            if (this.config.endpoint && this.config.apiKey) {
                await this.checkServiceHealth();
            }
            this.isInitialized = true;
            structuredLogger.info('Azure OpenAI Integration Service initialized successfully');
        }
        catch (error) {
            structuredLogger.error('Failed to initialize Azure OpenAI Integration Service', error);
            throw error;
        }
    }
    async generateChatCompletion(request) {
        if (!this.isInitialized) {
            throw new Error('Azure Integration Service not initialized');
        }
        if (!this.config.endpoint || !this.config.apiKey) {
            return this.generateDemoChatResponse(request);
        }
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.chatDeployment}/chat/completions?api-version=${this.config.apiVersion}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    messages: request.messages,
                    max_tokens: request.maxTokens || 1000,
                    temperature: request.temperature || 0.7,
                    top_p: request.topP || 1,
                    frequency_penalty: request.frequencyPenalty || 0,
                    presence_penalty: request.presencePenalty || 0,
                    stop: request.stop
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            const responseTime = Date.now() - startTime;
            structuredLogger.info('Chat completion generated successfully', {
                model: data.model,
                tokens: data.usage.totalTokens,
                responseTime,
                finishReason: data.choices[0]?.finishReason
            });
            return data;
        }
        catch (error) {
            structuredLogger.error('Failed to generate chat completion', error);
            throw error;
        }
    }
    generateDemoChatResponse(request) {
        const lastMessage = request.messages[request.messages.length - 1];
        const demoResponse = this.generateDemoResponse(lastMessage.content);
        return {
            id: `chatcmpl-demo-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'gpt-4o-mini-demo',
            choices: [{
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: demoResponse
                    },
                    finishReason: 'stop'
                }],
            usage: {
                promptTokens: lastMessage.content.length / 4,
                completionTokens: demoResponse.length / 4,
                totalTokens: (lastMessage.content.length + demoResponse.length) / 4
            }
        };
    }
    generateDemoResponse(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
            return '¡Hola! Soy un asistente de IA en modo demo. ¿En qué puedo ayudarte hoy?';
        }
        if (lowerPrompt.includes('weather') || lowerPrompt.includes('clima')) {
            return 'En modo demo, no puedo acceder a datos meteorológicos en tiempo real. Para obtener información del clima, necesitarías configurar las credenciales de Azure OpenAI.';
        }
        if (lowerPrompt.includes('code') || lowerPrompt.includes('programming')) {
            return 'Puedo ayudarte con programación. Aquí tienes un ejemplo de función en JavaScript:\n\n```javascript\nfunction saludar(nombre) {\n  return `¡Hola, ${nombre}!`;\n}\n```\n\n¿Te gustaría que te ayude con algo específico?';
        }
        return `He recibido tu mensaje: "${prompt}". En modo demo, puedo simular respuestas pero para funcionalidad completa necesitarías configurar Azure OpenAI. ¿Hay algo específico en lo que pueda ayudarte?`;
    }
    async generateImage(request) {
        if (!this.isInitialized) {
            throw new Error('Azure Integration Service not initialized');
        }
        if (!this.config.endpoint || !this.config.apiKey || !this.config.imageDeployment) {
            return this.generateDemoImageResponse(request);
        }
        try {
            const response = await fetch(`${this.config.endpoint}/openai/deployments/${this.config.imageDeployment}/images/generations?api-version=${this.config.apiVersion}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    prompt: request.prompt,
                    size: request.size || '1024x1024',
                    quality: request.quality || 'standard',
                    style: request.style || 'vivid',
                    n: request.n || 1
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure OpenAI Image API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            structuredLogger.info('Image generated successfully', {
                prompt: request.prompt,
                size: request.size,
                quality: request.quality
            });
            return data;
        }
        catch (error) {
            structuredLogger.error('Failed to generate image', error);
            throw error;
        }
    }
    generateDemoImageResponse(request) {
        return {
            created: Math.floor(Date.now() / 1000),
            data: [{
                    url: `https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=${encodeURIComponent(request.prompt)}`,
                    revisedPrompt: `Demo image for: ${request.prompt}`
                }]
        };
    }
    async generateSpeech(request) {
        if (!this.isInitialized) {
            throw new Error('Azure Integration Service not initialized');
        }
        if (!this.config.speechKey || !this.config.speechRegion) {
            return this.generateDemoSpeechResponse(request);
        }
        try {
            const ssml = this.generateSSML(request);
            const response = await fetch(`https://${this.config.speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
                    'Ocp-Apim-Subscription-Key': this.config.speechKey
                },
                body: ssml
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`);
            }
            const audioData = await response.arrayBuffer();
            const duration = this.estimateAudioDuration(request.text);
            structuredLogger.info('Speech generated successfully', {
                textLength: request.text.length,
                voice: request.voice,
                duration
            });
            return {
                audioData,
                contentType: 'audio/mpeg',
                duration
            };
        }
        catch (error) {
            structuredLogger.error('Failed to generate speech', error);
            throw error;
        }
    }
    generateSSML(request) {
        const voice = request.voice || 'es-ES-ElviraNeural';
        const rate = request.rate || 1.0;
        const pitch = request.pitch || 1.0;
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${request.language || 'es-ES'}">
      <voice name="${voice}">
        <prosody rate="${rate}" pitch="${pitch}">
          ${this.escapeXml(request.text)}
        </prosody>
      </voice>
    </speak>`;
    }
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    estimateAudioDuration(text) {
        const wordsPerMinute = 150;
        const wordCount = text.split(/\s+/).length;
        return (wordCount / wordsPerMinute) * 60;
    }
    generateDemoSpeechResponse(request) {
        const duration = this.estimateAudioDuration(request.text);
        const audioData = new ArrayBuffer(1024);
        return {
            audioData,
            contentType: 'audio/mpeg',
            duration
        };
    }
    async checkServiceHealth() {
        const now = new Date();
        if (now.getTime() - this.lastHealthCheck.getTime() < 5 * 60 * 1000) {
            return this.healthCache;
        }
        const services = ['chat', 'image', 'speech'];
        const healthResults = new Map();
        for (const service of services) {
            try {
                const startTime = Date.now();
                await this.checkSpecificService(service);
                const responseTime = Date.now() - startTime;
                healthResults.set(service, {
                    service,
                    status: 'healthy',
                    lastCheck: now,
                    responseTime
                });
            }
            catch (error) {
                healthResults.set(service, {
                    service,
                    status: 'unhealthy',
                    lastCheck: now,
                    error: error.message
                });
            }
        }
        this.healthCache = healthResults;
        this.lastHealthCheck = now;
        return healthResults;
    }
    async checkSpecificService(service) {
        if (!this.config.endpoint || !this.config.apiKey) {
            return;
        }
        switch (service) {
            case 'chat':
                await this.testChatService();
                break;
            case 'image':
                await this.testImageService();
                break;
            case 'speech':
                await this.testSpeechService();
                break;
        }
    }
    async testChatService() {
        const testRequest = {
            messages: [{ role: 'user', content: 'test' }],
            maxTokens: 1
        };
        await this.generateChatCompletion(testRequest);
    }
    async testImageService() {
        if (!this.config.imageDeployment) {
            throw new Error('Image deployment not configured');
        }
        const testRequest = {
            prompt: 'test',
            size: '1024x1024'
        };
        await this.generateImage(testRequest);
    }
    async testSpeechService() {
        if (!this.config.speechKey || !this.config.speechRegion) {
            throw new Error('Speech service not configured');
        }
        const testRequest = {
            text: 'test'
        };
        await this.generateSpeech(testRequest);
    }
    getConfiguration() {
        return {
            endpoint: this.config.endpoint ? 'configured' : 'demo mode',
            apiVersion: this.config.apiVersion,
            chatDeployment: this.config.chatDeployment,
            imageDeployment: this.config.imageDeployment ? 'configured' : 'not configured',
            speechKey: this.config.speechKey ? 'configured' : 'not configured',
            speechRegion: this.config.speechRegion
        };
    }
    isConfigured() {
        return !!(this.config.endpoint && this.config.apiKey);
    }
    getAvailableServices() {
        const services = ['chat'];
        if (this.config.imageDeployment) {
            services.push('image');
        }
        if (this.config.speechKey && this.config.speechRegion) {
            services.push('speech');
        }
        return services;
    }
}
export const azureIntegration = new AzureIntegrationService();
//# sourceMappingURL=azure-integration.service.js.map