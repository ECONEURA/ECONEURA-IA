import { UserInteraction, BusinessAction } from './autonomous-agent';

export interface LearningConfig {
  agentId: string;
  learningRate: number;
  domains: string[];
}

export interface PredictionResult {
  confidence: number;
  expectedOutcome: any;
  alternatives: any[];
  reasoning: string;
}

/**
 * Modelo de Aprendizaje Continuo para Agentes IA
 * Implementa algoritmos de machine learning para aprender de interacciones
 */
export class LearningModel {
  private config: LearningConfig;
  private knowledgeBase: Map<string, any> = new Map();
  private patternDatabase: Map<string, PatternData> = new Map();
  private isTrained: boolean = false;

  constructor(config: LearningConfig) {
    this.config = config;
  }

  /**
   * Entrena el modelo con una nueva interacción
   */
  async train(interaction: UserInteraction): Promise<void> {
    const patternKey = this.generatePatternKey(interaction);

    // Actualizar base de conocimiento
    const existingPattern = this.patternDatabase.get(patternKey) || {
      count: 0,
      successes: 0,
      failures: 0,
      avgFeedback: 0,
      lastSeen: new Date(),
      contextPatterns: new Map()
    };

    existingPattern.count++;
    existingPattern.lastSeen = interaction.timestamp;

    if (interaction.outcome === 'success') {
      existingPattern.successes++;
    } else {
      existingPattern.failures++;
    }

    if (interaction.feedback !== undefined) {
      existingPattern.avgFeedback =
        (existingPattern.avgFeedback * (existingPattern.count - 1) + interaction.feedback) / existingPattern.count;
    }

    // Aprender de contexto
    this.learnFromContext(interaction, existingPattern);

    this.patternDatabase.set(patternKey, existingPattern);
    this.isTrained = true;
  }

  /**
   * Genera predicciones basadas en acciones de negocio
   */
  async predict(action: BusinessAction): Promise<PredictionResult> {
    if (!this.isTrained) {
      return {
        confidence: 0.5,
        expectedOutcome: null,
        alternatives: [],
        reasoning: 'Modelo no entrenado aún'
      };
    }

    const relevantPatterns = this.findRelevantPatterns(action);
    const prediction = this.calculatePrediction(action, relevantPatterns);

    return prediction;
  }

  /**
   * Carga el modelo desde almacenamiento persistente
   */
  async load(): Promise<void> {
    try {
      // Aquí se implementaría la carga desde base de datos o archivo
      // Por ahora, mantenemos en memoria
      console.log(`Cargando modelo para agente ${this.config.agentId}`);
    } catch (error) {
      console.warn(`No se pudo cargar modelo para agente ${this.config.agentId}:`, error);
    }
  }

  /**
   * Guarda el modelo en almacenamiento persistente
   */
  async save(): Promise<void> {
    try {
      // Aquí se implementaría el guardado en base de datos o archivo
      // Por ahora, mantenemos en memoria
      console.log(`Guardando modelo para agente ${this.config.agentId}`);
    } catch (error) {
      console.error(`Error guardando modelo para agente ${this.config.agentId}:`, error);
    }
  }

  /**
   * Analiza patrones en interacciones recientes
   */
  async analyzePatterns(interactions: UserInteraction[]): Promise<any[]> {
    const patterns = [];

    // Análisis de frecuencia de acciones
    const actionFrequency = this.calculateActionFrequency(interactions);

    // Análisis de secuencias de acciones
    const sequences = this.findActionSequences(interactions);

    // Análisis de correlaciones
    const correlations = this.findCorrelations(interactions);

    patterns.push({
      type: 'frequency',
      data: actionFrequency
    });

    patterns.push({
      type: 'sequences',
      data: sequences
    });

    patterns.push({
      type: 'correlations',
      data: correlations
    });

    return patterns;
  }

  /**
   * Obtiene métricas del modelo de aprendizaje
   */
  getMetrics(): Record<string, any> {
    const totalPatterns = this.patternDatabase.size;
    const avgSuccessRate = Array.from(this.patternDatabase.values())
      .reduce((sum, pattern) => sum + (pattern.successes / pattern.count), 0) / totalPatterns;

    return {
      totalPatterns,
      avgSuccessRate: avgSuccessRate || 0,
      isTrained: this.isTrained,
      learningRate: this.config.learningRate,
      domains: this.config.domains
    };
  }

