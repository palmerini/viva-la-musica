import type { Voice } from '#lib/features/player/voices';

export interface Song {
	id: string;
	title: string;
	composer: string | null;
	notes: string | null;
	/** Voce di ciascuna traccia con note; se assente si deduce dal file. */
	voices: (Voice | null)[] | null;
}

export const midiUrl = (id: string) => `/api/songs/${id}/midi`;
