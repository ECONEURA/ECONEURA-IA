import { aiRouter } from '@econeura/shared';
import { customMetrics, createSpan, recordAIRequest } from '@econeura/shared/otel';

export interface SentimentAnalysisRequest {
  text: string;
  language?: string;
  context?: 'customer_feedback' | 'social_media' | 'reviews' | 'support_tickets';
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  score: number; // -1 to 1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  keywords: Array<{
    word: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    importance: number;
  }>;
  topics: string[];
  language: string;
  processingTime: number;
}

export interface SentimentTrend {
  period: string;
  averageSentiment: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalCount: number;
}

class SentimentAnalysisService {
  private sentimentCache: Map<string, SentimentResult> = new Map();
  private languageDetector: any;
  private emotionKeywords: Record<string, string[]> = {
    joy: ['happy', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'],
    sadness: ['sad', 'disappointed', 'terrible', 'awful', 'horrible', 'bad'],
    anger: ['angry', 'furious', 'mad', 'upset', 'frustrated', 'annoyed'],
    fear: ['scared', 'worried', 'afraid', 'concerned', 'anxious', 'nervous'],
    surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
    disgust: ['disgusting', 'gross', 'revolting', 'nasty', 'awful']
  };

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentResult> {
    const span = createSpan('sentiment.analyze', {
      text_length: request.text.length,
      context: request.context || 'general',
      language: request.language || 'auto'
    });

    try {
      const startTime = Date.now();
      
      // Detectar idioma si no se especifica
      const language = request.language || await this.detectLanguage(request.text);
      
      // Verificar cache
      const cacheKey = `${request.text}_${language}_${request.context}`;
      if (this.sentimentCache.has(cacheKey)) {
        return this.sentimentCache.get(cacheKey)!;
      }

      // Análisis de sentimiento usando IA
      const aiResponse = await aiRouter.route({
        prompt: this.buildSentimentPrompt(request.text, language, request.context),
        model: 'mistral-7b',
        maxTokens: 500,
        temperature: 0.1
      });

      // Procesar respuesta de IA
      const sentimentData = this.parseAIResponse(aiResponse.content);
      
      // Análisis de emociones
      const emotions = this.analyzeEmotions(request.text);
      
      // Extraer palabras clave
      const keywords = this.extractKeywords(request.text, sentimentData.sentiment);
      
      // Identificar temas
      const topics = this.identifyTopics(request.text);
      
      const processingTime = Date.now() - startTime;
      
      const result: SentimentResult = {
        sentiment: sentimentData.sentiment,
        confidence: sentimentData.confidence,
        score: sentimentData.score,
        emotions,
        keywords,
        topics,
        language,
        processingTime
      };

      // Guardar en cache
      this.sentimentCache.set(cacheKey, result);

      // Registrar métricas
      customMetrics.aiRequestsTotal.add(1, {
        provider: 'sentiment_analysis',
        model: 'mistral-7b',
        status: 'success'
      });

      recordAIRequest('sentiment_analysis', 'mistral-7b', 'success', 0.1, processingTime, request.text.length, aiResponse.content.length);

      span.setAttributes({
        sentiment: result.sentiment,
        confidence: result.confidence,
        score: result.score,
        processing_time_ms: processingTime
      });

      return result;
    } catch (error) {
      span.recordException(error as Error);
      customMetrics.aiRequestsTotal.add(1, {
        provider: 'sentiment_analysis',
        model: 'mistral-7b',
        status: 'error'
      });
      throw error;
    } finally {
      span.end();
    }
  }

  async analyzeBatch(texts: string[], context?: string): Promise<SentimentResult[]> {
    const span = createSpan('sentiment.analyze_batch', {
      batch_size: texts.length,
      context: context || 'general'
    });

    try {
      const results = await Promise.all(
        texts.map(text => this.analyzeSentiment({ text, context }))
      );

      // Calcular estadísticas del batch
      const avgSentiment = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      const positiveCount = results.filter(r => r.sentiment === 'positive').length;
      const negativeCount = results.filter(r => r.sentiment === 'negative').length;
      const neutralCount = results.filter(r => r.sentiment === 'neutral').length;

      span.setAttributes({
        average_sentiment: avgSentiment,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount
      });

      return results;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async getSentimentTrends(period: 'day' | 'week' | 'month', context?: string): Promise<SentimentTrend[]> {
    const span = createSpan('sentiment.get_trends', { period, context });
    
    try {
      // Simular datos de tendencias
      const trends: SentimentTrend[] = [];
      const periods = period === 'day' ? 7 : period === 'week' ? 4 : 12;
      
      for (let i = 0; i < periods; i++) {
        const baseSentiment = 0.6 + Math.random() * 0.3;
        const totalCount = Math.floor(Math.random() * 100) + 20;
        const positiveCount = Math.floor(totalCount * (0.5 + baseSentiment * 0.3));
        const negativeCount = Math.floor(totalCount * (0.1 + (1 - baseSentiment) * 0.4));
        const neutralCount = totalCount - positiveCount - negativeCount;

        trends.push({
          period: this.getPeriodLabel(period, i),
          averageSentiment: baseSentiment,
          positiveCount,
          negativeCount,
          neutralCount,
          totalCount
        });
      }

      return trends;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async getSentimentInsights(context?: string): Promise<any> {
    const span = createSpan('sentiment.get_insights', { context });
    
    try {
      // Simular insights de sentimiento
      return {
        overallSentiment: 'positive',
        sentimentScore: 0.75,
        topPositiveKeywords: ['excellent', 'great', 'amazing', 'wonderful', 'fantastic'],
        topNegativeKeywords: ['disappointed', 'terrible', 'awful', 'bad', 'poor'],
        emotionDistribution: {
          joy: 0.45,
          sadness: 0.15,
          anger: 0.10,
          fear: 0.05,
          surprise: 0.15,
          disgust: 0.10
        },
        trendingTopics: ['customer service', 'product quality', 'delivery speed', 'pricing'],
        recommendations: [
          'Focus on customer service improvements',
          'Address delivery speed concerns',
          'Highlight product quality in marketing'
        ]
      };
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  private buildSentimentPrompt(text: string, language: string, context?: string): string {
    return `Analyze the sentiment of the following text in ${language}. 
    
Context: ${context || 'general feedback'}
Text: "${text}"

Please provide a JSON response with:
- sentiment: "positive", "negative", "neutral", or "mixed"
- confidence: number between 0 and 1
- score: number between -1 (very negative) and 1 (very positive)

Focus on the overall tone and emotional content of the text.`;
  }

  private parseAIResponse(content: string): { sentiment: string; confidence: number; score: number } {
    try {
      // Intentar parsear JSON de la respuesta de IA
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || 'neutral',
          confidence: parsed.confidence || 0.5,
          score: parsed.score || 0
        };
      }
    } catch (error) {
      // Fallback: análisis simple basado en palabras clave
    }

    // Análisis fallback
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'poor', 'worst'];
    
    const text = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return { sentiment: 'positive', confidence: 0.7, score: 0.6 };
    } else if (negativeCount > positiveCount) {
      return { sentiment: 'negative', confidence: 0.7, score: -0.6 };
    } else {
      return { sentiment: 'neutral', confidence: 0.5, score: 0 };
    }
  }

  private analyzeEmotions(text: string): Record<string, number> {
    const emotions: Record<string, number> = {
      joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, disgust: 0
    };

    const words = text.toLowerCase().split(/\s+/);
    
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      const matches = keywords.filter(keyword => words.some(word => word.includes(keyword))).length;
      emotions[emotion] = Math.min(matches / words.length * 10, 1);
    }

    return emotions;
  }

  private extractKeywords(text: string, sentiment: string): Array<{ word: string; sentiment: string; importance: number }> {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq: Record<string, number> = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, freq]) => ({
        word,
        sentiment: this.getWordSentiment(word),
        importance: freq / words.length
      }));
  }

  private getWordSentiment(word: string): string {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'poor', 'worst'];
    
    if (positiveWords.includes(word)) return 'positive';
    if (negativeWords.includes(word)) return 'negative';
    return 'neutral';
  }

  private identifyTopics(text: string): string[] {
    const topics = ['customer service', 'product quality', 'delivery', 'pricing', 'support'];
    const identifiedTopics = topics.filter(topic => 
      text.toLowerCase().includes(topic.replace(' ', ''))
    );
    
    return identifiedTopics.length > 0 ? identifiedTopics : ['general'];
  }

  private async detectLanguage(text: string): Promise<string> {
    // Simulación de detección de idioma
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se'];
    const englishWords = ['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that'];
    
    const words = text.toLowerCase().split(/\s+/);
    const spanishCount = spanishWords.filter(word => words.includes(word)).length;
    const englishCount = englishWords.filter(word => words.includes(word)).length;
    
    return spanishCount > englishCount ? 'es' : 'en';
  }

  private getPeriodLabel(period: string, index: number): string {
    const now = new Date();
    if (period === 'day') {
      const date = new Date(now);
      date.setDate(date.getDate() - index);
      return date.toLocaleDateString();
    } else if (period === 'week') {
      const date = new Date(now);
      date.setDate(date.getDate() - (index * 7));
      return `Week ${date.getWeek()}`;
    } else {
      const date = new Date(now);
      date.setMonth(date.getMonth() - index);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }
}

// Extender Date para getWeek()
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function() {
  const d = new Date(+this);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const sentimentAnalysisService = new SentimentAnalysisService();
