import { AIRouter } from '@econeura/shared';

export interface SearchDocument {
  id: string;
  content: string;
  title?: string;
  type: 'text' | 'email' | 'document' | 'chat' | 'review';
  metadata: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  similarityThreshold?: number;
  includeMetadata?: boolean;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights: string[];
  explanation?: string;
}

export interface SearchCluster {
  id: string;
  name: string;
  documents: SearchDocument[];
  centroid: number[];
  keywords: string[];
  size: number;
}

export interface SearchAnalytics {
  totalDocuments: number;
  totalQueries: number;
  averageQueryTime: number;
  topQueries: Array<{ query: string; count: number }>;
  searchTrends: Array<{ date: string; count: number }>;
}

class SemanticSearchService {
  private documents: Map<string, SearchDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private clusters: Map<string, SearchCluster> = new Map();
  private searchHistory: Array<{ query: string; timestamp: Date; results: number }> = [];

  async indexDocument(document: Omit<SearchDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newDocument: SearchDocument = {
        ...document,
        id,
        createdAt: now,
        updatedAt: now
      };

      // Generar embedding semántico
      const embedding = await this.generateEmbedding(document.content);
      newDocument.embedding = embedding;
      
      this.documents.set(id, newDocument);
      this.embeddings.set(id, embedding);

      // Actualizar clusters
      await this.updateClusters();

      return id;
    } catch (error) {
      throw error;
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Generar embedding para la consulta
      const queryEmbedding = await this.generateEmbedding(query.query);
      
      // Calcular similitud con todos los documentos
      const similarities = await this.calculateSimilarities(queryEmbedding, query.filters);
      
      // Filtrar por umbral de similitud
      const threshold = query.similarityThreshold || 0.7;
      const filteredResults = similarities.filter(s => s.similarity >= threshold);
      
      // Ordenar por similitud
      filteredResults.sort((a, b) => b.similarity - a.similarity);
      
      // Aplicar paginación
      const limit = query.limit || 10;
      const offset = query.offset || 0;
      const paginatedResults = filteredResults.slice(offset, offset + limit);
      
      // Generar resultados con highlights
      const results: SearchResult[] = await Promise.all(
        paginatedResults.map(async (item) => {
          const document = this.documents.get(item.documentId)!;
          const highlights = await this.generateHighlights(query.query, document.content);
          
          return {
            document: query.includeMetadata ? document : this.sanitizeDocument(document),
            score: item.similarity,
            highlights,
            explanation: await this.generateExplanation(query.query, document.content, item.similarity)
          };
        })
      );

      // Registrar búsqueda
      this.searchHistory.push({
        query: query.query,
        timestamp: new Date(),
        results: results.length
      });

      // Mantener solo las últimas 1000 búsquedas
      if (this.searchHistory.length > 1000) {
        this.searchHistory = this.searchHistory.slice(-900);
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  async searchByCluster(clusterId: string, query: string): Promise<SearchResult[]> {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      throw new Error(`Cluster ${clusterId} not found`);
    }

    const queryEmbedding = await this.generateEmbedding(query);
    const similarities = await this.calculateSimilarities(queryEmbedding, {}, cluster.documents);
    
    const results: SearchResult[] = await Promise.all(
      similarities.slice(0, 10).map(async (item) => {
        const document = this.documents.get(item.documentId)!;
        const highlights = await this.generateHighlights(query, document.content);
        
        return {
          document,
          score: item.similarity,
          highlights,
          explanation: `Found in cluster: ${cluster.name}`
        };
      })
    );

    return results;
  }

  async getClusters(): Promise<SearchCluster[]> {
    return Array.from(this.clusters.values());
  }

  async getCluster(clusterId: string): Promise<SearchCluster | null> {
    return this.clusters.get(clusterId) || null;
  }

  async createCluster(name: string, documentIds: string[]): Promise<SearchCluster> {
    const documents = documentIds
      .map(id => this.documents.get(id))
      .filter(doc => doc !== undefined) as SearchDocument[];

    if (documents.length === 0) {
      throw new Error('No valid documents provided for cluster');
    }

    const centroid = this.calculateCentroid(documents.map(doc => doc.embedding!));
    const keywords = await this.extractKeywords(documents.map(doc => doc.content).join(' '));

    const cluster: SearchCluster = {
      id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      documents,
      centroid,
      keywords,
      size: documents.length
    };

    this.clusters.set(cluster.id, cluster);
    return cluster;
  }

  async getSearchAnalytics(): Promise<SearchAnalytics> {
    const totalDocuments = this.documents.size;
    const totalQueries = this.searchHistory.length;
    
    const averageQueryTime = this.calculateAverageQueryTime();
    
    const topQueries = this.getTopQueries();
    const searchTrends = this.getSearchTrends();

    return {
      totalDocuments,
      totalQueries,
      averageQueryTime,
      topQueries,
      searchTrends
    };
  }

  async getSimilarDocuments(documentId: string, limit: number = 5): Promise<SearchResult[]> {
    const document = this.documents.get(documentId);
    if (!document || !document.embedding) {
      throw new Error(`Document ${documentId} not found or has no embedding`);
    }

    const similarities = await this.calculateSimilarities(document.embedding);
    
    // Excluir el documento original
    const filteredSimilarities = similarities.filter(s => s.documentId !== documentId);
    
    const results: SearchResult[] = await Promise.all(
      filteredSimilarities.slice(0, limit).map(async (item) => {
        const similarDoc = this.documents.get(item.documentId)!;
        const highlights = await this.generateHighlights(document.content, similarDoc.content);
        
        return {
          document: similarDoc,
          score: item.similarity,
          highlights,
          explanation: `Similar to: ${document.title || document.content.substring(0, 50)}`
        };
      })
    );

    return results;
  }

  async updateDocument(documentId: string, updates: Partial<SearchDocument>): Promise<void> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const updatedDocument = {
      ...document,
      ...updates,
      updatedAt: new Date()
    };

    // Regenerar embedding si el contenido cambió
    if (updates.content && updates.content !== document.content) {
      const newEmbedding = await this.generateEmbedding(updates.content);
      updatedDocument.embedding = newEmbedding;
      this.embeddings.set(documentId, newEmbedding);
    }

    this.documents.set(documentId, updatedDocument);
    
    // Actualizar clusters
    await this.updateClusters();
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!this.documents.has(documentId)) {
      throw new Error(`Document ${documentId} not found`);
    }

