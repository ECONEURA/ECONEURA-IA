#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
type Agent = { department: string; department_key: string; type: 'agent'|'director'; agent_key: string; agent_name: string; hitl: boolean; SLA_minutes?: number; make_scenario_id?: string; };
const ROOT = process.cwd();
const file = path.join(ROOT, 'seed', 'agents_master.json');
const depts = ['ceo','ia','cso','cto','ciso','coo','chro','mkt','cfo','cdo'];
const names: Record<string,string> = { ceo:'CEO — Ejecutivo', ia:'Plataforma IA', cso:'Estrategia (CSO)', cto:'Tecnología (CTO)', ciso:'Seguridad (CISO)', coo:'Operaciones (COO)', chro:'RRHH (CHRO)', mkt:'Marketing y Ventas', cfo:'Finanzas (CFO)', cdo:'Datos (CDO)' };
const data: Agent[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : [];
const byKey = new Map(data.map(a=>[a.agent_key,a]));
for (const d of depts) {
  const label = names[d];
  const ensure = (k:string, nm:string, hitl:boolean) => {
    if (!byKey.has(k)) {
      const obj: Agent = { department:label, department_key:d, type: nm.toLowerCase().includes('orquestador') ? 'director':'agent', agent_key:k, agent_name:nm, hitl, SLA_minutes:120, make_scenario_id:`SCENARIO-${k}` };
      data.push(obj); byKey.set(k,obj);
    }
  };
  ensure(`${d}_orquestador`, d==='ceo'?'Orquestador Ejecutivo':'Orquestador', false);
  for (let i=1;i<=5;i++) ensure(`${d}_auto_${i}`, `Agente ${i.toString().padStart(2,'0')} ${label}`, i%2===0);
}
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log(`seed/agents_master.json -> ${data.length} items`);
