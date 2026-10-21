export const ssr = false;

import { loadScore } from '#lib/features/player/midi';
import { midiUrl } from '#lib/features/repertoire/songs';

export const load = async ({ data, fetch }) => ({
	...data,
	score: await loadScore(midiUrl(data.song.id), fetch, data.song.voices)
});
