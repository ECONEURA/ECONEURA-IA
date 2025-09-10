import { Request, Response } from 'express';
import { MemoryService } from '../services/memory.service';
import { ProblemDetails } from '../types/problem-details.types';

export class MemoryController {
  private memoryService: MemoryService;

  constructor() {
    this.memoryService = new MemoryService();
  }

  /**
   * Store or update memory entry
   */
  async putMemory(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        userId,
        agentId,
        namespace,
        vector,
        text,
        ttlSec,
        meta
      } = req.body;

      // Generate idempotency key from request
      const idempotencyKey = req.headers['x-idempotency-key'] as string;
      
      const result = await this.memoryService.putMemory({
        tenantId,
        userId,
        agentId,
        namespace,
        vector,
        text,
        ttlSec,
        meta,
        idempotencyKey
      });

      res.status(200).json({
        ok: true,
        id: result.id
      });
    } catch (error) {
      console.error('Memory put error:', error);
      
      if (error instanceof Error) {
        const problemDetails: ProblemDetails = {
          type: 'https://econeura.com/errors/memory-storage-failed',
          title: 'Memory Storage Failed',
          status: 500,
          detail: error.message,
          instance: req.url,
          timestamp: new Date().toISOString()
        };
        
        res.status(500).json(problemDetails);
      } else {
        res.status(500).json({
          type: 'https://econeura.com/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
          instance: req.url,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Query memory entries
   */
  async queryMemory(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        userId,
        agentId,
        namespace,
        query,
        topK = 5
      } = req.body;

      const matches = await this.memoryService.queryMemory({
        tenantId,
        userId,
        agentId,
        namespace,
        query,
        topK
      });

      res.status(200).json({
        matches
      });
    } catch (error) {
      console.error('Memory query error:', error);
      
      if (error instanceof Error) {
        const problemDetails: ProblemDetails = {
          type: 'https://econeura.com/errors/memory-query-failed',
          title: 'Memory Query Failed',
          status: 500,
          detail: error.message,
          instance: req.url,
          timestamp: new Date().toISOString()
        };
        
        res.status(500).json(problemDetails);
      } else {
        res.status(500).json({
          type: 'https://econeura.com/errors/internal-server-error',
          title: 'Internal Server Error',
          status: 500,
          detail: 'An unexpected error occurred',
          instance: req.url,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}
