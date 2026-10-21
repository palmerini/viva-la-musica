import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { getSong } from '#lib/server/db';

export const GET = async ({ params }) => {
	const song = await getSong(params.id);
	if (!song) error(404, 'Brano non trovato');
	const obj = await env.MIDI.get(song.midi_key);
	if (!obj) error(404, 'File MIDI mancante');
	return new Response(obj.body as unknown as ReadableStream, {
		headers: {
			'content-type': 'audio/midi',
			'cache-control': 'no-cache',
			etag: obj.httpEtag
		}
	});
};
