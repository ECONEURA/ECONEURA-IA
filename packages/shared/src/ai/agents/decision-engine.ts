import { BusinessAction } from './autonomous-agent';

export interface DecisionConfig {
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'fully-autonomous';
  confidenceThreshold: number;
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface DecisionContext {
  action: BusinessAction;
  prediction: any;
  autonomyLevel: 'supervised' | 'semi-autonomous' | 'fully-autonomous';
  historicalSuccessRate?: number;
  businessImpact?: 'low' | 'medium' | 'high' | 'critical';
  complianceRequirements?: string[];
  stakeholderApproval?: boolean;
}

export interface DecisionResult {
  canExecute: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string[];
  requiredApprovals: string[];
  alternatives: DecisionAlternative[];
}

export interface DecisionAlternative {
  action: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

/**
 * Motor de Decisiones Inteligente para Agentes IA
 * Evalúa cuándo un agente puede ejecutar acciones autónomamente
 */
export class DecisionEngine {
  private config: DecisionConfig;
  private decisionHistory: DecisionRecord[] = [];
  private riskModels: Map<string, RiskModel> = new Map();

  constructor(config: DecisionConfig) {
    this.config = config;
    this.initializeRiskModels();
  }

  /**
   * Evalúa si una acción puede ejecutarse autónomamente
   */
  async evaluate(context: DecisionContext): Promise<boolean> {
    const decision = await this.makeDecision(context);

    // Registrar la decisión para aprendizaje
    this.recordDecision(context, decision);

    return decision.canExecute;
  }

  /**
   * Toma una decisión completa sobre una acción
   */
  async makeDecision(context: DecisionContext): Promise<DecisionResult> {
    const reasoning: string[] = [];
    const requiredApprovals: string[] = [];

    // 1. Evaluar confianza de la predicción
    const predictionConfidence = this.evaluatePredictionConfidence(context.prediction);
    reasoning.push(`Confianza de predicción: ${Math.round(predictionConfidence * 100)}%`);

    // 2. Evaluar nivel de autonomía
    const autonomyScore = this.evaluateAutonomyLevel(context.autonomyLevel);
    reasoning.push(`Nivel de autonomía: ${context.autonomyLevel} (score: ${autonomyScore})`);

    // 3. Evaluar riesgo de la acción
    const riskAssessment = await this.assessRisk(context);
    reasoning.push(`Nivel de riesgo: ${riskAssessment.level}`);

    // 4. Evaluar impacto en el negocio
    const businessImpact = this.evaluateBusinessImpact(context);
    reasoning.push(`Impacto en negocio: ${businessImpact}`);

    // 5. Verificar requisitos de compliance
    const complianceCheck = this.checkComplianceRequirements(context);
    if (!complianceCheck.compliant) {
      requiredApprovals.push(...complianceCheck.requiredApprovals);
      reasoning.push(`Requisitos de compliance: ${complianceCheck.reasoning}`);
    }

    // 6. Evaluar aprobaciones de stakeholders
    if (context.stakeholderApproval === false) {
      requiredApprovals.push('stakeholder-approval');
      reasoning.push('Se requiere aprobación de stakeholder');
    }

    // 7. Calcular decisión final
    const finalConfidence = this.calculateFinalConfidence({
      predictionConfidence,
      autonomyScore,
      riskAssessment,
      businessImpact,
      complianceCheck
    });

    const canExecute = this.determineExecutionPermission({
      finalConfidence,
      riskAssessment,
      requiredApprovals,
      businessImpact
    });

    // 8. Generar alternativas
    const alternatives = this.generateAlternatives(context, riskAssessment);

    const decision: DecisionResult = {
      canExecute,
      confidence: finalConfidence,
      riskLevel: riskAssessment.level,
      reasoning,
      requiredApprovals,
      alternatives
    };

    return decision;
  }

  /**
   * Obtiene métricas de rendimiento del motor de decisiones
   */
  getMetrics(): Record<string, any> {
    const totalDecisions = this.decisionHistory.length;
    const autonomousDecisions = this.decisionHistory.filter(d => d.result.canExecute).length;
    const highRiskDecisions = this.decisionHistory.filter(d => d.result.riskLevel === 'high').length;

    const accuracy = totalDecisions > 0 ?
      this.decisionHistory.filter(d => d.wasCorrect !== undefined && d.wasCorrect).length / totalDecisions : 0;

    return {
      totalDecisions,
      autonomousDecisions,
      autonomyRate: totalDecisions > 0 ? autonomousDecisions / totalDecisions : 0,
      highRiskDecisions,
      accuracy,
      riskDistribution: this.calculateRiskDistribution(),
      decisionTrends: this.analyzeDecisionTrends()
    };
  }

