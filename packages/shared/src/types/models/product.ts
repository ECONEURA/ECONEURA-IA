import { TenantEntity } from './base.js';
/
// Product type definitions
export interface Product extends TenantEntity {;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  maxStock: number;
  category: string;
  metadata: Record<string, unknown>;
}
/
// Product categories
export type ProductCategory = ;
  | 'hardware'
  | 'software'
  | 'service'
  | 'subscription'
  | 'other';
/
// Product status
export type ProductStatus = ;
  | 'active'
  | 'inactive'
  | 'discontinued'
  | 'out_of_stock';
/
// Product pricing
export interface ProductPricing {;
  basePrice: number;
  cost?: number;
  margin?: number;
  discounts?: {
    bulk?: {
      quantity: number;
      discount: number;
    }[];
    seasonal?: {
      startDate: Date;
      endDate: Date;
      discount: number;
    }[];
  };
  taxes?: {
    rate: number;
    type: string;
  };
}
/