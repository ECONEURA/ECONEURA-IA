// packages/shared/src/ai/agents/learning/learning-engine.ts
import { LearningEvent, BusinessAction, Prediction, AgentContext, LearningModel } from '../types';

export class LearningEngine implements LearningModel {
  private knowledgeBase: Map<string, KnowledgeNode> = new Map();
  private patternRecognizer: PatternRecognizer;
  private adaptationEngine: AdaptationEngine;

  constructor() {
    this.patternRecognizer = new PatternRecognizer();
    this.adaptationEngine = new AdaptationEngine();
  }

  async train(event: LearningEvent): Promise<void> {
    // Extraer patrones del evento
    const patterns = await this.patternRecognizer.extractPatterns(event);

    // Actualizar base de conocimientos
    for (const pattern of patterns) {
      const key = this.generatePatternKey(pattern);
      const existing = this.knowledgeBase.get(key);

      if (existing) {
        existing.updateWithEvent(event);
      } else {
        this.knowledgeBase.set(key, new KnowledgeNode(pattern, event));
      }
    }

    // Limpiar conocimientos obsoletos
    this.cleanupObsoleteKnowledge();
  }

  async predict(action: BusinessAction): Promise<Prediction> {
    // Buscar patrones similares en la base de conocimientos
    const similarPatterns = await this.findSimilarPatterns(action);

    if (similarPatterns.length === 0) {
      return {
        type: 'unknown',
        confidence: 0,
        value: null,
        reasoning: 'No hay patrones similares en la base de conocimientos',
        timeframe: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      };
    }

    // Calcular predicción basada en patrones similares
    const prediction = await this.calculatePrediction(action, similarPatterns);

    return prediction;
  }

  async getConfidence(action: BusinessAction): Promise<number> {
    const similarPatterns = await this.findSimilarPatterns(action);

    if (similarPatterns.length === 0) {
      return 0;
    }

    // Calcular confianza basada en la calidad y cantidad de patrones similares
    const confidence = this.calculateConfidence(similarPatterns);
    return Math.min(confidence, 1.0);
  }

  async adapt(context: AgentContext): Promise<AgentContext> {
    // Analizar rendimiento del agente
    const performanceAnalysis = await this.analyzePerformance(context);

    // Identificar áreas de mejora
    const improvements = await this.identifyImprovements(performanceAnalysis);

    // Aplicar adaptaciones
    const adaptedContext = await this.adaptationEngine.applyAdaptations(context, improvements);

    return adaptedContext;
  }

  private async findSimilarPatterns(action: BusinessAction): Promise<KnowledgeNode[]> {
    const similar: KnowledgeNode[] = [];

    for (const [key, node] of this.knowledgeBase) {
      const similarity = await this.calculateSimilarity(action, node.pattern);
      if (similarity > 0.7) { // Umbral de similitud
        similar.push(node);
      }
    }

    // Ordenar por relevancia
    similar.sort((a, b) => b.relevance - a.relevance);

    return similar.slice(0, 10); // Top 10
  }

  private async calculateSimilarity(action: BusinessAction, pattern: any): Promise<number> {
    // Implementar cálculo de similitud basado en:
    // - Tipo de acción
    // - Datos de la acción
    // - Contexto histórico
    // - Resultados previos

    let similarity = 0;

    if (action.type === pattern.actionType) {
      similarity += 0.4;
    }

    if (action.priority === pattern.priority) {
      similarity += 0.3;
    }

    // Calcular similitud de datos (simplificado)
    const dataSimilarity = this.calculateDataSimilarity(action.data, pattern.data);
    similarity += dataSimilarity * 0.3;

    return Math.min(similarity, 1.0);
  }

  private calculateDataSimilarity(data1: Record<string, any>, data2: Record<string, any>): number {
    const keys1 = Object.keys(data1);
    const keys2 = Object.keys(data2);

    if (keys1.length === 0 && keys2.length === 0) return 1.0;
    if (keys1.length === 0 || keys2.length === 0) return 0.0;

    const commonKeys = keys1.filter(key => keys2.includes(key));
    return commonKeys.length / Math.max(keys1.length, keys2.length);
  }

  private async calculatePrediction(action: BusinessAction, patterns: KnowledgeNode[]): Promise<Prediction> {
    // Agregar lógica de predicción basada en patrones
    const successRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;

    return {
      type: action.type,
      confidence: avgConfidence,
      value: { expectedSuccess: successRate > 0.7 },
      reasoning: `Basado en ${patterns.length} patrones similares con tasa de éxito del ${(successRate * 100).toFixed(1)}%`,
      timeframe: new Date(Date.now() + 60 * 60 * 1000) // 1 hora
    };
  }

  private calculateConfidence(patterns: KnowledgeNode[]): number {
    if (patterns.length === 0) return 0;

    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
    const weightedConfidence = patterns.reduce((sum, p) => sum + (p.confidence * p.weight), 0);

    return weightedConfidence / totalWeight;
  }

