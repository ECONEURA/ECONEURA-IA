#!/usr/bin/env tsx
import fs from "node:fs";
const depts = [
  ["ceo","CEO — Ejecutivo"],["ia","Plataforma IA"],["cso","Estrategia"],["cto","Tecnología"],
  ["ciso","Seguridad"],["coo","Operaciones"],["chro","RRHH"],["mkt","Marketing y Ventas"],
  ["cfo","Finanzas"],["cdo","Datos"]
];
const auto = ["a1","a2","a3","a4","a5"];
const doctor = "doctor_coach";
const out:any[] = [];
for (const [k,n] of depts) {
  out.push({department:n,department_key:k,type:"director",agent_key:`${k}_orquestador`,agent_name:`Orquestador ${n}`,hitl:false});
  for (const a of auto) out.push({department:n,department_key:k,type:"agent",agent_key:`${k}_${a}`,agent_name:`${n} — ${a.toUpperCase()}`,hitl: a==="a3"});
  out.push({department:n,department_key:k,type:"agent",agent_key:`${k}_${doctor}`,agent_name:`${n} — Ejecutivo Doctor&Coach`,hitl:true});
}
fs.mkdirSync("seed",{recursive:true});
fs.writeFileSync("seed/agents_master.json", JSON.stringify(out,null,2));
console.log("seed/agents_master.json ->", out.length,"items");