  /**
   * Actualiza el resultado de una decisión previa (para aprendizaje)
   */
  updateDecisionOutcome(decisionId: string, wasCorrect: boolean, actualOutcome?: any): void {
    const decision = this.decisionHistory.find(d => d.id === decisionId);
    if (decision) {
      decision.wasCorrect = wasCorrect;
      decision.actualOutcome = actualOutcome;
      this.updateRiskModels(decision);
    }
  }

  private evaluatePredictionConfidence(prediction: any): number {
    if (!prediction || typeof prediction.confidence !== 'number') {
      return 0.5; // Confianza neutral por defecto
    }

    // Ajustar confianza basada en factores adicionales
    let adjustedConfidence = prediction.confidence;

    // Penalizar si hay incertidumbre alta
    if (prediction.uncertainty && prediction.uncertainty > 0.3) {
      adjustedConfidence *= 0.8;
    }

    // Bonus por consistencia histórica
    if (prediction.historicalAccuracy && prediction.historicalAccuracy > 0.8) {
      adjustedConfidence *= 1.1;
    }

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  private evaluateAutonomyLevel(level: 'supervised' | 'semi-autonomous' | 'fully-autonomous'): number {
    const scores = {
      'supervised': 0.3,
      'semi-autonomous': 0.7,
      'fully-autonomous': 1.0
    };

    return scores[level] || 0.5;
  }

  private async assessRisk(context: DecisionContext): Promise<RiskAssessment> {
    const riskModel = this.riskModels.get(context.action.type) || this.riskModels.get('default')!;

    const riskScore = await riskModel.calculateRisk(context);
    const riskLevel = this.classifyRiskLevel(riskScore);

    return {
      score: riskScore,
      level: riskLevel,
      factors: riskModel.getRiskFactors(context)
    };
  }

  private evaluateBusinessImpact(context: DecisionContext): 'low' | 'medium' | 'high' | 'critical' {
    // Evaluar impacto basado en el tipo de acción y datos
    const actionType = context.action.type;
    const data = context.action.data;

    if (actionType.includes('delete') || actionType.includes('remove')) {
      return 'high';
    }

    if (actionType.includes('financial') || data.amount > 10000) {
      return 'critical';
    }

    if (actionType.includes('user') || actionType.includes('customer')) {
      return 'medium';
    }

    return 'low';
  }

  private checkComplianceRequirements(context: DecisionContext): ComplianceCheck {
    const requirements = context.complianceRequirements || [];
    const requiredApprovals: string[] = [];

    let compliant = true;
    const reasoning: string[] = [];

    for (const requirement of requirements) {
      switch (requirement) {
        case 'gdpr':
          if (context.action.data.personalData) {
            requiredApprovals.push('dpo-approval');
            reasoning.push('Datos personales requieren aprobación DPO');
            compliant = false;
          }
          break;

        case 'pci':
          if (context.action.data.paymentInfo) {
            requiredApprovals.push('security-approval');
            reasoning.push('Información de pago requiere aprobación de seguridad');
            compliant = false;
          }
          break;

        case 'sox':
          if (context.businessImpact === 'critical') {
            requiredApprovals.push('audit-approval');
            reasoning.push('Impacto crítico requiere aprobación SOX');
            compliant = false;
          }
          break;
      }
    }

    return {
      compliant,
      requiredApprovals,
      reasoning: reasoning.join('; ')
    };
  }

  private calculateFinalConfidence(factors: {
    predictionConfidence: number;
    autonomyScore: number;
    riskAssessment: RiskAssessment;
    businessImpact: string;
    complianceCheck: ComplianceCheck;
  }): number {
    let confidence = factors.predictionConfidence;

    // Aplicar multiplicadores
    confidence *= factors.autonomyScore;

    // Penalizar por riesgo alto
    if (factors.riskAssessment.level === 'high') {
      confidence *= 0.7;
    } else if (factors.riskAssessment.level === 'critical') {
      confidence *= 0.5;
    }

    // Penalizar por impacto crítico
    if (factors.businessImpact === 'critical') {
      confidence *= 0.8;
    }

    // Penalizar por no cumplimiento
    if (!factors.complianceCheck.compliant) {
      confidence *= 0.6;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private determineExecutionPermission(params: {
    finalConfidence: number;
    riskAssessment: RiskAssessment;
    requiredApprovals: string[];
    businessImpact: string;
  }): boolean {
    // No ejecutar si hay aprobaciones requeridas
    if (params.requiredApprovals.length > 0) {
      return false;
    }

    // No ejecutar si el riesgo es crítico
    if (params.riskAssessment.level === 'critical') {
      return false;
    }

    // Verificar umbral de confianza
    if (params.finalConfidence < this.config.confidenceThreshold) {
      return false;
    }

    // Verificar tolerancia al riesgo
    if (this.config.riskTolerance === 'low' && params.riskAssessment.level !== 'low') {
      return false;
    }

    return true;
  }

  private generateAlternatives(context: DecisionContext, riskAssessment: RiskAssessment): DecisionAlternative[] {
    const alternatives: DecisionAlternative[] = [];

    // Alternativa conservadora
    alternatives.push({
      action: 'escalate-to-human',
      confidence: 1.0,
      riskLevel: 'low',
      description: 'Escalar a aprobación humana para minimizar riesgos'
    });

    // Alternativa con monitoreo
    if (riskAssessment.level !== 'critical') {
      alternatives.push({
        action: 'execute-with-monitoring',
        confidence: 0.9,
        riskLevel: 'medium',
        description: 'Ejecutar con monitoreo continuo y capacidad de rollback'
      });
    }

    // Alternativa de ejecución parcial
    if (context.action.data.partialExecution) {
      alternatives.push({
        action: 'partial-execution',
        confidence: 0.7,
        riskLevel: 'medium',
        description: 'Ejecutar parcialmente y requerir confirmación para el resto'
      });
    }

    return alternatives;
  }

  private recordDecision(context: DecisionContext, result: DecisionResult): void {
    const record: DecisionRecord = {
      id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      context,
      result,
      wasCorrect: undefined,
      actualOutcome: undefined
    };

    this.decisionHistory.push(record);

    // Mantener límite de historial
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory = this.decisionHistory.slice(-500);
    }
  }

  private initializeRiskModels(): void {
    // Modelo de riesgo por defecto
    this.riskModels.set('default', new DefaultRiskModel());

    // Modelos específicos por tipo de acción
    this.riskModels.set('financial', new FinancialRiskModel());
    this.riskModels.set('user-data', new UserDataRiskModel());
    this.riskModels.set('system-config', new SystemConfigRiskModel());
  }

  private classifyRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private calculateRiskDistribution(): Record<string, number> {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };

    this.decisionHistory.forEach(decision => {
      distribution[decision.result.riskLevel]++;
    });

    return distribution;
  }

  private analyzeDecisionTrends(): any[] {
    // Análisis básico de tendencias
    const recentDecisions = this.decisionHistory.slice(-50);
    const trends = [];

    if (recentDecisions.length >= 10) {
      const recentAutonomous = recentDecisions.filter(d => d.result.canExecute).length;
      const autonomyTrend = recentAutonomous / recentDecisions.length;

      trends.push({
        type: 'autonomy-trend',
        value: autonomyTrend,
        period: 'last-50-decisions'
      });
    }

    return trends;
  }

  private updateRiskModels(decision: DecisionRecord): void {
    if (decision.wasCorrect !== undefined) {
      const riskModel = this.riskModels.get(decision.context.action.type) || this.riskModels.get('default')!;
      riskModel.updateFromDecision(decision);
    }
  }
}

interface DecisionRecord {
  id: string;
  timestamp: Date;
  context: DecisionContext;
  result: DecisionResult;
  wasCorrect?: boolean;
  actualOutcome?: any;
}

interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

interface ComplianceCheck {
  compliant: boolean;
  requiredApprovals: string[];
  reasoning: string;
}

// Modelos de riesgo especializados
abstract class RiskModel {
  abstract calculateRisk(context: DecisionContext): Promise<number>;
  abstract getRiskFactors(context: DecisionContext): string[];
  abstract updateFromDecision(decision: DecisionRecord): void;
}

class DefaultRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    // Cálculo básico de riesgo por defecto
    let risk = 0.3; // Riesgo base

