CREATE TABLE song (
	id         TEXT PRIMARY KEY,
	title      TEXT NOT NULL,
	composer   TEXT,
	notes      TEXT,
	midi_key   TEXT NOT NULL,
	-- JSON: voce di ciascuna traccia con note, nell'ordine del file (es. ["S","A","T","B"]; null = non assegnata)
	voices     TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
