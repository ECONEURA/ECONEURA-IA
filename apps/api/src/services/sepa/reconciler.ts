import { SepaMovement, ReconcileSummary, ReconcileResultItem } from './types.js';

export function reconcile(movements: SepaMovement[], invoices: { id: string; amount: number; date?: string }[]): ReconcileSummary {
  const details: ReconcileResultItem[] = [];
  const invoicesLeft = [...invoices];

  for (const m of movements) {
    let best: { idx: number; score: number } | null = null;
    for (let i = 0; i < invoicesLeft.length; i++) {
      const inv = invoicesLeft[i];
      let score = 0;
      // exact amount
      if (Math.abs(inv.amount - m.amount) < 0.001) score += 50;
      // date proximity
      if (inv.date && m.bookingDate) {
        const d1 = new Date(inv.date).getTime();
        const d2 = new Date(m.bookingDate).getTime();
        const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
        if (diff <= 1) score += 30;
        else if (diff <= 7) score += 10;
      }
      // reference fuzzy (if present)
      if (m.reference && inv.id && m.reference.includes(inv.id)) score += 20;

      if (!best || score > best.score) best = { idx: i, score };
    }

    if (best && best.score > 40) {
      const matched = invoicesLeft.splice(best.idx, 1)[0];
      details.push({ movement: m, matchedInvoiceId: matched.id, score: best.score });
    } else {
      details.push({ movement: m, matchedInvoiceId: null, score: best?.score ?? 0 });
    }
  }

  const matched = details.filter(d => d.matchedInvoiceId).length;
  return { total: details.length, matched, unmatched: details.length - matched, details };
}
