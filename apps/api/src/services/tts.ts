export async function ttsBase64(text: string): Promise<string> {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  const voice = process.env.AZURE_SPEECH_VOICE || "es-ES-ElviraNeural";
  if (!key || !region) return "UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

  const ssml = `<?xml version="1.0"?><speak version="1.0" xml:lang="es-ES">
  <voice name="${voice}"><prosody rate="0%">${escape(text)}</prosody></voice></speak>`;
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), 15000);
  try{
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method:"POST",
      signal: ctrl.signal,
      headers:{
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type":"application/ssml+xml",
        "X-Microsoft-OutputFormat":"riff-24khz-16bit-mono-pcm",
      },
      body:ssml
    });
    if(!res.ok) throw new Error(`Speech ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString("base64");
  } finally { clearTimeout(t); }
}
function escape(s:string){return s.replace(/[<>&'"]/g,c=>({ '<':"&lt;", '>':"&gt;", '&':"&amp;", "'":"&apos;", '"':"&quot;" }[c]!));}
