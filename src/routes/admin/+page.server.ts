import { redirect } from '@sveltejs/kit';
import { endSession } from '#lib/server/admin';
import { deleteSong, listSongs } from '#lib/server/db';

export const load = async ({ parent }) => {
	const { admin } = await parent();
	return { songs: admin ? (await listSongs()).map(({ id, title, composer }) => ({ id, title, composer })) : [] };
};

export const actions = {
	delete: async ({ request }) => {
		const id = String((await request.formData()).get('id') ?? '');
		await deleteSong(id);
	},
	logout: async ({ cookies }) => {
		endSession(cookies);
		redirect(303, '/admin/login');
	}
};
