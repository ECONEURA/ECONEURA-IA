export class ProductsService {
    products = [];
    async create(data) {
        const product = {
            id: Date.now().toString(),
            ...data,
        };
        this.products.push(product);
        return product;
    }
    async list(orgId) {
        return this.products.filter(p => p.orgId === orgId);
    }
    async get(id) {
        return this.products.find(p => p.id === id);
    }
}
export const productsService = new ProductsService();
//# sourceMappingURL=products.service.js.map