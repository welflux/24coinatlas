CREATE TABLE catalogue_reviews (
 id INTEGER PRIMARY KEY, catalogue_id TEXT NOT NULL REFERENCES catalogue(id),
 reviewer TEXT NOT NULL, reviewed_at TEXT NOT NULL, rights_note TEXT NOT NULL
);
