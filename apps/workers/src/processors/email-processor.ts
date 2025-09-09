import { GraphService } from '../services/graph-service.js';
import { JobQueue } from '../queues/job-queue.js';
import { logger } from '../utils/logger.js';
import { prometheusMetrics } from '../utils/metrics.js';

export interface EmailMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
  }>;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  receivedDateTime: string;
  isRead: boolean;
  importance: 'low' | 'normal' | 'high';
  hasAttachments: boolean;
  internetMessageId: string;
  conversationId: string;
}

export interface EmailProcessingResult {
  messageId: string;
  processed: boolean;
  action: 'categorize' | 'respond' | 'forward' | 'archive' | 'none';
  confidence: number;
  metadata: {
    category?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    urgency?: 'low' | 'medium' | 'high';
    language?: string;
    entities?: string[];
  };
  processingTime: number;
}

export class EmailProcessor {
  private graphService: GraphService;
  private jobQueue: JobQueue;
  private processingCounter = prometheusMetrics.counter({
    name: 'econeura_emails_processed_total',
    help: 'Total number of emails processed',
    labelNames: ['action', 'category', 'status']
  });

  private processingDuration = prometheusMetrics.histogram({
    name: 'econeura_email_processing_duration_seconds',
    help: 'Time spent processing emails',
    labelNames: ['action', 'category']
  });

  constructor() {
    this.graphService = new GraphService();
    this.jobQueue = new JobQueue();
  }

  async processEmail(messageId: string, organizationId: string): Promise<EmailProcessingResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting email processing', { messageId, organizationId });

      // Fetch email from Microsoft Graph
      const email = await this.graphService.getEmail(messageId);

      if (!email) {
        throw new Error(`Email ${messageId} not found`);
      }

      // Process email content
      const result = await this.analyzeEmail(email, organizationId);

      // Apply actions based on analysis
      await this.applyEmailActions(email, result, organizationId);

      const processingTime = Date.now() - startTime;

      // Record metrics
      this.processingCounter.inc({
        action: result.action,
        category: result.metadata.category || 'unknown',
        status: 'success'
      });

      this.processingDuration.observe(
        { action: result.action, category: result.metadata.category || 'unknown' },
        processingTime / 1000
      );

      logger.info('Email processing completed', {
        messageId,
        action: result.action,
        processingTime,
        confidence: result.confidence
      });

