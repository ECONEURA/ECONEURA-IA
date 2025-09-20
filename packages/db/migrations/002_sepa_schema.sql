-- SEPA imports and movements (PR-42)

CREATE TABLE sepa_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  filename TEXT,
  content_hash TEXT,
  imported_at TIMESTAMP DEFAULT NOW() NOT NULL,
  importer_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE sepa_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_id UUID REFERENCES sepa_imports(id),
  org_id TEXT NOT NULL,
  booking_date TIMESTAMP,
  value_date TIMESTAMP,
  amount DECIMAL(14,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  reference TEXT,
  remittance TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL,
  import_id UUID REFERENCES sepa_imports(id),
  total_movements INTEGER NOT NULL DEFAULT 0,
  matched INTEGER NOT NULL DEFAULT 0,
  unmatched INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX sepa_imports_org_idx ON sepa_imports(org_id);
CREATE INDEX sepa_imports_status_idx ON sepa_imports(status);
CREATE INDEX sepa_movements_import_idx ON sepa_movements(import_id);
CREATE INDEX sepa_movements_org_idx ON sepa_movements(org_id);
CREATE INDEX reconciliations_org_idx ON reconciliations(org_id);
CREATE INDEX reconciliations_import_idx ON reconciliations(import_id);

-- Enable RLS
ALTER TABLE sepa_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sepa_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- Minimal RLS policies
CREATE POLICY "SEPA imports by org" ON sepa_imports FOR ALL USING (org_id = current_setting('app.org_id', true));
CREATE POLICY "SEPA movements by org" ON sepa_movements FOR ALL USING (org_id = current_setting('app.org_id', true));
CREATE POLICY "Reconciliations by org" ON reconciliations FOR ALL USING (org_id = current_setting('app.org_id', true));
