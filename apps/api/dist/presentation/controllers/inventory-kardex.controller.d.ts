import { Request, Response, NextFunction } from 'express';
import { InventoryKardexRepository } from '../../domain/repositories/inventory-kardex.repository.js';
import { BaseController } from './base.controller.js';
export declare class InventoryKardexController extends BaseController {
    private inventoryKardexRepository;
    private createInventoryKardexUseCase;
    private updateInventoryKardexUseCase;
    private recordMovementUseCase;
    constructor(inventoryKardexRepository: InventoryKardexRepository);
    createInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInventoryKardexByOrganization(req: Request, res: Response, next: NextFunction): Promise<void>;
    searchInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInventoryKardexStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInventoryByProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
    getInventoryByWarehouse(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLowStockInventory(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOutOfStockInventory(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNeedsReorderInventory(req: Request, res: Response, next: NextFunction): Promise<void>;
    recordMovement(req: Request, res: Response, next: NextFunction): Promise<void>;
    reserveQuantity(req: Request, res: Response, next: NextFunction): Promise<void>;
    releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkUpdateInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    bulkDeleteInventoryKardex(req: Request, res: Response, next: NextFunction): Promise<void>;
    private transformInventoryKardexToResponse;
    private transformStatsToResponse;
}
//# sourceMappingURL=inventory-kardex.controller.d.ts.map