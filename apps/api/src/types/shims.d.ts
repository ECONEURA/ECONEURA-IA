// Ambient module shims to satisfy the TypeScript compiler during iterative refactors.
// These are temporary and should be replaced by proper package types later.

declare module 'ioredis';

// Ensure process is recognized in strict TS environments
declare const process: NodeJS.Process;

// Basic Express Response type loosening for handlers to avoid TS7030 false positives on strict paths
declare namespace Express {
	interface Response {
		json: (body?: any) => this;
		status: (code: number) => this;
		send: (body?: any) => this;
		set: (field: string, val?: string) => this;
	}
}
