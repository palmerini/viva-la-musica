import type { Voice } from '#lib/features/player/voices';

export interface Song {
	id: string;
	title: string;
	composer: string | null;
	notes: string | null;
	/** Voce di ciascuna traccia con note; se assente si deduce dal file. */
	voices: (Voice | null)[] | null;
	/** C'è uno spartito (MusicXML) da mostrare. */
	hasScore: boolean;
}

export const midiUrl = (id: string) => `/api/songs/${id}/midi`;

export const scoreUrl = (id: string) => `/api/songs/${id}/score`;
