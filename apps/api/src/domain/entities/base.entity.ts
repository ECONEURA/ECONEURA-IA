// ============================================================================
// BASE ENTITY - Clase base para todas las entidades
// ============================================================================

export interface BaseEntityId {
  value: string;
}

export interface BaseEntityProps {
  id: BaseEntityId;
  organizationId: BaseEntityId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseEntity {
  protected constructor(protected props: BaseEntityProps) {}

  // ========================================================================
  // GETTERS COMUNES
  // ========================================================================

  get id(): BaseEntityId { return this.props.id; }
  get organizationId(): BaseEntityId { return this.props.organizationId; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ========================================================================
  // MÉTODOS COMUNES
  // ========================================================================

  activate(): void {
    this.props.isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.updateTimestamp();
  }

  protected updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  // ========================================================================
  // VALIDACIÓN COMÚN
  // ========================================================================

  protected validateBase(): boolean {
    if (!this.props.id || !this.props.id.value) {
      return false;
    }
    if (!this.props.organizationId || !this.props.organizationId.value) {
      return false;
    }
    return true;
  }

  // ========================================================================
  // UTILIDADES COMUNES
  // ========================================================================

  toJSON(): BaseEntityProps {
    return { ...this.props };
  }

  protected static generateId(): BaseEntityId {
    return crypto.randomUUID();
  }

  protected static getCurrentTimestamp(): Date {
    return new Date();
  }
}
