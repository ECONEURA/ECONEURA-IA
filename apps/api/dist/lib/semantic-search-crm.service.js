import { structuredLogger } from './structured-logger.js';
class SemanticSearchCRMService {
    documents = new Map();
    searchQueries = new Map();
    searchIndexes = new Map();
    searchAnalytics = new Map();
    searchSuggestions = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('Semantic Search CRM Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const mainIndex = {
            id: 'index_main',
            organizationId: 'demo-org-1',
            name: 'Main CRM Index',
            description: 'Índice principal para búsqueda semántica del CRM',
            status: 'ready',
            configuration: {
                model: 'text-embedding-ada-002',
                dimensions: 1536,
                similarityMetric: 'cosine',
                chunkSize: 512,
                overlapSize: 50,
                language: 'es',
                autoUpdate: true,
                updateInterval: 60
            },
            statistics: {
                totalDocuments: 0,
                totalVectors: 0,
                lastUpdated: oneHourAgo.toISOString(),
                averageVectorLength: 1536,
                memoryUsage: 256,
                buildTime: 120
            },
            createdAt: oneHourAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString()
        };
        this.searchIndexes.set(mainIndex.id, mainIndex);
        const contactDoc = {
            id: 'doc_contact_1',
            organizationId: 'demo-org-1',
            type: 'contact',
            title: 'Juan Pérez - Cliente Premium',
            content: 'Juan Pérez es un cliente premium de la empresa. Trabaja en TechCorp como Director de Ventas. Ha realizado múltiples compras y está interesado en productos de inteligencia artificial. Su email es juan.perez@techcorp.com y su teléfono es +34 600 123 456. Vive en Madrid y prefiere comunicación por email.',
            metadata: {
                entityId: 'contact_1',
                entityType: 'contact',
                tags: ['premium', 'techcorp', 'director', 'ventas', 'madrid'],
                categories: ['cliente', 'empresa', 'tecnología'],
                priority: 'high',
                status: 'active',
                createdBy: 'user_1',
                lastModifiedBy: 'user_1',
                language: 'es',
                confidence: 0.95
            },
            embeddings: {
                vector: this.generateMockEmbedding(),
                model: 'text-embedding-ada-002',
                version: '1.0',
                dimensions: 1536,
                generatedAt: oneHourAgo.toISOString()
            },
            searchableFields: {
                name: 'Juan Pérez',
                email: 'juan.perez@techcorp.com',
                phone: '+34 600 123 456',
                company: 'TechCorp',
                description: 'Cliente premium, Director de Ventas',
                notes: 'Interesado en IA, prefiere email'
            },
            createdAt: oneHourAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString(),
            indexedAt: oneHourAgo.toISOString()
        };
        const companyDoc = {
            id: 'doc_company_1',
            organizationId: 'demo-org-1',
            type: 'company',
            title: 'TechCorp Solutions',
            content: 'TechCorp Solutions es una empresa de tecnología especializada en soluciones de inteligencia artificial y automatización. Fundada en 2015, tiene su sede en Madrid y emplea a más de 200 personas. Se dedica principalmente al desarrollo de software empresarial y consultoría tecnológica. Sus principales clientes son empresas del sector financiero y retail.',
            metadata: {
                entityId: 'company_1',
                entityType: 'company',
                tags: ['tecnología', 'ia', 'automatización', 'madrid', 'empresa'],
                categories: ['tecnología', 'software', 'consultoría'],
                priority: 'high',
                status: 'active',
                createdBy: 'user_1',
                lastModifiedBy: 'user_1',
                language: 'es',
                confidence: 0.92
            },
            embeddings: {
                vector: this.generateMockEmbedding(),
                model: 'text-embedding-ada-002',
                version: '1.0',
                dimensions: 1536,
                generatedAt: oneHourAgo.toISOString()
            },
            searchableFields: {
                name: 'TechCorp Solutions',
                company: 'TechCorp Solutions',
                description: 'Empresa de tecnología especializada en IA',
                notes: 'Fundada en 2015, 200 empleados, sector financiero y retail'
            },
            createdAt: oneHourAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString(),
            indexedAt: oneHourAgo.toISOString()
        };
        const dealDoc = {
            id: 'doc_deal_1',
            organizationId: 'demo-org-1',
            type: 'deal',
            title: 'Implementación IA - TechCorp',
            content: 'Oportunidad de negocio para implementar una solución de inteligencia artificial en TechCorp. El proyecto incluye análisis de datos, automatización de procesos y desarrollo de chatbots. Valor estimado: €150,000. Fase actual: negociación. Próximo paso: presentación técnica. Contacto principal: Juan Pérez.',
            metadata: {
                entityId: 'deal_1',
                entityType: 'deal',
                tags: ['ia', 'techcorp', 'implementación', 'negociación', '€150k'],
                categories: ['oportunidad', 'tecnología', 'grande'],
                priority: 'critical',
                status: 'negotiation',
                createdBy: 'user_1',
                lastModifiedBy: 'user_2',
                language: 'es',
                confidence: 0.88
            },
            embeddings: {
                vector: this.generateMockEmbedding(),
                model: 'text-embedding-ada-002',
                version: '1.0',
                dimensions: 1536,
                generatedAt: oneHourAgo.toISOString()
            },
            searchableFields: {
                name: 'Implementación IA - TechCorp',
                company: 'TechCorp',
                description: 'Solución de IA, €150,000',
                notes: 'Análisis de datos, automatización, chatbots'
            },
            createdAt: oneHourAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString(),
            indexedAt: oneHourAgo.toISOString()
        };
        this.documents.set(contactDoc.id, contactDoc);
        this.documents.set(companyDoc.id, companyDoc);
        this.documents.set(dealDoc.id, dealDoc);
        mainIndex.statistics.totalDocuments = 3;
        mainIndex.statistics.totalVectors = 3;
        mainIndex.statistics.lastUpdated = now.toISOString();
        this.searchIndexes.set(mainIndex.id, mainIndex);
        const searchQuery = {
            id: 'query_1',
            organizationId: 'demo-org-1',
            query: 'cliente premium inteligencia artificial',
            type: 'semantic',
            filters: {
                documentTypes: ['contact', 'company', 'deal'],
                priority: ['high', 'critical']
            },
            options: {
                limit: 10,
                offset: 0,
                includeMetadata: true,
                includeEmbeddings: false,
                similarityThreshold: 0.7,
                boostFields: {
                    title: 2.0,
                    tags: 1.5
                },
                highlightMatches: true
            },
            results: {
                documents: [contactDoc, companyDoc, dealDoc],
                total: 3,
                executionTime: 45,
                queryVector: this.generateMockEmbedding(),
                suggestions: ['cliente premium', 'inteligencia artificial', 'techcorp'],
                facets: {
                    documentTypes: { contact: 1, company: 1, deal: 1 },
                    priority: { high: 2, critical: 1 },
                    tags: { premium: 1, ia: 2, techcorp: 2 }
                }
            },
            createdAt: oneHourAgo.toISOString()
        };
        this.searchQueries.set(searchQuery.id, searchQuery);
        const analytics = {
            id: 'analytics_1',
            organizationId: 'demo-org-1',
            queryId: 'query_1',
            userId: 'user_1',
            sessionId: 'session_1',
            query: 'cliente premium inteligencia artificial',
            results: {
                totalFound: 3,
                clickedDocuments: ['doc_contact_1', 'doc_deal_1'],
                timeSpent: 25,
                satisfaction: 4,
                feedback: 'Muy útil, encontré exactamente lo que buscaba'
            },
            performance: {
                queryTime: 45,
                indexTime: 12,
                cacheHit: false,
                modelUsed: 'text-embedding-ada-002'
            },
            timestamp: oneHourAgo.toISOString()
        };
        this.searchAnalytics.set(analytics.id, analytics);
        const suggestions = {
            id: 'suggestions_1',
            organizationId: 'demo-org-1',
            query: 'cliente',
            suggestions: [
                {
                    text: 'cliente premium',
                    type: 'autocomplete',
                    score: 0.95,
                    metadata: { frequency: 15 }
                },
                {
                    text: 'cliente techcorp',
                    type: 'related',
                    score: 0.87,
                    metadata: { relatedQueries: ['techcorp', 'premium'] }
                },
                {
                    text: 'cliente madrid',
                    type: 'semantic',
                    score: 0.82,
                    metadata: { semanticSimilarity: 0.82 }
                }
            ],
            context: {
                userId: 'user_1',
                sessionId: 'session_1',
                previousQueries: ['inteligencia artificial', 'techcorp'],
                userPreferences: {
                    language: 'es',
                    preferredTypes: ['contact', 'company']
                }
            },
            createdAt: oneHourAgo.toISOString()
        };
        this.searchSuggestions.set(suggestions.id, suggestions);
    }
    generateMockEmbedding() {
        const dimensions = 1536;
        const vector = [];
        for (let i = 0; i < dimensions; i++) {
            vector.push(Math.random() * 2 - 1);
        }
        return vector;
    }
    async indexDocument(documentData) {
        const now = new Date().toISOString();
        const document = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...documentData,
            embeddings: {
                vector: this.generateMockEmbedding(),
                model: 'text-embedding-ada-002',
                version: '1.0',
                dimensions: 1536,
                generatedAt: now
            },
            indexedAt: now
        };
        this.documents.set(document.id, document);
        const index = this.searchIndexes.get('index_main');
        if (index) {
            index.statistics.totalDocuments++;
            index.statistics.totalVectors++;
            index.statistics.lastUpdated = now;
            this.searchIndexes.set('index_main', index);
        }
        structuredLogger.info('Document indexed', {
            documentId: document.id,
            type: document.type,
            organizationId: document.organizationId
        });
        return document;
    }
    async getDocument(documentId) {
        return this.documents.get(documentId);
    }
    async updateDocument(documentId, updates) {
        const document = this.documents.get(documentId);
        if (!document)
            return undefined;
        const updatedDocument = {
            ...document,
            ...updates,
            updatedAt: new Date().toISOString(),
            indexedAt: new Date().toISOString()
        };
        if (updates.content || updates.title) {
            updatedDocument.embeddings = {
                vector: this.generateMockEmbedding(),
                model: 'text-embedding-ada-002',
                version: '1.0',
                dimensions: 1536,
                generatedAt: new Date().toISOString()
            };
        }
        this.documents.set(documentId, updatedDocument);
        structuredLogger.info('Document updated', {
            documentId,
            type: updatedDocument.type,
            organizationId: updatedDocument.organizationId
        });
        return updatedDocument;
    }
    async semanticSearch(query, organizationId, options = {}) {
        const startTime = Date.now();
        const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const searchQuery = {
            id: queryId,
            organizationId,
            query,
            type: options.type || 'semantic',
            filters: options.filters || {},
            options: {
                limit: options.limit || 10,
                offset: options.offset || 0,
                includeMetadata: options.includeMetadata || true,
                includeEmbeddings: false,
                similarityThreshold: options.similarityThreshold || 0.7,
                boostFields: {
                    title: 2.0,
                    tags: 1.5
                },
                highlightMatches: true
            },
            results: {
                documents: [],
                total: 0,
                executionTime: 0,
                queryVector: this.generateMockEmbedding(),
                suggestions: [],
                facets: {}
            },
            createdAt: new Date().toISOString()
        };
        const allDocuments = Array.from(this.documents.values())
            .filter(doc => doc.organizationId === organizationId);
        let filteredDocuments = allDocuments;
        if (options.filters?.documentTypes) {
            filteredDocuments = filteredDocuments.filter(doc => options.filters.documentTypes.includes(doc.type));
        }
        if (options.filters?.tags) {
            filteredDocuments = filteredDocuments.filter(doc => options.filters.tags.some(tag => doc.metadata.tags.includes(tag)));
        }
        if (options.filters?.priority) {
            filteredDocuments = filteredDocuments.filter(doc => options.filters.priority.includes(doc.metadata.priority));
        }
        const queryVector = this.generateMockEmbedding();
        const scoredDocuments = filteredDocuments.map(doc => ({
            document: doc,
            score: Math.random() * 0.3 + 0.7
        }));
        const threshold = options.similarityThreshold || 0.7;
        const relevantDocuments = scoredDocuments
            .filter(item => item.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(options.offset || 0, (options.offset || 0) + (options.limit || 10))
            .map(item => item.document);
        const suggestions = this.generateSuggestions(query, organizationId);
        const facets = this.generateFacets(filteredDocuments);
        searchQuery.results = {
            documents: relevantDocuments,
            total: filteredDocuments.length,
            executionTime: Date.now() - startTime,
            queryVector,
            suggestions,
            facets
        };
        this.searchQueries.set(queryId, searchQuery);
        structuredLogger.info('Semantic search executed', {
            queryId,
            query,
            organizationId,
            resultsCount: relevantDocuments.length,
            executionTime: searchQuery.results.executionTime
        });
        return searchQuery;
    }
    generateSuggestions(query, organizationId) {
        const suggestions = [];
        if (query.includes('cliente')) {
            suggestions.push('cliente premium', 'cliente techcorp', 'cliente madrid');
        }
        if (query.includes('ia') || query.includes('inteligencia')) {
            suggestions.push('inteligencia artificial', 'automatización', 'chatbots');
        }
        if (query.includes('techcorp')) {
            suggestions.push('techcorp solutions', 'techcorp madrid', 'techcorp ia');
        }
        return suggestions.slice(0, 5);
    }
    generateFacets(documents) {
        const facets = {
            documentTypes: {},
            priority: {},
            tags: {},
            categories: {}
        };
        documents.forEach(doc => {
            facets.documentTypes[doc.type] = (facets.documentTypes[doc.type] || 0) + 1;
            facets.priority[doc.metadata.priority] = (facets.priority[doc.metadata.priority] || 0) + 1;
            doc.metadata.tags.forEach(tag => {
                facets.tags[tag] = (facets.tags[tag] || 0) + 1;
            });
            doc.metadata.categories.forEach(category => {
                facets.categories[category] = (facets.categories[category] || 0) + 1;
            });
        });
        return facets;
    }
    async getSearchIndexes(organizationId) {
        return Array.from(this.searchIndexes.values())
            .filter(index => index.organizationId === organizationId);
    }
    async createSearchIndex(indexData) {
        const now = new Date().toISOString();
        const index = {
            id: `index_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...indexData,
            statistics: {
                totalDocuments: 0,
                totalVectors: 0,
                lastUpdated: now,
                averageVectorLength: indexData.configuration.dimensions,
                memoryUsage: 0,
                buildTime: 0
            },
            createdAt: now,
            updatedAt: now
        };
        this.searchIndexes.set(index.id, index);
        structuredLogger.info('Search index created', {
            indexId: index.id,
            name: index.name,
            organizationId: index.organizationId
        });
        return index;
    }
    async logSearchAnalytics(analyticsData) {
        const now = new Date().toISOString();
        const analytics = {
            id: `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...analyticsData,
            timestamp: now
        };
        this.searchAnalytics.set(analytics.id, analytics);
        structuredLogger.info('Search analytics logged', {
            analyticsId: analytics.id,
            queryId: analytics.queryId,
            userId: analytics.userId,
            resultsFound: analytics.results.totalFound
        });
        return analytics;
    }
    async getSearchSuggestions(query, organizationId, context) {
        const now = new Date().toISOString();
        const suggestionId = `suggestions_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const suggestions = {
            id: suggestionId,
            organizationId,
            query,
            suggestions: this.generateSuggestions(query, organizationId).map(text => ({
                text,
                type: 'autocomplete',
                score: Math.random() * 0.2 + 0.8,
                metadata: { frequency: Math.floor(Math.random() * 20) + 1 }
            })),
            context: context || {},
            createdAt: now
        };
        this.searchSuggestions.set(suggestionId, suggestions);
        structuredLogger.info('Search suggestions generated', {
            suggestionId,
            query,
            organizationId,
            suggestionsCount: suggestions.suggestions.length
        });
        return suggestions;
    }
    async getSearchStats(organizationId) {
        const documents = Array.from(this.documents.values()).filter(d => d.organizationId === organizationId);
        const queries = Array.from(this.searchQueries.values()).filter(q => q.organizationId === organizationId);
        const analytics = Array.from(this.searchAnalytics.values()).filter(a => a.organizationId === organizationId);
        const indexes = Array.from(this.searchIndexes.values()).filter(i => i.organizationId === organizationId);
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
            totalDocuments: documents.length,
            totalQueries: queries.length,
            totalAnalytics: analytics.length,
            totalIndexes: indexes.length,
            documentStats: {
                byType: this.getDocumentTypeStats(documents),
                byPriority: this.getDocumentPriorityStats(documents),
                byLanguage: this.getDocumentLanguageStats(documents),
                averageConfidence: documents.length > 0 ?
                    documents.reduce((sum, d) => sum + d.metadata.confidence, 0) / documents.length : 0
            },
            searchStats: {
                totalSearches: queries.length,
                averageResults: queries.length > 0 ?
                    queries.reduce((sum, q) => sum + q.results.total, 0) / queries.length : 0,
                averageExecutionTime: queries.length > 0 ?
                    queries.reduce((sum, q) => sum + q.results.executionTime, 0) / queries.length : 0,
                byType: this.getSearchTypeStats(queries)
            },
            last24Hours: {
                searches: queries.filter(q => new Date(q.createdAt) >= last24Hours).length,
                documentsIndexed: documents.filter(d => new Date(d.indexedAt) >= last24Hours).length,
                analytics: analytics.filter(a => new Date(a.timestamp) >= last24Hours).length
            },
            last7Days: {
                searches: queries.filter(q => new Date(q.createdAt) >= last7Days).length,
                documentsIndexed: documents.filter(d => new Date(d.indexedAt) >= last7Days).length,
                analytics: analytics.filter(a => new Date(a.timestamp) >= last7Days).length
            },
            performanceStats: {
                averageQueryTime: queries.length > 0 ?
                    queries.reduce((sum, q) => sum + q.results.executionTime, 0) / queries.length : 0,
                cacheHitRate: analytics.length > 0 ?
                    analytics.filter(a => a.performance.cacheHit).length / analytics.length : 0,
                averageSatisfaction: analytics.length > 0 ?
                    analytics.reduce((sum, a) => sum + a.results.satisfaction, 0) / analytics.length : 0
            },
            topQueries: this.getTopQueries(queries),
            topTags: this.getTopTags(documents)
        };
    }
    getDocumentTypeStats(documents) {
        const stats = {};
        documents.forEach(doc => {
            stats[doc.type] = (stats[doc.type] || 0) + 1;
        });
        return stats;
    }
    getDocumentPriorityStats(documents) {
        const stats = {};
        documents.forEach(doc => {
            stats[doc.metadata.priority] = (stats[doc.metadata.priority] || 0) + 1;
        });
        return stats;
    }
    getDocumentLanguageStats(documents) {
        const stats = {};
        documents.forEach(doc => {
            stats[doc.metadata.language] = (stats[doc.metadata.language] || 0) + 1;
        });
        return stats;
    }
    getSearchTypeStats(queries) {
        const stats = {};
        queries.forEach(query => {
            stats[query.type] = (stats[query.type] || 0) + 1;
        });
        return stats;
    }
    getTopQueries(queries) {
        const queryCounts = {};
        queries.forEach(q => {
            queryCounts[q.query] = (queryCounts[q.query] || 0) + 1;
        });
        return Object.entries(queryCounts)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    getTopTags(documents) {
        const tagCounts = {};
        documents.forEach(doc => {
            doc.metadata.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        return Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
    }
}
export const semanticSearchCRMService = new SemanticSearchCRMService();
//# sourceMappingURL=semantic-search-crm.service.js.map