// Minimal API types to satisfy re-exports during iterative typecheck.

export type ApiResponse<T = any> = {;
	success: boolean
	data?: T
	error?: string
}

export {};
/