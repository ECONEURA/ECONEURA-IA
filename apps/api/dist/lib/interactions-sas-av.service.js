import { structuredLogger } from './structured-logger.js';
class InteractionsSasAvService {
    interactions = new Map();
    sentimentInsights = new Map();
    voiceInsights = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        structuredLogger.info('Interactions SAS + AV Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const interaction1 = {
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
                duration: 900,
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
        const interaction2 = {
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
                duration: 2700,
                responseTime: 300,
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
        const interaction3 = {
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
                duration: 480,
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
        const sentimentInsight1 = {
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
        const voiceInsight1 = {
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
    async createInteraction(interactionData) {
        const now = new Date().toISOString();
        const newInteraction = {
            id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...interactionData,
            createdAt: now,
            updatedAt: now
        };
        this.interactions.set(newInteraction.id, newInteraction);
        await this.generateInsights(newInteraction);
        structuredLogger.info('Interaction created', {
            interactionId: newInteraction.id,
            organizationId: newInteraction.organizationId,
            type: newInteraction.type,
            sentiment: newInteraction.sentimentAnalysis.overallSentiment
        });
        return newInteraction;
    }
    async getInteraction(interactionId) {
        return this.interactions.get(interactionId);
    }
    async getInteractions(organizationId, filters = {}) {
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
            interactions = interactions.filter(i => i.timing.startTime >= filters.startDate);
        }
        if (filters.endDate) {
            interactions = interactions.filter(i => i.timing.startTime <= filters.endDate);
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
    async analyzeSentiment(text, audioData) {
        const positiveWords = ['excelente', 'perfecto', 'gracias', 'útil', 'genial', 'fantástico', 'maravilloso'];
        const negativeWords = ['error', 'problema', 'urgente', 'malo', 'terrible', 'horrible', 'frustrado'];
        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;
        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw)))
                positiveScore++;
            if (negativeWords.some(nw => word.includes(nw)))
                negativeScore++;
        });
        const totalWords = words.length;
        const positiveRatio = positiveScore / totalWords;
        const negativeRatio = negativeScore / totalWords;
        let overallSentiment;
        let confidence;
        if (positiveRatio > negativeRatio && positiveRatio > 0.1) {
            overallSentiment = 'positive';
            confidence = Math.min(0.9, positiveRatio * 2);
        }
        else if (negativeRatio > positiveRatio && negativeRatio > 0.1) {
            overallSentiment = 'negative';
            confidence = Math.min(0.9, negativeRatio * 2);
        }
        else {
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
    async analyzeVoice(audioData) {
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
    async generateInsights(interaction) {
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
    async createSentimentInsight(insightData) {
        const now = new Date().toISOString();
        const newInsight = {
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
    async createVoiceInsight(insightData) {
        const now = new Date().toISOString();
        const newInsight = {
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
    async getSentimentInsights(organizationId, filters = {}) {
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
    async getVoiceInsights(organizationId, filters = {}) {
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
    async generateInteractionReport(organizationId, reportType, startDate, endDate, generatedBy) {
        const interactions = Array.from(this.interactions.values()).filter(i => i.organizationId === organizationId &&
            i.timing.startTime >= startDate &&
            i.timing.startTime <= endDate);
        let summary = {};
        let data = {};
        switch (reportType) {
            case 'sentiment_summary': {
                const sentimentCounts = interactions.reduce((acc, i) => {
                    acc[i.sentimentAnalysis.overallSentiment] = (acc[i.sentimentAnalysis.overallSentiment] || 0) + 1;
                    return acc;
                }, {});
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
                    const quality = i.voiceAnalysis.audioQuality;
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
                break;
            }
        }
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            organizationId,
            reportType: reportType,
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
//# sourceMappingURL=interactions-sas-av.service.js.map