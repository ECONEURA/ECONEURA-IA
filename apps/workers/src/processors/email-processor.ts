/**
 * EmailProcessor - Processes email operations using AI Router
 * ECONEURA WORKERS OUTLOOK - Email Processing Component
 */

import axios from 'axios';
import { EmailMessage, EmailClassification, EmailDraft, EmailData } from '../types/email.types';
import { logger } from '../utils/logger';
import { prometheusMetrics } from '../utils/metrics';

interface AIRouterResponse {
  response: string;
  provider: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: number;
}

export class EmailProcessor {
  private aiRouterUrl: string;
  private maxRetries: number = 3;
  private baseDelay: number = 1000;

  constructor(aiRouterUrl = process.env.AI_ROUTER_URL || 'http://localhost:3000') {
    this.aiRouterUrl = aiRouterUrl;
  }

  /**
   * Classify email content using AI Router
   */
  async classifyEmail(message: EmailMessage, jobId: string): Promise<EmailClassification> {
    const startTime = Date.now();
    const timer = prometheusMetrics.jobDuration.startTimer({ type: 'email:classify' });
    
    try {
      logger.info('Starting email classification', { 
        jobId, 
        messageId: message.id,
        subject: message.subject 
      });

      const prompt = this.buildClassificationPrompt(message);
      
      const response = await this.callAIRouter({
        prompt,
        maxTokens: 500,
        temperature: 0.3,
        userId: `worker-${jobId}`,
        requestId: `classify-${message.id}`,
        metadata: {
          operation: 'email:classify',
          messageId: message.id
        }
      });

      const classification = this.parseClassificationResponse(response.response);
      
      // Record metrics
      timer();
      prometheusMetrics.jobsProcessed.inc({ 
        type: 'email:classify', 
        status: 'success' 
      });
      prometheusMetrics.aiCosts.inc(response.cost);

      logger.info('Email classification completed', {
        jobId,
        messageId: message.id,
        category: classification.category,
        priority: classification.priority,
        cost: response.cost,
        provider: response.provider,
        duration: Date.now() - startTime
      });

      return classification;

    } catch (error) {
      timer();
      prometheusMetrics.jobsProcessed.inc({ 
        type: 'email:classify', 
        status: 'error' 
      });
      
      logger.error('Email classification failed', {
        jobId,
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      throw new Error(`Email classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate email draft using AI Router
   */
  async generateDraft(request: EmailDraft, jobId: string): Promise<EmailData> {
    const startTime = Date.now();
    const timer = prometheusMetrics.jobDuration.startTimer({ type: 'email:draft' });
    
    try {
      logger.info('Starting email draft generation', { 
        jobId, 
        recipient: request.to,
        subject: request.subject 
      });

      const prompt = this.buildDraftPrompt(request);
      
      const response = await this.callAIRouter({
        prompt,
        maxTokens: 1000,
        temperature: 0.7,
        userId: `worker-${jobId}`,
        requestId: `draft-${Date.now()}`,
        metadata: {
          operation: 'email:draft',
          recipient: request.to
        }
      });

      const emailData = this.parseDraftResponse(response.response, request);
      
      // Record metrics
      timer();
      prometheusMetrics.jobsProcessed.inc({ 
        type: 'email:draft', 
        status: 'success' 
      });
      prometheusMetrics.aiCosts.inc(response.cost);

      logger.info('Email draft generated', {
        jobId,
        recipient: request.to,
        cost: response.cost,
        provider: response.provider,
        duration: Date.now() - startTime
      });

      return emailData;

    } catch (error) {
      timer();
      prometheusMetrics.jobsProcessed.inc({ 
        type: 'email:draft', 
        status: 'error' 
      });
      
      logger.error('Email draft generation failed', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      throw new Error(`Email draft generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract structured data from email content
   */
  async extractData(message: EmailMessage, schema: any, jobId: string): Promise<any> {
    const startTime = Date.now();
    const timer = prometheusMetrics.jobDuration.startTimer({ type: 'email:extract' });
    
    try {
      logger.info('Starting email data extraction', { 
        jobId, 
        messageId: message.id,
        schema: Object.keys(schema || {})
      });

      const prompt = this.buildExtractionPrompt(message, schema);
      
      const response = await this.callAIRouter({
        prompt,
        maxTokens: 800,
        temperature: 0.1,
        userId: `worker-${jobId}`,
        requestId: `extract-${message.id}`,
        metadata: {
          operation: 'email:extract',
          messageId: message.id
        }
      });

      const extractedData = this.parseExtractionResponse(response.response);
      
      // Record metrics
      timer();
      prometheusMetrics.jobsProcessed.inc({ 
        type: 'email:extract', 
        status: 'success' 
      });
      prometheusMetrics.aiCosts.inc(response.cost);

      logger.info('Email data extraction completed', {
        jobId,
        messageId: message.id,
        extractedFields: Object.keys(extractedData),
        cost: response.cost,
        provider: response.provider,
        duration: Date.now() - startTime
      });

      return extractedData;

    } catch (error) {
      timer();
      prometheusMetrics.jobsProcessed.inc({ 
        type: 'email:extract', 
        status: 'error' 
      });
      
      logger.error('Email data extraction failed', {
        jobId,
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      throw new Error(`Email data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Call AI Router with retry logic
   */
  private async callAIRouter(request: any): Promise<AIRouterResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios.post(`${this.aiRouterUrl}/api/v1/chat`, request, {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ECONEURA-Workers/1.0'
          }
        });

        if (response.status !== 200) {
          throw new Error(`AI Router returned status ${response.status}`);
        }

        return response.data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on 4xx errors (except 429)
        const errorObj = error instanceof Error ? error : new Error('Unknown error');
        if ((errorObj as any).response?.status >= 400 && (errorObj as any).response?.status < 500 && (errorObj as any).response?.status !== 429) {
          throw errorObj;
        }

        if (attempt < this.maxRetries - 1) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          logger.warn(`AI Router call failed, retrying in ${delay}ms`, {
            attempt: attempt + 1,
            maxRetries: this.maxRetries,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const finalError = lastError || new Error('Unknown error');
    throw new Error(`AI Router call failed after ${this.maxRetries} attempts: ${finalError.message}`);
  }

  /**
   * Build classification prompt
   */
  private buildClassificationPrompt(message: EmailMessage): string {
    return `Analyze this email and classify it according to the following criteria:

EMAIL CONTENT:
From: ${message.from}
To: ${message.to}
Subject: ${message.subject}
Body: ${message.body}

CLASSIFICATION REQUIREMENTS:
1. Category: Choose one of [business, personal, promotional, support, newsletter, spam, other]
2. Priority: Choose one of [urgent, high, medium, low]
3. Sentiment: Choose one of [positive, negative, neutral]
4. Action Required: Choose one of [reply, forward, archive, delete, schedule, none]
5. Confidence: Number between 0.0 and 1.0

Return ONLY a JSON object with this exact structure:
{
  "category": "string",
  "priority": "string", 
  "sentiment": "string",
  "actionRequired": "string",
  "confidence": 0.0,
  "reasoning": "Brief explanation"
}`;
  }

  /**
   * Build draft generation prompt
   */
  private buildDraftPrompt(request: EmailDraft): string {
    return `Generate a professional email draft based on these requirements:

TO: ${request.to}
SUBJECT: ${request.subject || 'Professional Correspondence'}
CONTEXT: ${request.context || 'Standard business communication'}
TONE: ${request.tone || 'professional'}
${request.replyTo ? `REPLYING TO: ${request.replyTo.subject}\nOriginal Message: ${request.replyTo.body}` : ''}

REQUIREMENTS:
- Professional and appropriate tone
- Clear and concise language
- Proper email structure with greeting and closing
- Address the context provided
- ${request.tone === 'urgent' ? 'Express urgency appropriately' : ''}
- ${request.tone === 'friendly' ? 'Use a warm, friendly tone' : ''}

Return ONLY a JSON object with this structure:
{
  "subject": "Email subject line",
  "body": "Complete email body with proper formatting",
  "priority": "low|medium|high"
}`;
  }

  /**
   * Build extraction prompt
   */
  private buildExtractionPrompt(message: EmailMessage, schema: any): string {
    const schemaFields = Object.keys(schema || {}).map(key => 
      `- ${key}: ${schema[key].type || 'string'} ${schema[key].required ? '(required)' : '(optional)'}`
    ).join('\n');

    return `Extract structured data from this email according to the specified schema:

EMAIL CONTENT:
From: ${message.from}
Subject: ${message.subject}
Body: ${message.body}

EXTRACTION SCHEMA:
${schemaFields || 'Extract any relevant structured data'}

INSTRUCTIONS:
- Extract only information that is clearly present in the email
- Use null for missing optional fields
- Maintain original formatting for dates and numbers
- Be precise and accurate

Return ONLY a JSON object matching the schema structure.`;
  }

  /**
   * Parse classification response
   */
  private parseClassificationResponse(response: string): EmailClassification {
    try {
      const parsed = JSON.parse(response.trim());
      
      // Validate required fields
      const required = ['category', 'priority', 'sentiment', 'actionRequired', 'confidence'];
      for (const field of required) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return {
        category: parsed.category,
        priority: parsed.priority,
        sentiment: parsed.sentiment,
        actionRequired: parsed.actionRequired,
        confidence: parseFloat(parsed.confidence),
        reasoning: parsed.reasoning || '',
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to parse classification response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse draft response
   */
  private parseDraftResponse(response: string, request: EmailDraft): EmailData {
    try {
      const parsed = JSON.parse(response.trim());
      
      return {
        to: request.to,
        subject: parsed.subject || request.subject || 'Professional Correspondence',
        body: parsed.body || '',
        priority: parsed.priority || 'medium',
        timestamp: new Date()
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        to: request.to,
        subject: request.subject || 'Professional Correspondence',
        body: response.trim(),
        priority: 'medium',
        timestamp: new Date()
      };
    }
  }

  /**
   * Parse extraction response
   */
  private parseExtractionResponse(response: string): any {
    try {
      return JSON.parse(response.trim());
    } catch (error) {
      throw new Error(`Failed to parse extraction response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}