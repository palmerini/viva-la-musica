import { env } from 'cloudflare:workers';
import { redirect } from '@sveltejs/kit';
import { endSession } from '#lib/server/admin';
import { deleteSong, getSong, listSongs } from '#lib/server/db';

export const load = async ({ parent }) => {
	const { admin } = await parent();
	return { songs: admin ? (await listSongs()).map(({ id, title, composer }) => ({ id, title, composer })) : [] };
};

export const actions = {
	delete: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		const song = await getSong(id);
		if (song) {
			await env.MIDI.delete(song.midi_key);
			await deleteSong(id);
		}
	},
	logout: async ({ cookies }) => {
		endSession(cookies);
		redirect(303, '/admin/login');
	}
};
