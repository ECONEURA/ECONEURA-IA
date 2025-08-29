import { Request, Response } from 'express'
import { BaseController } from './base.controller.js'
import { companies, type Company } from '@econeura/db'
import { insertCompanySchema, selectCompanySchema } from '@econeura/db'
import { z } from 'zod'

type CreateCompanyInput = z.infer<typeof insertCompanySchema>
type UpdateCompanyInput = Partial<CreateCompanyInput>

export class CompaniesController extends BaseController<Company, CreateCompanyInput, UpdateCompanyInput> {
  constructor() {
    super(companies, 'orgId', 'name')
  }

  async create(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertCompanySchema.parse(req.body)
    
    // Call parent create method
    return super.create(req, res)
  }

  async update(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertCompanySchema.partial().parse(req.body)
    
    // Call parent update method
    return super.update(req, res)
  }

  protected getResourceName(): string {
    return 'Company'
  }
}

export const companiesController = new CompaniesController()


