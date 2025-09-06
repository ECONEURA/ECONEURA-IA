// ============================================================================
// DOMAIN LAYER EXPORTS
// ============================================================================

// Base Entity
export { BaseEntity } from './entities/base.entity.js';
export type { BaseEntityId, BaseEntityProps } from './entities/base.entity.js';

// Entities
export { User } from './entities/user.entity.js';
export { Organization } from './entities/organization.entity.js';
export { Company } from './entities/company.entity.js';
export { Contact } from './entities/contact.entity.js';
export { Product } from './entities/product.entity.js';

// Value Objects
export { Email } from './value-objects/email.vo.js';
export { Money } from './value-objects/money.vo.js';
export { Address } from './value-objects/address.vo.js';

// Base Repository
export type { BaseRepository, BaseEntity, BaseFilters, BaseSearchOptions, PaginatedResult, BaseStats } from './repositories/base.repository.js';

// Repositories
export { UserRepository } from './repositories/user.repository.js';
export { OrganizationRepository } from './repositories/organization.repository.js';
export { CompanyRepository } from './repositories/company.repository.js';
export { ContactRepository } from './repositories/contact.repository.js';
export { ProductRepository } from './repositories/product.repository.js';

// Domain Services
export { UserDomainService } from './services/user.domain.service.js';

// Types
export type { UserId, OrganizationId, Email as EmailVO, PasswordHash, UserRole, UserStatus } from './entities/user.entity.js';
export type { OrganizationSlug, SubscriptionTier, OrganizationStatus, OrganizationSettings } from './entities/organization.entity.js';
export type { CompanyId, CompanyType, CompanyStatus, CompanySize, CompanyIndustry, CompanySource, CompanySettings } from './entities/company.entity.js';
export type { ContactId, ContactType, ContactStatus, ContactSource, ContactPriority, ContactSettings } from './entities/contact.entity.js';
export type { ProductId, ProductType, ProductStatus, ProductCategory, ProductBrand, ProductSupplier, ProductSettings, ProductVariant } from './entities/product.entity.js';
export type { Currency } from './value-objects/money.vo.js';
export type { AddressProps } from './value-objects/address.vo.js';
export type { UserFilters, PaginatedResult, UserSearchOptions } from './repositories/user.repository.js';
export type { OrganizationFilters, OrganizationSearchOptions } from './repositories/organization.repository.js';
export type { CompanyFilters, CompanySearchOptions, CompanyStats } from './repositories/company.repository.js';
export type { ContactFilters, ContactSearchOptions, ContactStats } from './repositories/contact.repository.js';
export type { ProductStats, InventoryStats, PricingStats, CategoryStats, BrandStats, SupplierStats } from './repositories/product.repository.js';

// Re-export shared utilities for convenience
export * from '../shared/index.js';
