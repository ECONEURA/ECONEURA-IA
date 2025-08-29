function hdr(){ return { "Content-Type":"application/json", "X-Request-Id": crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }; }

export async function iaText(d:{ prompt:string; system?:string; history?:Array<{role:"user"|"model";text:string}> }){
  const r = await fetch("/v1/ai/chat", { method:"POST", headers: hdr(), body: JSON.stringify(d) });
  const j = await r.json(); if(!j.ok) throw new Error(j.error||"iaText"); return j.text as string;
}
export async function iaTTS(d:{ text:string }){
  const r = await fetch("/v1/ai/tts", { method:"POST", headers: hdr(), body: JSON.stringify(d) });
  const j = await r.json(); if(!j.ok) throw new Error(j.error||"iaTTS"); return j.audioB64 as string;
}
export async function iaImage(d:{ prompt:string }){
  const r = await fetch("/v1/ai/images", { method:"POST", headers: hdr(), body: JSON.stringify(d) });
  const j = await r.json(); if(!j.ok) throw new Error(j.error||"iaImage"); return j.imageB64 as string;
}
export async function webSearch(q:string){
  const r = await fetch("/v1/search", { method:"POST", headers: hdr(), body: JSON.stringify({ query:q }) });
  const j = await r.json(); if(!j.ok) throw new Error(j.error||"search"); return j.items as Array<{title:string;url:string;snippet:string}>;
}
