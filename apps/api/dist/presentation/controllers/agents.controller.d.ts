import { Request, Response, NextFunction } from 'express';
import { AgentConnector } from '../../../../packages/agents/connector.d.js';
import { AgentSpecificMemory } from '../../../../packages/agents/memory.js';
export declare class AgentsController {
    private agentConnectors;
    private memory;
    constructor(memory: AgentSpecificMemory);
    registerAgent(connector: AgentConnector): void;
    executeAgent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAgentHealth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAgentStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    resetAgent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listAgents: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAgent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAgentMemory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    clearAgentMemory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const createAgentsController: (memory: AgentSpecificMemory) => AgentsController;
export declare const agentsController: AgentsController;
//# sourceMappingURL=agents.controller.d.ts.map