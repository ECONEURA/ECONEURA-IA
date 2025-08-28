/**
 * Email Types - Type definitions for email processing
 * ECONEURA WORKERS OUTLOOK - Email Type Definitions
 */

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  messageId?: string;
  threadId?: string;
  isRead?: boolean;
  importance?: 'low' | 'normal' | 'high';
}

export interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentId?: string;
  isInline?: boolean;
  downloadUrl?: string;
}

export interface EmailClassification {
  category: 'business' | 'personal' | 'promotional' | 'support' | 'newsletter' | 'spam' | 'other';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
  actionRequired: 'reply' | 'forward' | 'archive' | 'delete' | 'schedule' | 'none';
  confidence: number; // 0.0 to 1.0
  reasoning?: string;
  timestamp: Date;
  tags?: string[];
  entities?: EmailEntity[];
}

export interface EmailEntity {
  type: 'person' | 'company' | 'date' | 'amount' | 'location' | 'phone' | 'email' | 'url';
  value: string;
  confidence: number;
  start?: number;
  end?: number;
}

export interface EmailDraft {
  to: string;
  subject?: string;
  context?: string;
  tone?: 'professional' | 'friendly' | 'urgent' | 'formal' | 'casual';
  replyTo?: {
    messageId: string;
    subject: string;
    body: string;
  };
  template?: string;
  variables?: Record<string, any>;
  attachments?: EmailAttachment[];
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  htmlBody?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: string[];
  messages: EmailMessage[];
  lastActivity: Date;
  messageCount: number;
  unreadCount: number;
  isImportant: boolean;
  labels?: string[];
}

export interface EmailFolder {
  id: string;
  name: string;
  displayName: string;
  parentFolderId?: string;
  childFolders?: EmailFolder[];
  messageCount: number;
  unreadCount: number;
  isHidden: boolean;
}

export interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  provider: 'outlook' | 'gmail' | 'exchange' | 'imap';
  isConnected: boolean;
  lastSyncTime?: Date;
  folders: EmailFolder[];
  settings: EmailAccountSettings;
}

export interface EmailAccountSettings {
  syncFrequency: number; // minutes
  maxSyncDays: number;
  enablePush: boolean;
  autoClassify: boolean;
  spamFiltering: boolean;
  signatures: EmailSignature[];
}

export interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface EmailSearchQuery {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  folder?: string;
  hasAttachments?: boolean;
  isRead?: boolean;
  importance?: 'low' | 'normal' | 'high';
  dateFrom?: Date;
  dateTo?: Date;
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface EmailSearchResult {
  messages: EmailMessage[];
  totalCount: number;
  hasMore: boolean;
  query: EmailSearchQuery;
  timestamp: Date;
}

export interface EmailStats {
  totalMessages: number;
  unreadMessages: number;
  todayMessages: number;
  weekMessages: number;
  monthMessages: number;
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
  topSenders: Array<{
    email: string;
    count: number;
  }>;
  averageResponseTime: number; // hours
  lastUpdate: Date;
}

export interface EmailRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  conditions: EmailRuleCondition[];
  actions: EmailRuleAction[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailRuleCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'attachment' | 'importance';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'exists';
  value: string;
  caseSensitive?: boolean;
}

export interface EmailRuleAction {
  type: 'move_to_folder' | 'mark_as_read' | 'mark_as_important' | 'add_category' | 'forward' | 'delete' | 'reply';
  value: string;
  parameters?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  subject: string;
  body: string;
  variables: EmailTemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'email' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select type
  description?: string;
}

export interface EmailMetrics {
  sent: number;
  received: number;
  replied: number;
  forwarded: number;
  deleted: number;
  archived: number;
  classified: number;
  processed: number;
  errors: number;
  averageProcessingTime: number; // milliseconds
  timestamp: Date;
  period: 'hour' | 'day' | 'week' | 'month';
}

export interface EmailWebhook {
  id: string;
  url: string;
  events: EmailWebhookEvent[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffTime: number;
  };
  createdAt: Date;
  lastTriggered?: Date;
}

export interface EmailWebhookEvent {
  type: 'message.received' | 'message.sent' | 'message.read' | 'message.deleted' | 'classification.completed';
  filters?: Record<string, any>;
}

export interface EmailNotification {
  id: string;
  type: 'new_message' | 'classification_ready' | 'draft_generated' | 'error_occurred';
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}