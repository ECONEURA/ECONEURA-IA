import { Request, Response } from 'express';

import { memoryService } from '../services/memory.service.js';
import { MemoryPutRequest, MemoryQueryRequest } from '../db/memory.repo.js';

export class MemoryController {
  async putMemory(req: Request, res: Response) {
    try {
      const idempotencyKey = req.headers['x-idempotency-key'] as string;
      const request: MemoryPutRequest = req.body;

      const result = await memoryService.putMemory(request, idempotencyKey);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in putMemory:', error);
      
      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          type: 'https://econeura/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: error.message,
          instance: req.path,
        });
        return;
      }

      res.status(500).json({
        type: 'https://econeura/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        instance: req.path,
      });
    }
  }

  async queryMemory(req: Request, res: Response) {
    try {
      const request: MemoryQueryRequest = req.body;

      const result = await memoryService.queryMemory(request);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in queryMemory:', error);
      
      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({
          type: 'https://econeura/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: error.message,
          instance: req.path,
        });
        return;
      }

      res.status(500).json({
        type: 'https://econeura/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        instance: req.path,
      });
    }
  }

  async getMemoryStats(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          type: 'https://econeura/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'tenantId is required',
          instance: req.path,
        });
        return;
      }

      const result = await memoryService.getMemoryStats(tenantId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getMemoryStats:', error);
      
      res.status(500).json({
        type: 'https://econeura/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        instance: req.path,
      });
    }
  }

  async cleanupMemories(req: Request, res: Response) {
    try {
      const result = await memoryService.cleanupExpiredMemories();

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in cleanupMemories:', error);
      
      res.status(500).json({
        type: 'https://econeura/errors/internal-error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        instance: req.path,
      });
    }
  }
}

export const memoryController = new MemoryController();
