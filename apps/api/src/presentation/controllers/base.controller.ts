import { Request, Response, NextFunction } from 'express';
import { BaseResponse, ListResponse } from '../dto/base.dto.js';

// ============================================================================
// BASE CONTROLLER - Clase base para todos los controladores
// ============================================================================

export abstract class BaseController {
  // ========================================================================
  // MÉTODOS COMUNES DE RESPUESTA
  // ========================================================================

  protected sendSuccessResponse<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: BaseResponse = {
      success: true,
      data,
      message
    };
    res.status(statusCode).json(response);
  }

  protected sendListResponse<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message?: string
  ): void {
    const response: ListResponse<T> = {
      data,
      pagination
    };
    this.sendSuccessResponse(res, response, message);
  }

  protected sendErrorResponse(
    res: Response,
    message: string,
    statusCode: number = 400,
    details?: any
  ): void {
    const response: BaseResponse = {
      success: false,
      data: null,
      message,
      ...(details && { details })
    };
    res.status(statusCode).json(response);
  }

  protected sendNotFoundResponse(
    res: Response,
    resource: string = 'Resource'
  ): void {
    this.sendErrorResponse(res, `${resource} not found`, 404);
  }

  protected sendValidationErrorResponse(
    res: Response,
    message: string,
    details?: any
  ): void {
    this.sendErrorResponse(res, message, 400, details);
  }

  protected sendUnauthorizedResponse(
    res: Response,
    message: string = 'Unauthorized'
  ): void {
    this.sendErrorResponse(res, message, 401);
  }

  protected sendForbiddenResponse(
    res: Response,
    message: string = 'Forbidden'
  ): void {
    this.sendErrorResponse(res, message, 403);
  }

  protected sendInternalErrorResponse(
    res: Response,
    message: string = 'Internal server error'
  ): void {
    this.sendErrorResponse(res, message, 500);
  }

  // ========================================================================
  // UTILIDADES COMUNES
  // ========================================================================

  protected getUserId(req: Request): string | undefined {
    return req.user?.id || req.headers['x-user-id'] as string;
  }

  protected getOrganizationId(req: Request): string | undefined {
    return req.params.organizationId || req.body.organizationId || req.headers['x-organization-id'] as string;
  }

  protected validateRequiredFields(
    data: any,
    requiredFields: string[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  protected sanitizeString(value: string): string {
    return value.trim();
  }

  protected generatePagination(
    page: number,
    limit: number,
    total: number
  ) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  protected async handleAsync<T>(
    fn: () => Promise<T>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await fn();
      return result as any;
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // MÉTODOS DE VALIDACIÓN COMUNES
  // ========================================================================

  protected validateId(id: string, fieldName: string = 'ID'): void {
    if (!id || id.trim().length === 0) {
      throw new Error(`${fieldName} is required`);
    }
  }

  protected validateOrganizationId(organizationId: string): void {
    this.validateId(organizationId, 'Organization ID');
  }

  protected validatePaginationParams(page: number, limit: number): void {
    if (page < 1) {
      throw new Error('Page must be at least 1');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }

  // ========================================================================
  // MÉTODOS DE TRANSFORMACIÓN COMUNES
  // ========================================================================

  protected transformEntityToResponse<T extends { id: string; organizationId: string; createdAt: Date; updatedAt: Date }>(
    entity: T
  ): any {
    return {
      id: entity.id.value,
      organizationId: entity.organizationId.value,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      ...entity
    };
  }

  protected transformEntityListToResponse<T extends { id: string; organizationId: string; createdAt: Date; updatedAt: Date }>(
    entities: T[]
  ): any[] {
    return entities.map(entity => this.transformEntityToResponse(entity));
  }
}
