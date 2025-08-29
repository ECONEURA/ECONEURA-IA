import { AIRouter } from '@econeura/shared';

export interface BusinessProcess {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'operations' | 'finance' | 'hr' | 'customer_service' | 'custom';
  steps: ProcessStep[];
  metrics: ProcessMetric[];
  currentEfficiency: number;
  targetEfficiency: number;
  status: 'active' | 'optimizing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  optimizationHistory: OptimizationRecord[];
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'decision' | 'approval' | 'notification';
  duration: number; // minutes
  cost: number; // euros
  resources: string[];
  dependencies: string[]; // step IDs
  automationPotential: number; // 0-1
  bottlenecks: string[];
}

export interface ProcessMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface OptimizationRecord {
  id: string;
  timestamp: Date;
  type: 'automation' | 'reorganization' | 'resource_allocation' | 'elimination';
  description: string;
  impact: {
    efficiency: number;
    cost: number;
    time: number;
  };
  status: 'proposed' | 'implemented' | 'rejected';
  aiConfidence: number;
}

export interface OptimizationRecommendation {
  id: string;
  processId: string;
  type: 'automation' | 'reorganization' | 'resource_allocation' | 'elimination';
  title: string;
  description: string;
  expectedImpact: {
    efficiency: number;
    cost: number;
    time: number;
    roi: number;
  };
  implementation: {
    difficulty: 'low' | 'medium' | 'high';
    duration: number; // days
    cost: number;
    resources: string[];
  };
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  aiReasoning: string;
}

export interface ProcessAnalytics {
  totalProcesses: number;
  averageEfficiency: number;
  totalOptimizations: number;
  averageROI: number;
  topBottlenecks: string[];
  automationOpportunities: number;
}

class BusinessProcessOptimizationService {
  private processes: Map<string, BusinessProcess> = new Map();
  private recommendations: Map<string, OptimizationRecommendation> = new Map();
  private optimizationHistory: OptimizationRecord[] = [];

  async createProcess(process: Omit<BusinessProcess, 'id' | 'createdAt' | 'updatedAt' | 'optimizationHistory'>): Promise<BusinessProcess> {
    try {
      const id = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newProcess: BusinessProcess = {
        ...process,
        id,
        createdAt: now,
        updatedAt: now,
        optimizationHistory: []
      };

      this.processes.set(id, newProcess);
      
      // Analizar proceso inicialmente
      await this.analyzeProcess(newProcess);
      
      return newProcess;
    } catch (error) {
      throw error;
    }
  }

