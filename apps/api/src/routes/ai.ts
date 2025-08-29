import { Router } from "express";
import { z } from "zod";
import { backoff } from "../lib/backoff.js";
import { azChat, azImage } from "../services/azureOpenAI.js";
import { ttsBase64 } from "../services/tts.js";
import { aiLatencyMs, aiReq, aiTokens } from "../lib/observe.js";
import { reserveBudget, finalizeBudget, assertWithinBudget } from "../middleware/budget.js";
import { createParser } from "eventsource-parser";

export const ai = Router();

const Chat = z.object({
  system: z.string().optional(),
  prompt: z.string().min(1),
  history: z.array(z.object({ role: z.enum(["user","model"]), text: z.string() })).optional()
});
const Img = z.object({ prompt: z.string().min(1) });
const Tts = z.object({ text: z.string().min(1) });

ai.post("/chat", reserveBudget("text"), async (req, res) => {
  const s = Chat.safeParse(req.body);
  if (!s.success) return res.status(400).json({ ok:false, error:s.error.message });
  const model = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || "demo";
  const provider = process.env.AZURE_OPENAI_API_KEY ? "azure":"demo";
  const end = aiLatencyMs.startTimer({ mode:"text", provider, model });
  try{
    let text = "🧪 DEMO IA: sin claves Azure.";
    let costEur = 0;
    if (provider==="azure"){
      const msgs = buildMessages(s.data.system, s.data.prompt, s.data.history);
      const r = await backoff(()=> azChat(model, msgs, false));
      const j = await r.json();
      if (j.choices?.[0]?.finish_reason === "content_filter") return res.status(403).json({ ok:false, error:"Contenido bloqueado por políticas" });
      text = j.choices?.[0]?.message?.content ?? "Respuesta vacía";
      const usage = j.usage || { prompt_tokens:0, completion_tokens:0, total_tokens:0 };
      aiTokens.inc({ kind:"prompt", provider, model }, usage.prompt_tokens);
      aiTokens.inc({ kind:"completion", provider, model }, usage.completion_tokens);
      costEur = costFor(model, usage.prompt_tokens, usage.completion_tokens);
      res.setHeader("X-OpenAI-Usage-Total", String(usage.total_tokens));
      res.setHeader("X-OpenAI-Model", model);
      if (r.headers.get("x-request-id")) res.setHeader("X-OAI-Response-Id", r.headers.get("x-request-id")!);
    }
    finalizeBudget(req, true, model, costEur);
    assertWithinBudget(req, res);
    aiReq.inc({ mode:"text", provider, model, status:"200" });
    end();
    return res.json({ ok:true, text });
  } catch(e:any){
    finalizeBudget(req, false, model, 0);
    aiReq.inc({ mode:"text", provider, model, status:String(e?.status||500) });
    end();
    return res.status(500).json({ ok:false, error: e?.message||"AI error" });
  }
});

ai.get("/chat/stream", async (req, res) => {
  if (!process.env.AZURE_OPENAI_API_KEY) return res.status(501).json({ ok:false, error:"Streaming requiere Azure" });
  const system = String(req.query.system||"");
  const prompt = String(req.query.prompt||"");
  const model = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!;
  const provider = "azure";
  const start = Date.now();

  res.writeHead(200, { "Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive" });
  try {
    const msgs = buildMessages(system, prompt, undefined);
    const r = await azChat(model, msgs, true);
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    const parser = createParser((evt) => {
      if (evt.type !== "event") return;
      const data = evt.data;
      if (data === "[DONE]") { res.write("event: done\ndata: {}\n\n"); res.end(); }
      else {
        try{
          const j = JSON.parse(data);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
        } catch {}
      }
    });
    while(true){
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(dec.decode(value));
    }
    aiReq.inc({ mode:"text", provider, model, status:"200" });
    aiLatencyMs.observe({ mode:"text", provider, model }, Date.now()-start);
  } catch(e:any){
    res.write(`event: error\ndata: ${JSON.stringify({ error:e?.message||"stream error" })}\n\n`);
    res.end();
  }
});

ai.post("/images", reserveBudget("image"), async (req,res)=>{
  const s = Img.safeParse(req.body);
  if (!s.success) return res.status(400).json({ ok:false, error:s.error.message });
  const model = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || "demo";
  const provider = process.env.AZURE_OPENAI_API_KEY ? "azure":"demo";
  const end = aiLatencyMs.startTimer({ mode:"image", provider, model });
  try{
    let imageB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBg8q6jSkAAAAASUVORK5CYII=";
    let costEur = 0;
    if (provider==="azure"){
      imageB64 = await backoff(()=> azImage(model, s.data.prompt));
      costEur = Number(process.env.AI_RATE_EUR_PER_IMAGE || 0.03);
    }
    finalizeBudget(req, true, model, costEur);
    aiReq.inc({ mode:"image", provider, model, status:"200" });
    end();
    res.json({ ok:true, imageB64 });
  } catch(e:any){
    finalizeBudget(req, false, model, 0);
    aiReq.inc({ mode:"image", provider, model, status:"500" });
    end();
    res.status(500).json({ ok:false, error:e?.message||"image error" });
  }
});

ai.post("/tts", reserveBudget("tts"), async (req,res)=>{
  const s = Tts.safeParse(req.body);
  if (!s.success) return res.status(400).json({ ok:false, error:s.error.message });
  try{
    const b64 = await ttsBase64(s.data.text);
    finalizeBudget(req, true, process.env.AZURE_SPEECH_VOICE||"azure-speech", /*cost*/ 0.0002*s.data.text.length/1000);
    aiReq.inc({ mode:"tts", provider: process.env.AZURE_SPEECH_KEY? "azure":"demo", model: process.env.AZURE_SPEECH_VOICE||"voice", status:"200" });
    res.json({ ok:true, audioB64:b64 });
  } catch(e:any){
    finalizeBudget(req, false, "tts", 0);
    res.status(500).json({ ok:false, error:e?.message||"tts error" });
  }
});

function buildMessages(system?:string, prompt?:string, history?:{role:"user"|"model",text:string}[]) {
  const m: any[] = [];
  if (system) m.push({ role:"system", content: system });
  if (history?.length) history.forEach(h => m.push({ role: h.role==="user"?"user":"assistant", content: h.text }));
  if (prompt) m.push({ role:"user", content: prompt });
  return m;
}
function costFor(_model:string, promptTok:number, compTok:number){
  const ip = Number(process.env.AI_RATE_EUR_PER_1K_PROMPT || 0.0005);
  const ic = Number(process.env.AI_RATE_EUR_PER_1K_COMPLETION || 0.0015);
  return (promptTok/1000)*ip + (compTok/1000)*ic;
}