import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiChatAdvancedService } from '../../lib/ai-chat-advanced.service.js';

// ============================================================================
// AI CHAT ADVANCED SERVICE UNIT TESTS - PR-35
// ============================================================================

describe('AIChatAdvancedService', () => {
  beforeEach(() => {
    // Reset service state before each test
    vi.clearAllMocks();
  });

  describe('Conversation Management', () => {
    it('should create a new conversation', async () => {
      const conversationData = {
        organizationId: 'test-org',
        userId: 'test-user',
        title: 'Test Conversation',
        description: 'Test conversation description',
        status: 'active' as const,
        tags: ['test', 'demo'],
        context: {
          domain: 'test_domain',
          intent: 'test_intent',
          entities: { test: 'value' },
          preferences: { detail_level: 'high' },
          sessionData: { session_var: 'value' }
        }
      };

      const conversation = await aiChatAdvancedService.createConversation(conversationData);

      expect(conversation).toBeDefined();
      expect(conversation.id).toBeDefined();
      expect(conversation.organizationId).toBe(conversationData.organizationId);
      expect(conversation.userId).toBe(conversationData.userId);
      expect(conversation.title).toBe(conversationData.title);
      expect(conversation.description).toBe(conversationData.description);
      expect(conversation.status).toBe(conversationData.status);
      expect(conversation.tags).toEqual(conversationData.tags);
      expect(conversation.context).toEqual(conversationData.context);
      expect(conversation.messageCount).toBe(0);
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.updatedAt).toBeDefined();
    });

    it('should get a conversation by ID', async () => {
      const conversation = await aiChatAdvancedService.getConversation('conv_1');
      
      expect(conversation).toBeDefined();
      expect(conversation?.id).toBe('conv_1');
      expect(conversation?.title).toBe('Análisis de Inventario Q3');
      expect(conversation?.status).toBe('active');
    });

    it('should return undefined for non-existent conversation', async () => {
      const conversation = await aiChatAdvancedService.getConversation('non-existent');
      
      expect(conversation).toBeUndefined();
    });

    it('should get conversations with filters', async () => {
      const conversations = await aiChatAdvancedService.getConversations('demo-org-1', {
        status: 'active',
        limit: 10
      });

      expect(conversations).toBeDefined();
      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.every(c => c.status === 'active')).toBe(true);
    });

    it('should filter conversations by tags', async () => {
      const conversations = await aiChatAdvancedService.getConversations('demo-org-1', {
        tags: ['inventory'],
        limit: 10
      });

      expect(conversations).toBeDefined();
      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.every(c => c.tags.includes('inventory'))).toBe(true);
    });

    it('should update a conversation', async () => {
      const updates = {
        title: 'Updated Title',
        status: 'archived' as const,
        tags: ['updated', 'test']
      };

      const updatedConversation = await aiChatAdvancedService.updateConversation('conv_1', updates);

      expect(updatedConversation).toBeDefined();
      expect(updatedConversation?.title).toBe(updates.title);
      expect(updatedConversation?.status).toBe(updates.status);
      expect(updatedConversation?.tags).toEqual(updates.tags);
      expect(updatedConversation?.updatedAt).toBeDefined();
    });

    it('should return undefined when updating non-existent conversation', async () => {
      const updates = { title: 'New Title' };
      const result = await aiChatAdvancedService.updateConversation('non-existent', updates);

      expect(result).toBeUndefined();
    });

    it('should delete a conversation', async () => {
      const success = await aiChatAdvancedService.deleteConversation('conv_1');

      expect(success).toBe(true);
      
      // Verify conversation is marked as deleted
      const conversation = await aiChatAdvancedService.getConversation('conv_1');
      expect(conversation?.status).toBe('deleted');
    });

    it('should return false when deleting non-existent conversation', async () => {
      const success = await aiChatAdvancedService.deleteConversation('non-existent');

      expect(success).toBe(false);
    });
  });

  describe('Message Management', () => {
    it('should create a new message', async () => {
      const messageData = {
        conversationId: 'conv_1',
        role: 'user' as const,
        content: 'Test message content',
        metadata: {
          provider: 'Azure OpenAI',
          model: 'gpt-4o-mini',
          latency: 1000,
          costEur: 0.001,
          tokensIn: 10,
          tokensOut: 50,
          confidence: 0.95,
          sentiment: 'neutral' as const,
          intent: 'test_intent',
          entities: [
            { type: 'test', value: 'value', confidence: 0.9 }
          ]
        }
      };

      const message = await aiChatAdvancedService.createMessage(messageData);

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.conversationId).toBe(messageData.conversationId);
      expect(message.role).toBe(messageData.role);
      expect(message.content).toBe(messageData.content);
      expect(message.metadata).toEqual(messageData.metadata);
      expect(message.timestamp).toBeDefined();
    });

    it('should get messages for a conversation', async () => {
      const messages = await aiChatAdvancedService.getMessages('conv_1', {
        limit: 10,
        role: 'user'
      });

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.every(m => m.role === 'user')).toBe(true);
    });

    it('should get messages with offset', async () => {
      const messages = await aiChatAdvancedService.getMessages('conv_1', {
        limit: 5,
        offset: 2
      });

      expect(messages).toBeDefined();
      expect(Array.isArray(messages)).toBe(true);
    });

    it('should get a specific message', async () => {
      const message = await aiChatAdvancedService.getMessage('msg_1');

      expect(message).toBeDefined();
      expect(message?.id).toBe('msg_1');
      expect(message?.conversationId).toBe('conv_1');
      expect(message?.role).toBe('user');
    });

    it('should return undefined for non-existent message', async () => {
      const message = await aiChatAdvancedService.getMessage('non-existent');

      expect(message).toBeUndefined();
    });
  });

  describe('Session Management', () => {
    it('should create a new session', async () => {
      const sessionData = {
        conversationId: 'conv_1',
        userId: 'test-user',
        organizationId: 'test-org',
        context: {
          currentTopic: 'test_topic',
          userPreferences: { detail_level: 'high' },
          conversationHistory: [],
          activeEntities: { test: 'value' },
          sessionVariables: { var1: 'value1' }
        },
        isActive: true
      };

      const session = await aiChatAdvancedService.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.conversationId).toBe(sessionData.conversationId);
      expect(session.userId).toBe(sessionData.userId);
      expect(session.organizationId).toBe(sessionData.organizationId);
      expect(session.context).toEqual(sessionData.context);
      expect(session.isActive).toBe(sessionData.isActive);
      expect(session.lastActivityAt).toBeDefined();
      expect(session.createdAt).toBeDefined();
    });

    it('should get a session by ID', async () => {
      const session = await aiChatAdvancedService.getSession('session_1');

      expect(session).toBeDefined();
      expect(session?.id).toBe('session_1');
      expect(session?.conversationId).toBe('conv_1');
      expect(session?.isActive).toBe(true);
    });

    it('should return undefined for non-existent session', async () => {
      const session = await aiChatAdvancedService.getSession('non-existent');

      expect(session).toBeUndefined();
    });

    it('should update a session', async () => {
      const updates = {
        context: {
          currentTopic: 'updated_topic',
          userPreferences: { detail_level: 'medium' }
        },
        isActive: false
      };

      const updatedSession = await aiChatAdvancedService.updateSession('session_1', updates);

      expect(updatedSession).toBeDefined();
      expect(updatedSession?.context.currentTopic).toBe('updated_topic');
      expect(updatedSession?.context.userPreferences?.detail_level).toBe('medium');
      expect(updatedSession?.isActive).toBe(false);
      expect(updatedSession?.lastActivityAt).toBeDefined();
    });

    it('should return undefined when updating non-existent session', async () => {
      const updates = { isActive: false };
      const result = await aiChatAdvancedService.updateSession('non-existent', updates);

      expect(result).toBeUndefined();
    });
  });

  describe('AI Analysis', () => {
    it('should analyze message content', async () => {
      const content = 'Necesito un análisis del inventario del Q3';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis).toBeDefined();
      expect(analysis.sentiment).toMatch(/positive|negative|neutral/);
      expect(analysis.intent).toBeDefined();
      expect(analysis.entities).toBeDefined();
      expect(Array.isArray(analysis.entities)).toBe(true);
      expect(analysis.topics).toBeDefined();
      expect(Array.isArray(analysis.topics)).toBe(true);
      expect(analysis.confidence).toBeGreaterThan(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
      expect(analysis.suggestions).toBeDefined();
      expect(Array.isArray(analysis.suggestions)).toBe(true);
    });

    it('should detect positive sentiment', async () => {
      const content = 'Excelente trabajo, gracias por la ayuda';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', async () => {
      const content = 'Esto está mal, hay un error en el sistema';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.sentiment).toBe('negative');
    });

    it('should detect neutral sentiment', async () => {
      const content = 'Necesito información sobre el inventario';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.sentiment).toBe('neutral');
    });

    it('should extract intent from content', async () => {
      const content = 'Necesito un análisis del inventario del Q3';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.intent).toBe('analysis_request');
    });

    it('should extract entities from content', async () => {
      const content = 'Análisis del inventario del Q3';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.entities).toBeDefined();
      expect(analysis.entities.length).toBeGreaterThan(0);
      
      const periodEntity = analysis.entities.find(e => e.type === 'period');
      expect(periodEntity).toBeDefined();
      expect(periodEntity?.value).toBe('Q3');
    });

    it('should extract topics from content', async () => {
      const content = 'Necesito un análisis del inventario y reportes financieros';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.topics).toBeDefined();
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.topics).toContain('inventory_management');
    });

    it('should generate suggestions based on intent', async () => {
      const content = 'Necesito un análisis del inventario';
      const analysis = await aiChatAdvancedService.analyzeMessage(content);

      expect(analysis.suggestions).toBeDefined();
      expect(analysis.suggestions.length).toBeGreaterThan(0);
      expect(analysis.suggestions[0]).toContain('análisis');
    });
  });

  describe('Chat Processing', () => {
    it('should process chat message with AI', async () => {
      const response = await aiChatAdvancedService.processChatMessage(
        'conv_1',
        'Necesito un análisis del inventario del Q3',
        'test-user',
        'test-org'
      );

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.message.role).toBe('assistant');
      expect(response.message.content).toBeDefined();
      expect(response.analysis).toBeDefined();
      expect(response.suggestions).toBeDefined();
      expect(response.relatedTopics).toBeDefined();
      expect(response.contextUpdate).toBeDefined();
    });

    it('should update conversation message count', async () => {
      const initialConversation = await aiChatAdvancedService.getConversation('conv_1');
      const initialCount = initialConversation?.messageCount || 0;

      await aiChatAdvancedService.processChatMessage(
        'conv_1',
        'Test message',
        'test-user',
        'test-org'
      );

      const updatedConversation = await aiChatAdvancedService.getConversation('conv_1');
      expect(updatedConversation?.messageCount).toBe(initialCount + 2); // User message + AI response
    });

    it('should update conversation last message time', async () => {
      const initialConversation = await aiChatAdvancedService.getConversation('conv_1');
      const initialTime = initialConversation?.lastMessageAt;

      await aiChatAdvancedService.processChatMessage(
        'conv_1',
        'Test message',
        'test-user',
        'test-org'
      );

      const updatedConversation = await aiChatAdvancedService.getConversation('conv_1');
      expect(new Date(updatedConversation?.lastMessageAt || '').getTime())
        .toBeGreaterThan(new Date(initialTime || '').getTime());
    });
  });

  describe('Statistics and Analytics', () => {
    it('should get chat statistics', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1');

      expect(statistics).toBeDefined();
      expect(statistics.totalConversations).toBeDefined();
      expect(statistics.totalMessages).toBeDefined();
      expect(statistics.activeConversations).toBeDefined();
      expect(statistics.averageMessagesPerConversation).toBeDefined();
      expect(statistics.topIntents).toBeDefined();
      expect(Array.isArray(statistics.topIntents)).toBe(true);
      expect(statistics.topTopics).toBeDefined();
      expect(Array.isArray(statistics.topTopics)).toBe(true);
      expect(statistics.sentimentDistribution).toBeDefined();
      expect(statistics.averageResponseTime).toBeDefined();
      expect(statistics.totalCost).toBeDefined();
    });

    it('should filter statistics by user', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1', {
        userId: 'user_1'
      });

      expect(statistics).toBeDefined();
      expect(statistics.totalConversations).toBeGreaterThanOrEqual(0);
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1', {
        startDate,
        endDate
      });

      expect(statistics).toBeDefined();
      expect(statistics.totalMessages).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average response time', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1');

      expect(statistics.averageResponseTime).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total cost', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1');

      expect(statistics.totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should provide sentiment distribution', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1');

      expect(statistics.sentimentDistribution).toBeDefined();
      expect(typeof statistics.sentimentDistribution).toBe('object');
    });

    it('should provide top intents sorted by count', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1');

      expect(statistics.topIntents).toBeDefined();
      expect(Array.isArray(statistics.topIntents)).toBe(true);
      
      // Verify sorting (if there are multiple intents)
      if (statistics.topIntents.length > 1) {
        for (let i = 1; i < statistics.topIntents.length; i++) {
          expect(statistics.topIntents[i-1].count).toBeGreaterThanOrEqual(statistics.topIntents[i].count);
        }
      }
    });

    it('should provide top topics sorted by count', async () => {
      const statistics = await aiChatAdvancedService.getChatStatistics('demo-org-1');

      expect(statistics.topTopics).toBeDefined();
      expect(Array.isArray(statistics.topTopics)).toBe(true);
      
      // Verify sorting (if there are multiple topics)
      if (statistics.topTopics.length > 1) {
        for (let i = 1; i < statistics.topTopics.length; i++) {
          expect(statistics.topTopics[i-1].count).toBeGreaterThanOrEqual(statistics.topTopics[i].count);
        }
      }
    });
  });
});
