import { structuredLogger } from './structured-logger.js';

// Interactions SAS + AV Service - PR-36
// Sistema completo de interacciones con análisis de sentimientos y voz

interface Interaction {
  id: string;
  organizationId: string;
  type: 'call' | 'email' | 'chat' | 'meeting' | 'social_media' | 'support_ticket' | 'survey';
  channel: 'phone' | 'email' | 'web' | 'mobile' | 'social' | 'in_person' | 'video';
  direction: 'inbound' | 'outbound';
  status: 'active' | 'completed' | 'cancelled' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Participants
  participants: {
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    agentId?: string;
    agentName?: string;
    department?: string;
  };
  
  // Content
  content: {
    subject?: string;
    summary?: string;
    transcript?: string;
    attachments?: string[];
    tags?: string[];
  };
  
  // Timing
  timing: {
    startTime: string;
    endTime?: string;
    duration?: number; // in seconds
    responseTime?: number; // in seconds
    waitTime?: number; // in seconds
  };
  
  // Sentiment Analysis (SAS)
  sentimentAnalysis: {
    overallSentiment: 'positive' | 'neutral' | 'negative';
    confidence: number; // 0-1
    emotions: {
      joy: number;
      anger: number;
      fear: number;
      sadness: number;
      surprise: number;
      disgust: number;
    };
    topics: {
      topic: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      confidence: number;
    }[];
    keywords: {
      word: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      frequency: number;
    }[];
    sentimentTrend: {
      timestamp: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      confidence: number;
    }[];
  };
  
  // Voice Analysis (AV)
  voiceAnalysis?: {
    audioQuality: {
      clarity: number; // 0-1
      volume: number; // 0-1
      backgroundNoise: number; // 0-1
      distortion: number; // 0-1
    };
    speechPatterns: {
      speakingRate: number; // words per minute
      pauseFrequency: number; // pauses per minute
      averagePauseLength: number; // in seconds
      speechClarity: number; // 0-1
    };
    emotionalTone: {
      stress: number; // 0-1
      excitement: number; // 0-1
      calmness: number; // 0-1
      frustration: number; // 0-1
    };
    languageAnalysis: {
      language: string;
      dialect?: string;
      accent?: string;
      formality: 'formal' | 'informal' | 'mixed';
      politeness: number; // 0-1
    };
    voiceBiometrics?: {
      pitch: number; // Hz
      tone: number; // 0-1
      rhythm: number; // 0-1
      volume: number; // 0-1
    };
  };
  
  // Outcomes
  outcomes: {
    resolution?: string;
    satisfaction?: number; // 1-5
    followUpRequired?: boolean;
    escalationReason?: string;
    actionItems?: string[];
    nextSteps?: string[];
  };
  
