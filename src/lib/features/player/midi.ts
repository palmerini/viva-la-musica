import { Midi } from '@tonejs/midi';
import { assignVoices, type Voice } from './voices';

export interface Part {
	name: string;
	voice?: Voice;
	notes: { name: string; ticks: number; durationTicks: number; velocity: number }[];
}

export interface Score {
	ppq: number;
	totalTicks: number;
	tempos: { ticks: number; bpm: number }[];
	parts: Part[];
}

export async function loadScore(
	url: string,
	fetchFn: typeof fetch = fetch,
	voices?: (Voice | null)[] | null
): Promise<Score> {
	const res = await fetchFn(url);
	if (!res.ok) throw new Error(`Impossibile caricare il brano (${res.status})`);
	return parseScore(await res.arrayBuffer(), voices);
}

/** `override`: voce di ciascuna traccia con note, scelta dall'admin (null = nessuna). */
export function parseScore(data: ArrayBuffer, override?: (Voice | null)[] | null): Score {
	const midi = new Midi(data);
	// MuseScore esporta il nome del rigo in una traccia vuota che precede quella con le note.
	const tracks = midi.tracks
		.map((t, i) => ({
			notes: t.notes,
			name: t.name || (midi.tracks[i - 1]?.notes.length === 0 ? midi.tracks[i - 1].name : '')
		}))
		.filter((t) => t.notes.length > 0);
	const meanPitch = (t: (typeof tracks)[number]) =>
		t.notes.reduce((s, n) => s + n.midi, 0) / t.notes.length;
	const voices = override
		? tracks.map((_, i) => override[i] ?? undefined)
		: assignVoices(tracks.map((t) => ({ name: t.name, meanPitch: meanPitch(t) })));
	const parts: Part[] = tracks.map((t, i) => ({
		name: t.name || `Traccia ${i + 1}`,
		voice: voices[i],
		notes: t.notes.map((n) => ({
			name: n.name,
			ticks: n.ticks,
			durationTicks: Math.max(1, n.durationTicks),
			velocity: n.velocity
		}))
	}));
	const totalTicks = Math.max(0, ...parts.flatMap((p) => p.notes.map((n) => n.ticks + n.durationTicks)));
	const tempos = midi.header.tempos.length
		? midi.header.tempos.map((t) => ({ ticks: t.ticks, bpm: t.bpm }))
		: [{ ticks: 0, bpm: 120 }];
	return { ppq: midi.header.ppq, totalTicks, tempos, parts };
}
