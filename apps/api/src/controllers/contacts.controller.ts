import { Request, Response } from 'express'
import { BaseController } from './base.controller.js'
import { contacts, type Contact } from '@econeura/db'
import { insertContactSchema } from '@econeura/db'
import { z } from 'zod'

type CreateContactInput = z.infer<typeof insertContactSchema>
type UpdateContactInput = Partial<CreateContactInput>

export class ContactsController extends BaseController<Contact, CreateContactInput, UpdateContactInput> {
  constructor() {
    super(contacts, 'orgId', 'createdAt')
  }

  async create(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertContactSchema.parse(req.body)
    
    // Call parent create method
    return super.create(req, res)
  }

  async update(req: Request, res: Response) {
    // Validate input
    const validatedInput = insertContactSchema.partial().parse(req.body)
    
    // Call parent update method
    return super.update(req, res)
  }

  protected getResourceName(): string {
    return 'Contact'
  }
}

export const contactsController = new ContactsController()


