import { fail } from '@sveltejs/kit';
import { VOICES, type Voice } from '#lib/features/player/voices';
import type { SongInput } from './db';

const MAX_BYTES = 2 * 1024 * 1024;

export async function readSongForm(request: Request, opts: { fileRequired: boolean }) {
	const f = await request.formData();
	const text = (k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
	const title = text('title', 200);
	if (!title) return { error: fail(400, { error: 'Il titolo è obbligatorio' }) };

	const voices = f.getAll('voice').map((v) => (VOICES.includes(v as Voice) ? (v as Voice) : null));
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
	return { input, bytes };
}