  // Metadata
  metadata: {
    source: string;
    campaignId?: string;
    leadId?: string;
    dealId?: string;
    ticketId?: string;
    customFields?: Record<string, any>;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface SentimentInsight {
  id: string;
  organizationId: string;
  interactionId: string;
  type: 'trend' | 'alert' | 'pattern' | 'recommendation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: {
    metric: string;
    value: number;
    threshold?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    period?: string;
  };
  recommendations?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VoiceInsight {
  id: string;
  organizationId: string;
  interactionId: string;
  type: 'quality_issue' | 'emotion_detection' | 'speech_pattern' | 'language_insight';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: {
    metric: string;
    value: number;
    threshold?: number;
    details?: Record<string, any>;
  };
  recommendations?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InteractionReport {
  id: string;
  organizationId: string;
  reportType: 'sentiment_summary' | 'voice_analysis' | 'interaction_trends' | 'agent_performance' | 'customer_satisfaction';
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalInteractions: number;
    averageSentiment: number;
    positiveInteractions: number;
    negativeInteractions: number;
    averageDuration: number;
    resolutionRate: number;
  };
  data: any;
  generatedBy: string;
  createdAt: string;
}

class InteractionsSasAvService {
  private interactions: Map<string, Interaction> = new Map();
  private sentimentInsights: Map<string, SentimentInsight> = new Map();
  private voiceInsights: Map<string, VoiceInsight> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Interactions SAS + AV Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    // Demo interactions
    const interaction1: Interaction = {
      id: 'int_1',
      organizationId: 'demo-org-1',
      type: 'call',
      channel: 'phone',
      direction: 'inbound',
      status: 'completed',
      priority: 'medium',
      participants: {
        customerId: 'cust_1',
        customerName: 'María González',
        customerEmail: 'maria.gonzalez@email.com',
        agentId: 'agent_1',
        agentName: 'Carlos Ruiz',
        department: 'Sales'
      },
      content: {
        subject: 'Consulta sobre producto premium',
        summary: 'Cliente interesada en upgrade a plan premium, preguntas sobre funcionalidades',
        transcript: 'Cliente: Hola, estoy interesada en el plan premium. ¿Podrían explicarme las funcionalidades adicionales? Agente: Por supuesto, María. El plan premium incluye...',
        tags: ['premium', 'upgrade', 'sales']
      },
      timing: {
        startTime: threeHoursAgo.toISOString(),
        endTime: new Date(threeHoursAgo.getTime() + 15 * 60 * 1000).toISOString(),
        duration: 900, // 15 minutes
        responseTime: 30,
        waitTime: 120
      },
      sentimentAnalysis: {
        overallSentiment: 'positive',
        confidence: 0.85,
        emotions: {
          joy: 0.7,
          anger: 0.1,
          fear: 0.2,
          sadness: 0.1,
          surprise: 0.3,
          disgust: 0.0
        },
        topics: [
          { topic: 'product_features', sentiment: 'positive', confidence: 0.8 },
          { topic: 'pricing', sentiment: 'neutral', confidence: 0.6 },
          { topic: 'support', sentiment: 'positive', confidence: 0.9 }
        ],
        keywords: [
          { word: 'excelente', sentiment: 'positive', frequency: 3 },
          { word: 'interesante', sentiment: 'positive', frequency: 2 },
          { word: 'precio', sentiment: 'neutral', frequency: 2 }
        ],
        sentimentTrend: [
          { timestamp: threeHoursAgo.toISOString(), sentiment: 'neutral', confidence: 0.5 },
          { timestamp: new Date(threeHoursAgo.getTime() + 5 * 60 * 1000).toISOString(), sentiment: 'positive', confidence: 0.7 },
          { timestamp: new Date(threeHoursAgo.getTime() + 10 * 60 * 1000).toISOString(), sentiment: 'positive', confidence: 0.85 }
        ]
      },
      voiceAnalysis: {
        audioQuality: {
          clarity: 0.9,
          volume: 0.8,
          backgroundNoise: 0.1,
          distortion: 0.05
        },
        speechPatterns: {
          speakingRate: 120,
          pauseFrequency: 8,
          averagePauseLength: 1.2,
          speechClarity: 0.85
        },
        emotionalTone: {
          stress: 0.2,
          excitement: 0.6,
          calmness: 0.7,
          frustration: 0.1
        },
        languageAnalysis: {
          language: 'es',
          dialect: 'castellano',
          accent: 'madrileño',
          formality: 'informal',
          politeness: 0.8
        },
        voiceBiometrics: {
          pitch: 220,
          tone: 0.7,
          rhythm: 0.8,
          volume: 0.75
        }
      },
      outcomes: {
        resolution: 'Cliente informada sobre funcionalidades premium, programada demo para mañana',
        satisfaction: 4,
        followUpRequired: true,
        actionItems: ['Enviar información detallada por email', 'Programar demo técnica'],
        nextSteps: ['Demo programada para mañana 10:00', 'Seguimiento en 48h']
      },
      metadata: {
        source: 'CRM',
        campaignId: 'camp_1',
        leadId: 'lead_1',
        customFields: {
          productInterest: 'premium',
          budget: 'high'
        }
      },
      createdAt: threeHoursAgo.toISOString(),
      updatedAt: new Date(threeHoursAgo.getTime() + 15 * 60 * 1000).toISOString()
    };

    const interaction2: Interaction = {
      id: 'int_2',
      organizationId: 'demo-org-1',
      type: 'email',
      channel: 'email',
      direction: 'inbound',
      status: 'completed',
      priority: 'high',
      participants: {
        customerId: 'cust_2',
        customerName: 'Juan Pérez',
        customerEmail: 'juan.perez@empresa.com',
        agentId: 'agent_2',
        agentName: 'Ana Martín',
        department: 'Support'
      },
      content: {
        subject: 'Problema con facturación - URGENTE',
        summary: 'Cliente reporta error en facturación, necesita resolución inmediata',
        transcript: 'Estimados, tengo un problema urgente con mi facturación. Me han cobrado dos veces el mismo mes...',
        tags: ['billing', 'urgent', 'support', 'refund']
      },
      timing: {
        startTime: twoHoursAgo.toISOString(),
        endTime: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString(),
        duration: 2700, // 45 minutes
        responseTime: 300, // 5 minutes
        waitTime: 0
      },
      sentimentAnalysis: {
        overallSentiment: 'negative',
        confidence: 0.92,
        emotions: {
          joy: 0.1,
          anger: 0.8,
          fear: 0.3,
          sadness: 0.2,
          surprise: 0.1,
          disgust: 0.4
        },
        topics: [
          { topic: 'billing_error', sentiment: 'negative', confidence: 0.95 },
          { topic: 'refund', sentiment: 'negative', confidence: 0.8 },
          { topic: 'customer_service', sentiment: 'negative', confidence: 0.7 }
        ],
        keywords: [
          { word: 'error', sentiment: 'negative', frequency: 5 },
          { word: 'urgente', sentiment: 'negative', frequency: 3 },
          { word: 'reembolso', sentiment: 'negative', frequency: 2 }
        ],
        sentimentTrend: [
          { timestamp: twoHoursAgo.toISOString(), sentiment: 'negative', confidence: 0.8 },
          { timestamp: new Date(twoHoursAgo.getTime() + 15 * 60 * 1000).toISOString(), sentiment: 'negative', confidence: 0.9 },
          { timestamp: new Date(twoHoursAgo.getTime() + 30 * 60 * 1000).toISOString(), sentiment: 'neutral', confidence: 0.6 }
        ]
      },
      outcomes: {
        resolution: 'Error de facturación identificado y corregido, reembolso procesado',
        satisfaction: 3,
        followUpRequired: true,
        escalationReason: 'Billing error requiring immediate attention',
        actionItems: ['Procesar reembolso', 'Verificar sistema de facturación'],
        nextSteps: ['Reembolso en 2-3 días hábiles', 'Seguimiento de satisfacción']
      },
      metadata: {
        source: 'Email System',
        ticketId: 'ticket_12345',
        customFields: {
          billingIssue: 'duplicate_charge',
          amount: 299.99
        }
      },
      createdAt: twoHoursAgo.toISOString(),
      updatedAt: new Date(twoHoursAgo.getTime() + 45 * 60 * 1000).toISOString()
    };

    const interaction3: Interaction = {
      id: 'int_3',
      organizationId: 'demo-org-1',
      type: 'chat',
      channel: 'web',
      direction: 'inbound',
      status: 'completed',
      priority: 'low',
      participants: {
        customerId: 'cust_3',
        customerName: 'Laura Sánchez',
        customerEmail: 'laura.sanchez@startup.com',
        agentId: 'agent_3',
        agentName: 'Miguel Torres',
        department: 'Sales'
      },
      content: {
        subject: 'Consulta sobre integración API',
        summary: 'Cliente pregunta sobre documentación de API y ejemplos de integración',
        transcript: 'Cliente: Hola, necesito ayuda con la integración de la API. Agente: Hola Laura, te ayudo con eso...',
        tags: ['api', 'integration', 'technical', 'documentation']
      },
      timing: {
        startTime: oneHourAgo.toISOString(),
        endTime: new Date(oneHourAgo.getTime() + 8 * 60 * 1000).toISOString(),
        duration: 480, // 8 minutes
        responseTime: 15,
        waitTime: 30
      },
      sentimentAnalysis: {
        overallSentiment: 'positive',
        confidence: 0.78,
        emotions: {
          joy: 0.4,
          anger: 0.1,
          fear: 0.2,
          sadness: 0.1,
          surprise: 0.2,
          disgust: 0.0
        },
        topics: [
          { topic: 'api_documentation', sentiment: 'positive', confidence: 0.7 },
          { topic: 'integration_help', sentiment: 'positive', confidence: 0.8 },
          { topic: 'technical_support', sentiment: 'positive', confidence: 0.75 }
        ],
        keywords: [
          { word: 'gracias', sentiment: 'positive', frequency: 4 },
          { word: 'útil', sentiment: 'positive', frequency: 2 },
          { word: 'perfecto', sentiment: 'positive', frequency: 1 }
        ],
        sentimentTrend: [
          { timestamp: oneHourAgo.toISOString(), sentiment: 'neutral', confidence: 0.5 },
          { timestamp: new Date(oneHourAgo.getTime() + 3 * 60 * 1000).toISOString(), sentiment: 'positive', confidence: 0.7 },
          { timestamp: new Date(oneHourAgo.getTime() + 6 * 60 * 1000).toISOString(), sentiment: 'positive', confidence: 0.78 }
        ]
      },
      outcomes: {
        resolution: 'Cliente recibió documentación y ejemplos de código, satisfecha con la ayuda',
        satisfaction: 5,
        followUpRequired: false,
        actionItems: ['Enviar ejemplos adicionales por email'],
        nextSteps: ['Cliente procederá con la integración']
      },
      metadata: {
        source: 'Live Chat',
        leadId: 'lead_2',
        customFields: {
          technicalLevel: 'intermediate',
          companySize: 'startup'
        }
      },
      createdAt: oneHourAgo.toISOString(),
      updatedAt: new Date(oneHourAgo.getTime() + 8 * 60 * 1000).toISOString()
    };

    this.interactions.set(interaction1.id, interaction1);
    this.interactions.set(interaction2.id, interaction2);
    this.interactions.set(interaction3.id, interaction3);

    // Demo sentiment insights
    const sentimentInsight1: SentimentInsight = {
      id: 'si_1',
      organizationId: 'demo-org-1',
      interactionId: 'int_2',
      type: 'alert',
      severity: 'high',
      title: 'Sentimiento negativo detectado',
      description: 'Cliente muestra alta frustración con problema de facturación',
      data: {
        metric: 'negative_sentiment',
        value: 0.92,
        threshold: 0.8,
        trend: 'increasing',
        period: 'last_hour'
      },
      recommendations: [
        'Escalar inmediatamente a supervisor',
        'Ofrecer compensación adicional',
        'Seguimiento personalizado en 24h'
      ],
      isActive: true,
      createdAt: twoHoursAgo.toISOString(),
      updatedAt: twoHoursAgo.toISOString()
    };

    this.sentimentInsights.set(sentimentInsight1.id, sentimentInsight1);

    // Demo voice insights
    const voiceInsight1: VoiceInsight = {
      id: 'vi_1',
      organizationId: 'demo-org-1',
      interactionId: 'int_1',
      type: 'emotion_detection',
      severity: 'medium',
      title: 'Excitación detectada en voz',
      description: 'Cliente muestra alto nivel de interés y entusiasmo',
      data: {
        metric: 'excitement_level',
        value: 0.6,
        threshold: 0.5,
        details: {
          pitchVariation: 0.3,
          speechRate: 1.2,
          volumeIncrease: 0.15
        }
      },
      recommendations: [
        'Mantener el momentum positivo',
        'Presentar opciones premium',
        'Programar seguimiento rápido'
      ],
      isActive: true,
      createdAt: threeHoursAgo.toISOString(),
      updatedAt: threeHoursAgo.toISOString()
    };

    this.voiceInsights.set(voiceInsight1.id, voiceInsight1);
  }

  // Interaction Management
  async createInteraction(interactionData: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interaction> {
    const now = new Date().toISOString();
    const newInteraction: Interaction = {
      id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...interactionData,
      createdAt: now,
      updatedAt: now
    };

    this.interactions.set(newInteraction.id, newInteraction);
    
    // Generate insights
    await this.generateInsights(newInteraction);

    structuredLogger.info('Interaction created', { 
      interactionId: newInteraction.id, 
      organizationId: newInteraction.organizationId,
      type: newInteraction.type,
      sentiment: newInteraction.sentimentAnalysis.overallSentiment
    });

    return newInteraction;
  }

  async getInteraction(interactionId: string): Promise<Interaction | undefined> {
    return this.interactions.get(interactionId);
  }

  async getInteractions(organizationId: string, filters: {
    type?: string;
    channel?: string;
    status?: string;
    priority?: string;
    sentiment?: string;
    startDate?: string;
    endDate?: string;
    agentId?: string;
    customerId?: string;
    limit?: number;
  } = {}): Promise<Interaction[]> {
    let interactions = Array.from(this.interactions.values())
      .filter(i => i.organizationId === organizationId);

    if (filters.type) {
      interactions = interactions.filter(i => i.type === filters.type);
    }

    if (filters.channel) {
      interactions = interactions.filter(i => i.channel === filters.channel);
    }

    if (filters.status) {
      interactions = interactions.filter(i => i.status === filters.status);
    }

    if (filters.priority) {
      interactions = interactions.filter(i => i.priority === filters.priority);
    }

    if (filters.sentiment) {
      interactions = interactions.filter(i => i.sentimentAnalysis.overallSentiment === filters.sentiment);
    }

    if (filters.startDate) {
      interactions = interactions.filter(i => i.timing.startTime >= filters.startDate!);
    }

    if (filters.endDate) {
      interactions = interactions.filter(i => i.timing.startTime <= filters.endDate!);
    }

    if (filters.agentId) {
      interactions = interactions.filter(i => i.participants.agentId === filters.agentId);
    }

    if (filters.customerId) {
      interactions = interactions.filter(i => i.participants.customerId === filters.customerId);
    }

    if (filters.limit) {
      interactions = interactions.slice(0, filters.limit);
    }

    return interactions.sort((a, b) => new Date(b.timing.startTime).getTime() - new Date(a.timing.startTime).getTime());
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string, audioData?: any): Promise<{
    overallSentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: Record<string, number>;
    topics: Array<{ topic: string; sentiment: string; confidence: number }>;
    keywords: Array<{ word: string; sentiment: string; frequency: number }>;
  }> {
    // Simulate sentiment analysis
    const positiveWords = ['excelente', 'perfecto', 'gracias', 'útil', 'genial', 'fantástico', 'maravilloso'];
    const negativeWords = ['error', 'problema', 'urgente', 'malo', 'terrible', 'horrible', 'frustrado'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveScore++;
      if (negativeWords.some(nw => word.includes(nw))) negativeScore++;
    });
    
    const totalWords = words.length;
    const positiveRatio = positiveScore / totalWords;
    const negativeRatio = negativeScore / totalWords;
    
    let overallSentiment: 'positive' | 'neutral' | 'negative';
    let confidence: number;
    
    if (positiveRatio > negativeRatio && positiveRatio > 0.1) {
      overallSentiment = 'positive';
      confidence = Math.min(0.9, positiveRatio * 2);
    } else if (negativeRatio > positiveRatio && negativeRatio > 0.1) {
      overallSentiment = 'negative';
      confidence = Math.min(0.9, negativeRatio * 2);
    } else {
      overallSentiment = 'neutral';
      confidence = 0.5;
    }
    
    return {
      overallSentiment,
      confidence,
      emotions: {
        joy: overallSentiment === 'positive' ? 0.7 : 0.2,
        anger: overallSentiment === 'negative' ? 0.6 : 0.1,
        fear: 0.2,
        sadness: overallSentiment === 'negative' ? 0.4 : 0.1,
        surprise: 0.3,
        disgust: overallSentiment === 'negative' ? 0.3 : 0.0
      },
      topics: [
        { topic: 'customer_service', sentiment: overallSentiment, confidence: 0.7 },
        { topic: 'product_inquiry', sentiment: overallSentiment, confidence: 0.6 }
      ],
      keywords: words.slice(0, 5).map(word => ({
        word,
        sentiment: overallSentiment,
        frequency: 1
      }))
    };
  }

  // Voice Analysis
  async analyzeVoice(audioData: any): Promise<{
    audioQuality: Record<string, number>;
    speechPatterns: Record<string, number>;
    emotionalTone: Record<string, number>;
    languageAnalysis: Record<string, any>;
  }> {
    // Simulate voice analysis
    return {
      audioQuality: {
        clarity: 0.85 + Math.random() * 0.1,
        volume: 0.7 + Math.random() * 0.2,
        backgroundNoise: Math.random() * 0.2,
        distortion: Math.random() * 0.1
      },
      speechPatterns: {
        speakingRate: 100 + Math.random() * 40,
        pauseFrequency: 5 + Math.random() * 10,
        averagePauseLength: 0.5 + Math.random() * 1.5,
        speechClarity: 0.8 + Math.random() * 0.15
      },
      emotionalTone: {
        stress: Math.random() * 0.5,
        excitement: Math.random() * 0.6,
        calmness: 0.5 + Math.random() * 0.4,
        frustration: Math.random() * 0.4
      },
      languageAnalysis: {
        language: 'es',
        dialect: 'castellano',
        accent: 'neutral',
        formality: Math.random() > 0.5 ? 'formal' : 'informal',
        politeness: 0.6 + Math.random() * 0.3
      }
    };
  }

  // Insights Management
  async generateInsights(interaction: Interaction): Promise<void> {
    // Generate sentiment insights
    if (interaction.sentimentAnalysis.overallSentiment === 'negative' && 
        interaction.sentimentAnalysis.confidence > 0.8) {
      await this.createSentimentInsight({
        organizationId: interaction.organizationId,
        interactionId: interaction.id,
        type: 'alert',
        severity: 'high',
        title: 'Sentimiento negativo detectado',
        description: `Cliente muestra ${interaction.sentimentAnalysis.overallSentiment} con alta confianza`,
        data: {
          metric: 'negative_sentiment',
          value: interaction.sentimentAnalysis.confidence,
          threshold: 0.8,
          trend: 'increasing',
          period: 'current_interaction'
        },
        recommendations: [
          'Escalar a supervisor si es necesario',
          'Ofrecer solución inmediata',
          'Seguimiento personalizado'
        ],
        isActive: true
      });
    }

    // Generate voice insights
    if (interaction.voiceAnalysis) {
      const { emotionalTone } = interaction.voiceAnalysis;
      if (emotionalTone.excitement > 0.6) {
        await this.createVoiceInsight({
          organizationId: interaction.organizationId,
          interactionId: interaction.id,
          type: 'emotion_detection',
          severity: 'medium',
          title: 'Excitación detectada en voz',
          description: 'Cliente muestra alto nivel de interés y entusiasmo',
          data: {
            metric: 'excitement_level',
            value: emotionalTone.excitement,
            threshold: 0.5,
            details: {
              pitchVariation: 0.3,
              speechRate: 1.2,
              volumeIncrease: 0.15
            }
          },
          recommendations: [
            'Mantener el momentum positivo',
            'Presentar opciones adicionales',
            'Programar seguimiento rápido'
          ],
          isActive: true
        });
      }
    }
  }

  async createSentimentInsight(insightData: Omit<SentimentInsight, 'id' | 'createdAt' | 'updatedAt'>): Promise<SentimentInsight> {
    const now = new Date().toISOString();
    const newInsight: SentimentInsight = {
      id: `si_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...insightData,
      createdAt: now,
      updatedAt: now
    };

    this.sentimentInsights.set(newInsight.id, newInsight);
    structuredLogger.warn('Sentiment insight created', { 
      insightId: newInsight.id, 
      type: newInsight.type,
      severity: newInsight.severity
    });

    return newInsight;
  }

  async createVoiceInsight(insightData: Omit<VoiceInsight, 'id' | 'createdAt' | 'updatedAt'>): Promise<VoiceInsight> {
    const now = new Date().toISOString();
    const newInsight: VoiceInsight = {
      id: `vi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...insightData,
      createdAt: now,
      updatedAt: now
    };

    this.voiceInsights.set(newInsight.id, newInsight);
    structuredLogger.info('Voice insight created', { 
      insightId: newInsight.id, 
      type: newInsight.type,
      severity: newInsight.severity
    });

    return newInsight;
  }

  async getSentimentInsights(organizationId: string, filters: {
    type?: string;
    severity?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<SentimentInsight[]> {
    let insights = Array.from(this.sentimentInsights.values())
      .filter(si => si.organizationId === organizationId);

    if (filters.type) {
      insights = insights.filter(si => si.type === filters.type);
    }

    if (filters.severity) {
      insights = insights.filter(si => si.severity === filters.severity);
    }

    if (filters.isActive !== undefined) {
      insights = insights.filter(si => si.isActive === filters.isActive);
    }

    if (filters.limit) {
      insights = insights.slice(0, filters.limit);
    }

    return insights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getVoiceInsights(organizationId: string, filters: {
    type?: string;
    severity?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<VoiceInsight[]> {
    let insights = Array.from(this.voiceInsights.values())
      .filter(vi => vi.organizationId === organizationId);

    if (filters.type) {
      insights = insights.filter(vi => vi.type === filters.type);
    }

    if (filters.severity) {
      insights = insights.filter(vi => vi.severity === filters.severity);
    }

    if (filters.isActive !== undefined) {
      insights = insights.filter(vi => vi.isActive === filters.isActive);
    }

    if (filters.limit) {
      insights = insights.slice(0, filters.limit);
    }

    return insights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Reports
  async generateInteractionReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<InteractionReport> {
    const interactions = Array.from(this.interactions.values()).filter(i => 
      i.organizationId === organizationId && 
      i.timing.startTime >= startDate && 
      i.timing.startTime <= endDate
    );

    let summary: any = {};
    let data: any = {};

    switch (reportType) {
      case 'sentiment_summary': {
        const sentimentCounts = interactions.reduce((acc, i) => {
          acc[i.sentimentAnalysis.overallSentiment] = (acc[i.sentimentAnalysis.overallSentiment] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const totalInteractions = interactions.length;
        const positiveInteractions = sentimentCounts.positive || 0;
        const negativeInteractions = sentimentCounts.negative || 0;
        const averageSentiment = totalInteractions > 0 ? 
          (positiveInteractions - negativeInteractions) / totalInteractions : 0;

        summary = {
          totalInteractions,
          averageSentiment,
          positiveInteractions,
          negativeInteractions,
          averageDuration: interactions.reduce((sum, i) => sum + (i.timing.duration || 0), 0) / totalInteractions,
          resolutionRate: interactions.filter(i => i.status === 'completed' || i.status === 'resolved').length / totalInteractions
        };
        data = { sentimentCounts, interactions };
        break;
      }

      case 'voice_analysis': {
        const voiceInteractions = interactions.filter(i => i.voiceAnalysis);
        const avgAudioQuality = voiceInteractions.reduce((sum, i) => {
          const quality = i.voiceAnalysis!.audioQuality;
          return sum + (quality.clarity + quality.volume + (1 - quality.backgroundNoise) + (1 - quality.distortion)) / 4;
        }, 0) / voiceInteractions.length;

        summary = {
          totalInteractions: voiceInteractions.length,
          averageSentiment: 0,
          positiveInteractions: 0,
          negativeInteractions: 0,
          averageDuration: voiceInteractions.reduce((sum, i) => sum + (i.timing.duration || 0), 0) / voiceInteractions.length,
          resolutionRate: 0
        };
        data = { avgAudioQuality, voiceInteractions };
        break;
      }
      default: {
        // handle other report types or do nothing
        break;
      }
    }


    const report: InteractionReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      reportType: reportType as any,
      period: { startDate, endDate },
      summary,
      data,
      generatedBy,
      createdAt: new Date().toISOString()
    };

    structuredLogger.info('Interaction report generated', { 
      reportId: report.id, 
      organizationId,
      reportType,
      period: `${startDate} to ${endDate}`
    });

    return report;
  }

}

export const interactionsSasAvService = new InteractionsSasAvService();
