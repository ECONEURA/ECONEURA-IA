const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT||3001);
const NEURA = process.env.NEURA_GATEWAY_BASE||"";
const MAKE  = process.env.MAKE_GATEWAY_BASE||"";
const NTOK  = process.env.NEURA_TOKEN||"";
const MTOK  = process.env.MAKE_TOKEN||"";

function json(res, code, obj){ res.writeHead(code,{"content-type":"application/json"}); res.end(JSON.stringify(obj)); }

async function forward(targetBase, req, res, bearer){
  try{
    if(!targetBase) return json(res, 500, { ok:false, error:"TARGET_BASE_MISSING" });
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;

    const u = new URL(req.url.replace(/^\/api/,""), targetBase);
    const headers = {
      "content-type":"application/json",
      "x-correlation-id": req.headers["x-correlation-id"] || Date.now().toString(16),
      ...(bearer ? { authorization: Bearer \ } : {})
    };
    const r = await fetch(u, { method: req.method, headers, body });
    const text = await r.text();
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(text);
  }catch(e){ json(res, 500, { ok:false, error:String(e) }); }
}

const server = http.createServer(async (req,res)=>{
  const url = req.url || "/";
  if(url==="/healthz") return json(res,200,{ ok:true, ts:new Date().toISOString() });

  // Rutas Make opcionales: /api/make/*
  if(url.startsWith("/api/make/")) return forward(MAKE, req, res, MTOK);

  // Resto: NEURA
  if(url.startsWith("/api/")) return forward(NEURA, req, res, NTOK);

  json(res,404,{ ok:false, error:"NOT_FOUND" });
});

server.listen(PORT,"127.0.0.1",()=>console.log("F7 proxy on",PORT));
