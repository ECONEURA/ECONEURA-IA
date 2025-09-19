type DeptCfg = {
    department_key: string;
    monthly_budget_eur: number;
};
export declare function loadFinopsConfig(): DeptCfg[];
export declare function currentSpendEUR(org_id: string, department_key: string): Promise<number>;
export declare function shouldStopForBudget(org_id: string, department_key: string): Promise<{
    stop: boolean;
    pct: number;
}>;
export declare function estimateCostEUR(agent_key: string, payload: unknown): string;
export {};
//# sourceMappingURL=finops.d.ts.map