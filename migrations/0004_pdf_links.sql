-- Link a risorse esterne del brano (YouTube, file audio su drive, PDF dello spartito originale...).
-- kind: 'pdf' = spartito originale, 'all' = versione completa cantata, oppure una voce ('S','A','T','B','U').
-- Un solo link per tipo. I file restano sulla risorsa esterna: l'app memorizza solo l'indirizzo.
CREATE TABLE song_link (
	song_id TEXT NOT NULL REFERENCES song(id) ON DELETE CASCADE,
	kind    TEXT NOT NULL,
	url     TEXT NOT NULL,
	PRIMARY KEY (song_id, kind)
);
