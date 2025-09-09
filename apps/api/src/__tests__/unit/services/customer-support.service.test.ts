/**
 * CUSTOMER SUPPORT SERVICE TESTS
 *
 * PR-58: Pruebas unitarias para el servicio de soporte al cliente
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CustomerSupportService } from '../../../services/customer-support.service.js';

// Mock the database service
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: vi.fn(() => ({
    query: vi.fn()
  }))
}));

// Mock the structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('CustomerSupportService', () => {
  let service: CustomerSupportService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn()
    };

    // Mock the database service to return our mock
    vi.mocked(require('../../../lib/database.service.js').getDatabaseService).mockReturnValue(mockDb);

    service = new CustomerSupportService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTicket', () => {
    it('should create a new support ticket successfully', async () => {
      const organizationId = 'test-org';
      const ticketData = {
        customerId: 'customer-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Technical Issue',
        description: 'I am experiencing a technical problem with the application.',
        category: 'technical' as const,
        priority: 'medium' as const,
        status: 'open' as const,
        source: 'portal' as const,
        tags: ['urgent', 'bug'],
        attachments: []
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createTicket(organizationId, ticketData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.customerId).toBe(ticketData.customerId);
      expect(result.customerEmail).toBe(ticketData.customerEmail);
      expect(result.customerName).toBe(ticketData.customerName);
      expect(result.subject).toBe(ticketData.subject);
      expect(result.description).toBe(ticketData.description);
      expect(result.category).toBe(ticketData.category);
      expect(result.priority).toBe(ticketData.priority);
      expect(result.status).toBe(ticketData.status);
      expect(result.source).toBe(ticketData.source);
      expect(result.tags).toEqual(ticketData.tags);
      expect(result.attachments).toEqual(ticketData.attachments);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO support_tickets'),
        expect.arrayContaining([
          result.id,
          organizationId,
          ticketData.customerId,
          ticketData.customerEmail,
          ticketData.customerName,
          ticketData.subject,
          ticketData.description,
          ticketData.category,
          ticketData.priority,
          ticketData.status,
          ticketData.source,
          undefined, // assignedTo
          undefined, // assignedAt
          undefined, // resolvedAt
          undefined, // closedAt
          JSON.stringify(ticketData.tags),
          JSON.stringify(ticketData.attachments),
          JSON.stringify({}),
          result.createdAt,
          result.updatedAt
        ])
      );
    });

    it('should handle database errors when creating ticket', async () => {
      const organizationId = 'test-org';
      const ticketData = {
        customerId: 'customer-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Technical Issue',
        description: 'I am experiencing a technical problem.',
        category: 'technical' as const,
        priority: 'medium' as const,
        status: 'open' as const,
        source: 'portal' as const,
        tags: [],
        attachments: []
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(service.createTicket(organizationId, ticketData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getTicket', () => {
    it('should return ticket when found', async () => {
      const ticketId = 'test-ticket-id';
      const organizationId = 'test-org';

      const mockTicket = {
        id: ticketId,
        organizationId,
        customerId: 'customer-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Technical Issue',
        description: 'I am experiencing a technical problem.',
        category: 'technical',
        priority: 'medium',
        status: 'open',
        source: 'portal',
        tags: [],
        attachments: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the tickets Map
      (service as any).tickets.set(ticketId, mockTicket);

      const result = await service.getTicket(ticketId, organizationId);

      expect(result).toEqual(mockTicket);
    });

    it('should return null when ticket not found', async () => {
      const ticketId = 'non-existent-id';
      const organizationId = 'test-org';

      const result = await service.getTicket(ticketId, organizationId);

      expect(result).toBeNull();
    });

    it('should return null when ticket belongs to different organization', async () => {
      const ticketId = 'test-ticket-id';
      const organizationId = 'test-org';
      const differentOrgId = 'different-org';

      const mockTicket = {
        id: ticketId,
        organizationId: differentOrgId,
        customerId: 'customer-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Technical Issue',
        description: 'I am experiencing a technical problem.',
        category: 'technical',
        priority: 'medium',
        status: 'open',
        source: 'portal',
        tags: [],
        attachments: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the tickets Map
      (service as any).tickets.set(ticketId, mockTicket);

      const result = await service.getTicket(ticketId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status successfully', async () => {
      const ticketId = 'test-ticket-id';
      const organizationId = 'test-org';
      const newStatus = 'resolved';
      const updatedBy = 'agent-123';

      const mockTicket = {
        id: ticketId,
        organizationId,
        customerId: 'customer-123',
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        subject: 'Technical Issue',
        description: 'I am experiencing a technical problem.',
        category: 'technical',
        priority: 'medium',
        status: 'open',
        source: 'portal',
        tags: [],
        attachments: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the tickets Map
      (service as any).tickets.set(ticketId, mockTicket);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.updateTicketStatus(ticketId, organizationId, newStatus, updatedBy);

      expect(result).toBeDefined();
      expect(result?.status).toBe(newStatus);
      expect(result?.resolvedAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE support_tickets'),
        expect.arrayContaining([newStatus, expect.any(Date), expect.any(Date), ticketId, organizationId])
      );
    });

    it('should return null when ticket not found', async () => {
      const ticketId = 'non-existent-id';
      const organizationId = 'test-org';
      const newStatus = 'resolved';
      const updatedBy = 'agent-123';

      const result = await service.updateTicketStatus(ticketId, organizationId, newStatus, updatedBy);

      expect(result).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should send a chat message successfully', async () => {
      const ticketId = 'test-ticket-id';
      const senderId = 'customer-123';
      const senderType = 'customer' as const;
      const message = 'Hello, I need help with my account.';
      const messageType = 'text' as const;
      const attachments: any[] = [];

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.sendMessage(
        ticketId,
        senderId,
        senderType,
        message,
        messageType,
        attachments
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.ticketId).toBe(ticketId);
      expect(result.senderId).toBe(senderId);
      expect(result.senderType).toBe(senderType);
      expect(result.message).toBe(message);
      expect(result.messageType).toBe(messageType);
      expect(result.attachments).toEqual(attachments);
      expect(result.isRead).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_messages'),
        expect.arrayContaining([
          result.id,
          ticketId,
          senderId,
          senderType,
          message,
          messageType,
          JSON.stringify(attachments),
          false,
          undefined,
          result.createdAt
        ])
      );
    });

    it('should handle database errors when sending message', async () => {
      const ticketId = 'test-ticket-id';
      const senderId = 'customer-123';
      const senderType = 'customer' as const;
      const message = 'Hello, I need help.';

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(service.sendMessage(ticketId, senderId, senderType, message))
        .rejects.toThrow('Database error');
    });
  });

  describe('getTicketMessages', () => {
    it('should return messages for a ticket', async () => {
      const ticketId = 'test-ticket-id';

      const mockMessages = [
        {
          id: 'message-1',
          ticketId,
          senderId: 'customer-123',
          senderType: 'customer' as const,
          message: 'Hello, I need help.',
          messageType: 'text' as const,
          attachments: [],
          isRead: false,
          createdAt: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: 'message-2',
          ticketId,
          senderId: 'agent-123',
          senderType: 'agent' as const,
          message: 'Hello! How can I help you?',
          messageType: 'text' as const,
          attachments: [],
          isRead: true,
          createdAt: new Date('2024-01-01T10:05:00Z')
        }
      ];

      // Mock the messages Map
      (service as any).messages.set('message-1', mockMessages[0]);
      (service as any).messages.set('message-2', mockMessages[1]);

      const result = await service.getTicketMessages(ticketId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('message-1');
      expect(result[1].id).toBe('message-2');
      expect(result[0].createdAt.getTime()).toBeLessThan(result[1].createdAt.getTime());
    });

    it('should return empty array when no messages found', async () => {
      const ticketId = 'non-existent-ticket';

      const result = await service.getTicketMessages(ticketId);

      expect(result).toEqual([]);
    });
  });

  describe('createArticle', () => {
    it('should create a knowledge base article successfully', async () => {
      const organizationId = 'test-org';
      const articleData = {
        title: 'How to Reset Password',
        content: 'To reset your password, follow these steps...',
        category: 'account',
        tags: ['password', 'security', 'account'],
        isPublished: true,
        viewCount: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        authorId: 'author-123'
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createArticle(organizationId, articleData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.title).toBe(articleData.title);
      expect(result.content).toBe(articleData.content);
      expect(result.category).toBe(articleData.category);
      expect(result.tags).toEqual(articleData.tags);
      expect(result.isPublished).toBe(articleData.isPublished);
      expect(result.viewCount).toBe(articleData.viewCount);
      expect(result.helpfulCount).toBe(articleData.helpfulCount);
      expect(result.notHelpfulCount).toBe(articleData.notHelpfulCount);
      expect(result.authorId).toBe(articleData.authorId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO knowledge_base_articles'),
        expect.arrayContaining([
          result.id,
          organizationId,
          articleData.title,
          articleData.content,
          articleData.category,
          JSON.stringify(articleData.tags),
          articleData.isPublished,
          articleData.viewCount,
          articleData.helpfulCount,
          articleData.notHelpfulCount,
          articleData.authorId,
          result.createdAt,
          result.updatedAt
        ])
      );
    });

    it('should handle database errors when creating article', async () => {
      const organizationId = 'test-org';
      const articleData = {
        title: 'Test Article',
        content: 'Test content',
        category: 'test',
        tags: [],
        isPublished: true,
        viewCount: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        authorId: 'author-123'
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(service.createArticle(organizationId, articleData))
        .rejects.toThrow('Database error');
    });
  });

  describe('searchArticles', () => {
    it('should search articles with query and category filter', async () => {
      const organizationId = 'test-org';
      const query = 'password';
      const category = 'account';

      const mockArticles = [
        {
          id: 'article-1',
          organizationId,
          title: 'How to Reset Password',
          content: 'To reset your password, follow these steps...',
          category: 'account',
          tags: ['password', 'security'],
          isPublished: true,
          viewCount: 100,
          helpfulCount: 50,
          notHelpfulCount: 5,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'article-2',
          organizationId,
          title: 'Password Security Best Practices',
          content: 'Here are some best practices for password security...',
          category: 'account',
          tags: ['password', 'security', 'best-practices'],
          isPublished: true,
          viewCount: 80,
          helpfulCount: 40,
          notHelpfulCount: 2,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'article-3',
          organizationId,
          title: 'General FAQ',
          content: 'Frequently asked questions...',
          category: 'general',
          tags: ['faq', 'general'],
          isPublished: true,
          viewCount: 50,
          helpfulCount: 20,
          notHelpfulCount: 1,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock the articles Map
      (service as any).articles.set('article-1', mockArticles[0]);
      (service as any).articles.set('article-2', mockArticles[1]);
      (service as any).articles.set('article-3', mockArticles[2]);

      const result = await service.searchArticles(organizationId, query, category);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('article-1'); // Higher score due to more views and helpful votes
      expect(result[1].id).toBe('article-2');
      expect(result.every(article => article.category === category)).toBe(true);
      expect(result.every(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      )).toBe(true);
    });

    it('should return all published articles when no query provided', async () => {
      const organizationId = 'test-org';

      const mockArticles = [
        {
          id: 'article-1',
          organizationId,
          title: 'Article 1',
          content: 'Content 1',
          category: 'category1',
          tags: [],
          isPublished: true,
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'article-2',
          organizationId,
          title: 'Article 2',
          content: 'Content 2',
          category: 'category2',
          tags: [],
          isPublished: false, // Not published
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          authorId: 'author-123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock the articles Map
      (service as any).articles.set('article-1', mockArticles[0]);
      (service as any).articles.set('article-2', mockArticles[1]);

      const result = await service.searchArticles(organizationId, '', '');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('article-1');
      expect(result[0].isPublished).toBe(true);
    });
  });

  describe('createAgent', () => {
    it('should create a support agent successfully', async () => {
      const organizationId = 'test-org';
      const agentData = {
        userId: 'user-123',
        name: 'John Agent',
        email: 'john.agent@example.com',
        isActive: true,
        maxTickets: 15,
        currentTickets: 0,
        skills: ['technical', 'billing'],
        languages: ['en', 'es'],
        workingHours: {
          timezone: 'UTC',
          schedule: {
            monday: { start: '09:00', end: '17:00', isWorking: true },
            tuesday: { start: '09:00', end: '17:00', isWorking: true }
          }
        }
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createAgent(organizationId, agentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.userId).toBe(agentData.userId);
      expect(result.name).toBe(agentData.name);
      expect(result.email).toBe(agentData.email);
      expect(result.isActive).toBe(agentData.isActive);
      expect(result.maxTickets).toBe(agentData.maxTickets);
      expect(result.currentTickets).toBe(agentData.currentTickets);
      expect(result.skills).toEqual(agentData.skills);
      expect(result.languages).toEqual(agentData.languages);
      expect(result.workingHours).toEqual(agentData.workingHours);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO support_agents'),
        expect.arrayContaining([
          result.id,
          organizationId,
          agentData.userId,
          agentData.name,
          agentData.email,
          agentData.isActive,
          agentData.maxTickets,
          agentData.currentTickets,
          JSON.stringify(agentData.skills),
          JSON.stringify(agentData.languages),
          JSON.stringify(agentData.workingHours),
          JSON.stringify({}),
          result.createdAt,
          result.updatedAt
        ])
      );
    });

    it('should handle database errors when creating agent', async () => {
      const organizationId = 'test-org';
      const agentData = {
        userId: 'user-123',
        name: 'John Agent',
        email: 'john.agent@example.com',
        isActive: true,
        maxTickets: 10,
        currentTickets: 0,
        skills: [],
        languages: ['en']
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(service.createAgent(organizationId, agentData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getSupportStatistics', () => {
    it('should return comprehensive support statistics', async () => {
      const organizationId = 'test-org';

      const mockTickets = [
        {
          id: 'ticket-1',
          organizationId,
          customerId: 'customer-1',
          customerEmail: 'customer1@example.com',
          customerName: 'Customer 1',
          subject: 'Technical Issue',
          description: 'Description 1',
          category: 'technical',
          priority: 'high',
          status: 'open',
          source: 'portal',
          tags: [],
          attachments: [],
          metadata: {},
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
          resolvedAt: undefined
        },
        {
          id: 'ticket-2',
          organizationId,
          customerId: 'customer-2',
          customerEmail: 'customer2@example.com',
          customerName: 'Customer 2',
          subject: 'Billing Question',
          description: 'Description 2',
          category: 'billing',
          priority: 'medium',
          status: 'resolved',
          source: 'email',
          tags: [],
          attachments: [],
          metadata: {},
          createdAt: new Date('2024-01-01T09:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z'),
          resolvedAt: new Date('2024-01-01T11:00:00Z')
        }
      ];

      const mockAgents = [
        {
          id: 'agent-1',
          organizationId,
          userId: 'user-1',
          name: 'Agent 1',
          email: 'agent1@example.com',
          isActive: true,
          maxTickets: 10,
          currentTickets: 5,
          skills: ['technical'],
          languages: ['en'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'agent-2',
          organizationId,
          userId: 'user-2',
          name: 'Agent 2',
          email: 'agent2@example.com',
          isActive: false,
          maxTickets: 10,
          currentTickets: 0,
          skills: ['billing'],
          languages: ['en'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockArticles = [
        {
          id: 'article-1',
          organizationId,
          title: 'Article 1',
          content: 'Content 1',
          category: 'technical',
          tags: [],
          isPublished: true,
          viewCount: 0,
          helpfulCount: 0,
          notHelpfulCount: 0,
          authorId: 'author-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock the data Maps
      (service as any).tickets.set('ticket-1', mockTickets[0]);
      (service as any).tickets.set('ticket-2', mockTickets[1]);
      (service as any).agents.set('agent-1', mockAgents[0]);
      (service as any).agents.set('agent-2', mockAgents[1]);
      (service as any).articles.set('article-1', mockArticles[0]);

      const result = await service.getSupportStatistics(organizationId);

      expect(result).toBeDefined();
      expect(result.totalTickets).toBe(2);
      expect(result.ticketsByStatus).toEqual({
        open: 1,
        resolved: 1
      });
      expect(result.ticketsByPriority).toEqual({
        high: 1,
        medium: 1
      });
      expect(result.ticketsByCategory).toEqual({
        technical: 1,
        billing: 1
      });
      expect(result.averageResolutionTime).toBe(2); // 2 hours for the resolved ticket
      expect(result.totalAgents).toBe(2);
      expect(result.activeAgents).toBe(1);
      expect(result.totalArticles).toBe(1);
      expect(result.topCategories).toHaveLength(2);
      expect(result.topCategories[0]).toEqual({ category: 'technical', count: 1 });
      expect(result.topCategories[1]).toEqual({ category: 'billing', count: 1 });
      expect(result.customerSatisfaction).toBe(4.2);
    });

    it('should handle empty data gracefully', async () => {
      const organizationId = 'test-org';

      const result = await service.getSupportStatistics(organizationId);

      expect(result).toBeDefined();
      expect(result.totalTickets).toBe(0);
      expect(result.ticketsByStatus).toEqual({});
      expect(result.ticketsByPriority).toEqual({});
      expect(result.ticketsByCategory).toEqual({});
      expect(result.averageResolutionTime).toBe(0);
      expect(result.totalAgents).toBe(0);
      expect(result.activeAgents).toBe(0);
      expect(result.totalArticles).toBe(0);
      expect(result.topCategories).toEqual([]);
      expect(result.customerSatisfaction).toBe(4.2);
    });
  });

  describe('utility methods', () => {
    it('should generate unique IDs', () => {
      const id1 = (service as any).generateId();
      const id2 = (service as any).generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^support_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^support_\d+_[a-z0-9]+$/);
    });
  });
});
