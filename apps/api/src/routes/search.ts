import { Router } from "express";
import { z } from "zod";
import { getCache, setCache } from "../utils/cache.js";

export const search = Router();
const Body = z.object({ query: z.string().min(2) });

search.post("/", async (req,res)=>{
  const s = Body.safeParse(req.body);
  if (!s.success) return res.status(400).json({ ok:false, error:s.error.message });
  const q = s.data.query.trim();
  const ck = `search:${q}`; const cached = getCache(ck); if (cached) return res.json({ ok:true, items: cached });

  const bingKey = process.env.BING_SEARCH_KEY?.trim();
  const bingEp = process.env.BING_SEARCH_ENDPOINT?.trim() || "https://api.bing.microsoft.com";
  const gKey = process.env.GOOGLE_SEARCH_API_KEY?.trim();
  const gCx = process.env.GOOGLE_SEARCH_CX?.trim();

  try{
    let items: any[] = [];
    if (bingKey){
      const r = await fetch(`${bingEp}/v7.0/search?q=${encodeURIComponent(q)}`, { headers: { "Ocp-Apim-Subscription-Key": bingKey }});
      if (r.ok){
        const j:any = await r.json();
        items = (j.webPages?.value||[]).slice(0,5).map((x:any)=>({ title:x.name, url:x.url, snippet:x.snippet }));
      }
    }
    if (!items.length && gKey && gCx){
      const r = await fetch(`https://www.googleapis.com/customsearch/v1?key=${gKey}&cx=${gCx}&q=${encodeURIComponent(q)}`);
      if (r.ok){
        const j:any = await r.json();
        items = (j.items||[]).slice(0,5).map((x:any)=>({ title:x.title, url:x.link, snippet:x.snippet }));
      }
    }
    if (!items.length) items = [
      { title:"Informe sectorial (demo)", url:"https://example.com/sector", snippet:"Panorama general y jugadores clave." },
      { title:"Tendencias (demo)", url:"https://example.com/trends", snippet:"Crecimiento, adopción tecnológica y riesgos." },
      { title:"Competidores (demo)", url:"https://example.com/competitors", snippet:"Competidores relevantes y movimientos recientes." }
    ];
    setCache(ck, items, 6*60*60*1000);
    res.json({ ok:true, items });
  } catch(e:any){
    res.status(500).json({ ok:false, error:e?.message||"search error" });
  }
});
