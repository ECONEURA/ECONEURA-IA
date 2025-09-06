// ============================================================================
// BASE USE CASE - Clase base para todos los use cases
// ============================================================================

export interface BaseRequest {
  organizationId: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface BaseResponse {
  success: true;
  data: any;
  message?: string;
}

export interface BaseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export abstract class BaseUseCase<RequestType extends BaseRequest, ResponseType extends BaseResponse> {
  // ========================================================================
  // VALIDACIÓN COMÚN
  // ========================================================================

  protected validateBaseRequest(request: RequestType): void {
    if (!request.organizationId || request.organizationId.trim().length === 0) {
      throw new Error('Organization ID is required');
    }
  }

  protected validateId(id: string, fieldName: string = 'ID'): void {
    if (!id || id.trim().length === 0) {
      throw new Error(`${fieldName} is required`);
    }
  }

  protected validateString(value: string, fieldName: string, minLength: number = 1, maxLength?: number): void {
    if (!value || value.trim().length === 0) {
      throw new Error(`${fieldName} is required`);
    }
    if (value.trim().length < minLength) {
      throw new Error(`${fieldName} must be at least ${minLength} characters long`);
    }
    if (maxLength && value.trim().length > maxLength) {
      throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  protected validateUrl(url: string, fieldName: string = 'URL'): void {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid ${fieldName} format`);
    }
  }

  protected validateUuid(uuid: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      throw new Error(`Invalid ${fieldName} format`);
    }
  }

  // ========================================================================
  // UTILIDADES COMUNES
  // ========================================================================

  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected getCurrentTimestamp(): Date {
    return new Date();
  }

  protected sanitizeString(value: string): string {
    return value.trim();
  }

  protected createSuccessResponse(data: any, message?: string): ResponseType {
    return {
      success: true,
      data,
      message
    } as ResponseType;
  }

  protected createErrorResponse(code: string, message: string, details?: any): BaseError {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
  }

  // ========================================================================
  // MÉTODO ABSTRACTO
  // ========================================================================

  abstract execute(request: RequestType): Promise<ResponseType>;
}
