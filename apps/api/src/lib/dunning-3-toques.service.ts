import { structuredLogger } from './structured-logger.js';

// Dunning 3-Toques Service - PR-40
// Sistema automatizado de gestión de cobros con escalación inteligente

interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Financial Information
  financial: {
    amount: number;
    currency: string;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    discountAmount?: number;
  };
  
  // Dates
  dates: {
    issueDate: string;
    dueDate: string;
    paymentDate?: string;
    lastReminderDate?: string;
    nextReminderDate?: string;
  };
  
  // Status
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  
  // Dunning Information
  dunning: {
    isActive: boolean;
    level: 0 | 1 | 2 | 3; // 0 = no dunning, 1-3 = dunning levels
    attempts: number;
    lastAttemptDate?: string;
    nextAttemptDate?: string;
    escalationReason?: string;
    notes?: string;
  };
  
  // Payment Information
  payment: {
    method?: 'bank_transfer' | 'credit_card' | 'paypal' | 'cash' | 'check';
    reference?: string;
    bankDetails?: {
      accountNumber: string;
      sortCode: string;
      iban?: string;
      swift?: string;
    };
  };
  
  // Items
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate: number;
  }>;
  
  // Metadata
  metadata: {
    source: string;
    createdBy: string;
    lastUpdated: string;
    customFields?: Record<string, any>;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface DunningRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number; // 1-10, higher = more important
  
  // Trigger Conditions
  conditions: {
    daysOverdue: number;
    minAmount?: number;
    maxAmount?: number;
    customerTypes?: string[];
    excludeCustomers?: string[];
    paymentMethods?: string[];
  };
  
  // Dunning Levels
  levels: Array<{
    level: 1 | 2 | 3;
    daysAfterPrevious: number;
    action: 'email' | 'phone' | 'letter' | 'legal_notice' | 'collection_agency';
    template: string;
    subject: string;
    content: string;
    attachments?: string[];
    escalationActions?: string[];
  }>;
  
  // Escalation Rules
  escalation: {
    maxAttempts: number;
    escalationDelay: number; // days
    finalAction: 'suspend_service' | 'legal_action' | 'collection_agency' | 'write_off';
    notificationRecipients: string[];
  };
  
  createdAt: string;
  updatedAt: string;
}

interface DunningAttempt {
  id: string;
  invoiceId: string;
  organizationId: string;
  level: 1 | 2 | 3;
  attemptNumber: number;
  
  // Action Details
  action: {
    type: 'email' | 'phone' | 'letter' | 'legal_notice' | 'collection_agency';
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'cancelled';
    scheduledDate: string;
    executedDate?: string;
    responseDate?: string;
  };
  
  // Communication Details
  communication: {
    template: string;
    subject: string;
    content: string;
    recipient: string;
    channel: 'email' | 'phone' | 'postal' | 'sms';
    trackingId?: string;
  };
  
  // Response
  response?: {
    type: 'payment_promise' | 'payment_made' | 'dispute' | 'no_response' | 'unreachable';
    notes: string;
    nextAction?: string;
    followUpDate?: string;
  };
  
