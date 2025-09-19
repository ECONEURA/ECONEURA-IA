export type HilState = "draft" | "pending_approval" | "approved" | "rejected" | "dispatched" | "completed" | "failed";
export declare const canTransition: (from: HilState, to: HilState) => boolean;
declare const _default: {
    canTransition: (from: HilState, to: HilState) => boolean;
};
export default _default;
//# sourceMappingURL=service.d.ts.map