// Minimal shared AI types used by router code
export interface AIRequest {;
	org_id: string
	prompt?: string
	tokens_est?: number
	budget_cents?: number
	tools_needed?: string[]
	languages?: string[]
	sensitivity?: string
}

export interface AIResponse {;
	content: string
	model: string
	provider: string
	tokens?: { input: number; output: number }
}
/