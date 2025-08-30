interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'analysis' | 'technical' | 'customer-service';
  system: string;
  userTemplate: string;
  variables: string[];
  examples: Array<{
    input: Record<string, string>;
    output: string;
  }>;
}

class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Templates de Negocios
    this.addTemplate({
      id: 'business-strategy',
      name: 'Estrategia de Negocio',
      description: 'Desarrollo de estrategias empresariales',
      category: 'business',
      system: 'Eres un consultor estratégico senior con 25+ años de experiencia en Fortune 500. Proporciona estrategias accionables, basadas en datos y con roadmap claro.',
      userTemplate: 'Desarrolla una estrategia de negocio para: {business_area}. Contexto: {context}. Objetivos: {objectives}. Incluye: análisis de mercado, propuesta de valor, roadmap de implementación, métricas de éxito.',
      variables: ['business_area', 'context', 'objectives'],
      examples: [
        {
          input: {
            business_area: 'expansión internacional',
            context: 'empresa de software SaaS con 5M€ ARR',
            objectives: 'llegar a 20M€ ARR en 3 años'
          },
          output: 'Estrategia de expansión internacional para SaaS...'
        }
      ]
    });

    // Templates Creativos
    this.addTemplate({
      id: 'marketing-campaign',
      name: 'Campaña de Marketing',
      description: 'Creación de campañas de marketing integrales',
      category: 'creative',
      system: 'Eres un director de marketing creativo galardonado. Genera campañas memorables, medibles y que generen ROI.',
      userTemplate: 'Crea una campaña de marketing para: {product}. Público objetivo: {target_audience}. Presupuesto: {budget}. Objetivo: {goal}. Incluye: concepto creativo, canales, timeline, métricas.',
      variables: ['product', 'target_audience', 'budget', 'goal'],
      examples: [
        {
          input: {
            product: 'app de fitness',
            target_audience: 'profesionales 25-40 años',
            budget: '50k€',
            goal: '10k descargas en 3 meses'
          },
          output: 'Campaña de marketing para app de fitness...'
        }
      ]
    });

    // Templates de Análisis
    this.addTemplate({
      id: 'data-insights',
      name: 'Insights de Datos',
      description: 'Análisis profundo de datos empresariales',
      category: 'analysis',
      system: 'Eres un científico de datos senior especializado en business intelligence. Proporciona insights accionables y recomendaciones basadas en datos.',
      userTemplate: 'Analiza los siguientes datos: {data_description}. Preguntas clave: {key_questions}. Encuentra: patrones, correlaciones, insights accionables, recomendaciones estratégicas.',
      variables: ['data_description', 'key_questions'],
      examples: [
        {
          input: {
            data_description: 'ventas mensuales de los últimos 2 años',
            key_questions: '¿cuáles son las tendencias estacionales? ¿qué productos tienen mejor rendimiento?'
          },
          output: 'Análisis de datos de ventas mensuales...'
        }
      ]
    });

    // Templates Técnicos
    this.addTemplate({
      id: 'technical-architecture',
      name: 'Arquitectura Técnica',
      description: 'Diseño de arquitecturas de software',
      category: 'technical',
      system: 'Eres un arquitecto de software senior con experiencia en sistemas distribuidos y cloud. Diseña arquitecturas escalables, seguras y mantenibles.',
      userTemplate: 'Diseña una arquitectura técnica para: {system_description}. Requisitos: {requirements}. Restricciones: {constraints}. Incluye: diagrama de componentes, tecnologías, seguridad, escalabilidad.',
      variables: ['system_description', 'requirements', 'constraints'],
      examples: [
        {
          input: {
            system_description: 'plataforma de e-commerce',
            requirements: 'alta disponibilidad, procesamiento de pagos, catálogo de productos',
            constraints: 'presupuesto limitado, equipo de 5 desarrolladores'
          },
          output: 'Arquitectura técnica para plataforma de e-commerce...'
        }
      ]
    });

    // Templates de Customer Service
    this.addTemplate({
      id: 'customer-support',
      name: 'Soporte al Cliente',
      description: 'Respuestas profesionales para soporte al cliente',
      category: 'customer-service',
      system: 'Eres un representante de soporte al cliente experto. Proporciona respuestas empáticas, profesionales y soluciones efectivas.',
      userTemplate: 'Responde a la consulta del cliente: {customer_query}. Contexto: {context}. Política de la empresa: {policy}. Incluye: empatía, solución clara, próximos pasos.',
      variables: ['customer_query', 'context', 'policy'],
      examples: [
        {
          input: {
            customer_query: 'mi pedido no ha llegado',
            context: 'pedido realizado hace 5 días',
            policy: 'envío gratuito en 3-5 días hábiles'
          },
          output: 'Entiendo su preocupación por el retraso en su pedido...'
        }
      ]
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
    return this.getAllTemplates().filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }

  getTemplateWithExample(id: string): PromptTemplate | undefined {
    const template = this.getTemplate(id);
    if (!template || template.examples.length === 0) return template;
    
    // Agregar ejemplo al template
    const example = template.examples[0];
    return {
      ...template,
      userTemplate: `${template.userTemplate}\n\nEjemplo:\nEntrada: ${JSON.stringify(example.input, null, 2)}\nSalida: ${example.output}`
    };
  }
}

export const promptTemplateManager = new PromptTemplateManager();
