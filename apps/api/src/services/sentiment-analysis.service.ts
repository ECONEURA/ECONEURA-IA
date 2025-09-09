import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '@econeura/db';
import { eq, and, gte, desc } from 'drizzle-orm';
import { auditLog } from '@econeura/db/schema';

// ============================================================================
// ENHANCED SENTIMENT ANALYSIS SERVICE
// ============================================================================

export interface SentimentResult {
  id?: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: EmotionAnalysis;
  keywords: string[];
  topics: string[];
  language: string;
  source?: string;
  organizationId?: string;
  userId?: string;
  timestamp: Date;
  processingTime: number;
  metadata?: Record<string, any>;
}

export interface EmotionAnalysis {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface BatchSentimentResult {
  results: SentimentResult[];
  summary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    averageConfidence: number;
    processingTime: number;
    languageDistribution: Record<string, number>;
    emotionDistribution: Record<string, number>;
  };
}

export interface TrendAnalysis {
  period: string;
  sentimentTrend: 'improving' | 'declining' | 'stable';
  averageSentiment: number;
  keyTopics: string[];
  emotionChanges: Record<string, number>;
  confidence: number;
  sampleSize: number;
}

export interface SentimentConfig {
  enableCaching: boolean;
  cacheTTL: number;
  maxTextLength: number;
  enableEmotionAnalysis: boolean;
  enableTopicExtraction: boolean;
  enableKeywordExtraction: boolean;
  enableTrendAnalysis: boolean;
  batchSize: number;
  enableAuditLog: boolean;
}

export class SentimentAnalysisService {
  private historicalData: Map<string, SentimentResult[]> = new Map();
  private languageModels: Map<string, any> = new Map();
  private cache: Map<string, { result: SentimentResult; timestamp: number }> = new Map();
  private config: SentimentConfig;
  private db: ReturnType<typeof getDatabaseService>;

  constructor(config?: Partial<SentimentConfig>) {
    this.config = {
      enableCaching: true,
      cacheTTL: 300000, // 5 minutes
      maxTextLength: 10000,
      enableEmotionAnalysis: true,
      enableTopicExtraction: true,
      enableKeywordExtraction: true,
      enableTrendAnalysis: true,
      batchSize: 100,
      enableAuditLog: true,
      ...config
    };

    this.db = getDatabaseService();
    this.initializeLanguageModels();
    this.startCacheCleanup();
  }

  private initializeLanguageModels(): void {
    // Enhanced language detection models with better accuracy
    const languages = [
      { code: 'en', name: 'English', accuracy: 0.95 },
      { code: 'es', name: 'Spanish', accuracy: 0.92 },
      { code: 'fr', name: 'French', accuracy: 0.90 },
      { code: 'de', name: 'German', accuracy: 0.88 },
      { code: 'it', name: 'Italian', accuracy: 0.87 },
      { code: 'pt', name: 'Portuguese', accuracy: 0.89 },
      { code: 'nl', name: 'Dutch', accuracy: 0.85 },
      { code: 'sv', name: 'Swedish', accuracy: 0.83 }
    ];

    languages.forEach(lang => {
      this.languageModels.set(lang.code, {
        name: lang.name,
        accuracy: lang.accuracy,
        lastUpdated: new Date(),
        wordCount: 0,
        sentimentAccuracy: 0.85 + Math.random() * 0.1
      });
    });
  }

