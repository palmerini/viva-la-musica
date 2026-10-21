-- I file MIDI (pochi KB) vivono in D1 come base64, in una tabella a parte per tenere leggero l'elenco.
CREATE TABLE song_midi (
	song_id TEXT PRIMARY KEY REFERENCES song(id) ON DELETE CASCADE,
	data    TEXT NOT NULL
);

CREATE TABLE song_new (
	id         TEXT PRIMARY KEY,
	title      TEXT NOT NULL,
	composer   TEXT,
	notes      TEXT,
	voices     TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO song_new SELECT id, title, composer, notes, voices, created_at FROM song;
DROP TABLE song;
ALTER TABLE song_new RENAME TO song;
