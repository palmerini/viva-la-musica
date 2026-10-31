import { fail } from '@sveltejs/kit';
import { ALL_VOICES, normalizeThreeVoices, type Voice } from '#lib/features/player/voices';
import type { SongInput, SongLinks } from './db';

const MAX_BYTES = 2 * 1024 * 1024;

/** Accetta solo indirizzi http(s): niente javascript: né altri schemi. */
function cleanUrl(raw: string): string | null {
	const v = raw.trim();
	if (!v || v.length > 500) return null;
	try {
		const u = new URL(v);
		return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
	} catch {
		return null;
	}
}

export async function readSongForm(request: Request, opts: { fileRequired: boolean }) {
	const f = await request.formData();
	const text = (k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
	const title = text('title', 200);
	if (!title) return { error: fail(400, { error: 'Il titolo è obbligatorio' }) };

	const picked = f.getAll('voice').map((v) => (ALL_VOICES.includes(v as Voice) ? (v as Voice) : undefined));
	// Con tre voci la voce maschile è "Uomini" (vedi normalizeThreeVoices).
	const voices = normalizeThreeVoices(picked).map((v) => v ?? null);
	const input: SongInput = {
		title,
		composer: text('composer', 200) || null,
		notes: text('notes', 2000) || null,
		voices: voices.length ? voices : null
	};

	const file = f.get('file');
	let bytes: ArrayBuffer | null = null;
	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_BYTES) return { error: fail(400, { error: 'File troppo grande (max 2 MB)' }) };
		bytes = await file.arrayBuffer();
		if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'MThd')
			return { error: fail(400, { error: 'Il file non è un MIDI valido' }) };
	} else if (opts.fileRequired) {
		return { error: fail(400, { error: 'Seleziona un file MIDI' }) };
	}

	// Spartito facoltativo: MusicXML in chiaro o compresso (.mxl, uno zip).
	let score: ArrayBuffer | null = null;
	const sf = f.get('score');
	if (sf instanceof File && sf.size > 0) {
		if (sf.size > MAX_BYTES) return { error: fail(400, { error: 'Spartito troppo grande (max 2 MB)' }) };
		score = await sf.arrayBuffer();
		const head = new TextDecoder().decode(score.slice(0, 200));
		if (!head.startsWith('PK') && !head.includes('<?xml') && !head.includes('<score-'))
			return { error: fail(400, { error: 'Lo spartito deve essere un file MusicXML (.mxl o .musicxml)' }) };
	}

	// Link a risorse esterne: lo spartito originale (PDF), la versione completa cantata e una per ciascuna voce del brano
	// (YouTube, file su Drive…). L'app memorizza solo l'indirizzo.
	const links: SongLinks = {};
	const kinds: ('pdf' | 'all' | Voice)[] = ['pdf', 'all', ...new Set(voices.filter((v): v is Voice => !!v))];
	for (const kind of kinds) {
		const raw = String(f.get(`link_${kind}`) ?? '').trim();
		if (!raw) continue;
		const url = cleanUrl(raw);
		if (!url) return { error: fail(400, { error: 'Un link non è valido: deve iniziare con http:// o https://' }) };
		links[kind] = url;
	}
	return {
		input,
		bytes,
		score,
		removeScore: f.get('removeScore') === 'on',
		links
	};
}
