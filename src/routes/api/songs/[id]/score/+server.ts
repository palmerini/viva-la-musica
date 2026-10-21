import { error } from '@sveltejs/kit';
import { getScore } from '#lib/server/db';

export const GET = async ({ params }) => {
	const score = await getScore(params.id);
	if (!score) error(404, 'Spartito non disponibile');
	const zipped = score[0] === 0x50 && score[1] === 0x4b; // "PK"
	return new Response(score as BodyInit, {
		headers: {
			'content-type': zipped ? 'application/vnd.recordare.musicxml' : 'application/xml',
			'cache-control': 'no-cache'
		}
	});
};
