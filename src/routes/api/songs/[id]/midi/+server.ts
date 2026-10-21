import { error } from '@sveltejs/kit';
import { getMidi } from '#lib/server/db';

export const GET = async ({ params }) => {
	const midi = await getMidi(params.id);
	if (!midi) error(404, 'Brano non trovato');
	return new Response(midi as BodyInit, {
		headers: { 'content-type': 'audio/midi', 'cache-control': 'no-cache' }
	});
};