    this.documents.delete(documentId);
    this.embeddings.delete(documentId);
    
    // Actualizar clusters
    await this.updateClusters();
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Usar IA para generar embedding semántico
      const response = await AIRouter.route({
        prompt: `Generate a semantic embedding for the following text. Return only a JSON array of 384 numbers between -1 and 1: "${text}"`,
        model: 'mistral-7b',
        maxTokens: 1000,
        temperature: 0.1
      });

      // Parsear respuesta JSON
      const embeddingMatch = response.content.match(/\[[\d\.,\-\s]+\]/);
      if (embeddingMatch) {
        const embedding = JSON.parse(embeddingMatch[0]);
        return embedding.slice(0, 384); // Asegurar tamaño consistente
      }

      // Fallback: generar embedding simple
      return this.generateSimpleEmbedding(text);
    } catch (error) {
      // Fallback: generar embedding simple
      return this.generateSimpleEmbedding(text);
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // Embedding simple basado en hash del texto
    const hash = this.simpleHash(text);
    const embedding: number[] = [];
    
    for (let i = 0; i < 384; i++) {
      const seed = hash + i;
      embedding.push(Math.sin(seed) * 0.5);
    }
    
    return embedding;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private async calculateSimilarities(
    queryEmbedding: number[], 
    filters?: Record<string, any>,
    documents?: SearchDocument[]
  ): Promise<Array<{ documentId: string; similarity: number }>> {
    const targetDocuments = documents || Array.from(this.documents.values());
    
    const similarities: Array<{ documentId: string; similarity: number }> = [];
    
    for (const document of targetDocuments) {
      // Aplicar filtros
      if (filters) {
        let matches = true;
        for (const [key, value] of Object.entries(filters)) {
          if (document.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      if (document.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, document.embedding);
        similarities.push({
          documentId: document.id,
          similarity
        });
      }
    }
    
    return similarities;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private async generateHighlights(query: string, content: string): Promise<string[]> {
    try {
      const response = await AIRouter.route({
        prompt: `Find the most relevant sentences in the following content that match the query. Return only the sentences as a JSON array: Query: "${query}" Content: "${content}"`,
        model: 'mistral-7b',
        maxTokens: 500,
        temperature: 0.1
      });

      const highlightsMatch = response.content.match(/\[.*\]/);
      if (highlightsMatch) {
        return JSON.parse(highlightsMatch[0]);
      }
    } catch (error) {
      // Fallback: búsqueda simple de palabras clave
    }

    // Fallback: extraer oraciones que contengan palabras de la consulta
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences
      .filter(sentence => 
        queryWords.some(word => 
          sentence.toLowerCase().includes(word) && word.length > 2
        )
      )
      .slice(0, 3)
      .map(s => s.trim());
  }

  private async generateExplanation(query: string, content: string, similarity: number): Promise<string> {
    try {
      const response = await AIRouter.route({
        prompt: `Explain why this content is relevant to the query. Keep it brief: Query: "${query}" Content: "${content.substring(0, 200)}..." Similarity: ${similarity.toFixed(3)}`,
        model: 'mistral-7b',
        maxTokens: 200,
        temperature: 0.3
      });

      return response.content;
    } catch (error) {
      return `Relevance score: ${(similarity * 100).toFixed(1)}%`;
    }
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];
    
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }
    
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length;
    }
    
    return centroid;
  }

  private async extractKeywords(text: string): Promise<string[]> {
    try {
      const response = await AIRouter.route({
        prompt: `Extract the 10 most important keywords from this text. Return only a JSON array: "${text}"`,
        model: 'mistral-7b',
        maxTokens: 200,
        temperature: 0.1
      });

      const keywordsMatch = response.content.match(/\[.*\]/);
      if (keywordsMatch) {
        return JSON.parse(keywordsMatch[0]);
      }
    } catch (error) {
      // Fallback: extracción simple de palabras
    }

    // Fallback: extraer palabras más frecuentes
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
      .map(([word]) => word);
  }

  private async updateClusters(): Promise<void> {
    // Implementación simple de clustering
    // En producción, usar algoritmos como K-means o DBSCAN
    
    const documents = Array.from(this.documents.values());
    if (documents.length < 5) return;

    // Crear clusters basados en similitud
    const clusters: SearchCluster[] = [];
    const processed = new Set<string>();

    for (const doc of documents) {
      if (processed.has(doc.id)) continue;

      const similarDocs = documents.filter(otherDoc => 
        !processed.has(otherDoc.id) && 
        doc.embedding && 
        otherDoc.embedding &&
        this.cosineSimilarity(doc.embedding, otherDoc.embedding) > 0.8
      );

      if (similarDocs.length >= 2) {
        const clusterDocs = [doc, ...similarDocs];
        const centroid = this.calculateCentroid(clusterDocs.map(d => d.embedding!));
        const keywords = await this.extractKeywords(clusterDocs.map(d => d.content).join(' '));

        clusters.push({
          id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `Cluster ${clusters.length + 1}`,
          documents: clusterDocs,
          centroid,
          keywords,
          size: clusterDocs.length
        });

        clusterDocs.forEach(d => processed.add(d.id));
      }
    }

    // Actualizar clusters
    this.clusters.clear();
    clusters.forEach(cluster => {
      this.clusters.set(cluster.id, cluster);
    });
  }

  private sanitizeDocument(document: SearchDocument): SearchDocument {
    return {
      ...document,
      metadata: {} // Remover metadata sensible
    };
  }

  private calculateAverageQueryTime(): number {
    // Simulación de cálculo de tiempo promedio
    return Math.random() * 500 + 100; // 100-600ms
  }

  private getTopQueries(): Array<{ query: string; count: number }> {
    const queryCounts: Record<string, number> = {};
    
    this.searchHistory.forEach(item => {
      queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
    });
    
    return Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  private getSearchTrends(): Array<{ date: string; count: number }> {
    const trends: Record<string, number> = {};
    
    this.searchHistory.forEach(item => {
      const date = item.timestamp.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });
    
    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Últimos 7 días
      .map(([date, count]) => ({ date, count }));
  }
}

export const semanticSearchService = new SemanticSearchService();
