export async function backoff<T>(fn: () => Promise<T>, retries=2, base=400) {
  let err: any;
  for (let i=0;i<=retries;i++){
    try { return await fn(); }
    catch(e){ err=e; if(i===retries) break; await new Promise(r=>setTimeout(r, base*Math.pow(2,i))); }
  }
  throw err;
}
