type Msg = { role:"system"|"user"|"assistant", content:string };
const EP = process.env.AZURE_OPENAI_ENDPOINT!;
const V = process.env.AZURE_OPENAI_API_VERSION!;
const KEY = process.env.AZURE_OPENAI_API_KEY || "";
const H = { "Content-Type":"application/json", "api-key": KEY };

export async function azChat(deployment: string, messages: Msg[], stream=false) {
  const url = `${EP}/openai/deployments/${deployment}/chat/completions?api-version=${V}`;
  const res = await fetch(url, { method:"POST", headers:H as any, body: JSON.stringify({ messages, temperature:0.3, stream }) });
  if (!res.ok) throw new Error(`Azure chat ${res.status} ${res.statusText}`);
  return res;
}

export async function azImage(deployment: string, prompt: string) {
  const url = `${EP}/openai/deployments/${deployment}/images/generations?api-version=${V}`;
  const res = await fetch(url, { method:"POST", headers:H as any, body: JSON.stringify({ prompt, size:"1024x1024" }) });
  if (!res.ok) throw new Error(`Azure image ${res.status} ${res.statusText}`);
  const j = await res.json();
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image data");
  return b64 as string;
}
