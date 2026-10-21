import { env } from 'cloudflare:workers';
import type { Voice } from '#lib/features/player/voices';

export interface SongRow {
	id: string;
	title: string;
	composer: string | null;
	notes: string | null;
	midi_key: string;
	voices: (Voice | null)[] | null;
	created_at: string;
}

type RawRow = Omit<SongRow, 'voices'> & { voices: string | null };

const parse = (r: RawRow): SongRow => ({ ...r, voices: r.voices ? JSON.parse(r.voices) : null });

export async function listSongs(): Promise<SongRow[]> {
	const { results } = await env.DB.prepare('SELECT * FROM song ORDER BY title COLLATE NOCASE').all<RawRow>();
	return results.map(parse);
}

export async function getSong(id: string): Promise<SongRow | null> {
	const r = await env.DB.prepare('SELECT * FROM song WHERE id = ?').bind(id).first<RawRow>();
	return r ? parse(r) : null;
}

export interface SongInput {
	title: string;
	composer: string | null;
	notes: string | null;
	voices: (Voice | null)[] | null;
}

export async function insertSong(id: string, midiKey: string, s: SongInput) {
	await env.DB.prepare(
		'INSERT INTO song (id, title, composer, notes, midi_key, voices) VALUES (?, ?, ?, ?, ?, ?)'
	)
		.bind(id, s.title, s.composer, s.notes, midiKey, s.voices ? JSON.stringify(s.voices) : null)
		.run();
}

export async function updateSong(id: string, s: SongInput) {
	await env.DB.prepare('UPDATE song SET title = ?, composer = ?, notes = ?, voices = ? WHERE id = ?')
		.bind(s.title, s.composer, s.notes, s.voices ? JSON.stringify(s.voices) : null, id)
		.run();
}

export async function deleteSong(id: string) {
	await env.DB.prepare('DELETE FROM song WHERE id = ?').bind(id).run();
}
