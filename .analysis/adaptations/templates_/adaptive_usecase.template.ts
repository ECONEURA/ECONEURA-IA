import { {{ENTITY_NAME}}, {{ENTITY_NAME}}Id, OrganizationId } from '../../../domain/entities/{{ENTITY_NAME_LOWER}}.entity.js';
import { {{ENTITY_NAME}}Repository } from '../../../domain/repositories/{{ENTITY_NAME_LOWER}}.repository.js';
import { UserDomainService } from '../../../domain/services/user.domain.service.js';
import { createValidationError, createNotFoundError, createConflictError } from '../../../shared/utils/error.utils.js';

// ============================================================================
// ADAPTIVE USE CASE TEMPLATE
// ============================================================================

// Analizar use cases existentes para extraer patrones comunes
// TODO: Reemplazar con patrones específicos encontrados en el análisis

export interface Create{{ENTITY_NAME}}Request {
  organizationId: OrganizationId;
  // TODO: Agregar campos específicos basados en análisis de use cases existentes
}

export interface Create{{ENTITY_NAME}}Response {
  success: true;
  data: {
    {{ENTITY_NAME_LOWER}}: {{ENTITY_NAME}};
  };
}

export class Create{{ENTITY_NAME}}UseCase {
  constructor(
    private readonly {{ENTITY_NAME_LOWER}}Repository: {{ENTITY_NAME}}Repository,
    private readonly userDomainService: UserDomainService
  ) {}

  async execute(request: Create{{ENTITY_NAME}}Request): Promise<Create{{ENTITY_NAME}}Response> {
    // ========================================================================
    // VALIDATION - Seguir patrón de validación de use cases existentes
    // ========================================================================

    // TODO: Implementar validaciones basadas en patrones existentes

    // ========================================================================
    // BUSINESS LOGIC VALIDATION - Adaptar de use cases existentes
    // ========================================================================

    // TODO: Implementar validaciones de negocio basadas en patrones existentes

    // ========================================================================
    // CREATE {{ENTITY_NAME}} - Seguir patrón de creación existente
    // ========================================================================

    // TODO: Implementar creación basada en patrones existentes

    // ========================================================================
    // VALIDATE {{ENTITY_NAME}} - Seguir patrón de validación existente
    // ========================================================================

    // TODO: Implementar validación de entidad

    // ========================================================================
    // SAVE {{ENTITY_NAME}} - Seguir patrón de guardado existente
    // ========================================================================

    // TODO: Implementar guardado

    // ========================================================================
    // RETURN RESPONSE - Seguir patrón de respuesta existente
    // ========================================================================

    // TODO: Implementar respuesta
    return {
      success: true,
      data: {
        {{ENTITY_NAME_LOWER}}: {} as {{ENTITY_NAME}}
      }
    };
  }
}
