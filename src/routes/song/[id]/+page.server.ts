import { error } from '@sveltejs/kit';
import { getSong, hasScore } from '#lib/server/db';

export const load = async ({ params }) => {
	const s = await getSong(params.id);
	if (!s) error(404, 'Brano non trovato');
	return { song: { id: s.id, title: s.title, composer: s.composer, notes: s.notes, voices: s.voices, hasScore: await hasScore(s.id) } };
};
