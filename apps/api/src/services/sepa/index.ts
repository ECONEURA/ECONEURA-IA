import { parseCamt, parseMt940 } from './parser';
import { reconcile } from './reconciler';
import { SepaMovement, ReconcileSummary } from './types';

// Optional DB persistence (drizzle) — imported lazily
async function tryDb() {
  try {
    const mod = await import('@econeura/db');
    return mod;
  } catch (err) {
    return null;
  }
}

export async function importAndReconcile(content: string, type: 'camt' | 'mt940'): Promise<ReconcileSummary> {
  let movements: SepaMovement[] = [];
  if (type === 'camt') movements = await parseCamt(content);
  else movements = parseMt940(content);

  // For a smoke/demo, use a simple in-memory invoice list.
  const invoices = movements.map((m, idx) => ({ id: `INV-${idx + 1}`, amount: Math.abs(Math.round((m.amount || 0) * 100) / 100), date: m.bookingDate }));

  // Reconcile
  const summary = reconcile(movements, invoices);

  // Persist if DB available
  const dbMod = await tryDb();
  if (dbMod) {
    try {
  const maybe = dbMod as unknown as Record<string, unknown>;
  const db = maybe['db'];
  const sepaImports = maybe['sepaImports'];
  const sepaMovements = maybe['sepaMovements'];
  const reconciliations = maybe['reconciliations'];
  const setOrg = maybe['setOrg'] as ((org: string) => Promise<void>) | undefined;
      const orgId = process.env.DEFAULT_ORG || 'default';
      if (typeof setOrg === 'function') await setOrg(orgId);
      type DbLike = { insert: (table: unknown) => { values: (rows: unknown) => { returning?: () => Promise<any> } } };
      if (db && typeof (db as unknown as Record<string, unknown>)['insert'] === 'function') {
        const dbAny = db as unknown as DbLike; // localized minimal DB interface
        const imp = await dbAny.insert(sepaImports).values({ orgId, filename: null, contentHash: null }).returning?.();
        const importId = imp?.[0]?.id;
        const rows = movements.map((m) => ({ importId, orgId, bookingDate: m.bookingDate, amount: m.amount || 0, currency: m.currency || 'EUR', reference: m.reference, remittance: m.remittance }));
        if (rows.length && sepaMovements) await dbAny.insert(sepaMovements).values(rows);
        if (reconciliations) await dbAny.insert(reconciliations).values({ orgId, importId, totalMovements: summary.total, matched: summary.matched, unmatched: summary.unmatched, details: summary.details });
      }
    } catch (err) {
      // ignore persistence errors for smoke
      console.error('SEPA persistence failed', err);
    }
  }

  return summary;
}
