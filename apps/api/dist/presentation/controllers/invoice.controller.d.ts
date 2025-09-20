import { Request, Response, NextFunction } from 'express';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository.js';
import { BaseController } from './base.controller.js';
export declare class InvoiceController extends BaseController {
    private invoiceRepository;
    private createInvoiceUseCase;
    private updateInvoiceUseCase;
    constructor(invoiceRepository: InvoiceRepository);
    createInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoicesByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchInvoices(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoiceStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoicesByType(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoicesByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoicesByPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoicesByCompany(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOverdueInvoices(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInvoicesDueSoon(req: Request, res: Response, next: NextFunction): Promise<void>;
    recordPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    applyDiscount(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdateInvoices(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeleteInvoices(req: Request, res: Response, next: NextFunction): Promise<void>;
    private transformInvoiceToResponse;
    private transformStatsToResponse;
}
//# sourceMappingURL=invoice.controller.d.ts.map