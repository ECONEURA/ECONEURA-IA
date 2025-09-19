import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { InventoryKardexRepository } from '../../../domain/repositories/inventory-kardex.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface UpdateInventoryKardexRequest extends BaseRequest {
    id: string;
    warehouseId?: string;
    locationId?: string;
    settings?: {
        trackInventory?: boolean;
        allowNegativeStock?: boolean;
        lowStockThreshold?: number;
        reorderPoint?: number;
        reorderQuantity?: number;
        costMethod?: 'fifo' | 'lifo' | 'average' | 'standard';
        valuationMethod?: 'fifo' | 'lifo' | 'average' | 'standard';
        autoReorder?: boolean;
        trackExpiration?: boolean;
        trackSerialNumbers?: boolean;
        trackBatchNumbers?: boolean;
        customFields?: Record<string, any>;
        tags?: string[];
        notes?: string;
    };
}
export interface UpdateInventoryKardexResponse extends BaseResponse {
    data: {
        inventoryKardex: InventoryKardex;
    };
}
export declare class UpdateInventoryKardexUseCase extends BaseUseCase<UpdateInventoryKardexRequest, UpdateInventoryKardexResponse> {
    private readonly inventoryKardexRepository;
    constructor(inventoryKardexRepository: InventoryKardexRepository);
    execute(request: UpdateInventoryKardexRequest): Promise<UpdateInventoryKardexResponse>;
}
//# sourceMappingURL=update-inventory-kardex.use-case.d.ts.map