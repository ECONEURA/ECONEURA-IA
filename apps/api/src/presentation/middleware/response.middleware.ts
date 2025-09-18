import { Request, Response, NextFunction } from 'express';

// ============================================================================
// RESPONSE MIDDLEWARE
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
  requestId?: string;
}

export const responseHandler = (req: Request, res: Response, next: NextFunction): void => {
  // Add response helper methods
  res.success = <T>(data: T, message?: string, statusCode: number = 200) => {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string
    };
    res.status(statusCode).json(response);
  };

  res.error = (error: string, statusCode: number = 400) => {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string
    };
    res.status(statusCode).json(response);
  };

  res.created = <T>(data: T, message?: string) => {
    res.success(data, message, 201);
  };

  res.notFound = (message: string = 'Resource not found') => {
    res.error(message, 404);
  };

  res.unauthorized = (message: string = 'Unauthorized') => {
    res.error(message, 401);
  };

  res.forbidden = (message: string = 'Forbidden') => {
    res.error(message, 403);
  };

  res.conflict = (message: string = 'Conflict') => {
    res.error(message, 409);
  };

  res.unprocessableEntity = (message: string = 'Unprocessable entity') => {
    res.error(message, 422);
  };

  res.tooManyRequests = (message: string = 'Too many requests') => {
    res.error(message, 429);
  };

  res.internalServerError = (message: string = 'Internal server error') => {
    res.error(message, 500);
  };

  next();
};
