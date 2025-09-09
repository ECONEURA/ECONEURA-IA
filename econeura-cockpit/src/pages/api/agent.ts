// API Route para Agentes - ECONEURA Cockpit
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMake } from '@/lib/make';
import type { RunOrder, AgentEvent } from '@/lib/models';

export default async function handler(req: NextApiRequest, res: NextApiResponse): void {
  const make = createMake();

  try {
    if (req.method === 'POST') {
      const order: RunOrder = req.body;

      if (!order || !order.idempotencyKey) {
        res.status(400).json({ ok: false, error: 'RunOrder with idempotencyKey is required' });
        return;
      }

      const result = await make.trigger(order);
      res.json({ ok: true, result });
      return;
    }

    if (req.method === 'GET') {
      const idempotencyKey = String(req.query.idempotencyKey || '');

      if (!idempotencyKey) {
        res.status(400).json({ ok: false, error: 'idempotencyKey is required' });
        return;
      }

      const events: AgentEvent[] = await make.status(idempotencyKey);
      res.json({ ok: true, events });
      return;
    }

    res.status(405).end();
  } catch (error) {
    console.error('Agent API error:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
}
