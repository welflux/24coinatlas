CREATE TABLE users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE TABLE catalogue (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, denomination TEXT NOT NULL, era TEXT NOT NULL,
 start_year INTEGER NOT NULL, end_year INTEGER, description TEXT NOT NULL,
 metal TEXT, mintage INTEGER, verification TEXT NOT NULL, source_url TEXT NOT NULL,
 source_name TEXT NOT NULL, variety_notes TEXT NOT NULL, image TEXT
);
CREATE TABLE market_evidence (
 id TEXT PRIMARY KEY, catalogue_id TEXT NOT NULL REFERENCES catalogue(id),
 year INTEGER NOT NULL, mint_mark TEXT NOT NULL DEFAULT '', condition TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('completed_sale','asking_price','dealer_bid','catalogue_estimate','melt_value')),
 amount_minor INTEGER NOT NULL CHECK(amount_minor > 0), currency TEXT NOT NULL CHECK(currency = 'ZAR'),
 observed_at TEXT NOT NULL, source_url TEXT NOT NULL, source_name TEXT NOT NULL,
 rights_note TEXT NOT NULL, verified_at TEXT NOT NULL, includes_fees INTEGER NOT NULL DEFAULT 0,
 UNIQUE(source_url, catalogue_id, year, condition, type)
);
CREATE INDEX evidence_lookup ON market_evidence(catalogue_id, year, mint_mark, condition, observed_at);
CREATE TABLE coins (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 catalogue_id TEXT REFERENCES catalogue(id), name TEXT NOT NULL, denomination TEXT NOT NULL DEFAULT '',
 year INTEGER, mint_mark TEXT NOT NULL DEFAULT '', condition TEXT NOT NULL DEFAULT 'Not assessed',
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10000), purchase_minor INTEGER,
 acquired_at TEXT, provenance TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX coins_user ON coins(user_id, created_at);
CREATE TABLE photos (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 coin_id TEXT REFERENCES coins(id) ON DELETE SET NULL, side TEXT NOT NULL CHECK(side IN ('obverse','reverse')),
 file_name TEXT NOT NULL UNIQUE, size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX photos_user ON photos(user_id);
CREATE TABLE assessments (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 obverse_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
 reverse_id TEXT REFERENCES photos(id) ON DELETE CASCADE, prediction TEXT NOT NULL,
 model TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE monthly_usage (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, month TEXT NOT NULL,
 scans INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id, month)
);
CREATE TABLE collection_events (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 action TEXT NOT NULL, coin_name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE wishlist (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 catalogue_id TEXT NOT NULL REFERENCES catalogue(id), target_year INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX wishlist_user ON wishlist(user_id);
CREATE TABLE subscriptions (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'inactive', provider_code TEXT UNIQUE,
 email_token TEXT, customer_code TEXT, current_period_end INTEGER,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE checkouts (
 reference TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE payment_events (
 digest TEXT PRIMARY KEY, event_type TEXT NOT NULL, received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
