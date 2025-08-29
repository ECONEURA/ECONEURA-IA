import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'
// import { PrismaClient } from '@prisma/client'

// Pagination interface
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Filter operators
export interface FilterOperator {
  eq?: any
  ne?: any
  gt?: any
  gte?: any
  lt?: any
  lte?: any
  contains?: string
  startsWith?: string
  endsWith?: string
  in?: any[]
  notIn?: any[]
}

// Response helpers
export class ApiResponse {
  static success(res: Response, data: any, status = 200) {
    return res.status(status).json({
      success: true,
      data
    })
  }

  static paginated(res: Response, data: any[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit)
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  }

  static error(res: Response, message: string, status = 400, details?: any) {
    return res.status(status).json({
      success: false,
      error: {
        message,
        details
      }
    })
  }
}

// Validation middleware factory
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.error(res, 'Validation error', 400, error.errors)
      }
      next(error)
    }
  }
}

// Parse pagination from query
export function parsePagination(query: any): PaginationQuery {
  return {
    page: Math.max(1, parseInt(query.page) || 1),
    limit: Math.min(100, Math.max(1, parseInt(query.limit) || 20)),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc'
  }
}

// Parse filters from query
export function parseFilters(query: any, allowedFields: string[]): Record<string, any> {
  const filters: Record<string, any> = {}
  
  for (const field of allowedFields) {
    if (query[field] !== undefined) {
      // Handle different filter operators
      if (typeof query[field] === 'object') {
        filters[field] = query[field]
      } else {
        // Simple equality filter
        filters[field] = query[field]
      }
    }
  }
  
  // Handle search across multiple fields
  if (query.search) {
    filters.OR = allowedFields
      .filter(field => ['name', 'email', 'title', 'description'].includes(field))
      .map(field => ({
        [field]: {
          contains: query.search,
          mode: 'insensitive'
        }
      }))
  }
  
  return filters
}

// Build Prisma where clause with org isolation
export function buildWhereClause(
  orgId: string,
  filters: Record<string, any>
): Prisma.CompanyWhereInput {
  return {
    orgId,
    deletedAt: null, // Soft delete filter
    ...filters
  }
}

// Error handler for Prisma errors
export function handlePrismaError(error: any, res: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return ApiResponse.error(res, 'Duplicate record', 409, {
          field: error.meta?.target
        })
      case 'P2025':
        return ApiResponse.error(res, 'Record not found', 404)
      case 'P2003':
        return ApiResponse.error(res, 'Foreign key constraint failed', 400, {
          field: error.meta?.field_name
        })
      default:
        return ApiResponse.error(res, 'Database error', 500, {
          code: error.code
        })
    }
  }
  
  return ApiResponse.error(res, 'Internal server error', 500)
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Check ownership for record-level access control
export async function checkOwnership(
  model: any,
  recordId: string,
  userId: string,
  orgId: string
): Promise<boolean> {
  const record = await model.findFirst({
    where: {
      id: recordId,
      orgId,
      OR: [
        { createdByUserId: userId },
        { assignedUserId: userId }
      ]
    }
  })
  
  return !!record
}

// Audit log helper
export async function createAuditLog(
  prisma: any,
  data: {
    orgId: string
    userId: string
    action: string
    resource: string
    resourceId?: string
    metadata?: any
    ipAddress?: string
    userAgent?: string
  }
) {
  await prisma.auditLog.create({
    data: {
      organizationId: data.orgId,
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    }
  })
}

// Multi-tenant query builder
export class TenantQueryBuilder {
  private orgId: string
  private model: any
  private where: any = {}
  private include: any = {}
  private orderBy: any = {}
  private take?: number
  private skip?: number

  constructor(orgId: string, model: any) {
    this.orgId = orgId
    this.model = model
    this.where.orgId = orgId
    this.where.deletedAt = null
  }

  filter(filters: Record<string, any>) {
    Object.assign(this.where, filters)
    return this
  }

  search(searchTerm: string, fields: string[]) {
    if (searchTerm && fields.length > 0) {
      this.where.OR = fields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      }))
    }
    return this
  }

  includeRelations(relations: Record<string, any>) {
    this.include = relations
    return this
  }

  sort(field: string, order: 'asc' | 'desc' = 'desc') {
    this.orderBy[field] = order
    return this
  }

  paginate(page: number, limit: number) {
    this.skip = (page - 1) * limit
    this.take = limit
    return this
  }

  async execute() {
    const query: any = {
      where: this.where,
      orderBy: this.orderBy
    }

    if (Object.keys(this.include).length > 0) {
      query.include = this.include
    }

    if (this.take) {
      query.take = this.take
      query.skip = this.skip
    }

    const [data, total] = await Promise.all([
      this.model.findMany(query),
      this.model.count({ where: this.where })
    ])

    return { data, total }
  }

  async findOne(id: string) {
    return this.model.findFirst({
      where: {
        id,
        orgId: this.orgId,
        deletedAt: null
      },
      include: this.include
    })
  }

  async create(data: any) {
    return this.model.create({
      data: {
        ...data,
        orgId: this.orgId
      },
      include: this.include
    })
  }

  async update(id: string, data: any) {
    return this.model.update({
      where: {
        id,
        orgId: this.orgId
      },
      data,
      include: this.include
    })
  }

  async softDelete(id: string) {
    return this.model.update({
      where: {
        id,
        orgId: this.orgId
      },
      data: {
        deletedAt: new Date()
      }
    })
  }
}