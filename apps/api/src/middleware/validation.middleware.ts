import { Request, Response, NextFunction } from 'express';

import { ProblemDetails } from '../types/problem-details.types.js';

/**
 * Validation middleware for memory put endpoint
 */
export const validateMemoryPut = (req: Request, res: Response, next: NextFunction): void => {
  const { tenantId, userId, agentId, namespace } = req.body;

  const errors: string[] = [];

  // Required fields validation
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    errors.push('tenantId is required and must be a non-empty string');
  }

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    errors.push('userId is required and must be a non-empty string');
  }

  if (!agentId || typeof agentId !== 'string' || agentId.trim().length === 0) {
    errors.push('agentId is required and must be a non-empty string');
  }

  if (!namespace || typeof namespace !== 'string' || namespace.trim().length === 0) {
    errors.push('namespace is required and must be a non-empty string');
  }

  // Optional fields validation
  const { vector, text, ttlSec, meta } = req.body;

  if (vector !== undefined) {
    if (!Array.isArray(vector)) {
      errors.push('vector must be an array of numbers');
    } else if (vector.length > 0 && !vector.every(v => typeof v === 'number' && !isNaN(v))) {
      errors.push('vector must contain only valid numbers');
    } else if (vector.length > 2048) {
      errors.push('vector length cannot exceed 2048 dimensions');
    }
  }

  if (text !== undefined && typeof text !== 'string') {
    errors.push('text must be a string');
  } else if (text && text.length > 10000) {
    errors.push('text length cannot exceed 10000 characters');
  }

  if (ttlSec !== undefined) {
    if (typeof ttlSec !== 'number' || isNaN(ttlSec) || ttlSec <= 0) {
      errors.push('ttlSec must be a positive number');
    } else if (ttlSec > 31536000) { // 1 year in seconds
      errors.push('ttlSec cannot exceed 31536000 seconds (1 year)');
    }
  }

  if (meta !== undefined) {
    if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
      errors.push('meta must be an object');
    } else {
      // Validate meta object size
      const metaString = JSON.stringify(meta);
      if (metaString.length > 5000) {
        errors.push('meta object size cannot exceed 5000 characters');
      }
    }
  }

  if (errors.length > 0) {
    const problemDetails: ProblemDetails = {
      type: 'https://econeura.com/errors/validation-failed',
      title: 'Validation Failed',
      status: 400,
      detail: 'Request validation failed',
      instance: req.url,
      timestamp: new Date().toISOString(),
      errors: errors
    };

    res.status(400).json(problemDetails);
    return;
  }

  next();
};

/**
 * Validation middleware for memory query endpoint
 */
export const validateMemoryQuery = (req: Request, res: Response, next: NextFunction): void => {
  const { tenantId, namespace, query } = req.body;

  const errors: string[] = [];

  // Required fields validation
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    errors.push('tenantId is required and must be a non-empty string');
  }

  if (!namespace || typeof namespace !== 'string' || namespace.trim().length === 0) {
    errors.push('namespace is required and must be a non-empty string');
  }

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    errors.push('query is required and must be a non-empty string');
  }

  // Optional fields validation
  const { userId, agentId, topK } = req.body;

  if (userId !== undefined && (typeof userId !== 'string' || userId.trim().length === 0)) {
    errors.push('userId must be a non-empty string when provided');
  }

  if (agentId !== undefined && (typeof agentId !== 'string' || agentId.trim().length === 0)) {
    errors.push('agentId must be a non-empty string when provided');
  }

  if (topK !== undefined) {
    if (typeof topK !== 'number' || isNaN(topK) || !Number.isInteger(topK)) {
      errors.push('topK must be an integer');
    } else if (topK <= 0) {
      errors.push('topK must be a positive integer');
    } else if (topK > 100) {
      errors.push('topK cannot exceed 100');
    }
  }

  if (query && query.length > 1000) {
    errors.push('query length cannot exceed 1000 characters');
  }

  if (errors.length > 0) {
    const problemDetails: ProblemDetails = {
      type: 'https://econeura.com/errors/validation-failed',
      title: 'Validation Failed',
      status: 400,
      detail: 'Request validation failed',
      instance: req.url,
      timestamp: new Date().toISOString(),
      errors: errors
    };

    res.status(400).json(problemDetails);
    return;
  }

  next();
};
