import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'

interface ValidationSchemas {
  body?: z.ZodType<any>
  query?: z.ZodType<any>
  params?: z.ZodType<any>
}

export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }

      // Validate query if schema provided
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }

      // Validate params if schema provided  
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          detail: 'The request data is invalid',
          errors: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        })
      }

      console.error('Validation error:', error)
      res.status(500).json({
        error: 'Internal server error',
        detail: 'An unexpected error occurred during validation'
      })
    }
  }
}