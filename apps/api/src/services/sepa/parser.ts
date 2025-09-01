import { SepaMovement } from './types';
import { parseStringPromise } from 'xml2js';

export async function parseCamt(xml: string): Promise<SepaMovement[]> {
  const res = await parseStringPromise(xml, { explicitArray: false, explicitRoot: false });
  const entries: any[] = [];

  // Camino común en CAMT.053/054: entries in 'BkToCstmrStmt' or 'Ntry'
  const ntry = res?.BkToCstmrStmt?.Stmt?.Ntry || res?.Ntry || [];
  const items = Array.isArray(ntry) ? ntry : [ntry].filter(Boolean);

  for (const e of items) {
    try {
      const amt = parseFloat(e.Amt?._ || e.Amt || '0');
      const bookingDate = e.BookgDt?.Dt || e.BookingDate || e.BookgDt?.DtTm || e.BookgDt || new Date().toISOString().slice(0,10);
      const ref = e.NtryRef || e.AddtlNtryInf || e.RmtInf?.Ustrd || e.RmtInf?.Strd?.CdtrRefInf?.Ref || '';

      entries.push({
        bookingDate: bookingDate,
        amount: amt,
        currency: e.Amt?._ ? e.Amt.$?.Ccy : e.Amt?.$?.Ccy || 'EUR',
        reference: ref,
        remittance: e.RmtInf?.Ustrd || undefined
      });
    } catch (err) {
      // skip malformed entry
    }
  }

  return entries;
}

export function parseMt940(text: string): SepaMovement[] {
  // Very small MT940 parser: split by :61: entries
  const parts = text.split('\n:61:').slice(1);
  const out: SepaMovement[] = [];
  for (const p of parts) {
    // first line contains date and amount
    const lines = p.split('\n');
    const header = lines[0];
    // date format DDMMYY
    const dateMatch = header.match(/(\d{6})/);
    const dd = dateMatch ? dateMatch[1] : null;
    let booking = new Date().toISOString().slice(0,10);
    if (dd) {
      const day = dd.slice(0,2);
      const month = dd.slice(2,4);
      const year = '20' + dd.slice(4,6);
      booking = `${year}-${month}-${day}`;
    }

    const amtMatch = header.match(/([0-9,]+)N?/);
    let amt = 0;
    if (amtMatch) {
      amt = parseFloat(amtMatch[1].replace(',', '.'));
    }

    const rem = lines.slice(1).join(' ');
    out.push({ bookingDate: booking, amount: amt, remittance: rem });
  }
  return out;
}