    if (context.businessImpact === 'critical') risk += 0.5;
    else if (context.businessImpact === 'high') risk += 0.3;
    else if (context.businessImpact === 'medium') risk += 0.1;

    if (context.prediction?.confidence < 0.7) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['business-impact', 'prediction-confidence'];
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Implementación básica de actualización
  }
}

class FinancialRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    let risk = 0.5; // Riesgo más alto para operaciones financieras

    const amount = context.action.data.amount || 0;
    if (amount > 100000) risk += 0.4;
    else if (amount > 10000) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['transaction-amount', 'financial-impact', 'regulatory-compliance'];
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Actualización específica para operaciones financieras
  }
}

class UserDataRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    let risk = 0.4; // Riesgo moderado para datos de usuario

    if (context.action.data.sensitiveData) risk += 0.3;
    if (context.complianceRequirements?.includes('gdpr')) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['data-sensitivity', 'gdpr-compliance', 'privacy-impact'];
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Actualización específica para operaciones con datos de usuario
  }
}

class SystemConfigRiskModel extends RiskModel {
  async calculateRisk(context: DecisionContext): Promise<number> {
    let risk = 0.6; // Riesgo alto para configuración del sistema

    if (context.action.data.systemCritical) risk += 0.3;
    if (context.action.data.rollbackAvailable === false) risk += 0.2;

    return Math.min(1, risk);
  }

  getRiskFactors(context: DecisionContext): string[] {
    return ['system-criticality', 'rollback-availability', 'downtime-potential'];
  }

  updateFromDecision(decision: DecisionRecord): void {
    // Actualización específica para operaciones de configuración
  }
}
