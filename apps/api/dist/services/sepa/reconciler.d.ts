import { SepaMovement, ReconcileSummary } from './types.js';
export declare function reconcile(movements: SepaMovement[], invoices: {
    id: string;
    amount: number;
    date?: string;
}[]): ReconcileSummary;
//# sourceMappingURL=reconciler.d.ts.map