import { Request, Response, NextFunction } from 'express';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository.js';
import { CreateInvoiceUseCase } from '../../application/use-cases/invoice/create-invoice.use-case.js';
import { UpdateInvoiceUseCase } from '../../application/use-cases/invoice/update-invoice.use-case.js';
import { BaseController } from './base.controller.js';
import {
  CreateInvoiceRequestSchema,
  UpdateInvoiceRequestSchema,
  InvoiceIdParamSchema,
  InvoiceOrganizationIdParamSchema,
  InvoiceSearchQuerySchema,
  InvoiceBulkUpdateSchema,
  InvoiceBulkDeleteSchema,
  RecordPaymentRequestSchema,
  ApplyDiscountRequestSchema,
  type CreateInvoiceRequest,
  type UpdateInvoiceRequest,
  type InvoiceIdParam,
  type InvoiceOrganizationIdParam,
  type InvoiceSearchQuery,
  type InvoiceBulkUpdate,
  type InvoiceBulkDelete,
  type InvoiceResponse,
  type InvoiceListResponse,
  type InvoiceStatsResponse,
  type RecordPaymentRequest,
  type ApplyDiscountRequest
} from '../dto/invoice.dto.js';

// ============================================================================
// INVOICE CONTROLLER
// ============================================================================

export class InvoiceController extends BaseController {
  private createInvoiceUseCase: CreateInvoiceUseCase;
  private updateInvoiceUseCase: UpdateInvoiceUseCase;

  constructor(private invoiceRepository: InvoiceRepository) {
    super();
    this.createInvoiceUseCase = new CreateInvoiceUseCase(invoiceRepository);
    this.updateInvoiceUseCase = new UpdateInvoiceUseCase(invoiceRepository);
  }

  // ========================================================================
  // INVOICE MANAGEMENT
  // ========================================================================

  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const requestData = CreateInvoiceRequestSchema.parse(req.body);
      const createdBy = this.getUserId(req);

      const result = await this.createInvoiceUseCase.execute({
        ...requestData,
        createdBy
      });

