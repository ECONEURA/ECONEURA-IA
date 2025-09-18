// app/api/_utils.ts
export async function fetchWithBackoff(
  input: RequestInfo | URL,
  init: RequestInit,
  tries = 3,
  baseDelayMs = 500
) {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      // Reintentos solo en 429/5xx
      if (!(res.status === 429 || (res.status >= 500 && res.status <= 599))) {
        return res;
      }
      lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, i)));
  }
  throw lastErr;
}

export function noStoreJson(body: any, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function safeReadText(res: Response) {
  try { return await res.text(); } catch { return ""; }
}
