// API Route para LLM - ECONEURA Cockpit
import type { NextApiRequest, NextApiResponse } from 'next';
import { createLLM } from '@/lib/llm';

export default async function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  try {
    const { messages, opts } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ ok: false, error: 'Messages array is required' });
      return;
    }

    const llm = createLLM();
    const response = await llm.chat(messages, opts);

    res.json({ ok: true, response });
  } catch (error) {
    console.error('LLM API error:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
}
