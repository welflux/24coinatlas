CREATE TABLE valuation_snapshots (
 id TEXT PRIMARY KEY, coin_id TEXT NOT NULL REFERENCES coins(id) ON DELETE CASCADE,
 identity_key TEXT NOT NULL, observed_on TEXT NOT NULL, low_minor INTEGER NOT NULL,
 high_minor INTEGER NOT NULL, quantity INTEGER NOT NULL, evidence_ids TEXT NOT NULL,
 UNIQUE(coin_id, identity_key, observed_on)
);
CREATE INDEX snapshots_coin ON valuation_snapshots(coin_id, identity_key, observed_on);
CREATE TABLE varieties (
 id TEXT PRIMARY KEY, catalogue_id TEXT NOT NULL REFERENCES catalogue(id), name TEXT NOT NULL,
 year INTEGER, mint_mark TEXT, distinguishing_features TEXT NOT NULL,
 evidence_summary TEXT NOT NULL, source_url TEXT NOT NULL, source_name TEXT NOT NULL,
 rights_note TEXT NOT NULL, reviewer TEXT NOT NULL, reviewed_at TEXT NOT NULL
);
CREATE INDEX varieties_catalogue ON varieties(catalogue_id);
