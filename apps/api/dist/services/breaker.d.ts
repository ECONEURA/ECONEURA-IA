type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export declare function canCall(): boolean;
export declare function onSuccess(): void;
export declare function onFailure(): void;
export declare function status(): {
    state: State;
    nextTry: number;
    failures: number;
};
export {};
//# sourceMappingURL=breaker.d.ts.map