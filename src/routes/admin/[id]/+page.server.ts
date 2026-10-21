import { error, redirect } from '@sveltejs/kit';
import { getSong, replaceMidi, updateSong } from '#lib/server/db';
import { readSongForm } from '#lib/server/songForm';

export const load = async ({ params, parent }) => {
	const { admin } = await parent();
	if (!admin) return {};
	const s = await getSong(params.id);
	if (!s) error(404, 'Brano non trovato');
	return { song: { id: s.id, title: s.title, composer: s.composer, notes: s.notes, voices: s.voices } };
};

export const actions = {
	default: async ({ request, params }) => {
		const song = await getSong(params.id);
		if (!song) error(404, 'Brano non trovato');
		const r = await readSongForm(request, { fileRequired: false });
		if (r.error) return r.error;
		if (r.bytes) await replaceMidi(params.id, r.bytes);
		await updateSong(params.id, r.input!);
		redirect(303, '/admin');
	}
};
