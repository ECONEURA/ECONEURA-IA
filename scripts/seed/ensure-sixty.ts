#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
type Agent = { department: string; department_key: string; type: 'agent'|'director'; agent_key: string; agent_name: string; hitl: boolean; SLA_minutes?: number; make_scenario_id?: string; webhook_url?: string; };
const p = path.join(process.cwd(), 'seed', 'agents_master.json');
const list: Agent[] = JSON.parse(fs.readFileSync(p, 'utf8'));
const ensure = (a: Agent) => {
  a.SLA_minutes = a.SLA_minutes ?? 120;
  a.make_scenario_id = a.make_scenario_id ?? `SCENARIO-${a.agent_key}`;
  a.webhook_url = a.webhook_url ?? `https://hook.example.invalid/${a.agent_key}`;
  return a;
};
const completed = list.map(ensure);
if (completed.length < 60) {
  const needed = 60 - completed.length;
  for (let i = 0; i < needed; i++) {
    const idx = i + 1;
    completed.push(ensure({
      department: 'Demo',
      department_key: 'demo',
      type: 'agent',
      agent_key: `demo_auto_${idx}`,
      agent_name: `Demo Auto ${idx}`,
      hitl: idx % 3 === 0,
    } as Agent));
  }
}
fs.writeFileSync(p, JSON.stringify(completed, null, 2));
console.log(`Seed length: ${completed.length} (>=60 OK)`);
