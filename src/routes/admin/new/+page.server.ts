import { redirect } from '@sveltejs/kit';
import { insertSong, setLinks } from '#lib/server/db';
import { readSongForm } from '#lib/server/songForm';

export const actions = {
	default: async ({ request }) => {
		const r = await readSongForm(request, { fileRequired: true });
		if (r.error) return r.error;
		const id = crypto.randomUUID().slice(0, 8);
		await insertSong(id, r.bytes!, r.input!, r.score);
		if (Object.keys(r.links!).length) await setLinks(id, r.links!);
		redirect(303, '/admin');
	}
};
