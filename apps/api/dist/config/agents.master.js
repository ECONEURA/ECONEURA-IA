import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';
export const AgentSchema = z.object({
    department: z.string().min(1),
    department_key: z.string().min(1),
    type: z.union([z.literal('agent'), z.literal('director')]),
    agent_key: z.string().min(1),
    agent_name: z.string().min(1),
    hitl: z.boolean().default(false),
    SLA_minutes: z.number().int().positive().default(60),
    make_scenario_id: z.string().optional(),
    approval_tool: z.string().optional(),
    budget_weight: z.number().min(0.1).max(3.0).default(1.0)
});
export const AgentsArray = z.array(AgentSchema);
export function loadAgentsMaster() {
    const candidates = [
        path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'seed', 'agents_master.json'),
        path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'seed', 'agents_master.json'),
    ];
    for (const p of candidates) {
        try {
            if (!fs.existsSync(p))
                continue;
            const raw = fs.readFileSync(p, 'utf8');
            const parsed = JSON.parse(raw);
            return AgentsArray.parse(parsed);
        }
        catch (e) {
            continue;
        }
    }
    return AgentsArray.parse([]);
}
export const AGENTS_MASTER = loadAgentsMaster();
//# sourceMappingURL=agents.master.js.map