      const response: InvoiceResponse = this.transformInvoiceToResponse(result.data.invoice);
      this.sendSuccessResponse(res, response, 'Invoice created successfully', 201);
    }, res, next);
  }

  async updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = InvoiceIdParamSchema.parse(req.params);
      const requestData = UpdateInvoiceRequestSchema.parse(req.body);
      const updatedBy = this.getUserId(req);

      const result = await this.updateInvoiceUseCase.execute({
        id,
        ...requestData,
        updatedBy
      });

      const response: InvoiceResponse = this.transformInvoiceToResponse(result.data.invoice);
      this.sendSuccessResponse(res, response, 'Invoice updated successfully');
    }, res, next);
  }

  async deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = InvoiceIdParamSchema.parse(req.params);
      const deletedBy = this.getUserId(req);

      await this.invoiceRepository.delete(id);
      this.sendSuccessResponse(res, null, 'Invoice deleted successfully');
    }, res, next);
  }

  async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = InvoiceIdParamSchema.parse(req.params);

      const invoice = await this.invoiceRepository.findById(id);
      if (!invoice) {
        this.sendNotFoundResponse(res, 'Invoice');
        return;
      }

      const response: InvoiceResponse = this.transformInvoiceToResponse(invoice);
      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getInvoicesByOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findByOrganizationId(organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async searchInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.search(query.search || '', organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getInvoiceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);

      const stats = await this.invoiceRepository.getStats(organizationId);
      const response: InvoiceStatsResponse = this.transformStatsToResponse(stats);

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  // ========================================================================
  // INVOICE QUERIES
  // ========================================================================

  async getInvoicesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const { type } = req.params;
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findByType(type, organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getInvoicesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const { status } = req.params;
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findByStatus(status, organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getInvoicesByPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const { paymentStatus } = req.params;
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findByPaymentStatus(paymentStatus, organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getInvoicesByCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const { companyId } = req.params;
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findByCompanyId(companyId, organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getOverdueInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findOverdueInvoices(organizationId, query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getInvoicesDueSoon(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = InvoiceOrganizationIdParamSchema.parse(req.params);
      const { days } = req.params;
      const query = InvoiceSearchQuerySchema.parse(req.query);

      const result = await this.invoiceRepository.findInvoicesDueSoon(organizationId, parseInt(days), query);

      const response: InvoiceListResponse = {
        data: result.data.map(invoice => this.transformInvoiceToResponse(invoice)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  // ========================================================================
  // PAYMENT OPERATIONS
  // ========================================================================

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = InvoiceIdParamSchema.parse(req.params);
      const requestData = RecordPaymentRequestSchema.parse(req.body);

      const invoice = await this.invoiceRepository.findById(id);
      if (!invoice) {
        this.sendNotFoundResponse(res, 'Invoice');
        return;
      }

      invoice.recordPayment(
        { amount: requestData.amount.amount, currency: requestData.amount.currency },
        { value: requestData.paymentMethod },
        requestData.paidDate
      );

      const updatedInvoice = await this.invoiceRepository.update(invoice);
      const response: InvoiceResponse = this.transformInvoiceToResponse(updatedInvoice);

      this.sendSuccessResponse(res, response, 'Payment recorded successfully');
    }, res, next);
  }

  async applyDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = InvoiceIdParamSchema.parse(req.params);
      const requestData = ApplyDiscountRequestSchema.parse(req.body);

      const invoice = await this.invoiceRepository.findById(id);
      if (!invoice) {
        this.sendNotFoundResponse(res, 'Invoice');
        return;
      }

      invoice.applyDiscount({
        amount: requestData.discountAmount.amount,
        currency: requestData.discountAmount.currency
      });

      const updatedInvoice = await this.invoiceRepository.update(invoice);
      const response: InvoiceResponse = this.transformInvoiceToResponse(updatedInvoice);

      this.sendSuccessResponse(res, response, 'Discount applied successfully');
    }, res, next);
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async bulkUpdateInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const requestData = InvoiceBulkUpdateSchema.parse(req.body);
      const updatedBy = this.getUserId(req);

      await this.invoiceRepository.updateStatusMany(requestData.ids, requestData.updates.status || 'draft');

      this.sendSuccessResponse(res, {
        updated: requestData.ids.length,
        ids: requestData.ids
      }, `${requestData.ids.length} invoices updated successfully`);
    }, res, next);
  }

  async bulkDeleteInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const requestData = InvoiceBulkDeleteSchema.parse(req.body);
      const deletedBy = this.getUserId(req);

      await this.invoiceRepository.deleteMany(requestData.ids);

      this.sendSuccessResponse(res, {
        deleted: requestData.ids.length,
        ids: requestData.ids
      }, `${requestData.ids.length} invoices deleted successfully`);
    }, res, next);
  }

  // ========================================================================
  // TRANSFORMATION METHODS
  // ========================================================================

  private transformInvoiceToResponse(invoice: any): InvoiceResponse {
    return {
      id: invoice.id.value,
      organizationId: invoice.organizationId.value,
      invoiceNumber: invoice.invoiceNumber.value,
      type: invoice.type.value,
      status: invoice.status.value,
      paymentStatus: invoice.paymentStatus.value,
      companyId: invoice.companyId,
      contactId: invoice.contactId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      subtotal: {
        amount: invoice.subtotal.amount,
        currency: invoice.subtotal.currency
      },
      taxAmount: {
        amount: invoice.taxAmount.amount,
        currency: invoice.taxAmount.currency
      },
      discountAmount: {
        amount: invoice.discountAmount.amount,
        currency: invoice.discountAmount.currency
      },
      totalAmount: {
        amount: invoice.totalAmount.amount,
        currency: invoice.totalAmount.currency
      },
      paidAmount: {
        amount: invoice.paidAmount.amount,
        currency: invoice.paidAmount.currency
      },
      balanceAmount: {
        amount: invoice.balanceAmount.amount,
        currency: invoice.balanceAmount.currency
      },
      items: invoice.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice.amount,
          currency: item.unitPrice.currency
        },
        totalPrice: {
          amount: item.totalPrice.amount,
          currency: item.totalPrice.currency
        },
        taxRate: item.taxRate,
        taxAmount: item.taxAmount ? {
          amount: item.taxAmount.amount,
          currency: item.taxAmount.currency
        } : undefined,
        discountRate: item.discountRate,
        discountAmount: item.discountAmount ? {
          amount: item.discountAmount.amount,
          currency: item.discountAmount.currency
        } : undefined,
        notes: item.notes
      })),
      paymentMethod: invoice.paymentMethod?.value,
      reference: invoice.reference,
      notes: invoice.notes,
      settings: {
        currency: invoice.settings.currency,
        taxInclusive: invoice.settings.taxInclusive,
        defaultTaxRate: invoice.settings.defaultTaxRate,
        paymentTerms: invoice.settings.paymentTerms,
        lateFeeRate: invoice.settings.lateFeeRate,
        lateFeeAmount: invoice.settings.lateFeeAmount ? {
          amount: invoice.settings.lateFeeAmount.amount,
          currency: invoice.settings.lateFeeAmount.currency
        } : undefined,
        notes: invoice.settings.notes,
        footer: invoice.settings.footer,
        customFields: invoice.settings.customFields,
        tags: invoice.settings.tags
      },
      attachments: invoice.attachments,
      isActive: invoice.isActive,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt
    };
  }

  private transformStatsToResponse(stats: any): InvoiceStatsResponse {
    return {
      total: stats.total,
      active: stats.active,
      inactive: stats.inactive,
      createdThisMonth: stats.createdThisMonth,
      createdThisYear: stats.createdThisYear,
      updatedThisMonth: stats.updatedThisMonth,
      updatedThisYear: stats.updatedThisYear,
      byType: stats.byType,
      byStatus: stats.byStatus,
      byPaymentStatus: stats.byPaymentStatus,
      totalAmount: stats.totalAmount,
      paidAmount: stats.paidAmount,
      outstandingAmount: stats.outstandingAmount,
      overdueAmount: stats.overdueAmount,
      averageAmount: stats.averageAmount,
      averagePaymentTime: stats.averagePaymentTime,
      overdueCount: stats.overdueCount,
      paidCount: stats.paidCount,
      pendingCount: stats.pendingCount,
      partiallyPaidCount: stats.partiallyPaidCount
    };
  }
}
