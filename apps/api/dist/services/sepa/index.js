import { parseCamt, parseMt940 } from './parser.js';
import { reconcile } from './reconciler.js';
async function tryDb() {
    try {
        const mod = await import('@econeura/db');
        return mod;
    }
    catch (err) {
        return null;
    }
}
export async function importAndReconcile(content, type) {
    let movements = [];
    if (type === 'camt')
        movements = await parseCamt(content);
    else
        movements = parseMt940(content);
    const invoices = movements.map((m, idx) => ({ id: `INV-${idx + 1}`, amount: Math.abs(Math.round((m.amount || 0) * 100) / 100), date: m.bookingDate }));
    const summary = reconcile(movements, invoices);
    const dbMod = await tryDb();
    if (dbMod) {
        try {
            const maybe = dbMod;
            const db = maybe['db'];
            const sepaImports = maybe['sepaImports'];
            const sepaMovements = maybe['sepaMovements'];
            const reconciliations = maybe['reconciliations'];
            const setOrg = maybe['setOrg'];
            const orgId = process.env.DEFAULT_ORG || 'default';
            if (typeof setOrg === 'function')
                await setOrg(orgId);
            if (db && typeof db['insert'] === 'function') {
                const dbAny = db;
                const imp = await dbAny.insert(sepaImports).values({ orgId, filename: null, contentHash: null }).returning?.();
                const importId = imp?.[0]?.id;
                const rows = movements.map((m) => ({ importId, orgId, bookingDate: m.bookingDate, amount: m.amount || 0, currency: m.currency || 'EUR', reference: m.reference, remittance: m.remittance }));
                if (rows.length && sepaMovements)
                    await dbAny.insert(sepaMovements).values(rows);
                if (reconciliations)
                    await dbAny.insert(reconciliations).values({ orgId, importId, totalMovements: summary.total, matched: summary.matched, unmatched: summary.unmatched, details: summary.details });
            }
        }
        catch (err) {
            console.error('SEPA persistence failed', err);
        }
    }
    return summary;
}
//# sourceMappingURL=index.js.map