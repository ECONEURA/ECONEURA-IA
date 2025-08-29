// lib/ia.ts
type Hist = { role: "user" | "model"; text: string };

async function post(path: string, body: any) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "Request error");
  return j;
}

export async function iaText(data: { prompt: string; system?: string; history?: Hist[] }) {
  const j = await post("/api/ia", { mode: "text", data });
  return j.text as string;
}

export async function iaTTS(data: { text: string; voice?: string }) {
  const j = await post("/api/ia", { mode: "tts", data });
  return j.audioB64 as string; // WAV b64
}

export async function iaImage(data: { prompt: string; size?: string }) {
  const j = await post("/api/ia", { mode: "image", data });
  return j.imageB64 as string; // PNG b64
}

export async function webSearch(query: string) {
  const j = await post("/api/search", { query });
  return j.items as Array<{ title: string; url: string; snippet: string }>;
}
