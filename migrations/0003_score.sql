-- Spartito facoltativo (MusicXML, anche compresso .mxl) in base64, a parte per tenere leggero l'elenco.
CREATE TABLE song_score (
	song_id TEXT PRIMARY KEY REFERENCES song(id) ON DELETE CASCADE,
	data    TEXT NOT NULL
);
