import { Request, Response } from 'express';
export declare class MemoryController {
    putMemory(req: Request, res: Response): Promise<void>;
    queryMemory(req: Request, res: Response): Promise<void>;
    getMemoryStats(req: Request, res: Response): Promise<void>;
    cleanupMemories(req: Request, res: Response): Promise<void>;
}
export declare const memoryController: MemoryController;
//# sourceMappingURL=memory.controller.d.ts.map