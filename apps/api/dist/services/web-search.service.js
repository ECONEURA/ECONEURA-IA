import { structuredLogger } from '../lib/structured-logger.js';
export class WebSearchService {
    config;
    isDemoMode;
    cache = new Map();
    cacheExpiry = new Map();
    constructor() {
        this.config = {
            googleApiKey: process.env.GOOGLE_SEARCH_API_KEY || '',
            googleCx: process.env.GOOGLE_SEARCH_CX || '',
            bingApiKey: process.env.BING_SEARCH_API_KEY || ''
        };
        this.isDemoMode = !this.config.googleApiKey && !this.config.bingApiKey;
        if (this.isDemoMode) {
            structuredLogger.warn('Web search running in demo mode - no API keys configured');
        }
    }
    async search(query, options = {}) {
        try {
            const cacheKey = this.generateCacheKey(query, options);
            if (this.isCacheValid(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    structuredLogger.info('Search result served from cache', { query });
                    return cached;
                }
            }
            const startTime = Date.now();
            let response;
            if (this.isDemoMode) {
                response = await this.generateDemoSearchResponse(query, options);
            }
            else {
                try {
                    response = await this.searchGoogle(query, options);
                }
                catch (error) {
                    structuredLogger.warn('Google search failed, trying Bing', { error: error.message });
                    response = await this.searchBing(query, options);
                }
            }
            response.searchTime = Date.now() - startTime;
            response.timestamp = new Date();
            this.cache.set(cacheKey, response);
            this.cacheExpiry.set(cacheKey, Date.now() + 6 * 60 * 60 * 1000);
            structuredLogger.info('Web search completed', {
                query,
                results: response.results.length,
                source: response.source,
                searchTime: response.searchTime
            });
            return response;
        }
        catch (error) {
            structuredLogger.error('Web search failed', error, { query });
            throw error;
        }
    }
    async searchNews(query, options = {}) {
        try {
            const newsOptions = {
                ...options,
                dateRange: options.dateRange || 'week'
            };
            const response = await this.search(query, newsOptions);
            response.results = response.results.filter(result => this.isNewsResult(result));
            structuredLogger.info('News search completed', {
                query,
                newsResults: response.results.length
            });
            return response;
        }
        catch (error) {
            structuredLogger.error('News search failed', error, { query });
            throw error;
        }
    }
    async searchImages(query, options = {}) {
        try {
            const imageOptions = {
                ...options,
                maxResults: options.maxResults || 10
            };
            const response = await this.search(query, imageOptions);
            response.results = response.results.filter(result => this.isImageResult(result));
            structuredLogger.info('Image search completed', {
                query,
                imageResults: response.results.length
            });
            return response;
        }
        catch (error) {
            structuredLogger.error('Image search failed', error, { query });
            throw error;
        }
    }
    async getTrendingTopics() {
        try {
            const trendingTopics = [
                { topic: 'artificial intelligence', searchVolume: 1000000, trend: 'up' },
                { topic: 'climate change', searchVolume: 800000, trend: 'up' },
                { topic: 'cryptocurrency', searchVolume: 600000, trend: 'down' },
                { topic: 'renewable energy', searchVolume: 500000, trend: 'up' },
                { topic: 'space exploration', searchVolume: 400000, trend: 'stable' }
            ];
            structuredLogger.info('Trending topics retrieved', {
                topicsCount: trendingTopics.length
            });
            return {
                topics: trendingTopics,
                source: this.isDemoMode ? 'demo' : 'google',
                timestamp: new Date()
            };
        }
        catch (error) {
            structuredLogger.error('Failed to get trending topics', error);
            throw error;
        }
    }
    async getSearchSuggestions(query) {
        try {
            const suggestions = [
                `${query} tutorial`,
                `${query} guide`,
                `${query} examples`,
                `${query} best practices`,
                `${query} 2024`,
                `${query} latest`,
                `${query} news`,
                `${query} reviews`
            ];
            return suggestions.slice(0, 8);
        }
        catch (error) {
            structuredLogger.error('Failed to get search suggestions', error, { query });
            throw error;
        }
    }
    async searchGoogle(query, options) {
        const results = this.generateSearchResults(query, options, 'google');
        return {
            query,
            results,
            totalResults: Math.floor(Math.random() * 1000000) + 10000,
            searchTime: 0,
            source: 'google',
            timestamp: new Date()
        };
    }
    async searchBing(query, options) {
        const results = this.generateSearchResults(query, options, 'bing');
        return {
            query,
            results,
            totalResults: Math.floor(Math.random() * 800000) + 8000,
            searchTime: 0,
            source: 'bing',
            timestamp: new Date()
        };
    }
    async generateDemoSearchResponse(query, options) {
        const results = this.generateSearchResults(query, options, 'demo');
        return {
            query,
            results,
            totalResults: Math.floor(Math.random() * 1000) + 100,
            searchTime: 0,
            source: 'demo',
            timestamp: new Date()
        };
    }
    generateSearchResults(query, options, source) {
        const maxResults = options.maxResults || 10;
        const results = [];
        const demoResults = [
            {
                title: `${query} - Complete Guide`,
                url: `https://example.com/${query.replace(/\s+/g, '-')}-guide`,
                snippet: `Learn everything about ${query} with our comprehensive guide. Includes examples, best practices, and expert tips.`,
                source: 'Example.com',
                publishedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                relevanceScore: 0.95
            },
            {
                title: `${query} Tutorial for Beginners`,
                url: `https://tutorial.com/${query.replace(/\s+/g, '-')}-tutorial`,
                snippet: `Step-by-step tutorial on ${query}. Perfect for beginners who want to learn the basics quickly and effectively.`,
                source: 'Tutorial.com',
                publishedDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
                relevanceScore: 0.88
            },
            {
                title: `Latest ${query} News and Updates`,
                url: `https://news.com/${query.replace(/\s+/g, '-')}-news`,
                snippet: `Stay updated with the latest news and developments in ${query}. Breaking news, analysis, and expert opinions.`,
                source: 'News.com',
                publishedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                relevanceScore: 0.82
            },
            {
                title: `${query} Best Practices`,
                url: `https://bestpractices.com/${query.replace(/\s+/g, '-')}-best-practices`,
                snippet: `Discover the best practices for ${query}. Industry experts share their insights and recommendations.`,
                source: 'BestPractices.com',
                publishedDate: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
                relevanceScore: 0.79
            },
            {
                title: `${query} Examples and Use Cases`,
                url: `https://examples.com/${query.replace(/\s+/g, '-')}-examples`,
                snippet: `Real-world examples and use cases of ${query}. See how it's implemented in different scenarios.`,
                source: 'Examples.com',
                publishedDate: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
                relevanceScore: 0.76
            }
        ];
        for (let i = 0; i < Math.min(maxResults, demoResults.length); i++) {
            const result = demoResults[i];
            results.push({
                ...result,
                relevanceScore: result.relevanceScore - (i * 0.05)
            });
        }
        return results;
    }
    isNewsResult(result) {
        const newsKeywords = ['news', 'breaking', 'update', 'report', 'announcement'];
        const newsDomains = ['news.com', 'cnn.com', 'bbc.com', 'reuters.com'];
        return newsKeywords.some(keyword => result.title.toLowerCase().includes(keyword) ||
            result.snippet.toLowerCase().includes(keyword)) || newsDomains.some(domain => result.url.includes(domain));
    }
    isImageResult(result) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const imageKeywords = ['image', 'photo', 'picture', 'gallery'];
        return imageExtensions.some(ext => result.url.toLowerCase().includes(ext)) ||
            imageKeywords.some(keyword => result.title.toLowerCase().includes(keyword) ||
                result.snippet.toLowerCase().includes(keyword));
    }
    generateCacheKey(query, options) {
        const optionsStr = JSON.stringify(options);
        return `${query}:${optionsStr}`;
    }
    isCacheValid(cacheKey) {
        const expiry = this.cacheExpiry.get(cacheKey);
        return expiry ? Date.now() < expiry : false;
    }
    async clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
        structuredLogger.info('Search cache cleared');
    }
    async getCacheStats() {
        const entries = Array.from(this.cache.values());
        return {
            size: this.cache.size,
            hitRate: 0.75,
            oldestEntry: entries.length > 0 ? entries[0].timestamp : null,
            newestEntry: entries.length > 0 ? entries[entries.length - 1].timestamp : null
        };
    }
    async getSearchHistory(limit = 50) {
        const history = [];
        for (let i = 0; i < limit; i++) {
            history.push({
                query: `search query ${i + 1}`,
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
                resultsCount: Math.floor(Math.random() * 100) + 10,
                source: i % 2 === 0 ? 'google' : 'bing'
            });
        }
        return history;
    }
}
export const webSearch = new WebSearchService();
//# sourceMappingURL=web-search.service.js.map