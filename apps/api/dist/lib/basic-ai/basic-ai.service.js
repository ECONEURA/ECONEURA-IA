import { getDatabaseService } from '@econeura/db';

import { structuredLogger } from '../structured-logger.js';
import { sentimentAnalysis } from '../../services/sentiment-analysis.service.js';
import { predictiveAI } from '../../services/predictive-ai.service.js';
import { autoML } from '../../services/automl.service.js';
import { azureOpenAI } from '../../services/azure-openai.service.js';
import { webSearch } from '../../services/web-search.service.js';
export class BasicAIService {
    db;
    sessionCache = new Map();
    constructor() {
        this.db = getDatabaseService();
        this.initializeService();
    }
    async initializeService() {
        try {
            structuredLogger.info('Initializing Basic AI Service', {
                service: 'BasicAIService',
                timestamp: new Date().toISOString()
            });
            await this.checkAIServicesHealth();
            structuredLogger.info('Basic AI Service initialized successfully');
        }
        catch (error) {
            structuredLogger.error('Failed to initialize Basic AI Service', error);
            throw error;
        }
    }
    async checkAIServicesHealth() {
        const services = [
            { name: 'SentimentAnalysis', service: sentimentAnalysis },
            { name: 'PredictiveAI', service: predictiveAI },
            { name: 'AutoML', service: autoML },
            { name: 'AzureOpenAI', service: azureOpenAI },
            { name: 'WebSearch', service: webSearch }
        ];
        for (const { name, service } of services) {
            try {
                if (service && typeof service === 'object') {
                    structuredLogger.info(`AI Service ${name} is available`);
                }
                else {
                    structuredLogger.warn(`AI Service ${name} is not available`);
                }
            }
            catch (error) {
                structuredLogger.error(`AI Service ${name} health check failed`, error);
            }
        }
    }
    async generateResponse(request) {
        const startTime = Date.now();
        try {
            structuredLogger.info('Generating AI response', {
                userId: request.context.userId,
                organizationId: request.context.organizationId,
                sessionId: request.context.sessionId,
                promptLength: request.prompt.length
            });
            const responseType = this.determineResponseType(request.prompt);
            let response;
            switch (responseType) {
                case 'text':
                    response = await this.generateTextResponse(request);
                    break;
                case 'analysis':
                    response = await this.generateAnalysisResponse(request);
                    break;
                case 'prediction':
                    response = await this.generatePredictionResponse(request);
                    break;
                case 'search':
                    response = await this.generateSearchResponse(request);
                    break;
                default:
                    response = await this.generateTextResponse(request);
            }
            response.metadata.processingTime = Date.now() - startTime;
            this.updateSessionCache(request.context.sessionId, response);
            await this.saveAIInteraction(request, response);
            structuredLogger.info('AI response generated successfully', {
                responseId: response.id,
                type: response.type,
                processingTime: response.metadata.processingTime,
                confidence: response.confidence
            });
            return response;
        }
        catch (error) {
            structuredLogger.error('Failed to generate AI response', error, {
                userId: request.context.userId,
                sessionId: request.context.sessionId
            });
            throw error;
        }
    }
    determineResponseType(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('analyze') || lowerPrompt.includes('analysis') ||
            lowerPrompt.includes('sentiment') || lowerPrompt.includes('emotion')) {
            return 'analysis';
        }
        if (lowerPrompt.includes('predict') || lowerPrompt.includes('forecast') ||
            lowerPrompt.includes('future') || lowerPrompt.includes('trend')) {
            return 'prediction';
        }
        if (lowerPrompt.includes('search') || lowerPrompt.includes('find') ||
            lowerPrompt.includes('look up') || lowerPrompt.includes('information')) {
            return 'search';
        }
        return 'text';
    }
    async generateTextResponse(request) {
        try {
            const response = await azureOpenAI.generateText({
                prompt: request.prompt,
                maxTokens: request.options?.maxTokens || 500,
                temperature: request.options?.temperature || 0.7
            });
            return {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'text',
                content: response.text,
                confidence: response.confidence || 0.85,
                metadata: {
                    model: 'azure-openai-gpt-4',
                    timestamp: new Date(),
                    processingTime: 0,
                    tokens: response.tokens
                },
                suggestions: request.options?.includeSuggestions ? this.generateSuggestions(request.prompt) : undefined
            };
        }
        catch (error) {
            structuredLogger.error('Failed to generate text response', error);
            throw error;
        }
    }
    async generateAnalysisResponse(request) {
        try {
            const sentimentResult = await sentimentAnalysis.analyzeText(request.prompt);
            const analysisContent = `
**Análisis de Sentimiento:**
- Sentimiento: ${sentimentResult.sentiment}
- Confianza: ${(sentimentResult.confidence * 100).toFixed(1)}%
- Emociones detectadas: ${Object.keys(sentimentResult.emotions).join(', ')}

**Análisis Detallado:**
${sentimentResult.analysis || 'No se pudo generar análisis detallado.'}

**Recomendaciones:**
${this.generateAnalysisRecommendations(sentimentResult)}
      `.trim();
            return {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'analysis',
                content: analysisContent,
                confidence: sentimentResult.confidence,
                metadata: {
                    model: 'sentiment-analysis-v2',
                    timestamp: new Date(),
                    processingTime: 0,
                    tokens: sentimentResult.tokens
                },
                suggestions: this.generateAnalysisSuggestions(sentimentResult)
            };
        }
        catch (error) {
            structuredLogger.error('Failed to generate analysis response', error);
            throw error;
        }
    }
    async generatePredictionResponse(request) {
        try {
            const prediction = await predictiveAI.predictDemand('general');
            const predictionContent = `
**Predicción Generada:**
- Tipo: Predicción de demanda general
- Confianza: ${(prediction.confidence * 100).toFixed(1)}%
- Período: ${prediction.period}

**Resultados:**
${prediction.results.map(r => `- ${r.metric}: ${r.value}`).join('\n')}

**Recomendaciones:**
${prediction.recommendations.join('\n')}
      `.trim();
            return {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'prediction',
                content: predictionContent,
                confidence: prediction.confidence,
                metadata: {
                    model: 'predictive-ai-v1',
                    timestamp: new Date(),
                    processingTime: 0
                },
                suggestions: this.generatePredictionSuggestions(prediction)
            };
        }
        catch (error) {
            structuredLogger.error('Failed to generate prediction response', error);
            throw error;
        }
    }
    async generateSearchResponse(request) {
        try {
            const searchResults = await webSearch.search(request.prompt, {
                maxResults: 5,
                includeSummary: true
            });
            const searchContent = `
**Resultados de Búsqueda:**
${searchResults.results.map((result, index) => `
${index + 1}. **${result.title}**
   - URL: ${result.url}
   - Resumen: ${result.summary}
   - Relevancia: ${(result.relevance * 100).toFixed(1)}%
`).join('\n')}

**Resumen General:**
${searchResults.summary}
      `.trim();
            return {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'search',
                content: searchContent,
                confidence: searchResults.confidence,
                metadata: {
                    model: 'web-search-v1',
                    timestamp: new Date(),
                    processingTime: 0
                },
                suggestions: this.generateSearchSuggestions(searchResults)
            };
        }
        catch (error) {
            structuredLogger.error('Failed to generate search response', error);
            throw error;
        }
    }
    generateSuggestions(prompt) {
        const suggestions = [
            '¿Puedes explicar esto de manera más simple?',
            '¿Qué más información necesitas?',
            '¿Cómo puedo aplicar esto en mi negocio?',
            '¿Puedes darme un ejemplo práctico?',
            '¿Qué otros aspectos debería considerar?'
        ];
        return suggestions.slice(0, 3);
    }
    generateAnalysisRecommendations(sentimentResult) {
        const recommendations = [];
        if (sentimentResult.sentiment === 'positive') {
            recommendations.push('Mantén este tono positivo en futuras comunicaciones');
        }
        else if (sentimentResult.sentiment === 'negative') {
            recommendations.push('Considera revisar el enfoque para mejorar la percepción');
        }
        if (sentimentResult.confidence < 0.7) {
            recommendations.push('El análisis tiene baja confianza, considera proporcionar más contexto');
        }
        return recommendations.join('\n') || 'No hay recomendaciones específicas disponibles';
    }
    generateAnalysisSuggestions(sentimentResult) {
        return [
            '¿Quieres analizar otro texto?',
            '¿Necesitas un análisis más detallado?',
            '¿Cómo puedo mejorar el sentimiento?'
        ];
    }
    generatePredictionSuggestions(prediction) {
        return [
            '¿Quieres ver predicciones para otros períodos?',
            '¿Necesitas más detalles sobre la metodología?',
            '¿Cómo puedo optimizar estos resultados?'
        ];
    }
    generateSearchSuggestions(searchResults) {
        return [
            '¿Quieres buscar información más específica?',
            '¿Necesitas más resultados?',
            '¿Cómo puedo refinar la búsqueda?'
        ];
    }
    updateSessionCache(sessionId, response) {
        if (!this.sessionCache.has(sessionId)) {
            this.sessionCache.set(sessionId, {
                userId: '',
                organizationId: '',
                sessionId,
                previousMessages: []
            });
        }
        const context = this.sessionCache.get(sessionId);
        context.previousMessages = context.previousMessages || [];
        context.previousMessages.push(response);
        if (context.previousMessages.length > 10) {
            context.previousMessages = context.previousMessages.slice(-10);
        }
    }
    async saveAIInteraction(request, response) {
        try {
            await this.db.query(`
        INSERT INTO ai_interactions (
          id, user_id, organization_id, session_id, prompt, response, 
          response_type, confidence, model, processing_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
                response.id,
                request.context.userId,
                request.context.organizationId,
                request.context.sessionId,
                request.prompt,
                response.content,
                response.type,
                response.confidence,
                response.metadata.model,
                response.metadata.processingTime,
                new Date()
            ]);
        }
        catch (error) {
            structuredLogger.error('Failed to save AI interaction', error);
        }
    }
    async createSession(userId, organizationId) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessionCache.set(sessionId, {
            userId,
            organizationId,
            sessionId,
            previousMessages: [],
            userPreferences: {
                language: 'es',
                responseStyle: 'formal',
                maxLength: 500
            }
        });
        structuredLogger.info('AI session created', {
            sessionId,
            userId,
            organizationId
        });
        return sessionId;
    }
    async getSessionHistory(sessionId) {
        const context = this.sessionCache.get(sessionId);
        return context?.previousMessages || [];
    }
    async clearSession(sessionId) {
        this.sessionCache.delete(sessionId);
        structuredLogger.info('AI session cleared', { sessionId });
    }
    async getHealthStatus() {
        const services = {
            sentimentAnalysis: !!sentimentAnalysis,
            predictiveAI: !!predictiveAI,
            autoML: !!autoML,
            azureOpenAI: !!azureOpenAI,
            webSearch: !!webSearch
        };
        const healthyServices = Object.values(services).filter(Boolean).length;
        const totalServices = Object.keys(services).length;
        let status;
        if (healthyServices === totalServices) {
            status = 'healthy';
        }
        else if (healthyServices >= totalServices * 0.6) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return {
            status,
            services,
            lastCheck: new Date()
        };
    }
}
export const basicAIService = new BasicAIService();
//# sourceMappingURL=basic-ai.service.js.map