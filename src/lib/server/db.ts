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

export async function insertSong(id: string, midi: ArrayBuffer, s: SongInput, score?: ArrayBuffer | null) {
	await env.DB.batch([
		env.DB.prepare('INSERT INTO song (id, title, composer, notes, voices) VALUES (?, ?, ?, ?, ?)').bind(
			id, s.title, s.composer, s.notes, s.voices ? JSON.stringify(s.voices) : null
		),
		env.DB.prepare('INSERT INTO song_midi (song_id, data) VALUES (?, ?)').bind(id, toBase64(midi)),
		...(score ? [env.DB.prepare('INSERT INTO song_score (song_id, data) VALUES (?, ?)').bind(id, toBase64(score))] : [])
	]);
}

/** Imposta lo spartito (MusicXML) del brano; `null` lo rimuove. */
export async function setScore(id: string, score: ArrayBuffer | null) {
	await (score
		? env.DB.prepare('INSERT OR REPLACE INTO song_score (song_id, data) VALUES (?, ?)').bind(id, toBase64(score))
		: env.DB.prepare('DELETE FROM song_score WHERE song_id = ?').bind(id)
	).run();
}

export async function getScore(id: string): Promise<Uint8Array | null> {
	const r = await env.DB.prepare('SELECT data FROM song_score WHERE song_id = ?').bind(id).first<{ data: string }>();
	return r ? Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0)) : null;
}

export async function hasScore(id: string): Promise<boolean> {
	return !!(await env.DB.prepare('SELECT 1 AS x FROM song_score WHERE song_id = ?').bind(id).first());
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

/** I link a risorse esterne del brano: 'pdf' = spartito originale, 'all' = versione completa, poi una per voce. */
export type SongLinks = Partial<Record<'pdf' | 'all' | Voice, string>>;

export async function getLinks(id: string): Promise<SongLinks> {
	const { results } = await env.DB.prepare('SELECT kind, url FROM song_link WHERE song_id = ?')
		.bind(id)
		.all<{ kind: string; url: string }>();
	return Object.fromEntries(results.map((r) => [r.kind, r.url]));
}

/** Sostituisce tutti i link del brano con quelli indicati. */
export async function setLinks(id: string, links: SongLinks) {
	await env.DB.batch([
		env.DB.prepare('DELETE FROM song_link WHERE song_id = ?').bind(id),
		...Object.entries(links).map(([kind, url]) =>
			env.DB.prepare('INSERT INTO song_link (song_id, kind, url) VALUES (?, ?, ?)').bind(id, kind, url)
		)
	]);
}

export async function deleteSong(id: string) {
	await env.DB.batch([
		env.DB.prepare('DELETE FROM song_link WHERE song_id = ?').bind(id),
		env.DB.prepare('DELETE FROM song_score WHERE song_id = ?').bind(id),
		env.DB.prepare('DELETE FROM song_midi WHERE song_id = ?').bind(id),
		env.DB.prepare('DELETE FROM song WHERE id = ?').bind(id)
	]);
}
