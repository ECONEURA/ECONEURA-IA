import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  orgId?: string
  correlationId?: string
  errors?: Array<{
    field: string
    message: string
  }>
}

export class ProblemError extends Error {
  public readonly problem: ProblemDetails

  constructor(problem: ProblemDetails) {
    super(problem.title)
    this.problem = problem
    this.name = 'ProblemError'
  }
}

export function createProblem(
  type: string,
  title: string,
  status: number,
  detail?: string,
  orgId?: string,
  correlationId?: string
): ProblemDetails {
  return {
    type,
    title,
    status,
    detail,
    instance: `/api${type}`,
    orgId,
    correlationId,
  }
}

export function problemJsonMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const correlationId = req.headers['x-request-id'] as string || uuidv4()
  const orgId = req.headers['x-org-id'] as string

  let problem: ProblemDetails

  if (error instanceof ProblemError) {
    problem = {
      ...error.problem,
      correlationId,
      orgId: orgId || error.problem.orgId,
    }
  } else if (error instanceof ZodError) {
    problem = createProblem(
      '/validation-error',
      'Validation Error',
      400,
      'Request validation failed',
      orgId,
      correlationId
    )
    problem.errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }))
  } else if (error.name === 'UnauthorizedError') {
    problem = createProblem(
      '/unauthorized',
      'Unauthorized',
      401,
      'Authentication required',
      orgId,
      correlationId
    )
  } else if (error.name === 'ForbiddenError') {
    problem = createProblem(
      '/forbidden',
      'Forbidden',
      403,
      'Insufficient permissions',
      orgId,
      correlationId
    )
  } else {
    problem = createProblem(
      '/internal-error',
      'Internal Server Error',
      500,
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      orgId,
      correlationId
    )
  }

  // Log error
  console.error(`[${correlationId}] ${problem.type}: ${problem.title}`, {
    error: error.message,
    stack: error.stack,
    orgId: problem.orgId,
    url: req.url,
    method: req.method,
  })

  // Set headers
  res.setHeader('Content-Type', 'application/problem+json')
  res.setHeader('X-Request-ID', correlationId)
  if (orgId) {
    res.setHeader('X-Org-ID', orgId)
  }

  res.status(problem.status).json(problem)
}

// Helper functions for common problems
export const Problems = {
  notFound: (resource: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/not-found',
      `${resource} Not Found`,
      404,
      `The requested ${resource.toLowerCase()} was not found`,
      orgId,
      correlationId
    ),

  badRequest: (detail: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/bad-request',
      'Bad Request',
      400,
      detail,
      orgId,
      correlationId
    ),

  unauthorized: (detail?: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/unauthorized',
      'Unauthorized',
      401,
      detail || 'Authentication required',
      orgId,
      correlationId
    ),

  forbidden: (detail?: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/forbidden',
      'Forbidden',
      403,
      detail || 'Insufficient permissions',
      orgId,
      correlationId
    ),

  conflict: (detail: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/conflict',
      'Conflict',
      409,
      detail,
      orgId,
      correlationId
    ),

  tooManyRequests: (detail?: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/too-many-requests',
      'Too Many Requests',
      429,
      detail || 'Rate limit exceeded',
      orgId,
      correlationId
    ),

  internalError: (detail?: string, orgId?: string, correlationId?: string) =>
    createProblem(
      '/internal-error',
      'Internal Server Error',
      500,
      detail || 'An unexpected error occurred',
      orgId,
      correlationId
    ),
}



