export interface Song {
	id: string;
	title: string;
	composer?: string;
	midi: string;
}

// Per ora il repertorio è un file statico; in seguito verrà servito da D1/R2.
export async function listSongs(fetchFn: typeof fetch = fetch): Promise<Song[]> {
	const res = await fetchFn('/songs/index.json');
	if (!res.ok) throw new Error('Repertorio non disponibile');
	return res.json();
}