  private generatePatternKey(interaction: UserInteraction): string {
    const contextHash = this.hashContext(interaction.context);
    return `${interaction.action}_${contextHash}`;
  }

  private hashContext(context: Record<string, any>): string {
    // Simple hash function para contexto
    const str = JSON.stringify(context);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32 bits
    }
    return Math.abs(hash).toString(36);
  }

  private learnFromContext(interaction: UserInteraction, pattern: PatternData): void {
    const contextKey = this.hashContext(interaction.context);
    const existingContext = pattern.contextPatterns.get(contextKey) || {
      count: 0,
      outcomes: { success: 0, failure: 0, partial: 0 }
    };

    existingContext.count++;
    existingContext.outcomes[interaction.outcome]++;

    pattern.contextPatterns.set(contextKey, existingContext);
  }

  private findRelevantPatterns(action: BusinessAction): PatternData[] {
    const relevantPatterns: PatternData[] = [];

    for (const [key, pattern] of this.patternDatabase) {
      if (key.startsWith(action.type)) {
        relevantPatterns.push(pattern);
      }
    }

    return relevantPatterns;
  }

  private calculatePrediction(action: BusinessAction, patterns: PatternData[]): PredictionResult {
    if (patterns.length === 0) {
      return {
        confidence: 0.5,
        expectedOutcome: null,
        alternatives: [],
        reasoning: 'No hay patrones relevantes'
      };
    }

    // Calcular tasa de éxito promedio
    const avgSuccessRate = patterns.reduce((sum, pattern) =>
      sum + (pattern.successes / pattern.count), 0) / patterns.length;

    // Calcular confianza basada en cantidad de datos
    const totalSamples = patterns.reduce((sum, pattern) => sum + pattern.count, 0);
    const confidence = Math.min(totalSamples / 100, 1) * avgSuccessRate;

    return {
      confidence,
      expectedOutcome: avgSuccessRate > 0.7 ? 'success' : 'failure',
      alternatives: ['success', 'failure', 'partial'],
      reasoning: `Basado en ${totalSamples} muestras con tasa de éxito ${Math.round(avgSuccessRate * 100)}%`
    };
  }

  private calculateActionFrequency(interactions: UserInteraction[]): Record<string, number> {
    return interactions.reduce((freq, interaction) => {
      freq[interaction.action] = (freq[interaction.action] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);
  }

  private findActionSequences(interactions: UserInteraction[]): any[] {
    const sequences: any[] = [];
    const sortedInteractions = interactions.sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime());

    for (let i = 0; i < sortedInteractions.length - 1; i++) {
      const current = sortedInteractions[i];
      const next = sortedInteractions[i + 1];

      if (next.timestamp.getTime() - current.timestamp.getTime() < 300000) { // 5 minutos
        sequences.push({
          from: current.action,
          to: next.action,
          timeGap: next.timestamp.getTime() - current.timestamp.getTime()
        });
      }
    }

    return sequences;
  }

  private findCorrelations(interactions: UserInteraction[]): any[] {
    const correlations: any[] = [];
    const contextKeys = new Set<string>();

    // Extraer todas las claves de contexto
    interactions.forEach(interaction => {
      Object.keys(interaction.context).forEach(key => contextKeys.add(key));
    });

    // Calcular correlaciones básicas
    for (const key of contextKeys) {
      const successContexts = interactions
        .filter(i => i.outcome === 'success' && i.context[key] !== undefined)
        .length;

      const totalContexts = interactions
        .filter(i => i.context[key] !== undefined)
        .length;

      if (totalContexts > 5) {
        const correlation = successContexts / totalContexts;
        correlations.push({
          contextKey: key,
          successCorrelation: correlation,
          sampleSize: totalContexts
        });
      }
    }

    return correlations;
  }
}

interface PatternData {
  count: number;
  successes: number;
  failures: number;
  avgFeedback: number;
  lastSeen: Date;
  contextPatterns: Map<string, ContextPattern>;
}

interface ContextPattern {
  count: number;
  outcomes: Record<string, number>;
}
