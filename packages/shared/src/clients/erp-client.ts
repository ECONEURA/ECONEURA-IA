import { BaseClient } from './base-client';
import type {;
  Product,
  InventoryMovement,
  Supplier,
  CreateProductInput,
  UpdateProductInput,
  CreateInventoryMovementInput,
  CreateSupplierInput,
  UpdateSupplierInput,
  PaginatedResponse/
} from '../types';

export class ERPClient extends BaseClient {/;
  // Products
  async listProducts(page = 1, pageSize = 20): Promise<PaginatedResponse<Product>> {/
    return this.get('/erp/products', { params: { page, pageSize } });
  }

  async getProduct(id: string): Promise<Product> {/
    return this.get(`/erp/products/${id}`);
  }

  async createProduct(data: CreateProductInput): Promise<Product> {/
    return this.post('/erp/products', data);
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {/
    return this.patch(`/erp/products/${id}`, data);
  }

  async deleteProduct(id: string): Promise<void> {/
    return this.delete(`/erp/products/${id}`);
  }
/
  // Inventory Movements
  async listInventoryMovements(page = 1, pageSize = 20): Promise<PaginatedResponse<InventoryMovement>> {/
    return this.get('/erp/inventory/movements', { params: { page, pageSize } });
  }

  async getInventoryMovement(id: string): Promise<InventoryMovement> {/
    return this.get(`/erp/inventory/movements/${id}`);
  }

  async createInventoryMovement(data: CreateInventoryMovementInput): Promise<InventoryMovement> {/
    return this.post('/erp/inventory/movements', data);
  }
/
  // Suppliers
  async listSuppliers(page = 1, pageSize = 20): Promise<PaginatedResponse<Supplier>> {/
    return this.get('/erp/suppliers', { params: { page, pageSize } });
  }

  async getSupplier(id: string): Promise<Supplier> {/
    return this.get(`/erp/suppliers/${id}`);
  }

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {/
    return this.post('/erp/suppliers', data);
  }

  async updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier> {/
    return this.patch(`/erp/suppliers/${id}`, data);
  }

  async deleteSupplier(id: string): Promise<void> {/
    return this.delete(`/erp/suppliers/${id}`);
  }
}
/