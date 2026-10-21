import { redirect } from '@sveltejs/kit';
import { insertSong } from '#lib/server/db';
import { readSongForm } from '#lib/server/songForm';

export const actions = {
	default: async ({ request }) => {
		const r = await readSongForm(request, { fileRequired: true });
		if (r.error) return r.error;
		await insertSong(crypto.randomUUID().slice(0, 8), r.bytes!, r.input!, r.score);
		redirect(303, '/admin');
	}
};
