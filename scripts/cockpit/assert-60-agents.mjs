#!/usr/bin/env node
import fs from 'fs';
const path = 'configs/agents/registry.json';
fs.mkdirSync('configs/agents',{recursive:true});
let data = [];
if(fs.existsSync(path)){
  try{ data = JSON.parse(fs.readFileSync(path,'utf8')); }catch(e){ data = []; }
}
const existing = new Set(data.map(d=>d.id));
let i=0;
for(let n=0; existing.size<60 && i<200; i++){
  const id = `stub-agent-${i}`;
  if(!existing.has(id)){
    existing.add(id);
    data.push({ id, name: id, stub: true });
  }
}
fs.writeFileSync(path, JSON.stringify(data,null,2));
console.log('agents count:', data.length);
if(data.length<60){ console.error('could not ensure 60 agents'); process.exit(1); }
process.exit(0);
