// Conector Make - ECONEURA Cockpit
import { env } from './env.js';
import type { RunOrder, AgentEvent } from './models.js';

export interface MakeClient {
  trigger(order: RunOrder): Promise<{ accepted: boolean }>;
  status(key: string): Promise<AgentEvent[]>;
}

export function createMake(): MakeClient {
  return env.NEXT_PUBLIC_MAKE_MODE === 'real' ? real() : mock();
}

function real(): MakeClient {
  const base = String(env.MAKE_BASE_URL);
  const token = String(env.MAKE_TOKEN);

  return {
    async trigger(order) {
      const response = await fetch(`${base}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        throw new Error('Make trigger failed');
      }

      return { accepted: true };
    },

    async status(key) {
      const response = await fetch(`${base}/status/${encodeURIComponent(key)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok ? await response.json() : [];
    }
  };
}

function mock(): MakeClient {
  return {
    async trigger() {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 100));
      return { accepted: true };
    },

    async status() {
      // Simular eventos de agente
      await new Promise(resolve => setTimeout(resolve, 50));
      return [];
    }
  };
}

