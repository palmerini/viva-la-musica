import { listSongs } from '#lib/features/repertoire/songs';

export const load = async ({ fetch }) => ({ songs: await listSongs(fetch) });
