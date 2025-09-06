// ============================================================================
// DOMAIN LAYER EXPORTS
// ============================================================================

// Entities
export { User } from './entities/user.entity.js';
export { Organization } from './entities/organization.entity.js';
export { Company } from './entities/company.entity.js';
export { Contact } from './entities/contact.entity.js';
export { Interaction } from './entities/interaction.entity.js';
export { Deal } from './entities/deal.entity.js';

// Value Objects
export { Email } from './value-objects/email.vo.js';
export { Money } from './value-objects/money.vo.js';
export { Address } from './value-objects/address.vo.js';

// Repositories
export { UserRepository } from './repositories/user.repository.js';
export { OrganizationRepository } from './repositories/organization.repository.js';
export { CompanyRepository } from './repositories/company.repository.js';
export { ContactRepository } from './repositories/contact.repository.js';
export { InteractionRepository } from './repositories/interaction.repository.js';
export { DealRepository } from './repositories/deal.repository.js';

// Domain Services
export { UserDomainService } from './services/user.domain.service.js';

// Types
export type { UserId, OrganizationId, Email as EmailVO, PasswordHash, UserRole, UserStatus } from './entities/user.entity.js';
export type { OrganizationSlug, SubscriptionTier, OrganizationStatus, OrganizationSettings } from './entities/organization.entity.js';
export type { CompanyId, CompanyType, CompanyStatus, CompanySize, CompanyIndustry, CompanySource, CompanySettings } from './entities/company.entity.js';
export type { ContactId, ContactType, ContactStatus, ContactSource, ContactPriority, ContactSettings } from './entities/contact.entity.js';
export type { InteractionId, InteractionType, InteractionStatus, InteractionPriority } from './entities/interaction.entity.js';
export type { DealId, DealStage, DealStatus, DealPriority, DealSource } from './entities/deal.entity.js';
export type { Currency } from './value-objects/money.vo.js';
export type { AddressProps } from './value-objects/address.vo.js';
export type { UserFilters, PaginatedResult, UserSearchOptions } from './repositories/user.repository.js';
export type { OrganizationFilters, OrganizationSearchOptions } from './repositories/organization.repository.js';
export type { CompanyFilters, CompanySearchOptions, CompanyStats } from './repositories/company.repository.js';
export type { ContactFilters, ContactSearchOptions, ContactStats } from './repositories/contact.repository.js';
export type { InteractionFilters, InteractionSearchOptions, InteractionStats } from './repositories/interaction.repository.js';
export type { DealFilters, DealSearchOptions, DealStats } from './repositories/deal.repository.js';

// Re-export shared utilities for convenience
export * from '../shared/index.js';
