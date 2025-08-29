import { Request, Response } from 'express'
import { BaseController } from './base.controller.js'
import { invoices, type Invoice } from '@econeura/db'
import { insertInvoiceSchema } from '@econeura/db'
import { z } from 'zod'

type CreateInvoiceInput = z.infer<typeof insertInvoiceSchema>
type UpdateInvoiceInput = Partial<CreateInvoiceInput>

export class InvoicesController extends BaseController<Invoice, CreateInvoiceInput, UpdateInvoiceInput> {
  constructor() {
    super(invoices, 'orgId', 'createdAt')
  }

  async create(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertInvoiceSchema.parse(req.body)
    
    // Call parent create method
    return super.create(req, res)
  }

  async update(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertInvoiceSchema.partial().parse(req.body)
    
    // Call parent update method
    return super.update(req, res)
  }

  protected getResourceName(): string {
    return 'Invoice'
  }
}

export const invoicesController = new InvoicesController()


