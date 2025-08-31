// ============================================================================
// CLIENTE DEL SISTEMA DE INVENTARIO - BFF
// ============================================================================

// Este archivo contiene la lógica del cliente para interactuar con el sistema de inventario
// a través del BFF (Backend for Frontend) de Next.js

class WebInventorySystem {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/inventory';
    console.log('WebInventorySystem initialized (client-side)');
  }

  // ============================================================================
  // GESTIÓN DE PRODUCTOS
  // ============================================================================

  async getProducts(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/products?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    return response.json();
  }

  async getProduct(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    return response.json();
  }

  async createProduct(product: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error(`Failed to create product: ${response.statusText}`);
    }
    return response.json();
  }

  async updateProduct(id: string, updates: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete product: ${response.statusText}`);
    }
  }

  // ============================================================================
  // GESTIÓN DE TRANSACCIONES KARDEX
  // ============================================================================

  async getTransactions(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/transactions?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }
    return response.json();
  }

  async getTransaction(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/transactions/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }
    return response.json();
  }

  async addTransaction(transaction: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    if (!response.ok) {
      throw new Error(`Failed to add transaction: ${response.statusText}`);
    }
    return response.json();
  }

  async getProductKardex(productId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/products/${productId}/kardex`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product kardex: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // GESTIÓN DE ALERTAS
  // ============================================================================

  async getAlerts(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/alerts?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }
    return response.json();
  }

  async getAlert(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch alert: ${response.statusText}`);
    }
    return response.json();
  }

  async createAlert(alert: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    });
    if (!response.ok) {
      throw new Error(`Failed to create alert: ${response.statusText}`);
    }
    return response.json();
  }

  async updateAlert(id: string, updates: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error(`Failed to update alert: ${response.statusText}`);
    }
    return response.json();
  }

  async deleteAlert(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete alert: ${response.statusText}`);
    }
  }

  async acknowledgeAlert(id: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
    }
  }

  async resolveAlert(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/alerts/${id}/resolve`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to resolve alert: ${response.statusText}`);
    }
  }

  // ============================================================================
  // REPORTES
  // ============================================================================

  async getInventoryReport(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/report`);
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory report: ${response.statusText}`);
    }
    return response.json();
  }

  async getProductReport(productId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/products/${productId}/report`);
    if (!response.ok) {
      throw new Error(`Failed to fetch product report: ${response.statusText}`);
    }
    return response.json();
  }

  async getKardexReport(productId: string, fromDate?: string, toDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);

    const response = await fetch(`${this.baseUrl}/products/${productId}/kardex-report?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch kardex report: ${response.statusText}`);
    }
    return response.json();
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  async getLowStockProducts(): Promise<any[]> {
    return this.getProducts({ lowStock: true });
  }

  async getExpiringProducts(days: number = 30): Promise<any[]> {
    return this.getProducts({ expiring: true, days });
  }

  async getOutOfStockProducts(): Promise<any[]> {
    return this.getProducts({ outOfStock: true });
  }

  async getOverstockProducts(): Promise<any[]> {
    return this.getProducts({ overstock: true });
  }

  // ============================================================================
  // MÉTODOS DE CONVENIENCIA
  // ============================================================================

  async getActiveAlerts(): Promise<any[]> {
    return this.getAlerts({ status: 'active' });
  }

  async getCriticalAlerts(): Promise<any[]> {
    return this.getAlerts({ severity: 'critical', status: 'active' });
  }

  async getProductAlerts(productId: string): Promise<any[]> {
    return this.getAlerts({ productId });
  }

  async getProductTransactions(productId: string, type?: string): Promise<any[]> {
    const filters: any = { productId };
    if (type) filters.type = type;
    return this.getTransactions(filters);
  }
}

// Instancia global
export const webInventorySystem = new WebInventorySystem();
