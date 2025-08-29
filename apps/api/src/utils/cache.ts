const map = new Map<string,{v:any,exp:number}>();
export function getCache(k:string){ const i=map.get(k); if(!i) return; if(Date.now()>i.exp){map.delete(k); return;} return i.v; }
export function setCache(k:string, v:any, ttlMs:number){ map.set(k,{v,exp:Date.now()+ttlMs}); }
