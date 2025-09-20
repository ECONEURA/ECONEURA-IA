import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { InventoryKardexRepository } from '../../../domain/repositories/inventory-kardex.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface CreateInventoryKardexRequest extends BaseRequest {
    productId: string;
    warehouseId?: string;
    locationId?: string;
    initialQuantity: number;
    unitCost: {
        amount: number;
        currency: string;
    };
    settings: {
        trackInventory: boolean;
        allowNegativeStock: boolean;
        lowStockThreshold: number;
        reorderPoint: number;
        reorderQuantity: number;
        costMethod: 'fifo' | 'lifo' | 'average' | 'standard';
        valuationMethod: 'fifo' | 'lifo' | 'average' | 'standard';
        autoReorder: boolean;
        trackExpiration: boolean;
        trackSerialNumbers: boolean;
        trackBatchNumbers: boolean;
        customFields: Record<string, any>;
        tags: string[];
        notes: string;
    };
}
export interface CreateInventoryKardexResponse extends BaseResponse {
    data: {
        inventoryKardex: InventoryKardex;
    };
}
export declare class CreateInventoryKardexUseCase extends BaseUseCase<CreateInventoryKardexRequest, CreateInventoryKardexResponse> {
    private readonly inventoryKardexRepository;
    constructor(inventoryKardexRepository: InventoryKardexRepository);
    execute(request: CreateInventoryKardexRequest): Promise<CreateInventoryKardexResponse>;
}
//# sourceMappingURL=create-inventory-kardex.use-case.d.ts.map