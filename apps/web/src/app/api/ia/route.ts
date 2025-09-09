// app/api/ia/route.ts
export const runtime = "nodejs";

import { noStoreJson, fetchWithBackoff, escapeXml, safeReadText } from "@/app/api/_utils";

type Role = "user" | "assistant" | "system";
type Payload = {
  mode: "text" | "tts" | "image";
  data: any;
};

const DEMO_SILENT_WAV_B64 =
  "UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";
const DEMO_TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBg8q6jSkAAAAASUVORK5CYII=";

export async function POST(req: Request): void {
  // Enforce method
  if (req.method !== "POST") return noStoreJson({ ok: false, error: "Method not allowed" }, 405);

  const { mode, data } = (await req.json()) as Payload;

  const OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const OPENAI_KEY = process.env.AZURE_OPENAI_API_KEY?.trim();
  const OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION?.trim() || "2024-06-01";
  const CHAT_DEPLOYMENT = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT?.trim();
  const IMAGE_DEPLOYMENT = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT?.trim();

  const SPEECH_KEY = process.env.AZURE_SPEECH_KEY?.trim();
  const SPEECH_REGION = process.env.AZURE_SPEECH_REGION?.trim();

  const demo = !OPENAI_ENDPOINT || !OPENAI_KEY || !CHAT_DEPLOYMENT;

  try {
    // ---------------- DEMO ----------------
    if (demo) {
      if (mode === "text") return noStoreJson({ ok: true, text: "🧪 DEMO (Azure no configurado): respuesta simulada." });
      if (mode === "image") return noStoreJson({ ok: true, imageB64: DEMO_TINY_PNG_B64 });
      if (mode === "tts") return noStoreJson({ ok: true, audioB64: DEMO_SILENT_WAV_B64 });
      return noStoreJson({ ok: false, error: "Modo no soportado" }, 400);
    }

    // ---------------- REAL ----------------
    if (mode === "text") {
      const { prompt, system, history } = data ?? {};
      if (!prompt || typeof prompt !== "string") return noStoreJson({ ok: false, error: "Prompt vacío" }, 400);

      // Saneamiento mínimo
      const safePrompt = prompt.slice(0, 8000);
      const messages: Array<{ role: Role; content: string }> = [];
      if (system) messages.push({ role: "system", content: String(system).slice(0, 4000) });

      if (Array.isArray(history)) {
        for (const h of history.slice(-8)) {
          const role: Role = h.role === "model" ? "assistant" : h.role;
          if (typeof h.text === "string" && h.text.trim()) {
            messages.push({ role, content: h.text.slice(0, 4000) });
          }
        }
      }
      messages.push({ role: "user", content: safePrompt });

      const url = `${OPENAI_ENDPOINT}/openai/deployments/${CHAT_DEPLOYMENT}/chat/completions?api-version=${OPENAI_API_VERSION}`;
      const res = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
          "api-key": OPENAI_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          temperature: 0.4,
          top_p: 1,
          max_tokens: 1200
        }),
      });

      if (!res.ok) {
        const txt = await safeReadText(res);
        return noStoreJson({ ok: false, error: `Azure OpenAI ${res.status}: ${txt || res.statusText}` }, res.status);
      }
      const json = await res.json();

      // Content filter / finish_reason
      const choice = json?.choices?.[0];
      const text: string | undefined = choice?.message?.content?.trim();
      const finish = choice?.finish_reason;
      if (finish === "content_filter") {
        return noStoreJson({ ok: false, error: "Contenido bloqueado por políticas de Azure OpenAI." }, 400);
      }
      if (!text) {
        return noStoreJson({ ok: false, error: "Respuesta vacía del modelo." }, 502);
      }
      return noStoreJson({ ok: true, text });
    }

    if (mode === "image") {
      const { prompt, size = "1024x1024" } = data ?? {};
      if (!prompt || typeof prompt !== "string") return noStoreJson({ ok: false, error: "Prompt de imagen vacío" }, 400);
      if (!IMAGE_DEPLOYMENT) {
        // Si no hay deployment de imágenes, fallback controlado
        return noStoreJson({ ok: true, imageB64: DEMO_TINY_PNG_B64 });
      }

      const url = `${OPENAI_ENDPOINT}/openai/deployments/${IMAGE_DEPLOYMENT}/images/generations?api-version=${OPENAI_API_VERSION}`;
      const res = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
          "api-key": OPENAI_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: String(prompt).slice(0, 2000),
          size,
          n: 1,
          response_format: "b64_json",
        }),
      });

      if (!res.ok) {
        const txt = await safeReadText(res);
        return noStoreJson({ ok: false, error: `Azure Images ${res.status}: ${txt || res.statusText}` }, res.status);
      }
      const json = await res.json();
      const b64 = json?.data?.[0]?.b64_json;
      if (!b64) return noStoreJson({ ok: false, error: "Imagen vacía" }, 502);
      return noStoreJson({ ok: true, imageB64: b64 });
    }

    if (mode === "tts") {
      const { text, voice = "es-ES-AlvaroNeural" } = data ?? {};
      if (!text || typeof text !== "string") return noStoreJson({ ok: false, error: "Texto vacío para TTS" }, 400);
      if (!SPEECH_KEY || !SPEECH_REGION) return noStoreJson({ ok: true, audioB64: DEMO_SILENT_WAV_B64 });

      const ssml = `<speak version='1.0' xml:lang='es-ES'><voice xml:lang='es-ES' name='${voice}'>${escapeXml(text.slice(0, 5000))}</voice></speak>`;
      const url = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const res = await fetchWithBackoff(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": SPEECH_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "riff-24000hz-16bit-mono-pcm",
        },
        body: ssml,
      });

      if (!res.ok) {
        const txt = await safeReadText(res);
        return noStoreJson({ ok: false, error: `Azure Speech ${res.status}: ${txt || res.statusText}` }, res.status);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return noStoreJson({ ok: true, audioB64: buf.toString("base64") });
    }

    return noStoreJson({ ok: false, error: "Modo no soportado" }, 400);
  } catch (e: any) {
    return noStoreJson({ ok: false, error: e?.message ?? "IA error" }, 500);
  }
}
