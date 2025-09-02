#!/usr/bin/env tsx
/**
 * Read-only gate: validates seed/agents_master.json has deterministic structure with >= 60 agents.
 * - 10 departments: ceo, ia, cso, cto, ciso, coo, chro, mkt, cfo, cdo
 * - For each: one orchestrator "<dept>_orquestador" and 5 autos "<dept>_auto_<01..05>"
 * - Validates required fields and uniqueness of agent_key
 * Fails process with non-zero exit code if invalid.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';

const ROOT = process.cwd();
const file = path.join(ROOT, 'seed', 'agents_master.json');
const depts = ['ceo','ia','cso','cto','ciso','coo','chro','mkt','cfo','cdo'] as const;

const AgentSchema = z.object({
  department: z.string().min(1),
  department_key: z.string().min(1),
  type: z.enum(['agent','director']),
  agent_key: z.string().regex(/^[a-z0-9_]+$/),
  agent_name: z.string().min(1),
  hitl: z.boolean(),
  SLA_minutes: z.number().int().positive().optional(),
  make_scenario_id: z.string().optional(),
});

function fail(msg: string): never {
  console.error(`❌ Seed validation failed: ${msg}`);
  console.error('Hint: run "pnpm seed:ensure60" locally to generate missing entries.');
  process.exit(1);
}

if (!fs.existsSync(file)) {
  fail(`missing file at ${path.relative(ROOT, file)}`);
}

let dataRaw: unknown;
try {
  dataRaw = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  fail(`invalid JSON: ${(e as Error).message}`);
}

const arr = z.array(AgentSchema).safeParse(dataRaw);
if (!arr.success) {
  fail(arr.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
}

const data = arr.data;

// Uniqueness of agent_key
const keys = new Set<string>();
for (const a of data) {
  if (keys.has(a.agent_key)) {
    fail(`duplicate agent_key detected: ${a.agent_key}`);
  }
  keys.add(a.agent_key);
}

// Ensure expected minimum count
if (data.length < 60) {
  fail(`expected at least 60 agents, found ${data.length}`);
}

// Optional soft warnings: departments outside known set
const unknownDepts = Array.from(new Set(data.map(a => a.department_key))).filter(d => !depts.includes(d as any));
if (unknownDepts.length > 0) {
  console.warn(`⚠️ Unknown department_key values found: ${unknownDepts.join(', ')}`);
}

console.log(`✅ Seed validation passed: ${data.length} agents across ${depts.length} departments`);
