import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../index.js';

// ============================================================================
// AI CHAT ADVANCED API INTEGRATION TESTS - PR-35
// ============================================================================

describe('AI Chat Advanced API Integration Tests', () => {
  let testConversationId: string;
  let testMessageId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Wait for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Conversation Management Endpoints', () => {
    it('should create a new conversation', async () => {
      const conversationData = {
        organizationId: 'demo-org-1',
        userId: 'test-user',
        title: 'Integration Test Conversation',
        description: 'Conversation created during integration test',
        tags: ['test', 'integration'],
        context: {
          domain: 'test_domain',
          intent: 'test_intent',
          entities: { test: 'value' },
          preferences: { detail_level: 'high' },
          sessionData: { session_var: 'value' }
        }
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/conversations')
        .send(conversationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.organizationId).toBe(conversationData.organizationId);
      expect(response.body.data.userId).toBe(conversationData.userId);
      expect(response.body.data.title).toBe(conversationData.title);
      expect(response.body.data.description).toBe(conversationData.description);
      expect(response.body.data.tags).toEqual(conversationData.tags);
      expect(response.body.data.context).toEqual(conversationData.context);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.messageCount).toBe(0);
      expect(response.body.timestamp).toBeDefined();

      testConversationId = response.body.data.id;
    });

    it('should get conversations list', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/conversations')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.conversations).toBeDefined();
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should get specific conversation', async () => {
      const response = await request(app)
        .get(`/v1/ai-chat-advanced/conversations/${testConversationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testConversationId);
      expect(response.body.data.title).toBe('Integration Test Conversation');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/conversations/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Conversation not found');
    });

    it('should filter conversations by status', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/conversations')
        .query({
          organizationId: 'demo-org-1',
          status: 'active',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toBeDefined();
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
      expect(response.body.data.conversations.every((c: any) => c.status === 'active')).toBe(true);
    });

    it('should filter conversations by tags', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/conversations')
        .query({
          organizationId: 'demo-org-1',
          tags: 'test',
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toBeDefined();
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
    });

    it('should update conversation', async () => {
      const updates = {
        title: 'Updated Integration Test Conversation',
        status: 'archived',
        tags: ['updated', 'test']
      };

      const response = await request(app)
        .put(`/v1/ai-chat-advanced/conversations/${testConversationId}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testConversationId);
      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.status).toBe(updates.status);
      expect(response.body.data.tags).toEqual(updates.tags);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should delete conversation', async () => {
      const response = await request(app)
        .delete(`/v1/ai-chat-advanced/conversations/${testConversationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Conversation deleted successfully');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 when deleting non-existent conversation', async () => {
      const response = await request(app)
        .delete('/v1/ai-chat-advanced/conversations/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Conversation not found');
    });
  });

  describe('Message Management Endpoints', () => {
    beforeEach(async () => {
      // Create a new conversation for message tests
      const conversationData = {
        organizationId: 'demo-org-1',
        userId: 'test-user',
        title: 'Message Test Conversation',
        description: 'Conversation for message testing',
        tags: ['test', 'messages']
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/conversations')
        .send(conversationData);

      testConversationId = response.body.data.id;
    });

    it('should get messages for conversation', async () => {
      const response = await request(app)
        .get(`/v1/ai-chat-advanced/conversations/${testConversationId}/messages`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.messages).toBeDefined();
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.conversationId).toBe(testConversationId);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should create a new message', async () => {
      const messageData = {
        conversationId: testConversationId,
        role: 'user',
        content: 'Test message content for integration test',
        metadata: {
          provider: 'Azure OpenAI',
          model: 'gpt-4o-mini',
          latency: 1000,
          costEur: 0.001,
          tokensIn: 10,
          tokensOut: 50,
          confidence: 0.95,
          sentiment: 'neutral',
          intent: 'test_intent',
          entities: [
            { type: 'test', value: 'value', confidence: 0.9 }
          ]
        }
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.conversationId).toBe(messageData.conversationId);
      expect(response.body.data.role).toBe(messageData.role);
      expect(response.body.data.content).toBe(messageData.content);
      expect(response.body.data.metadata).toEqual(messageData.metadata);
      expect(response.body.timestamp).toBeDefined();

      testMessageId = response.body.data.id;
    });

    it('should get specific message', async () => {
      const response = await request(app)
        .get(`/v1/ai-chat-advanced/messages/${testMessageId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testMessageId);
      expect(response.body.data.content).toBe('Test message content for integration test');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/messages/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Message not found');
    });

    it('should filter messages by role', async () => {
      const response = await request(app)
        .get(`/v1/ai-chat-advanced/conversations/${testConversationId}/messages`)
        .query({ role: 'user', limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toBeDefined();
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.messages.every((m: any) => m.role === 'user')).toBe(true);
    });

    it('should filter messages with offset', async () => {
      const response = await request(app)
        .get(`/v1/ai-chat-advanced/conversations/${testConversationId}/messages`)
        .query({ limit: 5, offset: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toBeDefined();
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });
  });

  describe('Chat Processing Endpoints', () => {
    beforeEach(async () => {
      // Create a new conversation for chat processing tests
      const conversationData = {
        organizationId: 'demo-org-1',
        userId: 'test-user',
        title: 'Chat Processing Test',
        description: 'Conversation for chat processing testing',
        tags: ['test', 'chat']
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/conversations')
        .send(conversationData);

      testConversationId = response.body.data.id;
    });

    it('should process chat message with AI', async () => {
      const chatData = {
        conversationId: testConversationId,
        content: 'Necesito un análisis del inventario del Q3',
        userId: 'test-user',
        organizationId: 'demo-org-1'
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/chat/process')
        .send(chatData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.message.role).toBe('assistant');
      expect(response.body.data.message.content).toBeDefined();
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.sentiment).toMatch(/positive|negative|neutral/);
      expect(response.body.data.analysis.intent).toBeDefined();
      expect(response.body.data.analysis.entities).toBeDefined();
      expect(Array.isArray(response.body.data.analysis.entities)).toBe(true);
      expect(response.body.data.analysis.topics).toBeDefined();
      expect(Array.isArray(response.body.data.analysis.topics)).toBe(true);
      expect(response.body.data.analysis.confidence).toBeGreaterThan(0);
      expect(response.body.data.analysis.confidence).toBeLessThanOrEqual(1);
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
      expect(response.body.data.relatedTopics).toBeDefined();
      expect(Array.isArray(response.body.data.relatedTopics)).toBe(true);
      expect(response.body.data.contextUpdate).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should analyze message without processing', async () => {
      const analysisData = {
        content: 'Necesito un análisis del inventario del Q3',
        context: { domain: 'inventory_management' }
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/chat/analyze')
        .send(analysisData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sentiment).toMatch(/positive|negative|neutral/);
      expect(response.body.data.intent).toBeDefined();
      expect(response.body.data.entities).toBeDefined();
      expect(Array.isArray(response.body.data.entities)).toBe(true);
      expect(response.body.data.topics).toBeDefined();
      expect(Array.isArray(response.body.data.topics)).toBe(true);
      expect(response.body.data.confidence).toBeGreaterThan(0);
      expect(response.body.data.confidence).toBeLessThanOrEqual(1);
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Session Management Endpoints', () => {
    beforeEach(async () => {
      // Create a new conversation for session tests
      const conversationData = {
        organizationId: 'demo-org-1',
        userId: 'test-user',
        title: 'Session Test Conversation',
        description: 'Conversation for session testing',
        tags: ['test', 'session']
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/conversations')
        .send(conversationData);

      testConversationId = response.body.data.id;
    });

    it('should create a new session', async () => {
      const sessionData = {
        conversationId: testConversationId,
        userId: 'test-user',
        organizationId: 'demo-org-1',
        context: {
          currentTopic: 'test_topic',
          userPreferences: { detail_level: 'high' },
          conversationHistory: [],
          activeEntities: { test: 'value' },
          sessionVariables: { var1: 'value1' }
        },
        isActive: true
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/sessions')
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.conversationId).toBe(sessionData.conversationId);
      expect(response.body.data.userId).toBe(sessionData.userId);
      expect(response.body.data.organizationId).toBe(sessionData.organizationId);
      expect(response.body.data.context).toEqual(sessionData.context);
      expect(response.body.data.isActive).toBe(sessionData.isActive);
      expect(response.body.data.lastActivityAt).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      testSessionId = response.body.data.id;
    });

    it('should get specific session', async () => {
      const response = await request(app)
        .get(`/v1/ai-chat-advanced/sessions/${testSessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testSessionId);
      expect(response.body.data.conversationId).toBe(testConversationId);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/sessions/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Session not found');
    });

    it('should update session', async () => {
      const updates = {
        context: {
          currentTopic: 'updated_topic',
          userPreferences: { detail_level: 'medium' }
        },
        isActive: false
      };

      const response = await request(app)
        .put(`/v1/ai-chat-advanced/sessions/${testSessionId}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testSessionId);
      expect(response.body.data.context.currentTopic).toBe('updated_topic');
      expect(response.body.data.context.userPreferences.detail_level).toBe('medium');
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.data.lastActivityAt).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 404 when updating non-existent session', async () => {
      const updates = { isActive: false };
      const response = await request(app)
        .put('/v1/ai-chat-advanced/sessions/non-existent-id')
        .send(updates)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Session not found');
    });
  });

  describe('Analytics and Statistics Endpoints', () => {
    it('should get chat statistics', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/statistics')
        .query({ organizationId: 'demo-org-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalConversations).toBeDefined();
      expect(response.body.data.totalMessages).toBeDefined();
      expect(response.body.data.activeConversations).toBeDefined();
      expect(response.body.data.averageMessagesPerConversation).toBeDefined();
      expect(response.body.data.topIntents).toBeDefined();
      expect(Array.isArray(response.body.data.topIntents)).toBe(true);
      expect(response.body.data.topTopics).toBeDefined();
      expect(Array.isArray(response.body.data.topTopics)).toBe(true);
      expect(response.body.data.sentimentDistribution).toBeDefined();
      expect(response.body.data.averageResponseTime).toBeDefined();
      expect(response.body.data.totalCost).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should filter statistics by user', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/statistics')
        .query({
          organizationId: 'demo-org-1',
          userId: 'user_1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalConversations).toBeGreaterThanOrEqual(0);
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/v1/ai-chat-advanced/statistics')
        .query({
          organizationId: 'demo-org-1',
          startDate,
          endDate
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalMessages).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Health Check Endpoints', () => {
    it('should get AI chat health status', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('ok');
      expect(response.body.data.totalConversations).toBeDefined();
      expect(response.body.data.totalMessages).toBeDefined();
      expect(response.body.data.activeConversations).toBeDefined();
      expect(response.body.data.averageResponseTime).toBeDefined();
      expect(response.body.data.totalCost).toBeDefined();
      expect(response.body.data.lastUpdated).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should return 400 for invalid conversation data', async () => {
      const invalidConversationData = {
        organizationId: '', // Invalid: empty organizationId
        userId: '', // Invalid: empty userId
        title: '', // Invalid: empty title
        status: 'invalid_status', // Invalid: not in enum
        tags: 'invalid_tags' // Invalid: not an array
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/conversations')
        .send(invalidConversationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid message data', async () => {
      const invalidMessageData = {
        conversationId: '', // Invalid: empty conversationId
        role: 'invalid_role', // Invalid: not in enum
        content: '', // Invalid: empty content
        metadata: {
          sentiment: 'invalid_sentiment', // Invalid: not in enum
          confidence: 'invalid_confidence', // Invalid: not a number
          entities: 'invalid_entities' // Invalid: not an array
        }
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/messages')
        .send(invalidMessageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid chat processing data', async () => {
      const invalidChatData = {
        conversationId: '', // Invalid: empty conversationId
        content: '', // Invalid: empty content
        userId: '', // Invalid: empty userId
        organizationId: '' // Invalid: empty organizationId
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/chat/process')
        .send(invalidChatData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid session data', async () => {
      const invalidSessionData = {
        conversationId: '', // Invalid: empty conversationId
        userId: '', // Invalid: empty userId
        organizationId: '', // Invalid: empty organizationId
        isActive: 'invalid_boolean' // Invalid: not a boolean
      };

      const response = await request(app)
        .post('/v1/ai-chat-advanced/sessions')
        .send(invalidSessionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for invalid statistics query', async () => {
      const response = await request(app)
        .get('/v1/ai-chat-advanced/statistics')
        .query({
          organizationId: '', // Invalid: empty organizationId
          startDate: 'invalid-date', // Invalid: not a valid date
          endDate: 'invalid-date' // Invalid: not a valid date
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });
  });
});
