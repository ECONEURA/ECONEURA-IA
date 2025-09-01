export interface SepaMovement {
  id?: string;
  bookingDate: string; // YYYY-MM-DD
  valueDate?: string;
  amount: number;
  currency?: string;
  reference?: string;
  remittance?: string;
}

export interface ReconcileResultItem {
  movement: SepaMovement;
  matchedInvoiceId?: string | null;
  score: number;
}

export interface ReconcileSummary {
  total: number;
  matched: number;
  unmatched: number;
  details: ReconcileResultItem[];
}
