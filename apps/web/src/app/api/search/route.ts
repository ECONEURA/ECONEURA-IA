// app/api/search/route.ts
export const runtime = "nodejs";

import { noStoreJson, fetchWithBackoff } from "@/app/api/_utils";

export async function POST(req: Request): void {
  if (req.method !== "POST") return noStoreJson({ ok: false, error: "Method not allowed" }, 405);
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return noStoreJson({ ok: false, error: "query requerido" }, 400);
  }

  const key = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const cx = process.env.GOOGLE_SEARCH_CX?.trim();

  // DEMO
  if (!key || !cx) {
    return noStoreJson({
      ok: true,
      items: [
        { title: "Informe sectorial (demo)", url: "https://example.com/sector", snippet: "Panorama general del mercado y jugadores clave." },
        { title: "Tendencias (demo)", url: "https://example.com/trends", snippet: "Crecimiento anual, adopción tecnológica y riesgos." },
        { title: "Competidores (demo)", url: "https://example.com/competitors", snippet: "Lista de competidores relevantes y movimientos recientes." }
      ]
    });
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}`;
    const res = await fetchWithBackoff(url, { method: "GET" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return noStoreJson({ ok: false, error: `Search ${res.status}: ${txt || res.statusText}` }, res.status);
    }
    const data = await res.json();
    const items =
      (data.items ?? []).slice(0, 5).map((x: any) => ({
        title: x.title,
        url: x.link,
        snippet: x.snippet,
      })) ?? [];
    return noStoreJson({ ok: true, items });
  } catch (e: any) {
    return noStoreJson({ ok: false, error: e?.message ?? "Search error" }, 500);
  }
}
