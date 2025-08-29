import { AIRouter } from '@econeura/shared';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'analytical' | 'executive' | 'custom';
  sections: ReportSection[];
  dataSources: string[];
  schedule?: string; // cron expression
  recipients: string[];
  format: 'pdf' | 'excel' | 'html' | 'json';
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'ai_insight';
  content: string;
  dataQuery?: string;
  chartConfig?: ChartConfig;
  aiPrompt?: string;
  order: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  xAxis: string;
  yAxis: string;
  colorBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportRequest {
  templateId: string;
  parameters: Record<string, any>;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'html' | 'json';
  includeAIInsights?: boolean;
  customSections?: ReportSection[];
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  content: any;
  format: string;
  generatedAt: Date;
  fileSize: number;
  downloadUrl: string;
  aiInsights: AIInsight[];
  metadata: Record<string, any>;
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'comparison';
  title: string;
  description: string;
  confidence: number;
  dataPoints: any[];
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportAnalytics {
  totalReports: number;
  totalTemplates: number;
  averageGenerationTime: number;
  popularTemplates: Array<{ templateId: string; name: string; usage: number }>;
  generationTrends: Array<{ date: string; count: number }>;
}

class IntelligentReportingService {
  private templates: Map<string, ReportTemplate> = new Map();
  private generatedReports: Map<string, GeneratedReport> = new Map();
  private reportHistory: Array<{ templateId: string; timestamp: Date; generationTime: number }> = [];

  async createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportTemplate> {
    try {
      const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newTemplate: ReportTemplate = {
        ...template,
        id,
        createdAt: now,
        updatedAt: now
      };

      this.templates.set(id, newTemplate);
      return newTemplate;
    } catch (error) {
      throw error;
    }
  }

  async generateReport(request: ReportRequest): Promise<GeneratedReport> {
    const startTime = Date.now();
    
    try {
      const template = this.templates.get(request.templateId);
      if (!template) {
        throw new Error(`Template ${request.templateId} not found`);
      }

      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generar contenido del reporte
      const content = await this.generateReportContent(template, request);
      
      // Generar insights de IA si se solicita
      const aiInsights = request.includeAIInsights 
        ? await this.generateAIInsights(content, request)
        : [];

      // Crear reporte generado
      const report: GeneratedReport = {
        id: reportId,
        templateId: request.templateId,
        name: `${template.name} - ${request.dateRange.start.toLocaleDateString()} to ${request.dateRange.end.toLocaleDateString()}`,
        content,
        format: request.format,
        generatedAt: new Date(),
        fileSize: this.calculateFileSize(content),
        downloadUrl: `/reports/${reportId}.${request.format}`,
        aiInsights,
        metadata: {
          parameters: request.parameters,
          dateRange: request.dateRange,
          generationTime: Date.now() - startTime
        }
      };

      this.generatedReports.set(reportId, report);
      
      // Registrar en historial
      this.reportHistory.push({
        templateId: request.templateId,
        timestamp: new Date(),
        generationTime: Date.now() - startTime
      });

      return report;
    } catch (error) {
      throw error;
    }
  }

  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async listTemplates(): Promise<ReportTemplate[]> {
    return Array.from(this.templates.values());
  }

  async updateTemplate(templateId: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template ${templateId} not found`);
    }

    this.templates.delete(templateId);
  }

  async getGeneratedReport(reportId: string): Promise<GeneratedReport | null> {
    return this.generatedReports.get(reportId) || null;
  }

  async listGeneratedReports(limit: number = 50): Promise<GeneratedReport[]> {
    return Array.from(this.generatedReports.values())
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, limit);
  }

  async getReportAnalytics(): Promise<ReportAnalytics> {
    const totalReports = this.generatedReports.size;
    const totalTemplates = this.templates.size;
    const averageGenerationTime = this.calculateAverageGenerationTime();
    
    const popularTemplates = this.getPopularTemplates();
    const generationTrends = this.getGenerationTrends();

    return {
      totalReports,
      totalTemplates,
      averageGenerationTime,
      popularTemplates,
      generationTrends
    };
  }

  async scheduleReport(templateId: string, schedule: string, recipients: string[]): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // En una implementación real, usaría una librería como node-cron
    // Para esta simulación, solo actualizamos el template
    template.schedule = schedule;
    template.recipients = recipients;
    template.updatedAt = new Date();

    this.templates.set(templateId, template);
  }

  async generateCustomReport(sections: ReportSection[], data: any, format: string): Promise<GeneratedReport> {
    const startTime = Date.now();
    
    try {
      const reportId = `custom_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generar contenido personalizado
      const content = await this.generateCustomContent(sections, data);
      
      // Generar insights de IA
      const aiInsights = await this.generateAIInsights(content, { includeAIInsights: true });

      const report: GeneratedReport = {
        id: reportId,
        templateId: 'custom',
        name: 'Custom Report',
        content,
        format,
        generatedAt: new Date(),
        fileSize: this.calculateFileSize(content),
        downloadUrl: `/reports/${reportId}.${format}`,
        aiInsights,
        metadata: {
          sections: sections.length,
          generationTime: Date.now() - startTime
        }
      };

      this.generatedReports.set(reportId, report);
      return report;
    } catch (error) {
      throw error;
    }
  }

  private async generateReportContent(template: ReportTemplate, request: ReportRequest): Promise<any> {
    const content: any = {
      title: template.name,
      generatedAt: new Date(),
      dateRange: request.dateRange,
      sections: []
    };

    // Ordenar secciones por orden
    const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);

    for (const section of sortedSections) {
      const sectionContent = await this.generateSectionContent(section, request);
      content.sections.push({
        id: section.id,
        title: section.title,
        type: section.type,
        content: sectionContent
      });
    }

    return content;
  }

  private async generateSectionContent(section: ReportSection, request: ReportRequest): Promise<any> {
    switch (section.type) {
      case 'text':
        return await this.generateTextContent(section, request);
      case 'chart':
        return await this.generateChartContent(section, request);
      case 'table':
        return await this.generateTableContent(section, request);
      case 'metric':
        return await this.generateMetricContent(section, request);
      case 'ai_insight':
        return await this.generateAIInsightContent(section, request);
      default:
        return { error: `Unknown section type: ${section.type}` };
    }
  }

  private async generateTextContent(section: ReportSection, request: ReportRequest): Promise<string> {
    if (section.content.includes('{{AI_GENERATE}}')) {
      // Generar contenido con IA
      const prompt = section.content.replace('{{AI_GENERATE}}', 
        `Generate a comprehensive report section about ${section.title} for the period ${request.dateRange.start.toLocaleDateString()} to ${request.dateRange.end.toLocaleDateString()}. Include relevant metrics and insights.`
      );

      const response = await AIRouter.route({
        prompt,
        model: 'mistral-7b',
        maxTokens: 500,
        temperature: 0.3
      });

      return response.content;
    }

    // Reemplazar variables en el contenido
    return this.replaceVariables(section.content, request);
  }

  private async generateChartContent(section: ReportSection, request: ReportRequest): Promise<any> {
    // Simular datos de gráfico
    const chartData = this.generateChartData(section.chartConfig!, request);
    
    return {
      type: section.chartConfig!.type,
      data: chartData,
      config: section.chartConfig
    };
  }

  private async generateTableContent(section: ReportSection, request: ReportRequest): Promise<any> {
    // Simular datos de tabla
    const tableData = this.generateTableData(section.dataQuery!, request);
    
    return {
      headers: Object.keys(tableData[0] || {}),
      rows: tableData,
      totalRows: tableData.length
    };
  }

  private async generateMetricContent(section: ReportSection, request: ReportRequest): Promise<any> {
    // Simular métricas
    const metrics = this.generateMetrics(section.dataQuery!, request);
    
    return {
      value: metrics.value,
      change: metrics.change,
      changePercent: metrics.changePercent,
      trend: metrics.trend,
      unit: metrics.unit
    };
  }

  private async generateAIInsightContent(section: ReportSection, request: ReportRequest): Promise<any> {
    const prompt = section.aiPrompt || `Analyze the data and provide insights for ${section.title}`;
    
    const response = await AIRouter.route({
      prompt,
      model: 'mistral-7b',
      maxTokens: 300,
      temperature: 0.4
    });

    return {
      insight: response.content,
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      generatedAt: new Date()
    };
  }

  private async generateAIInsights(content: any, request: ReportRequest): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Analizar tendencias
      const trendInsight = await this.generateTrendInsight(content);
      if (trendInsight) insights.push(trendInsight);

      // Detectar anomalías
      const anomalyInsight = await this.generateAnomalyInsight(content);
      if (anomalyInsight) insights.push(anomalyInsight);

      // Generar recomendaciones
      const recommendationInsight = await this.generateRecommendationInsight(content);
      if (recommendationInsight) insights.push(recommendationInsight);

      // Predicciones
      const predictionInsight = await this.generatePredictionInsight(content);
      if (predictionInsight) insights.push(predictionInsight);

    } catch (error) {
      // Si falla la generación de insights, continuar sin ellos
    }

    return insights;
  }

  private async generateTrendInsight(content: any): Promise<AIInsight | null> {
    try {
      const response = await AIRouter.route({
        prompt: `Analyze this report data and identify the most significant trend. Return a JSON object with: title, description, confidence (0-1), priority (low/medium/high/critical), actionable (true/false): ${JSON.stringify(content)}`,
        model: 'mistral-7b',
        maxTokens: 300,
        temperature: 0.3
      });

      const insightMatch = response.content.match(/\{.*\}/);
      if (insightMatch) {
        const insight = JSON.parse(insightMatch[0]);
        return {
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'trend',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          dataPoints: [],
          actionable: insight.actionable,
          priority: insight.priority
        };
      }
    } catch (error) {
      // Fallback: insight simple
    }

    return null;
  }

  private async generateAnomalyInsight(content: any): Promise<AIInsight | null> {
    // Simulación de detección de anomalías
    if (Math.random() > 0.7) { // 30% de probabilidad
      return {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'anomaly',
        title: 'Unusual Pattern Detected',
        description: 'An unusual pattern was detected in the data that may require attention.',
        confidence: 0.85,
        dataPoints: [],
        actionable: true,
        priority: 'medium'
      };
    }
    return null;
  }

  private async generateRecommendationInsight(content: any): Promise<AIInsight | null> {
    try {
      const response = await AIRouter.route({
        prompt: `Based on this report data, provide one actionable recommendation. Return a JSON object with: title, description, confidence (0-1), priority (low/medium/high/critical): ${JSON.stringify(content)}`,
        model: 'mistral-7b',
        maxTokens: 300,
        temperature: 0.4
      });

      const insightMatch = response.content.match(/\{.*\}/);
      if (insightMatch) {
        const insight = JSON.parse(insightMatch[0]);
        return {
          id: `recommendation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'recommendation',
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          dataPoints: [],
          actionable: true,
          priority: insight.priority
        };
      }
    } catch (error) {
      // Fallback: recomendación simple
    }

    return null;
  }

  private async generatePredictionInsight(content: any): Promise<AIInsight | null> {
    // Simulación de predicción
    if (Math.random() > 0.8) { // 20% de probabilidad
      return {
        id: `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'prediction',
        title: 'Future Trend Prediction',
        description: 'Based on current data patterns, we predict a positive trend in the next quarter.',
        confidence: 0.75,
        dataPoints: [],
        actionable: false,
        priority: 'low'
      };
    }
    return null;
  }

  private async generateCustomContent(sections: ReportSection[], data: any): Promise<any> {
    const content: any = {
      title: 'Custom Report',
      generatedAt: new Date(),
      sections: []
    };

    for (const section of sections) {
      const sectionContent = await this.generateSectionContent(section, { 
        parameters: {}, 
        dateRange: { start: new Date(), end: new Date() },
        format: 'json',
        includeAIInsights: false
      });
      
      content.sections.push({
        id: section.id,
        title: section.title,
        type: section.type,
        content: sectionContent
      });
    }

    return content;
  }

  private replaceVariables(content: string, request: ReportRequest): string {
    return content
      .replace(/\{\{start_date\}\}/g, request.dateRange.start.toLocaleDateString())
      .replace(/\{\{end_date\}\}/g, request.dateRange.end.toLocaleDateString())
      .replace(/\{\{generated_at\}\}/g, new Date().toLocaleString());
  }

  private generateChartData(config: ChartConfig, request: ReportRequest): any[] {
    // Simular datos de gráfico
    const data = [];
    const days = Math.ceil((request.dateRange.end.getTime() - request.dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(request.dateRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      data.push({
        [config.xAxis]: date.toLocaleDateString(),
        [config.yAxis]: Math.floor(Math.random() * 1000) + 100
      });
    }
    
    return data;
  }

  private generateTableData(query: string, request: ReportRequest): any[] {
    // Simular datos de tabla
    return [
      { id: 1, name: 'Product A', sales: 1500, revenue: 75000 },
      { id: 2, name: 'Product B', sales: 1200, revenue: 60000 },
      { id: 3, name: 'Product C', sales: 800, revenue: 40000 }
    ];
  }

  private generateMetrics(query: string, request: ReportRequest): any {
    return {
      value: Math.floor(Math.random() * 10000) + 1000,
      change: Math.floor(Math.random() * 200) - 100,
      changePercent: (Math.random() * 20) - 10,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      unit: '€'
    };
  }

  private calculateFileSize(content: any): number {
    return JSON.stringify(content).length;
  }

  private calculateAverageGenerationTime(): number {
    if (this.reportHistory.length === 0) return 0;
    
    const totalTime = this.reportHistory.reduce((sum, item) => sum + item.generationTime, 0);
    return totalTime / this.reportHistory.length;
  }

  private getPopularTemplates(): Array<{ templateId: string; name: string; usage: number }> {
    const usage: Record<string, number> = {};
    
    this.reportHistory.forEach(item => {
      usage[item.templateId] = (usage[item.templateId] || 0) + 1;
    });
    
    return Object.entries(usage)
      .map(([templateId, count]) => {
        const template = this.templates.get(templateId);
        return {
          templateId,
          name: template?.name || 'Unknown',
          usage: count
        };
      })
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);
  }

  private getGenerationTrends(): Array<{ date: string; count: number }> {
    const trends: Record<string, number> = {};
    
    this.reportHistory.forEach(item => {
      const date = item.timestamp.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });
    
    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Últimos 7 días
      .map(([date, count]) => ({ date, count }));
  }
}

export const intelligentReportingService = new IntelligentReportingService();
