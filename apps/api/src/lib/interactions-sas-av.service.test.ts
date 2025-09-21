/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { interactionsSasAvService } from './interactions-sas-av.service.js';

describe('InteractionsSasAvService', () => {
  it('should create interaction', async () => {
    const interaction = await interactionsSasAvService.createInteraction({
      organizationId: 'test-org',
      type: 'call',
      channel: 'phone',
      direction: 'inbound',
      status: 'active',
      priority: 'medium',
      participants: {},
      content: {},
      timing: { startTime: new Date().toISOString() },
      sentimentAnalysis: { overallSentiment: 'neutral', confidence: 0.5, emotions: {}, topics: [], keywords: [], sentimentTrend: [] },
      outcomes: {},
      metadata: { source: 'test' }
    });
    expect(interaction.id).toBeDefined();
  });

  it('should analyze sentiment', async () => {
    const result = await interactionsSasAvService.analyzeSentiment('This is a great product!');
    expect(result.overallSentiment).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should analyze voice', async () => {
    const result = await interactionsSasAvService.analyzeVoice({});
    expect(result.audioQuality).toBeDefined();
    expect(result.speechPatterns).toBeDefined();
  });
});
