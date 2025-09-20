import { Request, Response, NextFunction } from 'express';
import { ProductRepository } from '../../domain/repositories/product.repository.js';
export declare class ProductController {
    private productRepository;
    private createProductUseCase;
    private updateProductUseCase;
    constructor(productRepository: ProductRepository);
    createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    getProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    getProductsByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    getProductStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdateProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeleteProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=product.controller.d.ts.map