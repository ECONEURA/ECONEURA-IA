import { structuredLogger } from './structured-logger.js';
export class Dunning3ToquesService {
    config;
    invoices = new Map();
    campaigns = new Map();
    steps = new Map();
    stats;
    isProcessing = false;
    processingInterval = null;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            maxSteps: 3,
            stepIntervals: [7, 14, 30],
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
    startPeriodicProcessing() {
        if (!this.config.enabled)
            return;
        this.processingInterval = setInterval(() => {
            this.processDunningCampaigns();
        }, 24 * 60 * 60 * 1000);
        structuredLogger.info('Periodic dunning processing started', {
            interval: '24 hours',
            requestId: ''
        });
    }
    async processDunningCampaigns() {
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
            const overdueInvoices = this.getOverdueInvoices();
            const newCampaigns = await this.createNewCampaigns(overdueInvoices);
            const processedCampaigns = await this.processActiveCampaigns();
            this.stats = this.calculateStats(startTime);
            structuredLogger.info('Dunning campaigns processing completed', {
                overdueInvoices: overdueInvoices.length,
                newCampaigns: newCampaigns.length,
                processedCampaigns: processedCampaigns.length,
                processingTime: Date.now() - startTime,
                requestId: ''
            });
            return this.stats;
        }
        catch (error) {
            structuredLogger.error('Dunning campaigns processing failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    getOverdueInvoices() {
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
    async createNewCampaigns(overdueInvoices) {
        const newCampaigns = [];
        for (const invoice of overdueInvoices) {
            const existingCampaign = Array.from(this.campaigns.values()).find(campaign => campaign.invoiceId === invoice.id && campaign.status === 'active');
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
    async createDunningCampaign(invoice) {
        const campaignId = `dunning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const steps = [];
        for (let i = 0; i < this.config.maxSteps; i++) {
            const stepType = this.getStepType(i);
            const scheduledDate = this.getScheduledDate(i);
            const step = {
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
        const campaign = {
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
    getStepType(stepIndex) {
        if (stepIndex === 0)
            return 'email';
        if (stepIndex === 1)
            return 'call';
        if (stepIndex === 2)
            return 'letter';
        return 'legal';
    }
    getScheduledDate(stepIndex) {
        const now = new Date();
        const intervalDays = this.config.stepIntervals[stepIndex] || 30;
        return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    }
    generateStepContent(stepType, invoice, stepNumber) {
        const templates = {
            email: `Estimado/a ${invoice.customerName},\n\nLe recordamos que tiene una factura pendiente de pago:\n\nFactura: ${invoice.invoiceNumber}\nMonto: ${invoice.amount} ${invoice.currency}\nVencimiento: ${invoice.dueDate}\n\nPor favor, proceda con el pago lo antes posible para evitar cargos adicionales.\n\nSaludos cordiales,\nEquipo de Cobranza`,
            call: `Llamada de seguimiento para factura ${invoice.invoiceNumber} por ${invoice.amount} ${invoice.currency}. Verificar estado de pago y ofrecer opciones de pago.`,
            letter: `Carta formal de cobranza para factura ${invoice.invoiceNumber} por ${invoice.amount} ${invoice.currency}. Incluir advertencia de acciones legales.`,
            legal: `Notificación legal para factura ${invoice.invoiceNumber} por ${invoice.amount} ${invoice.currency}. Iniciar proceso de cobranza legal.`
        };
        return templates[stepType] || templates.email;
    }
    getChannel(stepType) {
        const channels = {
            email: 'email',
            call: 'phone',
            letter: 'postal',
            legal: 'legal_notice'
        };
        return channels[stepType] || 'email';
    }
    getPriority(stepNumber) {
        if (stepNumber === 1)
            return 'medium';
        if (stepNumber === 2)
            return 'high';
        if (stepNumber === 3)
            return 'urgent';
        return 'low';
    }
    async processActiveCampaigns() {
        const activeCampaigns = Array.from(this.campaigns.values()).filter(campaign => campaign.status === 'active');
        const processedCampaigns = [];
        for (const campaign of activeCampaigns) {
            const processedCampaign = await this.processCampaign(campaign);
            if (processedCampaign) {
                processedCampaigns.push(processedCampaign);
            }
        }
        return processedCampaigns;
    }
    async processCampaign(campaign) {
        const now = new Date();
        const currentStep = campaign.steps.find(step => step.stepNumber === campaign.currentStep);
        if (!currentStep) {
            return null;
        }
        const scheduledDate = new Date(currentStep.scheduledDate);
        if (now >= scheduledDate && currentStep.status === 'pending') {
            await this.executeStep(currentStep);
            campaign.currentStep++;
            campaign.updatedAt = new Date().toISOString();
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
    async executeStep(step) {
        try {
            step.status = 'sent';
            step.sentDate = new Date().toISOString();
            step.updatedAt = new Date().toISOString();
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
        }
        catch (error) {
            step.status = 'failed';
            step.updatedAt = new Date().toISOString();
            structuredLogger.error('Dunning step execution failed', {
                stepId: step.id,
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
        }
    }
    async sendStep(step) {
        switch (step.stepType) {
            case 'email':
                break;
            case 'call':
                break;
            case 'letter':
                break;
            case 'legal':
                break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    calculateStats(startTime) {
        const totalInvoices = this.invoices.size;
        const overdueInvoices = this.getOverdueInvoices().length;
        const activeCampaigns = Array.from(this.campaigns.values()).filter(c => c.status === 'active').length;
        const completedCampaigns = Array.from(this.campaigns.values()).filter(c => c.status === 'completed').length;
        const successfulCollections = Array.from(this.campaigns.values()).filter(c => c.paymentReceived).length;
        const collectionRate = totalInvoices > 0 ? (successfulCollections / totalInvoices) * 100 : 0;
        const stepEffectiveness = {};
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
            averageDaysToPayment: 0,
            stepEffectiveness,
            lastRun: new Date().toISOString()
        };
    }
    getActiveCampaigns() {
        return Array.from(this.campaigns.values()).filter(campaign => campaign.status === 'active');
    }
    getCampaign(campaignId) {
        return this.campaigns.get(campaignId) || null;
    }
    getCampaignSteps(campaignId) {
        return this.steps.get(campaignId) || [];
    }
    async markInvoiceAsPaid(invoiceId, paymentDate) {
        const invoice = this.invoices.get(invoiceId);
        if (invoice) {
            invoice.status = 'paid';
            invoice.updatedAt = new Date().toISOString();
            this.invoices.set(invoiceId, invoice);
        }
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
    getStats() {
        return this.stats;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Dunning configuration updated', {
            config: this.config,
            requestId: ''
        });
    }
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        structuredLogger.info('Dunning 3-toques service stopped', { requestId: '' });
    }
}
export const dunning3ToquesService = new Dunning3ToquesService();
//# sourceMappingURL=dunning-3-toques.service.js.map