import { parseCamt, parseMt940 } from './parser';
import { reconcile } from './reconciler';
import { SepaMovement, ReconcileSummary } from './types';

export async function importAndReconcile(content: string, type: 'camt' | 'mt940'): Promise<ReconcileSummary> {
  let movements: SepaMovement[] = [];
  if (type === 'camt') movements = await parseCamt(content);
  else movements = parseMt940(content);

  // For a smoke/demo, use a simple in-memory invoice list.
  const invoices = movements.map((m, idx) => ({ id: `INV-${idx + 1}`, amount: Math.abs(Math.round(m.amount * 100) / 100), date: m.bookingDate }));

  // Reconcile
  const summary = reconcile(movements, invoices);
  return summary;
}
