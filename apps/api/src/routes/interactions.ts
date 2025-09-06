import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const InteractionSchema = z.object({
  type: z.enum(['note', 'call', 'email', 'meeting']),
  content: z.string().min(1),
  contactId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
});

// GET /v1/interactions - List interactions
router.get('/', async (req, res) => {
  try {
    const { contactId, companyId } = req.query;
    
    // Simulated interactions
    const interactions = [
      {
        id: '1',
        type: 'note',
        content: 'Initial contact made',
        contactId: contactId as string,
        companyId: companyId as string,
        createdAt: new Date().toISOString(),
      }
    ];
    
    res.json({
      success: true,
      data: interactions,
      count: interactions.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get interactions',
      message: (error as Error).message
    });
  }
});

// POST /v1/interactions - Create interaction
router.post('/', async (req, res) => {
  try {
    const data = InteractionSchema.parse(req.body);
    
    const interaction = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    res.status(201).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    
    res.status(500).json({
      error: 'Failed to create interaction',
      message: (error as Error).message
    });
  }
});

export { router as interactionsRouter };
