/**
 * PR-54: Dunning 3-toques Service
 * 
 * Sistema de gestión de cobranza con 3 toques automáticos
 */

import { structuredLogger } from './structured-logger.js';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid' | 'cancelled';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface DunningStep {
  id: string;
  invoiceId: string;
  stepNumber: number;
  stepType: 'email' | 'call' | 'letter' | 'legal';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  scheduledDate: string;
  sentDate?: string;
  deliveryDate?: string;
  content: string;
  recipient: string;
  channel: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface DunningCampaign {
  id: string;
  invoiceId: string;
  customerId: string;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  currentStep: number;
  totalSteps: number;
  startDate: string;
  endDate?: string;
  steps: DunningStep[];
  paymentReceived?: boolean;
  paymentDate?: string;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DunningConfig {
  enabled: boolean;
  maxSteps: number;
  stepIntervals: number[]; // días entre pasos
  escalationThresholds: {
    email: number;
    call: number;
    letter: number;
    legal: number;
  };
  channels: {
    email: { enabled: boolean; template: string };
    call: { enabled: boolean; script: string };
    letter: { enabled: boolean; template: string };
    legal: { enabled: boolean; template: string };
  };
  autoEscalation: boolean;
  gracePeriod: number; // días de gracia
  maxOverdueDays: number;
  notificationEnabled: boolean;
}

export interface DunningStats {
  totalInvoices: number;
  overdueInvoices: number;
  activeCampaigns: number;
  completedCampaigns: number;
  successfulCollections: number;
  collectionRate: number;
  averageDaysToPayment: number;
  stepEffectiveness: Record<string, number>;
  lastRun: string;
}

export class Dunning3ToquesService {
  private config: DunningConfig;
  private invoices: Map<string, Invoice> = new Map();
  private campaigns: Map<string, DunningCampaign> = new Map();
  private steps: Map<string, DunningStep[]> = new Map();
  private stats: DunningStats;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<DunningConfig> = {}) {
    this.config = {
      enabled: true,
      maxSteps: 3,
      stepIntervals: [7, 14, 30], // 7, 14, 30 días
      escalationThresholds: {
        email: 0,
        call: 1,
        letter: 2,
        legal: 3
      },
      channels: {
        email: { enabled: true, template: 'dunning_email_template' },
        call: { enabled: true, script: 'dunning_call_script' },
        letter: { enabled: true, template: 'dunning_letter_template' },
        legal: { enabled: true, template: 'dunning_legal_template' }
      },
      autoEscalation: true,
      gracePeriod: 3,
      maxOverdueDays: 90,
      notificationEnabled: true,
      ...config
    };

    this.stats = {
      totalInvoices: 0,
      overdueInvoices: 0,
      activeCampaigns: 0,
      completedCampaigns: 0,
      successfulCollections: 0,
      collectionRate: 0,
      averageDaysToPayment: 0,
      stepEffectiveness: {},
      lastRun: new Date().toISOString()
    };

    this.startPeriodicProcessing();
    structuredLogger.info('Dunning 3-toques service initialized', {
      config: this.config,
      requestId: ''
    });
  }

  private startPeriodicProcessing(): void {
    if (!this.config.enabled) return;

    this.processingInterval = setInterval(() => {
      this.processDunningCampaigns();
    }, 24 * 60 * 60 * 1000); // Cada 24 horas

    structuredLogger.info('Periodic dunning processing started', {
      interval: '24 hours',
      requestId: ''
    });
  }

  async processDunningCampaigns(): Promise<DunningStats> {
    if (this.isProcessing) {
      return this.stats;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      structuredLogger.info('Starting dunning campaigns processing', {
        totalInvoices: this.invoices.size,
        requestId: ''
      });

      // 1. Identificar facturas vencidas
      const overdueInvoices = this.getOverdueInvoices();
      
      // 2. Crear campañas para facturas sin campaña activa
      const newCampaigns = await this.createNewCampaigns(overdueInvoices);
      
      // 3. Procesar campañas activas
      const processedCampaigns = await this.processActiveCampaigns();
      
      // 4. Actualizar estadísticas
      this.stats = this.calculateStats(startTime);

      structuredLogger.info('Dunning campaigns processing completed', {
        overdueInvoices: overdueInvoices.length,
        newCampaigns: newCampaigns.length,
        processedCampaigns: processedCampaigns.length,
        processingTime: Date.now() - startTime,
        requestId: ''
      });

      return this.stats;

    } catch (error) {
      structuredLogger.error('Dunning campaigns processing failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private getOverdueInvoices(): Invoice[] {
    const now = new Date();
    const gracePeriodMs = this.config.gracePeriod * 24 * 60 * 60 * 1000;
    
    return Array.from(this.invoices.values()).filter(invoice => {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        return false;
      }

      const dueDate = new Date(invoice.dueDate);
      const overdueDate = new Date(dueDate.getTime() + gracePeriodMs);
      
      return now > overdueDate;
    });
  }

  private async createNewCampaigns(overdueInvoices: Invoice[]): Promise<DunningCampaign[]> {
    const newCampaigns: DunningCampaign[] = [];

    for (const invoice of overdueInvoices) {
      // Verificar si ya existe una campaña activa
      const existingCampaign = Array.from(this.campaigns.values()).find(
        campaign => campaign.invoiceId === invoice.id && campaign.status === 'active'
      );

      if (existingCampaign) {
        continue;
      }

      const campaign = await this.createDunningCampaign(invoice);
      this.campaigns.set(campaign.id, campaign);
      newCampaigns.push(campaign);

      structuredLogger.info('New dunning campaign created', {
        campaignId: campaign.id,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: invoice.amount,
        requestId: ''
      });
    }

    return newCampaigns;
  }

  private async createDunningCampaign(invoice: Invoice): Promise<DunningCampaign> {
    const campaignId = `dunning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const steps: DunningStep[] = [];

    // Crear los 3 pasos del dunning
    for (let i = 0; i < this.config.maxSteps; i++) {
      const stepType = this.getStepType(i);
      const scheduledDate = this.getScheduledDate(i);
      
      const step: DunningStep = {
        id: `${campaignId}_step_${i + 1}`,
        invoiceId: invoice.id,
        stepNumber: i + 1,
        stepType,
        status: 'pending',
        scheduledDate: scheduledDate.toISOString(),
        content: this.generateStepContent(stepType, invoice, i + 1),
        recipient: invoice.customerName,
        channel: this.getChannel(stepType),
        priority: this.getPriority(i + 1),
        escalationLevel: i + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      steps.push(step);
    }

    const campaign: DunningCampaign = {
      id: campaignId,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      status: 'active',
      currentStep: 1,
      totalSteps: this.config.maxSteps,
      startDate: new Date().toISOString(),
      steps,
      notes: [`Campaign started for invoice ${invoice.invoiceNumber}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.steps.set(campaignId, steps);
    return campaign;
  }

  private getStepType(stepIndex: number): 'email' | 'call' | 'letter' | 'legal' {
    if (stepIndex === 0) return 'email';
    if (stepIndex === 1) return 'call';
    if (stepIndex === 2) return 'letter';
    return 'legal';
  }

  private getScheduledDate(stepIndex: number): Date {
    const now = new Date();
    const intervalDays = this.config.stepIntervals[stepIndex] || 30;
    return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }

  private generateStepContent(stepType: string, invoice: Invoice, stepNumber: number): string {
    const templates = {
      email: `Estimado/a ${invoice.customerName},\n\nLe recordamos que tiene una factura pendiente de pago:\n\nFactura: ${invoice.invoiceNumber}\nMonto: ${invoice.amount} ${invoice.currency}\nVencimiento: ${invoice.dueDate}\n\nPor favor, proceda con el pago lo antes posible para evitar cargos adicionales.\n\nSaludos cordiales,\nEquipo de Cobranza`,
      
      call: `Llamada de seguimiento para factura ${invoice.invoiceNumber} por ${invoice.amount} ${invoice.currency}. Verificar estado de pago y ofrecer opciones de pago.`,
      
      letter: `Carta formal de cobranza para factura ${invoice.invoiceNumber} por ${invoice.amount} ${invoice.currency}. Incluir advertencia de acciones legales.`,
      
      legal: `Notificación legal para factura ${invoice.invoiceNumber} por ${invoice.amount} ${invoice.currency}. Iniciar proceso de cobranza legal.`
    };

    return templates[stepType as keyof typeof templates] || templates.email;
  }

  private getChannel(stepType: string): string {
    const channels = {
      email: 'email',
      call: 'phone',
      letter: 'postal',
      legal: 'legal_notice'
    };
    return channels[stepType as keyof typeof channels] || 'email';
  }

  private getPriority(stepNumber: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (stepNumber === 1) return 'medium';
    if (stepNumber === 2) return 'high';
    if (stepNumber === 3) return 'urgent';
    return 'low';
  }

  private async processActiveCampaigns(): Promise<DunningCampaign[]> {
    const activeCampaigns = Array.from(this.campaigns.values()).filter(
      campaign => campaign.status === 'active'
    );

    const processedCampaigns: DunningCampaign[] = [];

    for (const campaign of activeCampaigns) {
      const processedCampaign = await this.processCampaign(campaign);
      if (processedCampaign) {
        processedCampaigns.push(processedCampaign);
      }
    }

    return processedCampaigns;
  }

  private async processCampaign(campaign: DunningCampaign): Promise<DunningCampaign | null> {
    const now = new Date();
    const currentStep = campaign.steps.find(step => step.stepNumber === campaign.currentStep);

    if (!currentStep) {
      return null;
    }

    const scheduledDate = new Date(currentStep.scheduledDate);

    // Verificar si es hora de ejecutar el paso
    if (now >= scheduledDate && currentStep.status === 'pending') {
      await this.executeStep(currentStep);
      
      // Actualizar campaña
      campaign.currentStep++;
      campaign.updatedAt = new Date().toISOString();

      // Si se completaron todos los pasos
      if (campaign.currentStep > campaign.totalSteps) {
        campaign.status = 'completed';
        campaign.endDate = new Date().toISOString();
        campaign.notes.push('Campaign completed - all steps executed');
      }

      this.campaigns.set(campaign.id, campaign);
      return campaign;
    }

    return null;
  }

  private async executeStep(step: DunningStep): Promise<void> {
    try {
      step.status = 'sent';
      step.sentDate = new Date().toISOString();
      step.updatedAt = new Date().toISOString();

      // Simular envío
      await this.sendStep(step);

      step.status = 'delivered';
      step.deliveryDate = new Date().toISOString();
      step.updatedAt = new Date().toISOString();

      structuredLogger.info('Dunning step executed', {
        stepId: step.id,
        invoiceId: step.invoiceId,
        stepType: step.stepType,
        stepNumber: step.stepNumber,
        requestId: ''
      });

    } catch (error) {
      step.status = 'failed';
      step.updatedAt = new Date().toISOString();

      structuredLogger.error('Dunning step execution failed', {
        stepId: step.id,
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
    }
  }

  private async sendStep(step: DunningStep): Promise<void> {
    // En un sistema real, esto enviaría el paso a través del canal correspondiente
    // Por ahora, solo simulamos el envío
    
    switch (step.stepType) {
      case 'email':
        // Enviar email
        break;
      case 'call':
        // Programar llamada
        break;
      case 'letter':
        // Enviar carta
        break;
      case 'legal':
        // Enviar notificación legal
        break;
    }

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private calculateStats(startTime: number): DunningStats {
    const totalInvoices = this.invoices.size;
    const overdueInvoices = this.getOverdueInvoices().length;
    const activeCampaigns = Array.from(this.campaigns.values()).filter(
      c => c.status === 'active'
    ).length;
    const completedCampaigns = Array.from(this.campaigns.values()).filter(
      c => c.status === 'completed'
    ).length;
    const successfulCollections = Array.from(this.campaigns.values()).filter(
      c => c.paymentReceived
    ).length;

    const collectionRate = totalInvoices > 0 ? (successfulCollections / totalInvoices) * 100 : 0;

    // Calcular efectividad por paso
    const stepEffectiveness: Record<string, number> = {};
    for (const campaign of this.campaigns.values()) {
      for (const step of campaign.steps) {
        if (step.status === 'delivered') {
          stepEffectiveness[step.stepType] = (stepEffectiveness[step.stepType] || 0) + 1;
        }
      }
    }

    return {
      totalInvoices,
      overdueInvoices,
      activeCampaigns,
      completedCampaigns,
      successfulCollections,
      collectionRate,
      averageDaysToPayment: 0, // Se calcularía basado en datos reales
      stepEffectiveness,
      lastRun: new Date().toISOString()
    };
  }

  /**
   * Obtiene campañas activas
   */
  getActiveCampaigns(): DunningCampaign[] {
    return Array.from(this.campaigns.values()).filter(
      campaign => campaign.status === 'active'
    );
  }

  /**
   * Obtiene campaña por ID
   */
  getCampaign(campaignId: string): DunningCampaign | null {
    return this.campaigns.get(campaignId) || null;
  }

  /**
   * Obtiene pasos de una campaña
   */
  getCampaignSteps(campaignId: string): DunningStep[] {
    return this.steps.get(campaignId) || [];
  }

  /**
   * Marca una factura como pagada
   */
  async markInvoiceAsPaid(invoiceId: string, paymentDate: string): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (invoice) {
      invoice.status = 'paid';
      invoice.updatedAt = new Date().toISOString();
      this.invoices.set(invoiceId, invoice);
    }

    // Cancelar campañas activas para esta factura
    for (const campaign of this.campaigns.values()) {
      if (campaign.invoiceId === invoiceId && campaign.status === 'active') {
        campaign.status = 'cancelled';
        campaign.paymentReceived = true;
        campaign.paymentDate = paymentDate;
        campaign.endDate = new Date().toISOString();
        campaign.notes.push(`Payment received on ${paymentDate}`);
        this.campaigns.set(campaign.id, campaign);
      }
    }

    structuredLogger.info('Invoice marked as paid', {
      invoiceId,
      paymentDate,
      requestId: ''
    });
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): DunningStats {
    return this.stats;
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<DunningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Dunning configuration updated', {
      config: this.config,
      requestId: ''
    });
  }

  /**
   * Detiene el servicio
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    structuredLogger.info('Dunning 3-toques service stopped', { requestId: '' });
  }
}

export const dunning3ToquesService = new Dunning3ToquesService();
