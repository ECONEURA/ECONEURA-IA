export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    orgId: string;
}
export declare class ProductsService {
    private products;
    create(data: Omit<Product, 'id'>): Promise<Product>;
    list(orgId: string): Promise<Product[]>;
    get(id: string): Promise<Product>;
}
export declare const productsService: ProductsService;
//# sourceMappingURL=products.service.d.ts.map