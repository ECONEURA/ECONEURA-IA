import { Product } from '../entities/product.entity.js';

// ============================================================================
// PRODUCT REPOSITORY INTERFACE
// ============================================================================

export interface ProductRepository {
  // ========================================================================
  // BASIC CRUD OPERATIONS
  // ========================================================================

  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findByOrganizationId(organizationId: string): Promise<Product[]>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;

  // ========================================================================
  // QUERY OPERATIONS
  // ========================================================================

  findAll(): Promise<Product[]>;
  findByType(type: string): Promise<Product[]>;
  findByStatus(status: string): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  findByBrand(brand: string): Promise<Product[]>;
  findBySupplier(supplier: string): Promise<Product[]>;
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;

  // ========================================================================
  // ORGANIZATION-SPECIFIC QUERIES
  // ========================================================================

  findByOrganizationAndType(organizationId: string, type: string): Promise<Product[]>;
  findByOrganizationAndStatus(organizationId: string, status: string): Promise<Product[]>;
  findByOrganizationAndCategory(organizationId: string, category: string): Promise<Product[]>;
  findByOrganizationAndBrand(organizationId: string, brand: string): Promise<Product[]>;
  findByOrganizationAndSupplier(organizationId: string, supplier: string): Promise<Product[]>;

  // ========================================================================
  // SEARCH OPERATIONS
  // ========================================================================

  search(query: string, organizationId: string): Promise<Product[]>;
  searchByName(name: string, organizationId: string): Promise<Product[]>;
  searchBySku(sku: string, organizationId: string): Promise<Product[]>;
  searchByBarcode(barcode: string, organizationId: string): Promise<Product[]>;
  searchByDescription(description: string, organizationId: string): Promise<Product[]>;
  searchByTags(tags: string[], organizationId: string): Promise<Product[]>;

  // ========================================================================
  // INVENTORY OPERATIONS
  // ========================================================================

  findByLowStock(organizationId: string, threshold?: number): Promise<Product[]>;
  findByOutOfStock(organizationId: string): Promise<Product[]>;
  findByInStock(organizationId: string): Promise<Product[]>;
  findByBackorderAllowed(organizationId: string): Promise<Product[]>;
  findByPreorderAllowed(organizationId: string): Promise<Product[]>;

  // ========================================================================
  // PRICING OPERATIONS
  // ========================================================================

  findByPriceRange(organizationId: string, minPrice: number, maxPrice: number): Promise<Product[]>;
  findByMarginRange(organizationId: string, minMargin: number, maxMargin: number): Promise<Product[]>;
  findProductsWithDiscount(organizationId: string): Promise<Product[]>;
  findProductsWithoutDiscount(organizationId: string): Promise<Product[]>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  saveMany(products: Product[]): Promise<Product[]>;
  updateMany(products: Product[]): Promise<Product[]>;
  deleteMany(ids: string[]): Promise<void>;
  updateStatusMany(ids: string[], status: string): Promise<void>;
  updateCategoryMany(ids: string[], category: string): Promise<void>;
  updateBrandMany(ids: string[], brand: string): Promise<void>;
  updateSupplierMany(ids: string[], supplier: string): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS
  // ========================================================================

  countByOrganizationId(organizationId: string): Promise<number>;
  countByType(organizationId: string, type: string): Promise<number>;
  countByStatus(organizationId: string, status: string): Promise<number>;
  countByCategory(organizationId: string, category: string): Promise<number>;
  countByBrand(organizationId: string, brand: string): Promise<number>;
  countBySupplier(organizationId: string, supplier: string): Promise<number>;

  getStats(organizationId: string): Promise<ProductStats>;
  getInventoryStats(organizationId: string): Promise<InventoryStats>;
  getPricingStats(organizationId: string): Promise<PricingStats>;
  getCategoryStats(organizationId: string): Promise<CategoryStats>;
  getBrandStats(organizationId: string): Promise<BrandStats>;
  getSupplierStats(organizationId: string): Promise<SupplierStats>;

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  exists(id: string): Promise<boolean>;
  existsBySku(sku: string, organizationId: string): Promise<boolean>;
  existsByBarcode(barcode: string, organizationId: string): Promise<boolean>;
  getNextSku(organizationId: string, prefix?: string): Promise<string>;
}

// ============================================================================
// STATISTICS INTERFACES
// ============================================================================

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  discontinued: number;
  archived: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byBrand: Record<string, number>;
  bySupplier: Record<string, number>;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
  averagePrice: number;
  averageMargin: number;
}

export interface InventoryStats {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  backorderAllowed: number;
  preorderAllowed: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  totalValue: number;
  averageStockValue: number;
}

export interface PricingStats {
  totalProducts: number;
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  averageMargin: number;
  medianMargin: number;
  minMargin: number;
  maxMargin: number;
  productsWithDiscount: number;
  productsWithoutDiscount: number;
  averageDiscount: number;
}

export interface CategoryStats {
  totalCategories: number;
  categories: Array<{
    category: string;
    count: number;
    percentage: number;
    totalValue: number;
    averagePrice: number;
  }>;
}

export interface BrandStats {
  totalBrands: number;
  brands: Array<{
    brand: string;
    count: number;
    percentage: number;
    totalValue: number;
    averagePrice: number;
  }>;
}

export interface SupplierStats {
  totalSuppliers: number;
  suppliers: Array<{
    supplier: string;
    count: number;
    percentage: number;
    totalValue: number;
    averagePrice: number;
  }>;
}
