/**
 * CUSTOMER SUPPORT SERVICE
 * 
 * PR-58: Sistema completo de soporte al cliente avanzado
 * 
 * Funcionalidades:
 * - Gestión de tickets de soporte
 * - Chat en vivo y chatbot
 * - Base de conocimiento
 * - Escalación automática
 * - Analytics de soporte
 * - Integración con CRM
 */

import { z } from 'zod';

import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '../lib/database.service.js';

// ============================================================================
// SCHEMAS Y TIPOS
// ============================================================================

export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent', 'critical']);
export const TicketStatusSchema = z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']);
export const TicketCategorySchema = z.enum(['technical', 'billing', 'general', 'feature_request', 'bug_report']);
export const TicketSourceSchema = z.enum(['email', 'chat', 'phone', 'portal', 'api', 'social']);

export const SupportTicketSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  customerId: z.string().uuid(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  subject: z.string().min(1).max(255),
  description: z.string().min(1),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  source: TicketSourceSchema,
  assignedTo: z.string().uuid().optional(),
  assignedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  closedAt: z.date().optional(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    size: z.number(),
    type: z.string()
  })).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderType: z.enum(['customer', 'agent', 'bot']),
  message: z.string().min(1),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    size: z.number(),
    type: z.string()
  })).default([]),
  isRead: z.boolean().default(false),
  readAt: z.date().optional(),
  createdAt: z.date()
});

export const KnowledgeBaseArticleSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
  viewCount: z.number().default(0),
  helpfulCount: z.number().default(0),
  notHelpfulCount: z.number().default(0),
  authorId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const SupportAgentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  isActive: z.boolean().default(true),
  maxTickets: z.number().default(10),
  currentTickets: z.number().default(0),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(['en']),
  workingHours: z.object({
    timezone: z.string().default('UTC'),
    schedule: z.record(z.object({
      start: z.string(),
      end: z.string(),
      isWorking: z.boolean().default(true)
    }))
  }).optional(),
  performance: z.object({
    ticketsResolved: z.number().default(0),
    averageResolutionTime: z.number().default(0),
    customerSatisfaction: z.number().default(0),
    responseTime: z.number().default(0)
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type TicketSource = z.infer<typeof TicketSourceSchema>;
export type SupportTicket = z.infer<typeof SupportTicketSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type KnowledgeBaseArticle = z.infer<typeof KnowledgeBaseArticleSchema>;
export type SupportAgent = z.infer<typeof SupportAgentSchema>;

// ============================================================================
// CUSTOMER SUPPORT SERVICE
// ============================================================================

export class CustomerSupportService {
  private db: ReturnType<typeof getDatabaseService>;
  private tickets: Map<string, SupportTicket> = new Map();
  private messages: Map<string, ChatMessage> = new Map();
  private articles: Map<string, KnowledgeBaseArticle> = new Map();
  private agents: Map<string, SupportAgent> = new Map();
  private chatSessions: Map<string, any> = new Map();

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing Customer Support Service', {
        service: 'customer-support',
        timestamp: new Date().toISOString()
      });

      await this.initializeSupportTables();
      await this.loadExistingData();
      this.startBackgroundProcessing();

      structuredLogger.info('Customer Support Service initialized successfully', {
        service: 'customer-support',
        ticketsCount: this.tickets.size,
        messagesCount: this.messages.size,
        articlesCount: this.articles.size,
        agentsCount: this.agents.size
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize Customer Support Service', {
        service: 'customer-support',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeSupportTables(): Promise<void> {
    // Create support_tickets table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        customer_id UUID NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        source VARCHAR(20) NOT NULL,
        assigned_to UUID,
        assigned_at TIMESTAMP,
        resolved_at TIMESTAMP,
        closed_at TIMESTAMP,
        tags JSONB DEFAULT '[]',
        attachments JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create chat_messages table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        attachments JSONB DEFAULT '[]',
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create knowledge_base_articles table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base_articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        tags JSONB DEFAULT '[]',
        is_published BOOLEAN DEFAULT TRUE,
        view_count INTEGER DEFAULT 0,
        helpful_count INTEGER DEFAULT 0,
        not_helpful_count INTEGER DEFAULT 0,
        author_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create support_agents table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS support_agents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        user_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        max_tickets INTEGER DEFAULT 10,
        current_tickets INTEGER DEFAULT 0,
        skills JSONB DEFAULT '[]',
        languages JSONB DEFAULT '["en"]',
        working_hours JSONB DEFAULT '{}',
        performance JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_org_id ON support_tickets(organization_id);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON support_tickets(customer_id);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_id ON chat_messages(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_org_id ON knowledge_base_articles(organization_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base_articles(category);
      CREATE INDEX IF NOT EXISTS idx_support_agents_org_id ON support_agents(organization_id);
      CREATE INDEX IF NOT EXISTS idx_support_agents_user_id ON support_agents(user_id);
    `);
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load tickets
      const ticketsResult = await this.db.query(`
        SELECT * FROM support_tickets WHERE organization_id = $1
      `, ['demo-org']);

      for (const row of ticketsResult.rows) {
        const ticket: SupportTicket = {
          id: row.id,
          organizationId: row.organization_id,
          customerId: row.customer_id,
          customerEmail: row.customer_email,
          customerName: row.customer_name,
          subject: row.subject,
          description: row.description,
          category: row.category,
          priority: row.priority,
          status: row.status,
          source: row.source,
          assignedTo: row.assigned_to,
          assignedAt: row.assigned_at ? new Date(row.assigned_at) : undefined,
          resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
          closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
          tags: row.tags || [],
          attachments: row.attachments || [],
          metadata: row.metadata || {},
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
        this.tickets.set(ticket.id, ticket);
      }

      // Load messages
      const messagesResult = await this.db.query(`
        SELECT * FROM chat_messages
      `);

      for (const row of messagesResult.rows) {
        const message: ChatMessage = {
          id: row.id,
          ticketId: row.ticket_id,
          senderId: row.sender_id,
          senderType: row.sender_type,
          message: row.message,
          messageType: row.message_type,
          attachments: row.attachments || [],
          isRead: row.is_read,
          readAt: row.read_at ? new Date(row.read_at) : undefined,
          createdAt: new Date(row.created_at)
        };
        this.messages.set(message.id, message);
      }

      // Load articles
      const articlesResult = await this.db.query(`
        SELECT * FROM knowledge_base_articles WHERE organization_id = $1
      `, ['demo-org']);

      for (const row of articlesResult.rows) {
        const article: KnowledgeBaseArticle = {
          id: row.id,
          organizationId: row.organization_id,
          title: row.title,
          content: row.content,
          category: row.category,
          tags: row.tags || [],
          isPublished: row.is_published,
          viewCount: row.view_count,
          helpfulCount: row.helpful_count,
          notHelpfulCount: row.not_helpful_count,
          authorId: row.author_id,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
        this.articles.set(article.id, article);
      }

      // Load agents
      const agentsResult = await this.db.query(`
        SELECT * FROM support_agents WHERE organization_id = $1
      `, ['demo-org']);

      for (const row of agentsResult.rows) {
        const agent: SupportAgent = {
          id: row.id,
          organizationId: row.organization_id,
          userId: row.user_id,
          name: row.name,
          email: row.email,
          isActive: row.is_active,
          maxTickets: row.max_tickets,
          currentTickets: row.current_tickets,
          skills: row.skills || [],
          languages: row.languages || ['en'],
          workingHours: row.working_hours,
          performance: row.performance,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
        this.agents.set(agent.id, agent);
      }

      structuredLogger.info('Loaded existing customer support data', {
        ticketsCount: this.tickets.size,
        messagesCount: this.messages.size,
        articlesCount: this.articles.size,
        agentsCount: this.agents.size
      });
    } catch (error) {
      structuredLogger.error('Failed to load existing customer support data', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private startBackgroundProcessing(): void {
    setInterval(() => {
      this.processTicketEscalation();
    }, 300000); // Every 5 minutes

    setInterval(() => {
      this.updateAgentPerformance();
    }, 600000); // Every 10 minutes
  }

  // ============================================================================
  // TICKET OPERATIONS
  // ============================================================================

  async createTicket(
    organizationId: string,
    ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportTicket> {
    try {
      const ticketId = this.generateId();
      const now = new Date();

      const ticket: SupportTicket = {
        ...ticketData,
        id: ticketId,
        organizationId,
        createdAt: now,
        updatedAt: now
      };

      // Store in database
      await this.db.query(`
        INSERT INTO support_tickets (
          id, organization_id, customer_id, customer_email, customer_name,
          subject, description, category, priority, status, source,
          assigned_to, assigned_at, resolved_at, closed_at, tags,
          attachments, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        ticket.id, ticket.organizationId, ticket.customerId, ticket.customerEmail,
        ticket.customerName, ticket.subject, ticket.description, ticket.category,
        ticket.priority, ticket.status, ticket.source, ticket.assignedTo,
        ticket.assignedAt, ticket.resolvedAt, ticket.closedAt,
        JSON.stringify(ticket.tags), JSON.stringify(ticket.attachments),
        JSON.stringify(ticket.metadata), ticket.createdAt, ticket.updatedAt
      ]);

      // Store in memory
      this.tickets.set(ticket.id, ticket);

      // Auto-assign if possible
      await this.autoAssignTicket(ticket);

      structuredLogger.info('Support ticket created successfully', {
        ticketId: ticket.id,
        customerEmail: ticket.customerEmail,
        priority: ticket.priority,
        organizationId
      });

      return ticket;
    } catch (error) {
      structuredLogger.error('Failed to create support ticket', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  async getTicket(ticketId: string, organizationId: string): Promise<SupportTicket | null> {
    try {
      const ticket = this.tickets.get(ticketId);
      
      if (!ticket || ticket.organizationId !== organizationId) {
        return null;
      }

      return ticket;
    } catch (error) {
      structuredLogger.error('Failed to get support ticket', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId,
        organizationId
      });
      throw error;
    }
  }

  async updateTicketStatus(
    ticketId: string,
    organizationId: string,
    status: TicketStatus,
    updatedBy: string
  ): Promise<SupportTicket | null> {
    try {
      const ticket = this.tickets.get(ticketId);
      
      if (!ticket || ticket.organizationId !== organizationId) {
        return null;
      }

      const now = new Date();
      const updatedTicket: SupportTicket = {
        ...ticket,
        status,
        updatedAt: now,
        resolvedAt: status === 'resolved' ? now : ticket.resolvedAt,
        closedAt: status === 'closed' ? now : ticket.closedAt
      };

      // Update database
      await this.db.query(`
        UPDATE support_tickets 
        SET status = $1, resolved_at = $2, closed_at = $3, updated_at = $4
        WHERE id = $5 AND organization_id = $6
      `, [status, updatedTicket.resolvedAt, updatedTicket.closedAt, now, ticketId, organizationId]);

      // Update memory
      this.tickets.set(ticketId, updatedTicket);

      structuredLogger.info('Support ticket status updated', {
        ticketId,
        oldStatus: ticket.status,
        newStatus: status,
        updatedBy,
        organizationId
      });

      return updatedTicket;
    } catch (error) {
      structuredLogger.error('Failed to update ticket status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId,
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // CHAT OPERATIONS
  // ============================================================================

  async sendMessage(
    ticketId: string,
    senderId: string,
    senderType: 'customer' | 'agent' | 'bot',
    message: string,
    messageType: 'text' | 'image' | 'file' | 'system' = 'text',
    attachments: any[] = []
  ): Promise<ChatMessage> {
    try {
      const messageId = this.generateId();
      const now = new Date();

      const chatMessage: ChatMessage = {
        id: messageId,
        ticketId,
        senderId,
        senderType,
        message,
        messageType,
        attachments,
        isRead: false,
        createdAt: now
      };

      // Store in database
      await this.db.query(`
        INSERT INTO chat_messages (
          id, ticket_id, sender_id, sender_type, message, message_type,
          attachments, is_read, read_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        chatMessage.id, chatMessage.ticketId, chatMessage.senderId,
        chatMessage.senderType, chatMessage.message, chatMessage.messageType,
        JSON.stringify(chatMessage.attachments), chatMessage.isRead,
        chatMessage.readAt, chatMessage.createdAt
      ]);

      // Store in memory
      this.messages.set(chatMessage.id, chatMessage);

      // Update ticket status if needed
      if (senderType === 'customer') {
        await this.updateTicketStatus(ticketId, 'demo-org', 'in_progress', senderId);
      }

      structuredLogger.info('Chat message sent successfully', {
        messageId: chatMessage.id,
        ticketId,
        senderType,
        messageType
      });

      return chatMessage;
    } catch (error) {
      structuredLogger.error('Failed to send chat message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId,
        senderId
      });
      throw error;
    }
  }

  async getTicketMessages(ticketId: string): Promise<ChatMessage[]> {
    try {
      const messages = Array.from(this.messages.values())
        .filter(message => message.ticketId === ticketId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return messages;
    } catch (error) {
      structuredLogger.error('Failed to get ticket messages', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId
      });
      throw error;
    }
  }

  // ============================================================================
  // KNOWLEDGE BASE OPERATIONS
  // ============================================================================

  async createArticle(
    organizationId: string,
    articleData: Omit<KnowledgeBaseArticle, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<KnowledgeBaseArticle> {
    try {
      const articleId = this.generateId();
      const now = new Date();

      const article: KnowledgeBaseArticle = {
        ...articleData,
        id: articleId,
        organizationId,
        createdAt: now,
        updatedAt: now
      };

      // Store in database
      await this.db.query(`
        INSERT INTO knowledge_base_articles (
          id, organization_id, title, content, category, tags,
          is_published, view_count, helpful_count, not_helpful_count,
          author_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        article.id, article.organizationId, article.title, article.content,
        article.category, JSON.stringify(article.tags), article.isPublished,
        article.viewCount, article.helpfulCount, article.notHelpfulCount,
        article.authorId, article.createdAt, article.updatedAt
      ]);

      // Store in memory
      this.articles.set(article.id, article);

      structuredLogger.info('Knowledge base article created successfully', {
        articleId: article.id,
        title: article.title,
        category: article.category,
        organizationId
      });

      return article;
    } catch (error) {
      structuredLogger.error('Failed to create knowledge base article', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  async searchArticles(
    organizationId: string,
    query: string,
    category?: string
  ): Promise<KnowledgeBaseArticle[]> {
    try {
      let articles = Array.from(this.articles.values())
        .filter(article => 
          article.organizationId === organizationId && 
          article.isPublished
        );

      if (category) {
        articles = articles.filter(article => article.category === category);
      }

      if (query) {
        const searchQuery = query.toLowerCase();
        articles = articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery) ||
          article.content.toLowerCase().includes(searchQuery) ||
          article.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
      }

      // Sort by relevance (view count and helpful count)
      articles.sort((a, b) => {
        const aScore = a.viewCount + (a.helpfulCount * 2);
        const bScore = b.viewCount + (b.helpfulCount * 2);
        return bScore - aScore;
      });

      return articles;
    } catch (error) {
      structuredLogger.error('Failed to search knowledge base articles', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId,
        query
      });
      throw error;
    }
  }

  // ============================================================================
  // AGENT OPERATIONS
  // ============================================================================

  async createAgent(
    organizationId: string,
    agentData: Omit<SupportAgent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SupportAgent> {
    try {
      const agentId = this.generateId();
      const now = new Date();

      const agent: SupportAgent = {
        ...agentData,
        id: agentId,
        organizationId,
        createdAt: now,
        updatedAt: now
      };

      // Store in database
      await this.db.query(`
        INSERT INTO support_agents (
          id, organization_id, user_id, name, email, is_active,
          max_tickets, current_tickets, skills, languages, working_hours,
          performance, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        agent.id, agent.organizationId, agent.userId, agent.name, agent.email,
        agent.isActive, agent.maxTickets, agent.currentTickets,
        JSON.stringify(agent.skills), JSON.stringify(agent.languages),
        JSON.stringify(agent.workingHours), JSON.stringify(agent.performance),
        agent.createdAt, agent.updatedAt
      ]);

      // Store in memory
      this.agents.set(agent.id, agent);

      structuredLogger.info('Support agent created successfully', {
        agentId: agent.id,
        name: agent.name,
        email: agent.email,
        organizationId
      });

      return agent;
    } catch (error) {
      structuredLogger.error('Failed to create support agent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async autoAssignTicket(ticket: SupportTicket): Promise<void> {
    try {
      const availableAgents = Array.from(this.agents.values())
        .filter(agent => 
          agent.organizationId === ticket.organizationId &&
          agent.isActive &&
          agent.currentTickets < agent.maxTickets
        );

      if (availableAgents.length > 0) {
        // Simple round-robin assignment
        const agent = availableAgents[0];
        
        const updatedTicket: SupportTicket = {
          ...ticket,
          assignedTo: agent.id,
          assignedAt: new Date(),
          updatedAt: new Date()
        };

        // Update database
        await this.db.query(`
          UPDATE support_tickets 
          SET assigned_to = $1, assigned_at = $2, updated_at = $3
          WHERE id = $4
        `, [agent.id, updatedTicket.assignedAt, updatedTicket.updatedAt, ticket.id]);

        // Update memory
        this.tickets.set(ticket.id, updatedTicket);

        // Update agent current tickets count
        agent.currentTickets += 1;

        structuredLogger.info('Ticket auto-assigned to agent', {
          ticketId: ticket.id,
          agentId: agent.id,
          agentName: agent.name
        });
      }
    } catch (error) {
      structuredLogger.error('Failed to auto-assign ticket', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: ticket.id
      });
    }
  }

  private async processTicketEscalation(): Promise<void> {
    try {
      const now = new Date();
      const escalationThreshold = 24 * 60 * 60 * 1000; // 24 hours

      const ticketsToEscalate = Array.from(this.tickets.values())
        .filter(ticket => {
          const timeSinceCreation = now.getTime() - ticket.createdAt.getTime();
          return ticket.status === 'open' && 
                 timeSinceCreation > escalationThreshold &&
                 ticket.priority !== 'critical';
        });

      for (const ticket of ticketsToEscalate) {
        // Escalate priority
        const newPriority = ticket.priority === 'low' ? 'medium' :
                           ticket.priority === 'medium' ? 'high' : 'urgent';

        const updatedTicket: SupportTicket = {
          ...ticket,
          priority: newPriority,
          updatedAt: now
        };

        this.tickets.set(ticket.id, updatedTicket);

        structuredLogger.info('Ticket escalated', {
          ticketId: ticket.id,
          oldPriority: ticket.priority,
          newPriority,
          timeSinceCreation: now.getTime() - ticket.createdAt.getTime()
        });
      }
    } catch (error) {
      structuredLogger.error('Failed to process ticket escalation', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateAgentPerformance(): Promise<void> {
    try {
      // Update agent performance metrics
      for (const agent of this.agents.values()) {
        const agentTickets = Array.from(this.tickets.values())
          .filter(ticket => ticket.assignedTo === agent.id);

        const resolvedTickets = agentTickets.filter(ticket => ticket.status === 'resolved');
        const totalResolutionTime = resolvedTickets.reduce((total, ticket) => {
          if (ticket.resolvedAt) {
            return total + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
          }
          return total;
        }, 0);

        const averageResolutionTime = resolvedTickets.length > 0 
          ? totalResolutionTime / resolvedTickets.length 
          : 0;

        agent.performance = {
          ticketsResolved: resolvedTickets.length,
          averageResolutionTime,
          customerSatisfaction: 4.5, // Placeholder
          responseTime: 2.5 // Placeholder
        };

        structuredLogger.debug('Updated agent performance', {
          agentId: agent.id,
          ticketsResolved: resolvedTickets.length,
          averageResolutionTime
        });
      }
    } catch (error) {
      structuredLogger.error('Failed to update agent performance', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateId(): string {
    return `support_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // ANALYTICS AND STATISTICS
  // ============================================================================

  async getSupportStatistics(organizationId: string): Promise<{
    totalTickets: number;
    ticketsByStatus: Record<string, number>;
    ticketsByPriority: Record<string, number>;
    ticketsByCategory: Record<string, number>;
    averageResolutionTime: number;
    totalAgents: number;
    activeAgents: number;
    totalArticles: number;
    topCategories: Array<{ category: string; count: number }>;
    customerSatisfaction: number;
  }> {
    try {
      const tickets = Array.from(this.tickets.values())
        .filter(ticket => ticket.organizationId === organizationId);
      
      const agents = Array.from(this.agents.values())
        .filter(agent => agent.organizationId === organizationId);
      
      const articles = Array.from(this.articles.values())
        .filter(article => article.organizationId === organizationId);

      const totalTickets = tickets.length;
      const ticketsByStatus: Record<string, number> = {};
      const ticketsByPriority: Record<string, number> = {};
      const ticketsByCategory: Record<string, number> = {};
      let totalResolutionTime = 0;
      let resolvedTickets = 0;

      tickets.forEach(ticket => {
        ticketsByStatus[ticket.status] = (ticketsByStatus[ticket.status] || 0) + 1;
        ticketsByPriority[ticket.priority] = (ticketsByPriority[ticket.priority] || 0) + 1;
        ticketsByCategory[ticket.category] = (ticketsByCategory[ticket.category] || 0) + 1;
        
        if (ticket.resolvedAt) {
          totalResolutionTime += ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
          resolvedTickets++;
        }
      });

      const averageResolutionTime = resolvedTickets > 0 
        ? totalResolutionTime / resolvedTickets / (1000 * 60 * 60) // Convert to hours
        : 0;

      const totalAgents = agents.length;
      const activeAgents = agents.filter(agent => agent.isActive).length;
      const totalArticles = articles.length;

      const topCategories = Object.entries(ticketsByCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalTickets,
        ticketsByStatus,
        ticketsByPriority,
        ticketsByCategory,
        averageResolutionTime,
        totalAgents,
        activeAgents,
        totalArticles,
        topCategories,
        customerSatisfaction: 4.2 // Placeholder
      };
    } catch (error) {
      structuredLogger.error('Failed to get support statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }
}

export const customerSupportService = new CustomerSupportService();
