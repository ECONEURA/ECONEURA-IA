// lib/prompts.ts
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  system: string;
  userTemplate: string;
  variables: string[];
  category: 'business' | 'creative' | 'analysis' | 'technical';
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Templates de Negocios
    this.addTemplate({
      id: 'business-analysis',
      name: 'Análisis de Negocio',
      description: 'Análisis completo de un aspecto empresarial',
      system: 'Eres un consultor de negocios senior con 20+ años de experiencia. Proporciona análisis profundos, accionables y basados en datos.',
      userTemplate: 'Analiza el siguiente aspecto de negocio: {topic}. Incluye: 1) Análisis de situación actual, 2) Oportunidades identificadas, 3) Riesgos potenciales, 4) Recomendaciones estratégicas.',
      variables: ['topic'],
      category: 'business'
    });

    this.addTemplate({
      id: 'market-research',
      name: 'Investigación de Mercado',
      description: 'Análisis de mercado y competencia',
      system: 'Eres un analista de mercado experto. Proporciona insights valiosos sobre tendencias, competidores y oportunidades.',
      userTemplate: 'Realiza una investigación de mercado sobre: {market}. Enfócate en: 1) Tamaño del mercado, 2) Competidores principales, 3) Tendencias emergentes, 4) Oportunidades de entrada.',
      variables: ['market'],
      category: 'business'
    });

    // Templates Creativos
    this.addTemplate({
      id: 'creative-campaign',
      name: 'Campaña Creativa',
      description: 'Generación de ideas para campañas de marketing',
      system: 'Eres un director creativo galardonado. Genera ideas innovadoras, memorables y efectivas.',
      userTemplate: 'Crea una campaña creativa para: {product/service}. Objetivo: {objective}. Público objetivo: {target_audience}. Incluye: concepto, mensaje principal, canales recomendados.',
      variables: ['product/service', 'objective', 'target_audience'],
      category: 'creative'
    });

    this.addTemplate({
      id: 'content-strategy',
      name: 'Estrategia de Contenido',
      description: 'Planificación de contenido digital',
      system: 'Eres un estratega de contenido digital. Crea estrategias que generen engagement y conversiones.',
      userTemplate: 'Desarrolla una estrategia de contenido para: {brand}. Objetivo: {goal}. Audiencia: {audience}. Incluye: tipos de contenido, calendario, métricas de éxito.',
      variables: ['brand', 'goal', 'audience'],
      category: 'creative'
    });

    // Templates de Análisis
    this.addTemplate({
      id: 'data-analysis',
      name: 'Análisis de Datos',
      description: 'Interpretación y análisis de datos',
      system: 'Eres un científico de datos senior. Proporciona insights profundos y accionables basados en datos.',
      userTemplate: 'Analiza los siguientes datos: {data_description}. Encuentra: 1) Patrones clave, 2) Correlaciones importantes, 3) Insights accionables, 4) Recomendaciones basadas en datos.',
      variables: ['data_description'],
      category: 'analysis'
    });

    this.addTemplate({
      id: 'performance-review',
      name: 'Revisión de Rendimiento',
      description: 'Evaluación de KPIs y métricas',
      system: 'Eres un analista de rendimiento empresarial. Evalúa métricas y proporciona recomendaciones de mejora.',
      userTemplate: 'Revisa el rendimiento de: {metric_area}. Período: {period}. Incluye: 1) Análisis de tendencias, 2) Comparación con benchmarks, 3) Identificación de problemas, 4) Plan de mejora.',
      variables: ['metric_area', 'period'],
      category: 'analysis'
    });

    // Templates Técnicos
    this.addTemplate({
      id: 'technical-spec',
      name: 'Especificación Técnica',
      description: 'Documentación técnica detallada',
      system: 'Eres un arquitecto de software senior. Crea especificaciones técnicas claras y detalladas.',
      userTemplate: 'Crea una especificación técnica para: {feature/system}. Requisitos: {requirements}. Incluye: arquitectura, APIs, base de datos, seguridad, escalabilidad.',
      variables: ['feature/system', 'requirements'],
      category: 'technical'
    });

    this.addTemplate({
      id: 'code-review',
      name: 'Revisión de Código',
      description: 'Análisis y mejora de código',
      system: 'Eres un ingeniero de software senior. Proporciona revisiones de código constructivas y detalladas.',
      userTemplate: 'Revisa el siguiente código: {code_snippet}. Enfócate en: 1) Calidad del código, 2) Performance, 3) Seguridad, 4) Mejores prácticas, 5) Sugerencias de mejora.',
      variables: ['code_snippet'],
      category: 'technical'
    });
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: string): PromptTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  renderTemplate(id: string, variables: Record<string, string>): { system: string; user: string } | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    let userPrompt = template.userTemplate;

    // Reemplazar variables en el template
    for (const variable of template.variables) {
      const value = variables[variable];
      if (value) {
        userPrompt = userPrompt.replace(new RegExp(`{${variable}}`, 'g'), value);
      }
    }

    return {
      system: template.system,
      user: userPrompt
    };
  }

  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template => ;
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }
}

export const promptManager = new PromptManager();
