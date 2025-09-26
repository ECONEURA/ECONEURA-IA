import { getDatabaseService } from '@econeura/db';
import { auditLog } from '@econeura/db/schema';

import { structuredLogger } from '../lib/structured-logger.js';
export class SentimentAnalysisService {
    historicalData = new Map();
    languageModels = new Map();
    cache = new Map();
    config;
    db;
    constructor(config) {
        this.config = {
            enableCaching: true,
            cacheTTL: 300000,
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
    initializeLanguageModels() {
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
    startCacheCleanup() {
        if (!this.config.enableCaching)
            return;
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > this.config.cacheTTL) {
                    this.cache.delete(key);
                }
            }
        }, 60000);
    }
    async analyzeSentiment(text, source, organizationId, userId, metadata) {
        const startTime = Date.now();
        try {
            if (!text || text.trim().length === 0) {
                throw new Error('Text cannot be empty');
            }
            if (text.length > this.config.maxTextLength) {
                throw new Error(`Text exceeds maximum length of ${this.config.maxTextLength} characters`);
            }
            const cacheKey = this.generateCacheKey(text, source);
            if (this.config.enableCaching) {
                const cached = this.cache.get(cacheKey);
                if (cached && (Date.now() - cached.timestamp) < this.config.cacheTTL) {
                    structuredLogger.info('Sentiment analysis cache hit', { cacheKey });
                    return cached.result;
                }
            }
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
            const result = {
                text: text.substring(0, 500),
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
            if (this.config.enableCaching) {
                this.cache.set(cacheKey, { result, timestamp: Date.now() });
            }
            if (source) {
                const historical = this.historicalData.get(source) || [];
                historical.push(result);
                this.historicalData.set(source, historical.slice(-1000));
            }
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
        }
        catch (error) {
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
    generateCacheKey(text, source) {
        const normalizedText = text.toLowerCase().trim();
        const hash = this.simpleHash(normalizedText);
        return `${source || 'default'}:${hash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    getDefaultEmotions() {
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
    async logSentimentAnalysis(result, organizationId, userId) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to log sentiment analysis', error);
        }
    }
    async analyzeBatch(texts, source) {
        try {
            const results = [];
            for (const text of texts) {
                const result = await this.analyzeSentiment(text, source);
                results.push(result);
            }
            const summary = this.calculateBatchSummary(results);
            const batchResult = {
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
        }
        catch (error) {
            structuredLogger.error('Failed to analyze batch sentiment', error);
            throw error;
        }
    }
    async getTrendAnalysis(source, period = '30d') {
        try {
            const historical = this.historicalData.get(source) || [];
            const periodData = this.filterByPeriod(historical, period);
            const sentimentTrend = this.calculateSentimentTrend(periodData);
            const averageSentiment = this.calculateAverageSentiment(periodData);
            const keyTopics = this.extractKeyTopics(periodData);
            const emotionChanges = this.calculateEmotionChanges(periodData);
            const analysis = {
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
        }
        catch (error) {
            structuredLogger.error('Failed to get trend analysis', error, { source });
            throw error;
        }
    }
    async getEmotionDistribution(source, period) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to get emotion distribution', error, { source });
            throw error;
        }
    }
    async getKeywordAnalysis(source, period) {
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
        }
        catch (error) {
            structuredLogger.error('Failed to get keyword analysis', error, { source });
            throw error;
        }
    }
    detectLanguage(text) {
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
            const score = indicators.reduce((sum, indicator) => sum + (words.includes(indicator) ? 1 : 0), 0);
            if (score > maxScore) {
                maxScore = score;
                detectedLanguage = lang;
            }
        }
        return detectedLanguage;
    }
    classifySentiment(text) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'awesome'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointed', 'angry', 'frustrated', 'sad'];
        const words = text.toLowerCase().split(' ');
        const positiveScore = words.reduce((sum, word) => sum + (positiveWords.includes(word) ? 1 : 0), 0);
        const negativeScore = words.reduce((sum, word) => sum + (negativeWords.includes(word) ? 1 : 0), 0);
        if (positiveScore > negativeScore)
            return 'positive';
        if (negativeScore > positiveScore)
            return 'negative';
        return 'neutral';
    }
    calculateConfidence(text, sentiment) {
        const baseConfidence = 0.7;
        const lengthFactor = Math.min(text.length / 100, 1) * 0.2;
        const sentimentFactor = Math.random() * 0.1;
        return Math.min(baseConfidence + lengthFactor + sentimentFactor, 1.0);
    }
    analyzeEmotions(text) {
        const emotionKeywords = {
            joy: ['happy', 'joy', 'excited', 'delighted', 'cheerful', 'pleased'],
            sadness: ['sad', 'depressed', 'melancholy', 'gloomy', 'sorrowful', 'unhappy'],
            anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage'],
            fear: ['afraid', 'scared', 'worried', 'anxious', 'terrified', 'nervous'],
            surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered'],
            disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'appalled', 'horrified']
        };
        const words = text.toLowerCase().split(' ');
        const emotions = {
            joy: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
            disgust: 0
        };
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const score = keywords.reduce((sum, keyword) => sum + (words.includes(keyword) ? 1 : 0), 0);
            emotions[emotion] = Math.min(score / keywords.length, 1.0);
        }
        return emotions;
    }
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(word => word.length > 3);
        const wordCount = words.reduce((count, word) => {
            count[word] = (count[word] || 0) + 1;
            return count;
        }, {});
        return Object.entries(wordCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }
    identifyTopics(text) {
        const topicKeywords = {
            'customer service': ['service', 'support', 'help', 'assistance', 'customer'],
            'product quality': ['quality', 'product', 'material', 'durable', 'reliable'],
            'pricing': ['price', 'cost', 'expensive', 'cheap', 'affordable', 'budget'],
            'delivery': ['delivery', 'shipping', 'arrived', 'package', 'fast', 'slow'],
            'user experience': ['experience', 'interface', 'easy', 'difficult', 'user', 'usability']
        };
        const words = text.toLowerCase().split(' ');
        const topics = [];
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            const score = keywords.reduce((sum, keyword) => sum + (words.includes(keyword) ? 1 : 0), 0);
            if (score > 0) {
                topics.push(topic);
            }
        }
        return topics;
    }
    calculateBatchSummary(results) {
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
    filterByPeriod(data, period) {
        const now = new Date();
        const periodMs = this.parsePeriod(period);
        const cutoff = new Date(now.getTime() - periodMs);
        return data.filter(result => result.timestamp >= cutoff);
    }
    parsePeriod(period) {
        const unit = period.slice(-1);
        const value = parseInt(period.slice(0, -1));
        switch (unit) {
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            case 'm': return value * 30 * 24 * 60 * 60 * 1000;
            default: return 30 * 24 * 60 * 60 * 1000;
        }
    }
    calculateSentimentTrend(data) {
        if (data.length < 2)
            return 'stable';
        const recent = data.slice(-Math.floor(data.length / 3));
        const older = data.slice(0, Math.floor(data.length / 3));
        const recentPositive = recent.filter(r => r.sentiment === 'positive').length / recent.length;
        const olderPositive = older.filter(r => r.sentiment === 'positive').length / older.length;
        const change = recentPositive - olderPositive;
        if (change > 0.1)
            return 'improving';
        if (change < -0.1)
            return 'declining';
        return 'stable';
    }
    calculateAverageSentiment(data) {
        if (data.length === 0)
            return 0;
        const sentimentValues = data.map(r => {
            switch (r.sentiment) {
                case 'positive': return 1;
                case 'negative': return -1;
                default: return 0;
            }
        });
        return sentimentValues.reduce((sum, val) => sum + val, 0) / data.length;
    }
    extractKeyTopics(data) {
        const topicCount = {};
        data.forEach(result => {
            result.topics.forEach(topic => {
                topicCount[topic] = (topicCount[topic] || 0) + 1;
            });
        });
        return Object.entries(topicCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([topic]) => topic);
    }
    calculateEmotionChanges(data) {
        if (data.length < 2)
            return {};
        const recent = data.slice(-Math.floor(data.length / 2));
        const older = data.slice(0, Math.floor(data.length / 2));
        const recentEmotions = this.aggregateEmotions(recent);
        const olderEmotions = this.aggregateEmotions(older);
        const changes = {};
        Object.keys(recentEmotions).forEach(emotion => {
            changes[emotion] = recentEmotions[emotion] - olderEmotions[emotion];
        });
        return changes;
    }
    aggregateEmotions(data) {
        const emotions = {
            joy: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0,
            disgust: 0
        };
        data.forEach(result => {
            Object.keys(emotions).forEach(emotion => {
                emotions[emotion] += result.emotions[emotion];
            });
        });
        Object.keys(emotions).forEach(emotion => {
            emotions[emotion] = emotions[emotion] / data.length;
        });
        return emotions;
    }
    findDominantEmotion(emotions) {
        return Object.entries(emotions)
            .reduce((dominant, [emotion, value]) => value > emotions[dominant] ? emotion : dominant);
    }
    calculateEmotionalIntensity(emotions) {
        return Object.values(emotions).reduce((sum, value) => sum + value, 0) / Object.keys(emotions).length;
    }
    aggregateKeywords(data) {
        const keywordCount = {};
        data.forEach(result => {
            result.keywords.forEach(keyword => {
                if (!keywordCount[keyword]) {
                    keywordCount[keyword] = { count: 0, sentiments: [] };
                }
                keywordCount[keyword].count++;
                keywordCount[keyword].sentiments.push(result.sentiment);
            });
        });
        return Object.entries(keywordCount)
            .map(([word, data]) => ({
            word,
            frequency: data.count,
            sentiment: this.calculateKeywordSentiment(data.sentiments)
        }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 20);
    }
    findTrendingKeywords(data) {
        const midpoint = Math.floor(data.length / 2);
        const recent = data.slice(midpoint);
        const older = data.slice(0, midpoint);
        const recentKeywords = this.aggregateKeywords(recent);
        const olderKeywords = this.aggregateKeywords(older);
        const trending = [];
        recentKeywords.forEach(recent => {
            const older = olderKeywords.find(o => o.word === recent.word);
            if (!older || recent.frequency > older.frequency * 1.5) {
                trending.push(recent.word);
            }
        });
        return trending.slice(0, 10);
    }
    calculateSentimentByKeyword(data) {
        const keywordSentiments = {};
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
        const sentimentByKeyword = {};
        Object.entries(keywordSentiments).forEach(([keyword, sentiments]) => {
            sentimentByKeyword[keyword] = sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length;
        });
        return sentimentByKeyword;
    }
    calculateKeywordSentiment(sentiments) {
        const positive = sentiments.filter(s => s === 'positive').length;
        const negative = sentiments.filter(s => s === 'negative').length;
        const neutral = sentiments.filter(s => s === 'neutral').length;
        if (positive > negative && positive > neutral)
            return 'positive';
        if (negative > positive && negative > neutral)
            return 'negative';
        return 'neutral';
    }
}
export const sentimentAnalysis = new SentimentAnalysisService();
//# sourceMappingURL=sentiment-analysis.service.js.map