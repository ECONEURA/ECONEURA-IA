export type HilState = "draft"|"pending_approval"|"approved"|"rejected"|"dispatched"|"completed"|"failed";
const allowed: Record<HilState, HilState[]> = {
  draft: ["pending_approval"],
  pending_approval: ["approved","rejected"],
  approved: ["dispatched"],
  rejected: [],
  dispatched: ["completed","failed"],
  completed: [],
  failed: []
};
export const canTransition = (from:HilState,to:HilState)=> allowed[from]?.includes(to) ?? false;

export default {
  canTransition
}
