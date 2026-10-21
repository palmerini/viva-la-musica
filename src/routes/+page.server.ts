import { listSongs } from '#lib/server/db';

export const load = async () => ({
	songs: (await listSongs()).map(({ id, title, composer }) => ({ id, title, composer }))
});
