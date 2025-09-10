#!/usr/bin/env node
// Probar upgrade WS en rutas comunes sin romper si no existe
import http from "http";
const host = process.argv[2] || ""; const candidates = ["/ws","/socket","/realtime"];
const check = (p)=>new Promise(res=>{
  const req = http.request(host.replace("https://","http://")+p,{headers:{Upgrade:"websocket",Connection:"Upgrade"}}, r=>res(false));
  req.on("upgrade",()=>res(true)); req.on("error",()=>res(false)); req.end();
});
let ok=false; for (const p of candidates){ /* eslint-disable no-await-in-loop */ if(await check(p)){ ok=true; break; } }
if(!ok){ process.exitCode=1; }
