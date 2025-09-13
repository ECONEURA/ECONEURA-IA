import { structuredLogger } from '../structured-logger.js';
import { sentimentAnalysis } from '../../services/sentiment-analysis.service.js';
import { predictiveAI } from '../../services/predictive-ai.service.js';
import { autoML } from '../../services/automl.service.js';
import { azureOpenAI } from '../../services/azure-openai.service.js';
import { webSearch } from '../../services/web-search.service.js';
import { getDatabaseService } from '@econeura/db';

// ============================================================================
// BASIC AI SERVICE - PR-16
// ============================================================================

export interface AIResponse {
  id: string;
  type: 'text' | 'analysis' | 'prediction' | 'search';
  content: string;
  confidence: number;
  metadata: {
    model: string;
    timestamp: Date;
    processingTime: number;
    tokens?: number;
  };
  suggestions?: string[];
}

export interface AIContext {
  userId: string;
  organizationId: string;
  sessionId: string;
  previousMessages?: AIResponse[];
  userPreferences?: {
    language: string;
    responseStyle: 'formal' | 'casual' | 'technical';
    maxLength: number;
  };
}

export interface AIRequest {
  prompt: string;
  context: AIContext;
  options?: {
    maxTokens?: number;
    temperature?: number;
    includeAnalysis?: boolean;
    includeSuggestions?: boolean;
  };
}

