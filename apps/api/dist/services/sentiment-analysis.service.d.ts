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
export declare class SentimentAnalysisService {
    private historicalData;
    private languageModels;
    private cache;
    private config;
    private db;
    constructor(config?: Partial<SentimentConfig>);
    private initializeLanguageModels;
    private startCacheCleanup;
    analyzeSentiment(text: string, source?: string, organizationId?: string, userId?: string, metadata?: Record<string, any>): Promise<SentimentResult>;
    private generateCacheKey;
    private simpleHash;
    private getDefaultEmotions;
    private logSentimentAnalysis;
    analyzeBatch(texts: string[], source?: string): Promise<BatchSentimentResult>;
    getTrendAnalysis(source: string, period?: string): Promise<TrendAnalysis>;
    getEmotionDistribution(source: string, period?: string): Promise<{
        emotions: Record<string, number>;
        dominantEmotion: string;
        emotionalIntensity: number;
    }>;
    getKeywordAnalysis(source: string, period?: string): Promise<{
        keywords: Array<{
            word: string;
            frequency: number;
            sentiment: string;
        }>;
        trendingKeywords: string[];
        sentimentByKeyword: Record<string, number>;
    }>;
    private detectLanguage;
    private classifySentiment;
    private calculateConfidence;
    private analyzeEmotions;
    private extractKeywords;
    private identifyTopics;
    private calculateBatchSummary;
    private filterByPeriod;
    private parsePeriod;
    private calculateSentimentTrend;
    private calculateAverageSentiment;
    private extractKeyTopics;
    private calculateEmotionChanges;
    private aggregateEmotions;
    private findDominantEmotion;
    private calculateEmotionalIntensity;
    private aggregateKeywords;
    private findTrendingKeywords;
    private calculateSentimentByKeyword;
    private calculateKeywordSentiment;
}
export declare const sentimentAnalysis: SentimentAnalysisService;
//# sourceMappingURL=sentiment-analysis.service.d.ts.map