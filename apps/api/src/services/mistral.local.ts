import { getEnv } from '@econeura/shared/env';

const env = getEnv() as Record<string, any>;
export const useLocalMistral = String(env.USE_LOCAL_MISTRAL || '').toLowerCase() === 'true';

export async function summarizeLocal(text: string) {
  // Very small, fast deterministic summarizer for local dev/testing.
  // Keeps a few leading sentences.
  if (!text) return '';
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const first = lines.slice(0, 3).join(' ');
  return first.length <= 512 ? first : first.slice(0, 512);
}
