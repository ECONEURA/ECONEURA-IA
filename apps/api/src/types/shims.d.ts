// Ambient module shims to satisfy the TypeScript compiler during iterative refactors.
// These are temporary and should be replaced by proper package types later.

declare module 'ioredis';
declare module 'express';

// Ensure process is recognized in strict TS environments
declare const process: NodeJS.Process;
