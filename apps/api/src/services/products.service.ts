export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  orgId: string;
}

export class ProductsService {
  private products: Product[] = [];

  async create(data: Omit<Product, 'id'>) {
    const product: Product = {
      id: Date.now().toString(),
      ...data,
    };
    this.products.push(product);
    return product;
  }

  async list(orgId: string) {
    return this.products.filter(p => p.orgId === orgId);
  }

  async get(id: string) {
    return this.products.find(p => p.id === id);
  }
}

export const productsService = new ProductsService();
