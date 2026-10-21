import { env } from 'cloudflare:workers';
import { redirect } from '@sveltejs/kit';
import { insertSong } from '#lib/server/db';
import { readSongForm } from '#lib/server/songForm';

export const actions = {
	default: async ({ request }) => {
		const r = await readSongForm(request, { fileRequired: true });
		if (r.error) return r.error;
		const id = crypto.randomUUID().slice(0, 8);
		const key = `songs/${id}.mid`;
		await env.MIDI.put(key, r.bytes!, { httpMetadata: { contentType: 'audio/midi' } });
		await insertSong(id, key, r.input!);
		redirect(303, '/admin');
	}
};