export class BasicAIService {
  private db: ReturnType<typeof getDatabaseService>;
  private sessionCache: Map<string, AIContext> = new Map();

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing Basic AI Service', {
        service: 'BasicAIService',
        timestamp: new Date().toISOString()
      });

      // Verificar servicios de IA disponibles
      await this.checkAIServicesHealth();
      
      structuredLogger.info('Basic AI Service initialized successfully');
    } catch (error) {
      structuredLogger.error('Failed to initialize Basic AI Service', error as Error);
      throw error;
    }
  }

  private async checkAIServicesHealth(): Promise<void> {
    const services = [
      { name: 'SentimentAnalysis', service: sentimentAnalysis },
      { name: 'PredictiveAI', service: predictiveAI },
      { name: 'AutoML', service: autoML },
      { name: 'AzureOpenAI', service: azureOpenAI },
      { name: 'WebSearch', service: webSearch }
    ];

    for (const { name, service } of services) {
      try {
        // Verificar que el servicio esté disponible
        if (service && typeof service === 'object') {
          structuredLogger.info(`AI Service ${name} is available`);
        } else {
          structuredLogger.warn(`AI Service ${name} is not available`);
        }
      } catch (error) {
        structuredLogger.error(`AI Service ${name} health check failed`, error as Error);
      }
    }
  }

  // ============================================================================
  // CORE AI METHODS
  // ============================================================================

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      structuredLogger.info('Generating AI response', {
        userId: request.context.userId,
        organizationId: request.context.organizationId,
        sessionId: request.context.sessionId,
        promptLength: request.prompt.length
      });

      // Determinar el tipo de respuesta basado en el prompt
      const responseType = this.determineResponseType(request.prompt);
      
      let response: AIResponse;

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

      // Agregar tiempo de procesamiento
      response.metadata.processingTime = Date.now() - startTime;

      // Guardar en caché de sesión
      this.updateSessionCache(request.context.sessionId, response);

      // Guardar en base de datos
      await this.saveAIInteraction(request, response);

      structuredLogger.info('AI response generated successfully', {
        responseId: response.id,
        type: response.type,
        processingTime: response.metadata.processingTime,
        confidence: response.confidence
      });

      return response;

    } catch (error) {
      structuredLogger.error('Failed to generate AI response', error as Error, {
        userId: request.context.userId,
        sessionId: request.context.sessionId
      });
      throw error;
    }
  }

  private determineResponseType(prompt: string): 'text' | 'analysis' | 'prediction' | 'search' {
    const lowerPrompt = prompt.toLowerCase();
    
    // Palabras clave para análisis
    if (lowerPrompt.includes('analyze') || lowerPrompt.includes('analysis') || 
        lowerPrompt.includes('sentiment') || lowerPrompt.includes('emotion')) {
      return 'analysis';
    }
    
    // Palabras clave para predicciones
    if (lowerPrompt.includes('predict') || lowerPrompt.includes('forecast') || 
        lowerPrompt.includes('future') || lowerPrompt.includes('trend')) {
      return 'prediction';
    }
    
    // Palabras clave para búsqueda
    if (lowerPrompt.includes('search') || lowerPrompt.includes('find') || 
        lowerPrompt.includes('look up') || lowerPrompt.includes('information')) {
      return 'search';
    }
    
    // Por defecto, respuesta de texto
    return 'text';
  }

  private async generateTextResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Usar Azure OpenAI para generar texto
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
          processingTime: 0, // Se actualizará después
          tokens: response.tokens
        },
        suggestions: request.options?.includeSuggestions ? this.generateSuggestions(request.prompt) : undefined
      };
    } catch (error) {
      structuredLogger.error('Failed to generate text response', error as Error);
      throw error;
    }
  }

  private async generateAnalysisResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Usar análisis de sentimientos
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
    } catch (error) {
      structuredLogger.error('Failed to generate analysis response', error as Error);
      throw error;
    }
  }

  private async generatePredictionResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Usar servicios de predicción
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
    } catch (error) {
      structuredLogger.error('Failed to generate prediction response', error as Error);
      throw error;
    }
  }

  private async generateSearchResponse(request: AIRequest): Promise<AIResponse> {
    try {
      // Usar búsqueda web
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
    } catch (error) {
      structuredLogger.error('Failed to generate search response', error as Error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateSuggestions(prompt: string): string[] {
    const suggestions = [
      '¿Puedes explicar esto de manera más simple?',
      '¿Qué más información necesitas?',
      '¿Cómo puedo aplicar esto en mi negocio?',
      '¿Puedes darme un ejemplo práctico?',
      '¿Qué otros aspectos debería considerar?'
    ];
    
    return suggestions.slice(0, 3);
  }

  private generateAnalysisRecommendations(sentimentResult: any): string {
    const recommendations = [];
    
    if (sentimentResult.sentiment === 'positive') {
      recommendations.push('Mantén este tono positivo en futuras comunicaciones');
    } else if (sentimentResult.sentiment === 'negative') {
      recommendations.push('Considera revisar el enfoque para mejorar la percepción');
    }
    
    if (sentimentResult.confidence < 0.7) {
      recommendations.push('El análisis tiene baja confianza, considera proporcionar más contexto');
    }
    
    return recommendations.join('\n') || 'No hay recomendaciones específicas disponibles';
  }

  private generateAnalysisSuggestions(sentimentResult: any): string[] {
    return [
      '¿Quieres analizar otro texto?',
      '¿Necesitas un análisis más detallado?',
      '¿Cómo puedo mejorar el sentimiento?'
    ];
  }

  private generatePredictionSuggestions(prediction: any): string[] {
    return [
      '¿Quieres ver predicciones para otros períodos?',
      '¿Necesitas más detalles sobre la metodología?',
      '¿Cómo puedo optimizar estos resultados?'
    ];
  }

  private generateSearchSuggestions(searchResults: any): string[] {
    return [
      '¿Quieres buscar información más específica?',
      '¿Necesitas más resultados?',
      '¿Cómo puedo refinar la búsqueda?'
    ];
  }

  private updateSessionCache(sessionId: string, response: AIResponse): void {
    if (!this.sessionCache.has(sessionId)) {
      this.sessionCache.set(sessionId, {
        userId: '',
        organizationId: '',
        sessionId,
        previousMessages: []
      });
    }
    
    const context = this.sessionCache.get(sessionId)!;
    context.previousMessages = context.previousMessages || [];
    context.previousMessages.push(response);
    
    // Mantener solo los últimos 10 mensajes
    if (context.previousMessages.length > 10) {
      context.previousMessages = context.previousMessages.slice(-10);
    }
  }

  private async saveAIInteraction(request: AIRequest, response: AIResponse): Promise<void> {
    try {
      // Guardar interacción en base de datos
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
    } catch (error) {
      structuredLogger.error('Failed to save AI interaction', error as Error);
      // No lanzar error para no interrumpir la respuesta
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async createSession(userId: string, organizationId: string): Promise<string> {
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

  async getSessionHistory(sessionId: string): Promise<AIResponse[]> {
    const context = this.sessionCache.get(sessionId);
    return context?.previousMessages || [];
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessionCache.delete(sessionId);
    structuredLogger.info('AI session cleared', { sessionId });
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
    lastCheck: Date;
  }> {
    const services = {
      sentimentAnalysis: !!sentimentAnalysis,
      predictiveAI: !!predictiveAI,
      autoML: !!autoML,
      azureOpenAI: !!azureOpenAI,
      webSearch: !!webSearch
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices >= totalServices * 0.6) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      lastCheck: new Date()
    };
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const basicAIService = new BasicAIService();

