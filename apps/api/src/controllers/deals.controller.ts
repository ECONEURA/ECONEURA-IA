import { Request, Response } from 'express'
import { BaseController } from './base.controller.js'
import { deals, type Deal } from '@econeura/db'
import { insertDealSchema } from '@econeura/db'
import { z } from 'zod'

type CreateDealInput = z.infer<typeof insertDealSchema>
type UpdateDealInput = Partial<CreateDealInput>

export class DealsController extends BaseController<Deal, CreateDealInput, UpdateDealInput> {
  constructor() {
    super(deals, 'orgId', 'createdAt')
  }

  async create(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertDealSchema.parse(req.body)
    
    // Call parent create method
    return super.create(req, res)
  }

  async update(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertDealSchema.partial().parse(req.body)
    
    // Call parent update method
    return super.update(req, res)
  }

  protected getResourceName(): string {
    return 'Deal'
  }
}

export const dealsController = new DealsController()


