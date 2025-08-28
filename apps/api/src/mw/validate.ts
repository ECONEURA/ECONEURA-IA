import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'

interface ValidationSchema {
  body?: z.ZodType<any, any>
  query?: z.ZodType<any, any>
  params?: z.ZodType<any, any>
}

export function validateRequest(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body)
      }

      // Validate query parameters
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query)
      }

      // Validate URL parameters
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))

        res.status(400).json({
          type: 'validation_error',
          title: 'Validation Error',
          status: 400,
          detail: 'The request contains invalid data',
          errors
        })
      } else {
        next(error)
      }
    }
  }
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove any HTML tags
    return input.replace(/<[^>]*>/g, '').trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key])
      }
    }
    return sanitized
  }
  
  return input
}