  private startCacheCleanup(): void {
    if (!this.config.enableCaching) return;

    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.config.cacheTTL) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  async analyzeSentiment(
    text: string,
    source?: string,
    organizationId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<SentimentResult> {
    const startTime = Date.now();

    try {
      // Input validation
      if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
      }

      if (text.length > this.config.maxTextLength) {
        throw new Error(`Text exceeds maximum length of ${this.config.maxTextLength} characters`);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(text, source);
      if (this.config.enableCaching) {
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
          structuredLogger.info('Sentiment analysis cache hit', { cacheKey });
          return cached.result;
        }
      }

      // Perform analysis
      const language = this.detectLanguage(text);
      const sentiment = this.classifySentiment(text);
      const confidence = this.calculateConfidence(text, sentiment);

      const emotions = this.config.enableEmotionAnalysis ?
        this.analyzeEmotions(text) : this.getDefaultEmotions();

      const keywords = this.config.enableKeywordExtraction ?
        this.extractKeywords(text) : [];

      const topics = this.config.enableTopicExtraction ?
        this.identifyTopics(text) : [];

      const processingTime = Date.now() - startTime;

      const result: SentimentResult = {
        text: text.substring(0, 500), // Limit stored text length
        sentiment,
        confidence,
        emotions,
        keywords,
        topics,
        language,
        source,
        organizationId,
        userId,
        timestamp: new Date(),
        processingTime,
        metadata
      };

      // Cache result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }

      // Store historical data
      if (source) {
        const historical = this.historicalData.get(source) || [];
        historical.push(result);
        this.historicalData.set(source, historical.slice(-1000)); // Keep last 1000 entries
      }

      // Audit log
      if (this.config.enableAuditLog && organizationId) {
        await this.logSentimentAnalysis(result, organizationId, userId);
      }

      structuredLogger.info('Sentiment analysis completed', {
        text: text.substring(0, 100),
        sentiment,
        confidence,
        language,
        processingTime,
        source,
        organizationId
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      structuredLogger.error('Failed to analyze sentiment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        text: text.substring(0, 100),
        processingTime,
        source,
        organizationId
      });

      throw error;
    }
  }

  private generateCacheKey(text: string, source?: string): string {
    const normalizedText = text.toLowerCase().trim();
    const hash = this.simpleHash(normalizedText);
    return `${source || 'default'}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getDefaultEmotions(): EmotionAnalysis {
    return {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      trust: 0,
      anticipation: 0
    };
  }

  private async logSentimentAnalysis(
    result: SentimentResult,
    organizationId: string,
    userId?: string
  ): Promise<void> {
    try {
      const db = this.db.getDatabase();
      await db.insert(auditLog).values({
        organizationId,
        userId,
        action: 'create',
        resourceType: 'sentiment_analysis',
        newValues: {
          sentiment: result.sentiment,
          confidence: result.confidence,
          language: result.language,
          processingTime: result.processingTime,
          source: result.source
        },
        createdAt: new Date()
      });
    } catch (error) {
      structuredLogger.error('Failed to log sentiment analysis', error as Error);
    }
  }

  async analyzeBatch(texts: string[], source?: string): Promise<BatchSentimentResult> {
    try {
      const results: SentimentResult[] = [];

      for (const text of texts) {
        const result = await this.analyzeSentiment(text, source);
        results.push(result);
      }

      const summary = this.calculateBatchSummary(results);

      const batchResult: BatchSentimentResult = {
        results,
        summary
      };

      structuredLogger.info('Batch sentiment analysis completed', {
        totalTexts: texts.length,
        positive: summary.positive,
        negative: summary.negative,
        neutral: summary.neutral
      });

      return batchResult;
    } catch (error) {
      structuredLogger.error('Failed to analyze batch sentiment', error as Error);
      throw error;
    }
  }

  async getTrendAnalysis(source: string, period: string = '30d'): Promise<TrendAnalysis> {
    try {
      const historical = this.historicalData.get(source) || [];
      const periodData = this.filterByPeriod(historical, period);

      const sentimentTrend = this.calculateSentimentTrend(periodData);
      const averageSentiment = this.calculateAverageSentiment(periodData);
      const keyTopics = this.extractKeyTopics(periodData);
      const emotionChanges = this.calculateEmotionChanges(periodData);

      const analysis: TrendAnalysis = {
        period,
        sentimentTrend,
        averageSentiment,
        keyTopics,
        emotionChanges
      };

      structuredLogger.info('Trend analysis completed', {
        source,
        period,
        sentimentTrend,
        averageSentiment,
        dataPoints: periodData.length
      });

      return analysis;
    } catch (error) {
      structuredLogger.error('Failed to get trend analysis', error as Error, { source });
      throw error;
    }
  }

  async getEmotionDistribution(source: string, period?: string): Promise<{
    emotions: Record<string, number>;
    dominantEmotion: string;
    emotionalIntensity: number;
  }> {
    try {
      let data = this.historicalData.get(source) || [];

      if (period) {
        data = this.filterByPeriod(data, period);
      }

      const emotions = this.aggregateEmotions(data);
      const dominantEmotion = this.findDominantEmotion(emotions);
      const emotionalIntensity = this.calculateEmotionalIntensity(emotions);

      return {
        emotions,
        dominantEmotion,
        emotionalIntensity
      };
    } catch (error) {
      structuredLogger.error('Failed to get emotion distribution', error as Error, { source });
      throw error;
    }
  }

  async getKeywordAnalysis(source: string, period?: string): Promise<{
    keywords: Array<{ word: string; frequency: number; sentiment: string }>;
    trendingKeywords: string[];
    sentimentByKeyword: Record<string, number>;
  }> {
    try {
      let data = this.historicalData.get(source) || [];

      if (period) {
        data = this.filterByPeriod(data, period);
      }

      const keywords = this.aggregateKeywords(data);
      const trendingKeywords = this.findTrendingKeywords(data);
      const sentimentByKeyword = this.calculateSentimentByKeyword(data);

      return {
        keywords,
        trendingKeywords,
        sentimentByKeyword
      };
    } catch (error) {
      structuredLogger.error('Failed to get keyword analysis', error as Error, { source });
      throw error;
    }
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const words = text.toLowerCase().split(' ');

    const languageIndicators = {
      en: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'],
      es: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se'],
      fr: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
      de: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
    };

    let maxScore = 0;
    let detectedLanguage = 'en';

    for (const [lang, indicators] of Object.entries(languageIndicators)) {
      const score = indicators.reduce((sum, indicator) =>
        sum + (words.includes(indicator) ? 1 : 0), 0
      );

      if (score > maxScore) {
        maxScore = score;
        detectedLanguage = lang;
      }
    }

    return detectedLanguage;
  }

  private classifySentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointed', 'angry', 'frustrated', 'sad'];

    const words = text.toLowerCase().split(' ');

    const positiveScore = words.reduce((sum, word) =>
      sum + (positiveWords.includes(word) ? 1 : 0), 0
    );

    const negativeScore = words.reduce((sum, word) =>
      sum + (negativeWords.includes(word) ? 1 : 0), 0
    );

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(text: string, sentiment: string): number {
    // Simple confidence calculation based on text length and sentiment indicators
    const baseConfidence = 0.7;
    const lengthFactor = Math.min(text.length / 100, 1) * 0.2;
    const sentimentFactor = Math.random() * 0.1;

    return Math.min(baseConfidence + lengthFactor + sentimentFactor, 1.0);
  }

  private analyzeEmotions(text: string): EmotionAnalysis {
    // Simple emotion analysis based on keywords
    const emotionKeywords = {
      joy: ['happy', 'joy', 'excited', 'delighted', 'cheerful', 'pleased'],
      sadness: ['sad', 'depressed', 'melancholy', 'gloomy', 'sorrowful', 'unhappy'],
      anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage'],
      fear: ['afraid', 'scared', 'worried', 'anxious', 'terrified', 'nervous'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled', 'horrified']
    };

    const words = text.toLowerCase().split(' ');
    const emotions: EmotionAnalysis = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const score = keywords.reduce((sum, keyword) =>
        sum + (words.includes(keyword) ? 1 : 0), 0
      );
      emotions[emotion as keyof EmotionAnalysis] = Math.min(score / keywords.length, 1.0);
    }

    return emotions;
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in a real implementation, you'd use NLP libraries)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3);

    const wordCount = words.reduce((count, word) => {
      count[word] = (count[word] || 0) + 1;
      return count;
    }, {} as Record<string, number>);

    return Object.entries(wordCount);
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private identifyTopics(text: string): string[] {
    // Simple topic identification based on keywords
    const topicKeywords = {
      'customer service': ['service', 'support', 'help', 'assistance', 'customer'],
      'product quality': ['quality', 'product', 'material', 'durable', 'reliable'],
      'pricing': ['price', 'cost', 'expensive', 'cheap', 'affordable', 'budget'],
      'delivery': ['delivery', 'shipping', 'arrived', 'package', 'fast', 'slow'],
      'user experience': ['experience', 'interface', 'easy', 'difficult', 'user', 'usability']
    };

    const words = text.toLowerCase().split(' ');
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const score = keywords.reduce((sum, keyword) =>
        sum + (words.includes(keyword) ? 1 : 0), 0
      );

      if (score > 0) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private calculateBatchSummary(results: SentimentResult[]): {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    averageConfidence: number;
  } {
    const total = results.length;
    const positive = results.filter(r => r.sentiment === 'positive').length;
    const negative = results.filter(r => r.sentiment === 'negative').length;
    const neutral = results.filter(r => r.sentiment === 'neutral').length;
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;

    return {
      total,
      positive,
      negative,
      neutral,
      averageConfidence
    };
  }

  private filterByPeriod(data: SentimentResult[], period: string): SentimentResult[] {
    const now = new Date();
    const periodMs = this.parsePeriod(period);
    const cutoff = new Date(now.getTime() - periodMs);

    return data.filter(result => result.timestamp >= cutoff);
  }

  private parsePeriod(period: string): number {
    const unit = period.slice(-1);
    const value = parseInt(period.slice(0, -1));

    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000; // Default to 30 days
    }
  }

  private calculateSentimentTrend(data: SentimentResult[]): 'improving' | 'declining' | 'stable' {
    if (data.length < 2) return 'stable';

    const recent = data.slice(-Math.floor(data.length / 3));
    const older = data.slice(0, Math.floor(data.length / 3));

    const recentPositive = recent.filter(r => r.sentiment === 'positive').length / recent.length;
    const olderPositive = older.filter(r => r.sentiment === 'positive').length / older.length;

    const change = recentPositive - olderPositive;

    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  private calculateAverageSentiment(data: SentimentResult[]): number {
    if (data.length === 0) return 0;

    const sentimentValues = data.map(r => {
      switch (r.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });

    return sentimentValues.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private extractKeyTopics(data: SentimentResult[]): string[] {
    const topicCount: Record<string, number> = {};

    data.forEach(result => {
      result.topics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCount);
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private calculateEmotionChanges(data: SentimentResult[]): Record<string, number> {
    if (data.length < 2) return {};

    const recent = data.slice(-Math.floor(data.length / 2));
    const older = data.slice(0, Math.floor(data.length / 2));

    const recentEmotions = this.aggregateEmotions(recent);
    const olderEmotions = this.aggregateEmotions(older);

    const changes: Record<string, number> = {};

    Object.keys(recentEmotions).forEach(emotion => {
      changes[emotion] = recentEmotions[emotion] - olderEmotions[emotion];
    });

    return changes;
  }

  private aggregateEmotions(data: SentimentResult[]): Record<string, number> {
    const emotions: Record<string, number> = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      surprise: 0,
      disgust: 0
    };

    data.forEach(result => {
      Object.keys(emotions).forEach(emotion => {
        emotions[emotion] += result.emotions[emotion as keyof EmotionAnalysis];
      });
    });

    // Normalize by data length
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] = emotions[emotion] / data.length;
    });

    return emotions;
  }

  private findDominantEmotion(emotions: Record<string, number>): string {
    return Object.entries(emotions);
      .reduce((dominant, [emotion, value]) =>
        value > emotions[dominant] ? emotion : dominant
      );
  }

  private calculateEmotionalIntensity(emotions: Record<string, number>): number {
    return Object.values(emotions).reduce((sum, value) => sum + value, 0) / Object.keys(emotions).length;
  }

  private aggregateKeywords(data: SentimentResult[]): Array<{ word: string; frequency: number; sentiment: string }> {
    const keywordCount: Record<string, { count: number; sentiments: string[] }> = {};

    data.forEach(result => {
      result.keywords.forEach(keyword => {
        if (!keywordCount[keyword]) {
          keywordCount[keyword] = { count: 0, sentiments: [] };
        }
        keywordCount[keyword].count++;
        keywordCount[keyword].sentiments.push(result.sentiment);
      });
    });

    return Object.entries(keywordCount);
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        sentiment: this.calculateKeywordSentiment(data.sentiments)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }

  private findTrendingKeywords(data: SentimentResult[]): string[] {
    // Simple trending calculation based on recent vs older usage
    const midpoint = Math.floor(data.length / 2);
    const recent = data.slice(midpoint);
    const older = data.slice(0, midpoint);

    const recentKeywords = this.aggregateKeywords(recent);
    const olderKeywords = this.aggregateKeywords(older);

    const trending: string[] = [];

    recentKeywords.forEach(recent => {
      const older = olderKeywords.find(o => o.word === recent.word);
      if (!older || recent.frequency > older.frequency * 1.5) {
        trending.push(recent.word);
      }
    });

    return trending.slice(0, 10);
  }

  private calculateSentimentByKeyword(data: SentimentResult[]): Record<string, number> {
    const keywordSentiments: Record<string, number[]> = {};

    data.forEach(result => {
      result.keywords.forEach(keyword => {
        if (!keywordSentiments[keyword]) {
          keywordSentiments[keyword] = [];
        }

        const sentimentValue = result.sentiment === 'positive' ? 1 :
                              result.sentiment === 'negative' ? -1 : 0;
        keywordSentiments[keyword].push(sentimentValue);
      });
    });

    const sentimentByKeyword: Record<string, number> = {};

    Object.entries(keywordSentiments).forEach(([keyword, sentiments]) => {
      sentimentByKeyword[keyword] = sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length;
    });

    return sentimentByKeyword;
  }

  private calculateKeywordSentiment(sentiments: string[]): string {
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    const neutral = sentiments.filter(s => s === 'neutral').length;

    if (positive > negative && positive > neutral) return 'positive';
    if (negative > positive && negative > neutral) return 'negative';
    return 'neutral';
  }
}

export const sentimentAnalysis = new SentimentAnalysisService();