  async analyzeProcess(process: BusinessProcess): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];
      
      // Analizar cada paso del proceso
      for (const step of process.steps) {
        const stepRecommendations = await this.analyzeStep(step, process);
        recommendations.push(...stepRecommendations);
      }
      
      // Analizar el proceso completo
      const processRecommendations = await this.analyzeProcessFlow(process);
      recommendations.push(...processRecommendations);
      
      // Calcular eficiencia actual
      const currentEfficiency = this.calculateProcessEfficiency(process);
      process.currentEfficiency = currentEfficiency;
      process.updatedAt = new Date();
      
      this.processes.set(process.id, process);
      
      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  async getOptimizationRecommendations(processId: string): Promise<OptimizationRecommendation[]> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    return Array.from(this.recommendations.values())
      .filter(rec => rec.processId === processId)
      .sort((a, b) => b.priority.localeCompare(a.priority));
  }

  async implementRecommendation(recommendationId: string): Promise<OptimizationRecord> {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    const process = this.processes.get(recommendation.processId);
    if (!process) {
      throw new Error(`Process ${recommendation.processId} not found`);
    }

    try {
      // Implementar la optimización
      const optimizationRecord = await this.implementOptimization(process, recommendation);
      
      // Actualizar proceso
      process.optimizationHistory.push(optimizationRecord);
      process.updatedAt = new Date();
      
      this.processes.set(process.id, process);
      
      return optimizationRecord;
    } catch (error) {
      throw error;
    }
  }

  async getProcess(processId: string): Promise<BusinessProcess | null> {
    return this.processes.get(processId) || null;
  }

  async listProcesses(): Promise<BusinessProcess[]> {
    return Array.from(this.processes.values());
  }

  async updateProcess(processId: string, updates: Partial<BusinessProcess>): Promise<BusinessProcess> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    const updatedProcess = {
      ...process,
      ...updates,
      updatedAt: new Date()
    };

    this.processes.set(processId, updatedProcess);
    
    // Re-analizar proceso si se actualizaron los pasos
    if (updates.steps) {
      await this.analyzeProcess(updatedProcess);
    }

    return updatedProcess;
  }

  async deleteProcess(processId: string): Promise<void> {
    if (!this.processes.has(processId)) {
      throw new Error(`Process ${processId} not found`);
    }

    this.processes.delete(processId);
    
    // Limpiar recomendaciones relacionadas
    const processRecommendations = Array.from(this.recommendations.values())
      .filter(rec => rec.processId === processId);
    
    processRecommendations.forEach(rec => {
      this.recommendations.delete(rec.id);
    });
  }

  async getProcessAnalytics(): Promise<ProcessAnalytics> {
    const processes = Array.from(this.processes.values());
    const totalProcesses = processes.length;
    
    const averageEfficiency = processes.length > 0 
      ? processes.reduce((sum, p) => sum + p.currentEfficiency, 0) / processes.length
      : 0;
    
    const totalOptimizations = this.optimizationHistory.length;
    
    const averageROI = this.calculateAverageROI();
    
    const topBottlenecks = this.identifyTopBottlenecks();
    
    const automationOpportunities = this.countAutomationOpportunities();

    return {
      totalProcesses,
      averageEfficiency,
      totalOptimizations,
      averageROI,
      topBottlenecks,
      automationOpportunities
    };
  }

  async compareProcesses(processIds: string[]): Promise<any> {
    const processes = processIds
      .map(id => this.processes.get(id))
      .filter(p => p !== undefined) as BusinessProcess[];

    if (processes.length < 2) {
      throw new Error('At least 2 processes are required for comparison');
    }

    const comparison = {
      efficiency: processes.map(p => ({ id: p.id, name: p.name, efficiency: p.currentEfficiency })),
      cost: processes.map(p => ({ id: p.id, name: p.name, cost: this.calculateProcessCost(p) })),
      duration: processes.map(p => ({ id: p.id, name: p.name, duration: this.calculateProcessDuration(p) })),
      automationPotential: processes.map(p => ({ id: p.id, name: p.name, potential: this.calculateAutomationPotential(p) }))
    };

    return comparison;
  }

  async generateProcessReport(processId: string): Promise<any> {
    const process = this.processes.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    const recommendations = await this.getOptimizationRecommendations(processId);
    const analytics = await this.getProcessAnalytics();

    return {
      process,
      recommendations,
      analytics,
      report: {
        generatedAt: new Date(),
        summary: await this.generateProcessSummary(process),
        insights: await this.generateProcessInsights(process),
        nextSteps: this.generateNextSteps(process, recommendations)
      }
    };
  }

  private async analyzeStep(step: ProcessStep, process: BusinessProcess): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analizar potencial de automatización
    if (step.automationPotential > 0.7) {
      const automationRec = await this.createAutomationRecommendation(step, process);
      recommendations.push(automationRec);
    }

    // Analizar cuellos de botella
    if (step.duration > 60) { // Más de 1 hora
      const bottleneckRec = await this.createBottleneckRecommendation(step, process);
      recommendations.push(bottleneckRec);
    }

    // Analizar costos
    if (step.cost > 100) { // Más de 100€
      const costRec = await this.createCostOptimizationRecommendation(step, process);
      recommendations.push(costRec);
    }

    return recommendations;
  }

  private async analyzeProcessFlow(process: BusinessProcess): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Analizar dependencias y secuencia
    const flowRecommendations = await this.analyzeProcessFlowOptimization(process);
    recommendations.push(...flowRecommendations);

    // Analizar recursos
    const resourceRecommendations = await this.analyzeResourceOptimization(process);
    recommendations.push(...resourceRecommendations);

    return recommendations;
  }

  private async createAutomationRecommendation(step: ProcessStep, process: BusinessProcess): Promise<OptimizationRecommendation> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const expectedImpact = {
      efficiency: step.automationPotential * 0.3,
      cost: step.cost * 0.6, // 60% reducción de costos
      time: step.duration * 0.8, // 80% reducción de tiempo
      roi: (step.cost * 0.6) / (step.cost * 0.1) // ROI basado en costo de implementación
    };

    const implementation = {
      difficulty: step.automationPotential > 0.9 ? 'low' : step.automationPotential > 0.7 ? 'medium' : 'high',
      duration: Math.ceil(step.automationPotential * 30), // 1-30 días
      cost: step.cost * 0.1, // 10% del costo actual
      resources: ['developer', 'automation_tool']
    };

    return {
      id,
      processId: process.id,
      type: 'automation',
      title: `Automate ${step.name}`,
      description: `Automate the ${step.name} step to reduce manual work and improve efficiency.`,
      expectedImpact,
      implementation,
      confidence: step.automationPotential,
      priority: expectedImpact.roi > 5 ? 'high' : expectedImpact.roi > 2 ? 'medium' : 'low',
      aiReasoning: `High automation potential (${(step.automationPotential * 100).toFixed(1)}%) with significant efficiency gains.`
    };
  }

  private async createBottleneckRecommendation(step: ProcessStep, process: BusinessProcess): Promise<OptimizationRecommendation> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const expectedImpact = {
      efficiency: 0.25,
      cost: step.cost * 0.2,
      time: step.duration * 0.5,
      roi: 3.0
    };

    const implementation = {
      difficulty: 'medium',
      duration: 15,
      cost: step.cost * 0.2,
      resources: ['process_analyst', 'workflow_tool']
    };

    return {
      id,
      processId: process.id,
      type: 'reorganization',
      title: `Optimize ${step.name} - Bottleneck Resolution`,
      description: `The ${step.name} step is taking too long (${step.duration} minutes). Reorganize to reduce processing time.`,
      expectedImpact,
      implementation,
      confidence: 0.8,
      priority: 'high',
      aiReasoning: `Step duration (${step.duration} minutes) exceeds optimal threshold. Reorganization can reduce time by ~50%.`
    };
  }

  private async createCostOptimizationRecommendation(step: ProcessStep, process: BusinessProcess): Promise<OptimizationRecommendation> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const expectedImpact = {
      efficiency: 0.15,
      cost: step.cost * 0.4,
      time: step.duration * 0.1,
      roi: 2.5
    };

    const implementation = {
      difficulty: 'low',
      duration: 7,
      cost: step.cost * 0.1,
      resources: ['cost_analyst']
    };

    return {
      id,
      processId: process.id,
      type: 'resource_allocation',
      title: `Optimize Costs for ${step.name}`,
      description: `Reduce costs for the ${step.name} step through better resource allocation.`,
      expectedImpact,
      implementation,
      confidence: 0.7,
      priority: 'medium',
      aiReasoning: `High cost step (€${step.cost}) with potential for 40% cost reduction through optimization.`
    };
  }

  private async analyzeProcessFlowOptimization(process: BusinessProcess): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analizar secuencia de pasos
    const steps = process.steps;
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];
      
      // Verificar si hay dependencias innecesarias
      if (nextStep.dependencies.includes(currentStep.id) && !this.isDependencyRequired(currentStep, nextStep)) {
        const rec = await this.createFlowOptimizationRecommendation(currentStep, nextStep, process);
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  private async analyzeResourceOptimization(process: BusinessProcess): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analizar recursos compartidos
    const resourceUsage = this.analyzeResourceUsage(process);
    
    for (const [resource, usage] of Object.entries(resourceUsage)) {
      if (usage.count > 3) { // Recurso usado en más de 3 pasos
        const rec = await this.createResourceOptimizationRecommendation(resource, usage, process);
        recommendations.push(rec);
      }
    }

    return recommendations;
  }

  private async createFlowOptimizationRecommendation(step1: ProcessStep, step2: ProcessStep, process: BusinessProcess): Promise<OptimizationRecommendation> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      processId: process.id,
      type: 'reorganization',
      title: `Optimize Flow: ${step1.name} → ${step2.name}`,
      description: `Remove unnecessary dependency between ${step1.name} and ${step2.name} to improve process flow.`,
      expectedImpact: {
        efficiency: 0.1,
        cost: 0,
        time: (step1.duration + step2.duration) * 0.1,
        roi: 1.5
      },
      implementation: {
        difficulty: 'low',
        duration: 3,
        cost: 0,
        resources: ['process_analyst']
      },
      confidence: 0.6,
      priority: 'low',
      aiReasoning: `Unnecessary dependency detected. Removing it can improve parallel processing.`
    };
  }

  private async createResourceOptimizationRecommendation(resource: string, usage: any, process: BusinessProcess): Promise<OptimizationRecommendation> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      processId: process.id,
      type: 'resource_allocation',
      title: `Optimize ${resource} Usage`,
      description: `Optimize the usage of ${resource} across ${usage.count} process steps.`,
      expectedImpact: {
        efficiency: 0.2,
        cost: usage.totalCost * 0.3,
        time: usage.totalDuration * 0.15,
        roi: 2.0
      },
      implementation: {
        difficulty: 'medium',
        duration: 10,
        cost: usage.totalCost * 0.1,
        resources: ['resource_analyst']
      },
      confidence: 0.7,
      priority: 'medium',
      aiReasoning: `Resource ${resource} used in ${usage.count} steps. Optimization can reduce costs by ~30%.`
    };
  }

  private async implementOptimization(process: BusinessProcess, recommendation: OptimizationRecommendation): Promise<OptimizationRecord> {
    const id = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const optimizationRecord: OptimizationRecord = {
      id,
      timestamp: new Date(),
      type: recommendation.type,
      description: recommendation.description,
      impact: recommendation.expectedImpact,
      status: 'implemented',
      aiConfidence: recommendation.confidence
    };

    // Actualizar proceso según el tipo de optimización
    await this.applyOptimizationToProcess(process, recommendation);

    this.optimizationHistory.push(optimizationRecord);
    return optimizationRecord;
  }

  private async applyOptimizationToProcess(process: BusinessProcess, recommendation: OptimizationRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'automation':
        // Marcar paso como automatizado
        const step = process.steps.find(s => s.name === recommendation.title.replace('Automate ', ''));
        if (step) {
          step.type = 'automated';
          step.duration = step.duration * 0.2; // 80% reducción
          step.cost = step.cost * 0.4; // 60% reducción
        }
        break;
      case 'reorganization':
        // Reorganizar pasos
        process.steps.sort((a, b) => a.duration - b.duration); // Ordenar por duración
        break;
      case 'resource_allocation':
        // Optimizar recursos
        process.steps.forEach(step => {
          if (step.resources.length > 2) {
            step.resources = step.resources.slice(0, 2); // Reducir recursos
          }
        });
        break;
      case 'elimination':
        // Eliminar pasos innecesarios
        process.steps = process.steps.filter(step => 
          !recommendation.description.toLowerCase().includes(step.name.toLowerCase())
        );
        break;
    }

    // Recalcular eficiencia
    process.currentEfficiency = this.calculateProcessEfficiency(process);
  }

  private calculateProcessEfficiency(process: BusinessProcess): number {
    const totalDuration = process.steps.reduce((sum, step) => sum + step.duration, 0);
    const totalCost = process.steps.reduce((sum, step) => sum + step.cost, 0);
    
    // Eficiencia basada en duración y costo
    const durationEfficiency = Math.max(0, 1 - (totalDuration / 1000)); // Normalizar a 1000 minutos
    const costEfficiency = Math.max(0, 1 - (totalCost / 10000)); // Normalizar a 10000€
    
    return (durationEfficiency + costEfficiency) / 2;
  }

  private calculateProcessCost(process: BusinessProcess): number {
    return process.steps.reduce((sum, step) => sum + step.cost, 0);
  }

  private calculateProcessDuration(process: BusinessProcess): number {
    return process.steps.reduce((sum, step) => sum + step.duration, 0);
  }

  private calculateAutomationPotential(process: BusinessProcess): number {
    const automationScores = process.steps.map(step => step.automationPotential);
    return automationScores.reduce((sum, score) => sum + score, 0) / automationScores.length;
  }

  private isDependencyRequired(step1: ProcessStep, step2: ProcessStep): boolean {
    // Lógica simple: dependencia requerida si comparten recursos
    const sharedResources = step1.resources.filter(r => step2.resources.includes(r));
    return sharedResources.length > 0;
  }

  private analyzeResourceUsage(process: BusinessProcess): Record<string, any> {
    const resourceUsage: Record<string, any> = {};
    
    process.steps.forEach(step => {
      step.resources.forEach(resource => {
        if (!resourceUsage[resource]) {
          resourceUsage[resource] = { count: 0, totalCost: 0, totalDuration: 0 };
        }
        resourceUsage[resource].count++;
        resourceUsage[resource].totalCost += step.cost;
        resourceUsage[resource].totalDuration += step.duration;
      });
    });
    
    return resourceUsage;
  }

  private calculateAverageROI(): number {
    if (this.optimizationHistory.length === 0) return 0;
    
    const rois = this.optimizationHistory.map(opt => opt.impact.efficiency);
    return rois.reduce((sum, roi) => sum + roi, 0) / rois.length;
  }

  private identifyTopBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    Array.from(this.processes.values()).forEach(process => {
      process.steps.forEach(step => {
        if (step.duration > 60) {
          bottlenecks.push(`${process.name} - ${step.name}`);
        }
      });
    });
    
    return bottlenecks.slice(0, 5);
  }

  private countAutomationOpportunities(): number {
    let count = 0;
    
    Array.from(this.processes.values()).forEach(process => {
      process.steps.forEach(step => {
        if (step.automationPotential > 0.7) {
          count++;
        }
      });
    });
    
    return count;
  }

  private async generateProcessSummary(process: BusinessProcess): Promise<string> {
    try {
      const summary = `Process: ${process.name}
Steps: ${process.steps.length}
Current Efficiency: ${(process.currentEfficiency * 100).toFixed(1)}%
Target Efficiency: ${(process.targetEfficiency * 100).toFixed(1)}%
Total Duration: ${this.calculateProcessDuration(process)} minutes
Total Cost: €${this.calculateProcessCost(process)}`;

      return summary;
    } catch (error) {
      return 'Process summary unavailable';
    }
  }

  private async generateProcessInsights(process: BusinessProcess): Promise<string[]> {
    const insights: string[] = [];
    
    // Análisis de duración
    const avgDuration = this.calculateProcessDuration(process) / process.steps.length;
    if (avgDuration > 30) {
      insights.push(`Average step duration (${avgDuration.toFixed(1)} minutes) is high. Consider optimization.`);
    }
    
    // Análisis de costos
    const avgCost = this.calculateProcessCost(process) / process.steps.length;
    if (avgCost > 50) {
      insights.push(`Average step cost (€${avgCost.toFixed(1)}) is high. Look for cost reduction opportunities.`);
    }
    
    // Análisis de automatización
    const automationPotential = this.calculateAutomationPotential(process);
    if (automationPotential > 0.6) {
      insights.push(`High automation potential (${(automationPotential * 100).toFixed(1)}%). Consider automation initiatives.`);
    }
    
    return insights;
  }

  private generateNextSteps(process: BusinessProcess, recommendations: OptimizationRecommendation[]): string[] {
    const nextSteps: string[] = [];
    
    if (process.currentEfficiency < process.targetEfficiency) {
      nextSteps.push('Focus on efficiency improvements to reach target.');
    }
    
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');
    if (highPriorityRecs.length > 0) {
      nextSteps.push(`Implement ${highPriorityRecs.length} high-priority optimizations.`);
    }
    
    const automationRecs = recommendations.filter(r => r.type === 'automation');
    if (automationRecs.length > 0) {
      nextSteps.push(`Evaluate ${automationRecs.length} automation opportunities.`);
    }
    
    return nextSteps;
  }
}

export const businessProcessOptimizationService = new BusinessProcessOptimizationService();