      return {
        ...result,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.processingCounter.inc({
        action: 'error',
        category: 'unknown',
        status: 'error'
      });

      logger.error('Email processing failed', {
        messageId,
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      });

      throw error;
    }
  }

  private async analyzeEmail(email: EmailMessage, organizationId: string): Promise<EmailProcessingResult> {
    const startTime = Date.now();

    // Simulate AI-powered email analysis
    const analysis = await this.performEmailAnalysis(email, organizationId);

    const processingTime = Date.now() - startTime;

    return {
      messageId: email.id,
      processed: true,
      action: analysis.action,
      confidence: analysis.confidence,
      metadata: analysis.metadata,
      processingTime
    };
  }

  private async performEmailAnalysis(email: EmailMessage, organizationId: string): Promise<{
    action: 'categorize' | 'respond' | 'forward' | 'archive' | 'none';
    confidence: number;
    metadata: {
      category?: string;
      sentiment?: 'positive' | 'negative' | 'neutral';
      urgency?: 'low' | 'medium' | 'high';
      language?: string;
      entities?: string[];
    };
  }> {
    // Simulate AI analysis based on email content
    const subject = email.subject.toLowerCase();
    const body = email.body.content.toLowerCase();

    // Determine category based on content
    let category = 'general';
    let action: 'categorize' | 'respond' | 'forward' | 'archive' | 'none' = 'none';
    let confidence = 0.5;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let urgency: 'low' | 'medium' | 'high' = 'low';

    // Business logic for email categorization
    if (subject.includes('invoice') || subject.includes('factura') || body.includes('payment')) {
      category = 'finance';
      action = 'categorize';
      confidence = 0.9;
      urgency = 'high';
    } else if (subject.includes('meeting') || subject.includes('reunión') || body.includes('calendar')) {
      category = 'calendar';
      action = 'categorize';
      confidence = 0.8;
      urgency = 'medium';
    } else if (subject.includes('support') || subject.includes('soporte') || body.includes('help')) {
      category = 'support';
      action = 'forward';
      confidence = 0.85;
      urgency = 'high';
    } else if (subject.includes('spam') || body.includes('unsubscribe')) {
      category = 'spam';
      action = 'archive';
      confidence = 0.95;
      urgency = 'low';
    } else if (email.importance === 'high' || subject.includes('urgent')) {
      category = 'urgent';
      action = 'categorize';
      confidence = 0.7;
      urgency = 'high';
    }

    // Determine sentiment
    const positiveWords = ['thank', 'thanks', 'great', 'excellent', 'good', 'happy', 'pleased'];
    const negativeWords = ['problem', 'issue', 'error', 'bad', 'wrong', 'disappointed', 'angry'];

    const positiveCount = positiveWords.filter(word => body.includes(word)).length;
    const negativeCount = negativeWords.filter(word => body.includes(word)).length;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    }

    // Extract entities (simplified)
    const entities = this.extractEntities(email);

    return {
      action,
      confidence,
      metadata: {
        category,
        sentiment,
        urgency,
        language: 'es', // Simplified language detection
        entities
      }
    };
  }

  private extractEntities(email: EmailMessage): string[] {
    const entities: string[] = [];
    const content = `${email.subject} ${email.body.content}`.toLowerCase();

    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = content.match(emailRegex) || [];
    entities.push(...emails);

    // Extract phone numbers (Spanish format)
    const phoneRegex = /(\+34|0034)?[6-9]\d{8}/g;
    const phones = content.match(phoneRegex) || [];
    entities.push(...phones);

    // Extract amounts (EUR)
    const amountRegex = /€?\s*\d+[.,]\d{2}/g;
    const amounts = content.match(amountRegex) || [];
    entities.push(...amounts);

    return entities;
  }

  private async applyEmailActions(
    email: EmailMessage,
    result: EmailProcessingResult,
    organizationId: string
  ): Promise<void> {
    try {
      switch (result.action) {
        case 'categorize':
          await this.categorizeEmail(email, result.metadata.category!, organizationId);
          break;

        case 'respond':
          await this.generateResponse(email, organizationId);
          break;

        case 'forward':
          await this.forwardEmail(email, result.metadata.category!, organizationId);
          break;

        case 'archive':
          await this.archiveEmail(email, organizationId);
          break;

        case 'none':
        default:
          logger.info('No action required for email', { messageId: email.id });
          break;
      }
    } catch (error) {
      logger.error('Failed to apply email action', {
        messageId: email.id,
        action: result.action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async categorizeEmail(email: EmailMessage, category: string, organizationId: string): Promise<void> {
    logger.info('Categorizing email', {
      messageId: email.id,
      category,
      organizationId
    });
  }

  private async generateResponse(email: EmailMessage, organizationId: string): Promise<void> {
    logger.info('Generating email response', {
      messageId: email.id,
      organizationId
    });
  }

  private async forwardEmail(email: EmailMessage, category: string, organizationId: string): Promise<void> {
    logger.info('Forwarding email', {
      messageId: email.id,
      category,
      organizationId
    });
  }

  private async archiveEmail(email: EmailMessage, organizationId: string): Promise<void> {
    logger.info('Archiving email', {
      messageId: email.id,
      organizationId
    });
  }

  async processBulkEmails(messageIds: string[], organizationId: string): Promise<EmailProcessingResult[]> {
    const results: EmailProcessingResult[] = [];

    logger.info('Starting bulk email processing', {
      count: messageIds.length,
      organizationId
    });

    // Process emails in parallel with concurrency limit
    const concurrencyLimit = 5;
    const chunks = this.chunkArray(messageIds, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(messageId =>
        this.processEmail(messageId, organizationId).catch(error => {
          logger.error('Bulk processing error', {
            messageId,
            organizationId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
      return {
            messageId,
            processed: false,
            action: 'none' as const,
            confidence: 0,
            metadata: {},
            processingTime: 0
          };
        })
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    logger.info('Bulk email processing completed', {
      total: messageIds.length,
      successful: results.filter(r => r.processed).length,
      failed: results.filter(r => !r.processed).length,
      organizationId
    });

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
