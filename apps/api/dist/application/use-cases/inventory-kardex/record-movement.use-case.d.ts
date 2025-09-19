import { InventoryKardex } from '../../../domain/entities/inventory-kardex.entity.js';
import { InventoryKardexRepository } from '../../../domain/repositories/inventory-kardex.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface RecordMovementRequest extends BaseRequest {
    inventoryKardexId: string;
    movementType: 'in' | 'out' | 'transfer' | 'adjustment' | 'return' | 'damage' | 'expired' | 'theft';
    movementReason: 'purchase' | 'sale' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'return' | 'damage' | 'expired' | 'theft' | 'production' | 'consumption' | 'other';
    quantity: number;
    unitCost?: {
        amount: number;
        currency: string;
    };
    reference?: string;
    referenceId?: string;
    notes?: string;
    batchNumber?: string;
    expirationDate?: Date;
    serialNumber?: string;
    supplierId?: string;
    customerId?: string;
    toWarehouseId?: string;
    toLocationId?: string;
}
export interface RecordMovementResponse extends BaseResponse {
    data: {
        inventoryKardex: InventoryKardex;
        movement: any;
    };
}
export declare class RecordMovementUseCase extends BaseUseCase<RecordMovementRequest, RecordMovementResponse> {
    private readonly inventoryKardexRepository;
    constructor(inventoryKardexRepository: InventoryKardexRepository);
    execute(request: RecordMovementRequest): Promise<RecordMovementResponse>;
}
//# sourceMappingURL=record-movement.use-case.d.ts.map