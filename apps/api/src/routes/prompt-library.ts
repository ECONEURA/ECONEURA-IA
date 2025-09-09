import { Router } from 'express';
import { z } from 'zod';
import { promptLibrary, PromptDefinitionSchema } from '../lib/prompt-library.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// GET /v1/prompt-library - List all prompts
router.get('/', async (req, res) => {
  try {
    const prompts = await promptLibrary.listPrompts();

    res.json({
      success: true,
      data: prompts,
      count: prompts.length
    });
  } catch (error) {
    structuredLogger.error('Failed to list prompts', error as Error);
    res.status(500).json({
      error: 'Failed to list prompts',
      message: (error as Error).message
    });
  }
});

// GET /v1/prompt-library/approved - List approved prompts only
router.get('/approved', async (req, res) => {
  try {
    const prompts = await promptLibrary.getApprovedPrompts();

    res.json({
      success: true,
      data: prompts,
      count: prompts.length
    });
  } catch (error) {
    structuredLogger.error('Failed to list approved prompts', error as Error);
    res.status(500).json({
      error: 'Failed to list approved prompts',
      message: (error as Error).message
    });
  }
});

// GET /v1/prompt-library/category/:category - Get prompts by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const prompts = await promptLibrary.getPromptsByCategory(category);

    res.json({
      success: true,
      data: prompts,
      count: prompts.length
    });
  } catch (error) {
    structuredLogger.error('Failed to get prompts by category', error as Error, {
      category: req.params.category
    });
    res.status(500).json({
      error: 'Failed to get prompts by category',
      message: (error as Error).message
    });
  }
});

// GET /v1/prompt-library/search - Search prompts
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Missing search query',
        message: 'Query parameter "q" is required'
      });
    }

    const prompts = await promptLibrary.searchPrompts(q);

    res.json({
      success: true,
      data: prompts,
      count: prompts.length,
      query: q
    });
  } catch (error) {
    structuredLogger.error('Failed to search prompts', error as Error);
    res.status(500).json({
      error: 'Failed to search prompts',
      message: (error as Error).message
    });
  }
});

// GET /v1/prompt-library/:id - Get specific prompt
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.query;

    const prompt = await promptLibrary.getPrompt(id, version as string);

    if (!prompt) {
      return res.status(404).json({
        error: 'Prompt not found',
        message: `Prompt ${id} not found`
      });
    }

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    structuredLogger.error('Failed to get prompt', error as Error, {
      promptId: req.params.id
    });
    res.status(500).json({
      error: 'Failed to get prompt',
      message: (error as Error).message
    });
  }
});

// POST /v1/prompt-library - Add new prompt
router.post('/', async (req, res) => {
  try {
    const promptData = PromptDefinitionSchema.omit({ createdAt: true, updatedAt: true }).parse(req.body);

    await promptLibrary.addPrompt(promptData);

    res.status(201).json({
      success: true,
      message: 'Prompt added successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }

    structuredLogger.error('Failed to add prompt', error as Error);
    res.status(500).json({
      error: 'Failed to add prompt',
      message: (error as Error).message
    });
  }
});

// POST /v1/prompt-library/:id/approve - Approve prompt
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        error: 'Version is required'
      });
    }

    await promptLibrary.approvePrompt(id, version);

    res.json({
      success: true,
      message: 'Prompt approved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to approve prompt', error as Error, {
      promptId: req.params.id
    });
    res.status(500).json({
      error: 'Failed to approve prompt',
      message: (error as Error).message
    });
  }
});

export { router as promptLibraryRouter };
