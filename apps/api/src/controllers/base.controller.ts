import { Request, Response } from 'express'
import { eq, and, desc, asc, SQL, sql } from 'drizzle-orm'
import { db } from '@econeura/db'
import { Problems, ProblemError } from '../middleware/problem-json.js'

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export abstract class BaseController<T, CreateInput, UpdateInput> {
  protected table: any
  protected orgIdField: string
  protected defaultSortBy: string
  protected defaultSortOrder: 'asc' | 'desc' = 'desc'

  constructor(
    table: any,
    orgIdField: string = 'orgId',
    defaultSortBy: string = 'createdAt'
  ) {
    this.table = table
    this.orgIdField = orgIdField
    this.defaultSortBy = defaultSortBy
  }

  protected getPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
    const sortBy = req.query.sortBy as string || this.defaultSortBy
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || this.defaultSortOrder

    return { page, limit, sortBy, sortOrder }
  }

  protected buildWhereClause(orgId: string, filters: Record<string, any> = {}): SQL {
    const conditions: SQL[] = [eq(this.table[this.orgIdField], orgId)]

    // Add filter conditions
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (this.table[key]) {
          conditions.push(eq(this.table[key], value))
        }
      }
    })

    return and(...conditions)
  }

  protected buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): SQL {
    const column = this.table[sortBy] || this.table[this.defaultSortBy]
    return sortOrder === 'desc' ? desc(column) : asc(column)
  }

  async list(req: Request, res: Response) {
    const orgId = req.orgId!
    const { page, limit, sortBy, sortOrder } = this.getPaginationParams(req)
    const offset = (page - 1) * limit

    try {
      // Build filters from query params
      const filters: Record<string, any> = {}
      Object.keys(req.query).forEach(key => {
        if (!['page', 'limit', 'sortBy', 'sortOrder'].includes(key)) {
          filters[key] = req.query[key]
        }
      })

      const whereClause = this.buildWhereClause(orgId, filters)
      const orderBy = this.buildOrderBy(sortBy, sortOrder)

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(whereClause)

      // Get paginated data
      const data = await db
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset)

      const totalPages = Math.ceil(count / limit)

      const response: PaginatedResponse<T> = {
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }

      res.json(response)
    } catch (error) {
      throw new Error(Problems.internalError('Failed to fetch data'))
    }
  }

  async getById(req: Request, res: Response) {
    const orgId = req.orgId!
    const { id } = req.params

    try {
      const [item] = await db
        .select()
        .from(this.table)
        .where(and(
          eq(this.table.id, id),
          eq(this.table[this.orgIdField], orgId)
        ))

      if (!item) {
        throw new Error(Problems.notFound(this.getResourceName(), orgId))
      }

      res.json(item)
    } catch (error) {
      if (error instanceof ProblemError) {
        throw error
      }
      throw new Error(Problems.internalError('Failed to fetch item'))
    }
  }

  async create(req: Request, res: Response) {
    const orgId = req.orgId!
    const input = req.body

    try {
      const [item] = await db
        .insert(this.table)
        .values({
          ...input,
          [this.orgIdField]: orgId,
        })
        .returning()

      res.status(201).json(item)
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate')) {
        throw new Error(Problems.conflict('Item already exists'))
      }
      throw new Error(Problems.internalError('Failed to create item'))
    }
  }

  async update(req: Request, res: Response) {
    const orgId = req.orgId!
    const { id } = req.params
    const input = req.body

    try {
      const [item] = await db
        .update(this.table)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(and(
          eq(this.table.id, id),
          eq(this.table[this.orgIdField], orgId)
        ))
        .returning()

      if (!item) {
        throw new Error(Problems.notFound(this.getResourceName(), orgId))
      }

      res.json(item)
    } catch (error) {
      if (error instanceof ProblemError) {
        throw error
      }
      throw new Error(Problems.internalError('Failed to update item'))
    }
  }

  async delete(req: Request, res: Response) {
    const orgId = req.orgId!
    const { id } = req.params

    try {
      const [item] = await db
        .delete(this.table)
        .where(and(
          eq(this.table.id, id),
          eq(this.table[this.orgIdField], orgId)
        ))
        .returning()

      if (!item) {
        throw new Error(Problems.notFound(this.getResourceName(), orgId))
      }

      res.status(204).send()
    } catch (error) {
      if (error instanceof ProblemError) {
        throw error
      }
      throw new Error(Problems.internalError('Failed to delete item'))
    }
  }

  protected getResourceName(): string {
    return this.table.name || 'Resource'
  }
}



