interface Interaction {
    id: string;
    organizationId: string;
    type: 'call' | 'email' | 'chat' | 'meeting' | 'social_media' | 'support_ticket' | 'survey';
    channel: 'phone' | 'email' | 'web' | 'mobile' | 'social' | 'in_person' | 'video';
    direction: 'inbound' | 'outbound';
    status: 'active' | 'completed' | 'cancelled' | 'escalated' | 'resolved';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    participants: {
        customerId?: string;
        customerName?: string;
        customerEmail?: string;
        agentId?: string;
        agentName?: string;
        department?: string;
    };
    content: {
        subject?: string;
        summary?: string;
        transcript?: string;
        attachments?: string[];
        tags?: string[];
    };
    timing: {
        startTime: string;
        endTime?: string;
        duration?: number;
        responseTime?: number;
        waitTime?: number;
    };
    sentimentAnalysis: {
        overallSentiment: 'positive' | 'neutral' | 'negative';
        confidence: number;
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
    voiceAnalysis?: {
        audioQuality: {
            clarity: number;
            volume: number;
            backgroundNoise: number;
            distortion: number;
        };
        speechPatterns: {
            speakingRate: number;
            pauseFrequency: number;
            averagePauseLength: number;
            speechClarity: number;
        };
        emotionalTone: {
            stress: number;
            excitement: number;
            calmness: number;
            frustration: number;
        };
        languageAnalysis: {
            language: string;
            dialect?: string;
            accent?: string;
            formality: 'formal' | 'informal' | 'mixed';
            politeness: number;
        };
        voiceBiometrics?: {
            pitch: number;
            tone: number;
            rhythm: number;
            volume: number;
        };
    };
    outcomes: {
        resolution?: string;
        satisfaction?: number;
        followUpRequired?: boolean;
        escalationReason?: string;
        actionItems?: string[];
        nextSteps?: string[];
    };
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
declare class InteractionsSasAvService {
    private interactions;
    private sentimentInsights;
    private voiceInsights;
    constructor();
    init(): void;
    private createDemoData;
    createInteraction(interactionData: Omit<Interaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interaction>;
    getInteraction(interactionId: string): Promise<Interaction | undefined>;
    getInteractions(organizationId: string, filters?: {
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
    }): Promise<Interaction[]>;
    analyzeSentiment(text: string, audioData?: any): Promise<{
        overallSentiment: 'positive' | 'neutral' | 'negative';
        confidence: number;
        emotions: Record<string, number>;
        topics: Array<{
            topic: string;
            sentiment: string;
            confidence: number;
        }>;
        keywords: Array<{
            word: string;
            sentiment: string;
            frequency: number;
        }>;
    }>;
    analyzeVoice(audioData: any): Promise<{
        audioQuality: Record<string, number>;
        speechPatterns: Record<string, number>;
        emotionalTone: Record<string, number>;
        languageAnalysis: Record<string, any>;
    }>;
    generateInsights(interaction: Interaction): Promise<void>;
    createSentimentInsight(insightData: Omit<SentimentInsight, 'id' | 'createdAt' | 'updatedAt'>): Promise<SentimentInsight>;
    createVoiceInsight(insightData: Omit<VoiceInsight, 'id' | 'createdAt' | 'updatedAt'>): Promise<VoiceInsight>;
    getSentimentInsights(organizationId: string, filters?: {
        type?: string;
        severity?: string;
        isActive?: boolean;
        limit?: number;
    }): Promise<SentimentInsight[]>;
    getVoiceInsights(organizationId: string, filters?: {
        type?: string;
        severity?: string;
        isActive?: boolean;
        limit?: number;
    }): Promise<VoiceInsight[]>;
    generateInteractionReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<InteractionReport>;
}
export declare const interactionsSasAvService: InteractionsSasAvService;
export {};
//# sourceMappingURL=interactions-sas-av.service.d.ts.map