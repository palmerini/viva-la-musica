import { error } from '@sveltejs/kit';
import { listSongs } from '#lib/features/repertoire/songs';
import { loadScore } from '#lib/features/player/midi';

export const ssr = false;

export const load = async ({ params, fetch }) => {
	const song = (await listSongs(fetch)).find((s) => s.id === params.id);
	if (!song) error(404, 'Brano non trovato');
	return { song, score: await loadScore(song.midi, fetch) };
};