  private async analyzePerformance(context: AgentContext): Promise<PerformanceAnalysis> {
    const recentEvents = context.learningHistory.slice(-100);
    const successRate = recentEvents.filter(e => e.result === 'success').length / recentEvents.length;
    const avgFeedback = recentEvents.reduce((sum, e) => sum + e.feedback, 0) / recentEvents.length;

    return {
      successRate,
      avgFeedback,
      totalEvents: recentEvents.length,
      specialization: this.calculateSpecialization(context),
      adaptation: this.calculateAdaptationRate(context)
    };
  }

  private async identifyImprovements(analysis: PerformanceAnalysis): Promise<Improvement[]> {
    const improvements: Improvement[] = [];

    if (analysis.successRate < 0.7) {
      improvements.push({
        type: 'skill_improvement',
        metric: 'success_rate',
        currentValue: analysis.successRate,
        targetValue: 0.8,
        action: 'increase_training_frequency'
      });
    }

    if (analysis.avgFeedback < 0.3) {
      improvements.push({
        type: 'learning_optimization',
        metric: 'feedback_processing',
        currentValue: analysis.avgFeedback,
        targetValue: 0.5,
        action: 'improve_feedback_analysis'
      });
    }

    return improvements;
  }

  private calculateSpecialization(context: AgentContext): number {
    // Calcular qué tan especializado está el agente en su rol
    const roleEvents = context.learningHistory.filter(e => e.context.action?.type === context.role);
    return roleEvents.length / context.learningHistory.length;
  }

  private calculateAdaptationRate(context: AgentContext): number {
    // Calcular qué tan bien se adapta el agente a nuevos escenarios
    const recentEvents = context.learningHistory.slice(-50);
    const newPatterns = recentEvents.filter(e => e.result === 'success' && e.feedback > 0.5);
    return newPatterns.length / recentEvents.length;
  }

  private generatePatternKey(pattern: any): string {
    return `${pattern.actionType}_${pattern.priority}_${JSON.stringify(pattern.data).slice(0, 100)}`;
  }

  private cleanupObsoleteKnowledge(): void {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días

    for (const [key, node] of this.knowledgeBase) {
      if (node.lastUpdated < cutoffDate && node.usageCount < 5) {
        this.knowledgeBase.delete(key);
      }
    }
  }
}

class KnowledgeNode {
  pattern: any;
  events: LearningEvent[] = [];
  successRate: number = 0;
  confidence: number = 0;
  weight: number = 1;
  relevance: number = 0;
  lastUpdated: Date;
  usageCount: number = 0;

  constructor(pattern: any, initialEvent: LearningEvent) {
    this.pattern = pattern;
    this.events = [initialEvent];
    this.lastUpdated = new Date();
    this.updateMetrics();
  }

  updateWithEvent(event: LearningEvent): void {
    this.events.push(event);
    this.lastUpdated = new Date();
    this.usageCount++;
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const successCount = this.events.filter(e => e.result === 'success').length;
    this.successRate = successCount / this.events.length;

    const avgFeedback = this.events.reduce((sum, e) => sum + e.feedback, 0) / this.events.length;
    this.confidence = Math.max(0, Math.min(1, (avgFeedback + 1) / 2));

    // Calcular peso basado en recencia y frecuencia
    const recencyWeight = Math.exp(-(Date.now() - this.lastUpdated.getTime()) / (7 * 24 * 60 * 60 * 1000)); // 7 días
    const frequencyWeight = Math.min(this.usageCount / 10, 1);
    this.weight = (recencyWeight + frequencyWeight) / 2;

    this.relevance = this.successRate * this.confidence * this.weight;
  }
}

class PatternRecognizer {
  async extractPatterns(event: LearningEvent): Promise<any[]> {
    const patterns = [];

    // Extraer patrones del evento
    if (event.context.action) {
      patterns.push({
        actionType: event.context.action.type,
        priority: event.context.action.priority,
        data: event.context.action.data,
        result: event.result,
        feedback: event.feedback
      });
    }

    return patterns;
  }
}

class AdaptationEngine {
  async applyAdaptations(context: AgentContext, improvements: Improvement[]): Promise<AgentContext> {
    let adaptedContext = { ...context };

    for (const improvement of improvements) {
      switch (improvement.action) {
        case 'increase_training_frequency':
          adaptedContext.capabilities.push('high_frequency_training');
          break;
        case 'improve_feedback_analysis':
          adaptedContext.capabilities.push('advanced_feedback_processing');
          break;
      }
    }

    return adaptedContext;
  }
}

interface PerformanceAnalysis {
  successRate: number;
  avgFeedback: number;
  totalEvents: number;
  specialization: number;
  adaptation: number;
}

interface Improvement {
  type: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  action: string;
}