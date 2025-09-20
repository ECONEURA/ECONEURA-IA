import { getEnv } from '@econeura/shared/env';
const env = getEnv();
export const useLocalMistral = String(env.USE_LOCAL_MISTRAL || '').toLowerCase() === 'true';
export async function summarizeLocal(text) {
    if (!text)
        return '';
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const first = lines.slice(0, 3).join(' ');
    return first.length <= 512 ? first : first.slice(0, 512);
}
//# sourceMappingURL=mistral.local.js.map