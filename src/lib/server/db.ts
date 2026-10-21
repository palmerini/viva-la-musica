import { env } from 'cloudflare:workers';
import type { Voice } from '#lib/features/player/voices';

export interface SongRow {
	id: string;
	title: string;
	composer: string | null;
	notes: string | null;
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

export async function insertSong(id: string, midi: ArrayBuffer, s: SongInput) {
	await env.DB.batch([
		env.DB.prepare('INSERT INTO song (id, title, composer, notes, voices) VALUES (?, ?, ?, ?, ?)').bind(
			id, s.title, s.composer, s.notes, s.voices ? JSON.stringify(s.voices) : null
		),
		env.DB.prepare('INSERT INTO song_midi (song_id, data) VALUES (?, ?)').bind(id, toBase64(midi))
	]);
}

export async function replaceMidi(id: string, midi: ArrayBuffer) {
	await env.DB.prepare('UPDATE song_midi SET data = ? WHERE song_id = ?').bind(toBase64(midi), id).run();
}

export async function getMidi(id: string): Promise<Uint8Array | null> {
	const r = await env.DB.prepare('SELECT data FROM song_midi WHERE song_id = ?').bind(id).first<{ data: string }>();
	return r ? Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0)) : null;
}

function toBase64(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let bin = '';
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

export async function updateSong(id: string, s: SongInput) {
	await env.DB.prepare('UPDATE song SET title = ?, composer = ?, notes = ?, voices = ? WHERE id = ?')
		.bind(s.title, s.composer, s.notes, s.voices ? JSON.stringify(s.voices) : null, id)
		.run();
}

export async function deleteSong(id: string) {
	await env.DB.batch([
		env.DB.prepare('DELETE FROM song_midi WHERE song_id = ?').bind(id),
		env.DB.prepare('DELETE FROM song WHERE id = ?').bind(id)
	]);
}
