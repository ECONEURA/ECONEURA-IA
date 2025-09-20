const allowed = {
    draft: ["pending_approval"],
    pending_approval: ["approved", "rejected"],
    approved: ["dispatched"],
    rejected: [],
    dispatched: ["completed", "failed"],
    completed: [],
    failed: []
};
export const canTransition = (from, to) => allowed[from]?.includes(to) ?? false;
export default {
    canTransition
};
//# sourceMappingURL=service.js.map