  // Results
  results: {
    paymentReceived: boolean;
    paymentAmount?: number;
    paymentDate?: string;
    customerResponse?: string;
    escalationRequired: boolean;
    nextLevel?: 1 | 2 | 3;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface DunningCampaign {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  
  // Configuration
  configuration: {
    ruleId: string;
    targetInvoices: string[];
    startDate: string;
    endDate?: string;
    batchSize: number;
    maxConcurrency: number;
    respectQuietHours: boolean;
    quietHoursStart?: string; // HH:MM
    quietHoursEnd?: string; // HH:MM
  };
  
  // Progress
  progress: {
    totalInvoices: number;
    processedInvoices: number;
    successfulAttempts: number;
    failedAttempts: number;
    paymentsReceived: number;
    totalAmountCollected: number;
    startTime?: string;
    endTime?: string;
  };
  
  // Results
  results?: {
    invoices: Array<{
      invoiceId: string;
      attempts: number;
      paymentsReceived: number;
      finalStatus: string;
    }>;
    summary: {
      totalAttempts: number;
      successRate: number;
      averageDaysToPayment: number;
      totalCollected: number;
    };
  };
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DunningReport {
  id: string;
  organizationId: string;
  type: 'summary' | 'detailed' | 'performance' | 'compliance';
  period: {
    startDate: string;
    endDate: string;
  };
  
  // Report Data
  data: {
    totalInvoices: number;
    overdueInvoices: number;
    totalOutstanding: number;
    totalCollected: number;
    collectionRate: number;
    
    byLevel: {
      level1: { attempts: number; success: number; amount: number };
      level2: { attempts: number; success: number; amount: number };
      level3: { attempts: number; success: number; amount: number };
    };
    
    byCustomer: Array<{
      customerId: string;
      customerName: string;
      totalOutstanding: number;
      totalCollected: number;
      collectionRate: number;
      averageDaysToPayment: number;
    }>;
    
    trends: Array<{
      date: string;
      newOverdue: number;
      paymentsReceived: number;
      collectionRate: number;
    }>;
  };
  
  generatedAt: string;
  generatedBy: string;
}

class Dunning3ToquesService {
  private invoices: Map<string, Invoice> = new Map();
  private dunningRules: Map<string, DunningRule> = new Map();
  private dunningAttempts: Map<string, DunningAttempt> = new Map();
  private dunningCampaigns: Map<string, DunningCampaign> = new Map();
  private dunningReports: Map<string, DunningReport> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Dunning 3-Toques Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Demo invoices
    const invoice1: Invoice = {
      id: 'invoice_1',
      organizationId: 'demo-org-1',
      invoiceNumber: 'INV-2024-001',
      customerId: 'customer_1',
      customerName: 'TechCorp Solutions',
      customerEmail: 'billing@techcorp.com',
      customerPhone: '+34 91 123 4567',
      financial: {
        amount: 5000,
        currency: 'EUR',
        taxAmount: 1050,
        totalAmount: 6050,
        paidAmount: 0,
        outstandingAmount: 6050,
        discountAmount: 0
      },
      dates: {
        issueDate: oneMonthAgo.toISOString(),
        dueDate: twoWeeksAgo.toISOString(),
        lastReminderDate: oneWeekAgo.toISOString(),
        nextReminderDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'overdue',
      paymentStatus: 'overdue',
      dunning: {
        isActive: true,
        level: 2,
        attempts: 2,
        lastAttemptDate: oneWeekAgo.toISOString(),
        nextAttemptDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        escalationReason: 'No response to first reminder',
        notes: 'Customer has not responded to previous attempts'
      },
      payment: {
        method: 'bank_transfer',
        bankDetails: {
          accountNumber: 'ES1234567890123456789012',
          sortCode: '1234',
          iban: 'ES1234567890123456789012',
          swift: 'BBVAESMM'
        }
      },
      items: [
        {
          id: 'item_1',
          description: 'Software License - Annual',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000,
          taxRate: 21
        }
      ],
      metadata: {
        source: 'CRM',
        createdBy: 'admin@demo.com',
        lastUpdated: oneWeekAgo.toISOString()
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneWeekAgo.toISOString()
    };

    const invoice2: Invoice = {
      id: 'invoice_2',
      organizationId: 'demo-org-1',
      invoiceNumber: 'INV-2024-002',
      customerId: 'customer_2',
      customerName: 'GreenTech Innovations',
      customerEmail: 'finance@greentech.com',
      customerPhone: '+34 93 987 6543',
      financial: {
        amount: 2500,
        currency: 'EUR',
        taxAmount: 525,
        totalAmount: 3025,
        paidAmount: 0,
        outstandingAmount: 3025,
        discountAmount: 0
      },
      dates: {
        issueDate: twoWeeksAgo.toISOString(),
        dueDate: oneWeekAgo.toISOString(),
        lastReminderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextReminderDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      status: 'overdue',
      paymentStatus: 'overdue',
      dunning: {
        isActive: true,
        level: 1,
        attempts: 1,
        lastAttemptDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        nextAttemptDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        escalationReason: 'Payment overdue',
        notes: 'First reminder sent'
      },
      payment: {
        method: 'bank_transfer',
        bankDetails: {
          accountNumber: 'ES9876543210987654321098',
          sortCode: '5678',
          iban: 'ES9876543210987654321098',
          swift: 'SABNESMM'
        }
      },
      items: [
        {
          id: 'item_2',
          description: 'Consulting Services - 20 hours',
          quantity: 20,
          unitPrice: 125,
          totalPrice: 2500,
          taxRate: 21
        }
      ],
      metadata: {
        source: 'CRM',
        createdBy: 'admin@demo.com',
        lastUpdated: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: twoWeeksAgo.toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.invoices.set(invoice1.id, invoice1);
    this.invoices.set(invoice2.id, invoice2);

    // Demo dunning rule
    const rule1: DunningRule = {
      id: 'rule_1',
      organizationId: 'demo-org-1',
      name: 'Standard Dunning Process',
      description: 'Proceso estándar de gestión de cobros con 3 niveles',
      isActive: true,
      priority: 10,
      conditions: {
        daysOverdue: 1,
        minAmount: 100,
        maxAmount: 10000,
        customerTypes: ['standard', 'premium'],
        excludeCustomers: ['vip_customer'],
        paymentMethods: ['bank_transfer', 'credit_card']
      },
      levels: [
        {
          level: 1,
          daysAfterPrevious: 7,
          action: 'email',
          template: 'dunning_level_1',
          subject: 'Recordatorio de pago - Factura {{invoiceNumber}}',
          content: 'Estimado cliente, le recordamos que la factura {{invoiceNumber}} por importe de {{amount}} está pendiente de pago desde {{dueDate}}. Por favor, proceda al pago lo antes posible.',
          attachments: ['invoice_pdf'],
          escalationActions: ['schedule_phone_call']
        },
        {
          level: 2,
          daysAfterPrevious: 14,
          action: 'phone',
          template: 'dunning_level_2',
          subject: 'Llamada de seguimiento - Factura {{invoiceNumber}}',
          content: 'Llamada telefónica para recordar el pago de la factura {{invoiceNumber}}. Se registrará la respuesta del cliente.',
          escalationActions: ['send_legal_notice']
        },
        {
          level: 3,
          daysAfterPrevious: 21,
          action: 'legal_notice',
          template: 'dunning_level_3',
          subject: 'Aviso legal - Factura {{invoiceNumber}}',
          content: 'Aviso legal formal por impago de la factura {{invoiceNumber}}. Se procederá a las acciones legales correspondientes si no se recibe el pago en 10 días.',
          attachments: ['legal_notice_pdf'],
          escalationActions: ['suspend_service', 'collection_agency']
        }
      ],
      escalation: {
        maxAttempts: 3,
        escalationDelay: 7,
        finalAction: 'collection_agency',
        notificationRecipients: ['finance@demo.com', 'legal@demo.com']
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.dunningRules.set(rule1.id, rule1);

    // Demo dunning attempts
    const attempt1: DunningAttempt = {
      id: 'attempt_1',
      invoiceId: 'invoice_1',
      organizationId: 'demo-org-1',
      level: 1,
      attemptNumber: 1,
      action: {
        type: 'email',
        status: 'delivered',
        scheduledDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        executedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        responseDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString()
      },
      communication: {
        template: 'dunning_level_1',
        subject: 'Recordatorio de pago - Factura INV-2024-001',
        content: 'Estimado cliente, le recordamos que la factura INV-2024-001 por importe de €6.050 está pendiente de pago desde 2024-08-22. Por favor, proceda al pago lo antes posible.',
        recipient: 'billing@techcorp.com',
        channel: 'email',
        trackingId: 'track_001'
      },
      response: {
        type: 'no_response',
        notes: 'Email delivered but no response received',
        nextAction: 'Schedule phone call',
        followUpDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      results: {
        paymentReceived: false,
        customerResponse: 'No response',
        escalationRequired: true,
        nextLevel: 2
      },
      createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString()
    };

    const attempt2: DunningAttempt = {
      id: 'attempt_2',
      invoiceId: 'invoice_1',
      organizationId: 'demo-org-1',
      level: 2,
      attemptNumber: 2,
      action: {
        type: 'phone',
        status: 'sent',
        scheduledDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        executedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      communication: {
        template: 'dunning_level_2',
        subject: 'Llamada de seguimiento - Factura INV-2024-001',
        content: 'Llamada telefónica para recordar el pago de la factura INV-2024-001. Se registrará la respuesta del cliente.',
        recipient: '+34 91 123 4567',
        channel: 'phone',
        trackingId: 'call_001'
      },
      response: {
        type: 'payment_promise',
        notes: 'Customer promised payment within 5 days',
        nextAction: 'Wait for payment',
        followUpDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      results: {
        paymentReceived: false,
        customerResponse: 'Payment promise - 5 days',
        escalationRequired: false,
        nextLevel: undefined
      },
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.dunningAttempts.set(attempt1.id, attempt1);
    this.dunningAttempts.set(attempt2.id, attempt2);
  }

  // Invoice Management
  async getInvoices(organizationId: string, filters: {
    status?: string;
    paymentStatus?: string;
    minAmount?: number;
    maxAmount?: number;
    daysOverdue?: number;
    hasDunning?: boolean;
    dunningLevel?: number;
    search?: string;
    limit?: number;
  } = {}): Promise<Invoice[]> {
    let invoices = Array.from(this.invoices.values())
      .filter(i => i.organizationId === organizationId);

    if (filters.status) {
      invoices = invoices.filter(i => i.status === filters.status);
    }

    if (filters.paymentStatus) {
      invoices = invoices.filter(i => i.paymentStatus === filters.paymentStatus);
    }

    if (filters.minAmount !== undefined) {
      invoices = invoices.filter(i => i.financial.outstandingAmount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      invoices = invoices.filter(i => i.financial.outstandingAmount <= filters.maxAmount!);
    }

    if (filters.daysOverdue !== undefined) {
      const cutoffDate = new Date(Date.now() - filters.daysOverdue! * 24 * 60 * 60 * 1000);
      invoices = invoices.filter(i => new Date(i.dates.dueDate) <= cutoffDate);
    }

    if (filters.hasDunning !== undefined) {
      invoices = invoices.filter(i => filters.hasDunning ? i.dunning.isActive : !i.dunning.isActive);
    }

    if (filters.dunningLevel !== undefined) {
      invoices = invoices.filter(i => i.dunning.level === filters.dunningLevel);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      invoices = invoices.filter(i => 
        i.invoiceNumber.toLowerCase().includes(searchLower) ||
        i.customerName.toLowerCase().includes(searchLower) ||
        i.customerEmail.toLowerCase().includes(searchLower)
      );
    }

    if (filters.limit) {
      invoices = invoices.slice(0, filters.limit);
    }

    return invoices.sort((a, b) => new Date(b.dates.dueDate).getTime() - new Date(a.dates.dueDate).getTime());
  }

  async getInvoice(invoiceId: string): Promise<Invoice | undefined> {
    return this.invoices.get(invoiceId);
  }

  // Dunning Management
  async startDunningProcess(invoiceId: string, ruleId?: string): Promise<DunningAttempt> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const rule = ruleId ? this.dunningRules.get(ruleId) : 
      Array.from(this.dunningRules.values())
        .find(r => r.organizationId === invoice.organizationId && r.isActive);

    if (!rule) {
      throw new Error('No active dunning rule found');
    }

    // Check if invoice meets conditions
    if (!this.checkDunningConditions(invoice, rule)) {
      throw new Error('Invoice does not meet dunning conditions');
    }

    // Determine next level
    const nextLevel = this.getNextDunningLevel(invoice, rule);
    if (!nextLevel) {
      throw new Error('Maximum dunning level reached');
    }

    // Create dunning attempt
    const attempt = await this.createDunningAttempt(invoice, rule, nextLevel);
    
    // Update invoice
    invoice.dunning.level = nextLevel;
    invoice.dunning.attempts += 1;
    invoice.dunning.lastAttemptDate = new Date().toISOString();
    invoice.dunning.nextAttemptDate = this.calculateNextAttemptDate(invoice, rule, nextLevel);
    invoice.updatedAt = new Date().toISOString();

    structuredLogger.info('Dunning process started', { 
      invoiceId, 
      organizationId: invoice.organizationId,
      level: nextLevel,
      attemptId: attempt.id
    });

    return attempt;
  }

  private checkDunningConditions(invoice: Invoice, rule: DunningRule): boolean {
    const conditions = rule.conditions;
    
    // Check days overdue
    const daysOverdue = Math.ceil((Date.now() - new Date(invoice.dates.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue < conditions.daysOverdue) {
      return false;
    }

    // Check amount range
    if (conditions.minAmount && invoice.financial.outstandingAmount < conditions.minAmount) {
      return false;
    }
    if (conditions.maxAmount && invoice.financial.outstandingAmount > conditions.maxAmount) {
      return false;
    }

    // Check customer type (simplified)
    if (conditions.customerTypes && !conditions.customerTypes.includes('standard')) {
      return false;
    }

    // Check excluded customers
    if (conditions.excludeCustomers && conditions.excludeCustomers.includes(invoice.customerId)) {
      return false;
    }

    return true;
  }

  private getNextDunningLevel(invoice: Invoice, rule: DunningRule): 1 | 2 | 3 | null {
    const currentLevel = invoice.dunning.level;
    const attempts = invoice.dunning.attempts;

    if (currentLevel === 0) {
      return 1;
    }

    if (currentLevel === 1 && attempts >= 1) {
      return 2;
    }

    if (currentLevel === 2 && attempts >= 2) {
      return 3;
    }

    if (currentLevel === 3 && attempts >= 3) {
      return null; // Maximum level reached
    }

    return currentLevel as 1 | 2 | 3;
  }

  private async createDunningAttempt(invoice: Invoice, rule: DunningRule, level: 1 | 2 | 3): Promise<DunningAttempt> {
    const levelConfig = rule.levels.find(l => l.level === level);
    if (!levelConfig) {
      throw new Error(`Dunning level ${level} not configured`);
    }

    const now = new Date().toISOString();
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const attempt: DunningAttempt = {
      id: attemptId,
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      level,
      attemptNumber: invoice.dunning.attempts + 1,
      action: {
        type: levelConfig.action,
        status: 'pending',
        scheduledDate: now
      },
      communication: {
        template: levelConfig.template,
        subject: this.processTemplate(levelConfig.subject, invoice),
        content: this.processTemplate(levelConfig.content, invoice),
        recipient: this.getRecipient(levelConfig.action, invoice),
        channel: this.getChannel(levelConfig.action)
      },
      results: {
        paymentReceived: false,
        escalationRequired: false
      },
      createdAt: now,
      updatedAt: now
    };

    this.dunningAttempts.set(attempt.id, attempt);
    return attempt;
  }

  private processTemplate(template: string, invoice: Invoice): string {
    return template
      .replace(/\{\{invoiceNumber\}\}/g, invoice.invoiceNumber)
      .replace(/\{\{amount\}\}/g, `€${invoice.financial.outstandingAmount.toLocaleString()}`)
      .replace(/\{\{dueDate\}\}/g, new Date(invoice.dates.dueDate).toLocaleDateString())
      .replace(/\{\{customerName\}\}/g, invoice.customerName);
  }

  private getRecipient(action: string, invoice: Invoice): string {
    switch (action) {
      case 'email':
        return invoice.customerEmail;
      case 'phone':
        return invoice.customerPhone || '';
      case 'letter':
        return invoice.customerName;
      default:
        return invoice.customerEmail;
    }
  }

  private getChannel(action: string): 'email' | 'phone' | 'postal' | 'sms' {
    switch (action) {
      case 'email':
        return 'email';
      case 'phone':
        return 'phone';
      case 'letter':
        return 'postal';
      case 'sms':
        return 'sms';
      default:
        return 'email';
    }
  }

  private calculateNextAttemptDate(invoice: Invoice, rule: DunningRule, level: 1 | 2 | 3): string {
    const levelConfig = rule.levels.find(l => l.level === level);
    if (!levelConfig) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const nextDate = new Date(Date.now() + levelConfig.daysAfterPrevious * 24 * 60 * 60 * 1000);
    return nextDate.toISOString();
  }

  // Campaign Management
  async createDunningCampaign(campaignData: Omit<DunningCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<DunningCampaign> {
    const now = new Date().toISOString();
    const campaign: DunningCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...campaignData,
      createdAt: now,
      updatedAt: now
    };

    this.dunningCampaigns.set(campaign.id, campaign);
    
    structuredLogger.info('Dunning campaign created', { 
      campaignId: campaign.id, 
      organizationId: campaign.organizationId,
      totalInvoices: campaign.configuration.targetInvoices.length
    });

    return campaign;
  }

  async executeDunningCampaign(campaignId: string): Promise<void> {
    const campaign = this.dunningCampaigns.get(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw new Error('Campaign is not in draft status');
    }

    campaign.status = 'active';
    campaign.progress.startTime = new Date().toISOString();

    // Process invoices in batches
    const invoices = campaign.configuration.targetInvoices;
    const batchSize = campaign.configuration.batchSize;
    
    for (let i = 0; i < invoices.length; i += batchSize) {
      const batch = invoices.slice(i, i + batchSize);
      
      for (const invoiceId of batch) {
        try {
          await this.startDunningProcess(invoiceId, campaign.configuration.ruleId);
          campaign.progress.successfulAttempts++;
        } catch (error) {
          campaign.progress.failedAttempts++;
          structuredLogger.error('Dunning attempt failed', { invoiceId, error });
        }
        
        campaign.progress.processedInvoices++;
      }
    }

    campaign.status = 'completed';
    campaign.progress.endTime = new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();

    structuredLogger.info('Dunning campaign completed', { 
      campaignId, 
      organizationId: campaign.organizationId,
      processedInvoices: campaign.progress.processedInvoices,
      successfulAttempts: campaign.progress.successfulAttempts,
      failedAttempts: campaign.progress.failedAttempts
    });
  }

  // Statistics
  async getDunningStats(organizationId: string) {
    const invoices = Array.from(this.invoices.values()).filter(i => i.organizationId === organizationId);
    const attempts = Array.from(this.dunningAttempts.values()).filter(a => a.organizationId === organizationId);
    const campaigns = Array.from(this.dunningCampaigns.values()).filter(c => c.organizationId === organizationId);

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const activeDunning = invoices.filter(i => i.dunning.isActive);

    return {
      totalInvoices: invoices.length,
      overdueInvoices: overdueInvoices.length,
      activeDunning: activeDunning.length,
      totalOutstanding: invoices.reduce((sum, i) => sum + i.financial.outstandingAmount, 0),
      totalCollected: invoices.reduce((sum, i) => sum + i.financial.paidAmount, 0),
      collectionRate: invoices.length > 0 ? 
        (invoices.reduce((sum, i) => sum + i.financial.paidAmount, 0) / 
         invoices.reduce((sum, i) => sum + i.financial.totalAmount, 0)) * 100 : 0,
      totalAttempts: attempts.length,
      successfulAttempts: attempts.filter(a => a.results.paymentReceived).length,
      successRate: attempts.length > 0 ? 
        (attempts.filter(a => a.results.paymentReceived).length / attempts.length) * 100 : 0,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      last30Days: {
        newOverdue: invoices.filter(i => 
          i.status === 'overdue' && new Date(i.updatedAt) >= last30Days
        ).length,
        paymentsReceived: invoices.filter(i => 
          i.paymentStatus === 'paid' && new Date(i.dates.paymentDate || '') >= last30Days
        ).length,
        attemptsMade: attempts.filter(a => 
          new Date(a.createdAt) >= last30Days
        ).length
      },
      byLevel: {
        level1: attempts.filter(a => a.level === 1).length,
        level2: attempts.filter(a => a.level === 2).length,
        level3: attempts.filter(a => a.level === 3).length
      },
      byStatus: {
        pending: attempts.filter(a => a.action.status === 'pending').length,
        sent: attempts.filter(a => a.action.status === 'sent').length,
        delivered: attempts.filter(a => a.action.status === 'delivered').length,
        failed: attempts.filter(a => a.action.status === 'failed').length
      },
      averageDaysToPayment: this.calculateAverageDaysToPayment(invoices),
      topCustomers: this.getTopCustomers(invoices)
    };
  }

  private calculateAverageDaysToPayment(invoices: Invoice[]): number {
    const paidInvoices = invoices.filter(i => i.paymentStatus === 'paid' && i.dates.paymentDate);
    
    if (paidInvoices.length === 0) return 0;
    
    const totalDays = paidInvoices.reduce((sum, i) => {
      const dueDate = new Date(i.dates.dueDate);
      const paymentDate = new Date(i.dates.paymentDate!);
      return sum + Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    
    return Math.round(totalDays / paidInvoices.length);
  }

  private getTopCustomers(invoices: Invoice[]): Array<{
    customerId: string;
    customerName: string;
    totalOutstanding: number;
    invoiceCount: number;
  }> {
    const customerMap = new Map<string, {
      customerId: string;
      customerName: string;
      totalOutstanding: number;
      invoiceCount: number;
    }>();

    invoices.forEach(invoice => {
      const existing = customerMap.get(invoice.customerId);
      if (existing) {
        existing.totalOutstanding += invoice.financial.outstandingAmount;
        existing.invoiceCount += 1;
      } else {
        customerMap.set(invoice.customerId, {
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          totalOutstanding: invoice.financial.outstandingAmount,
          invoiceCount: 1
        });
      }
    });

    return Array.from(customerMap.values())
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
      .slice(0, 10);
  }
}

export const dunning3ToquesService = new Dunning3ToquesService();
