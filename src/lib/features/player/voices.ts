export type Voice = 'S' | 'A' | 'T' | 'B';

export const VOICES: Voice[] = ['S', 'A', 'T', 'B'];

export const VOICE_NAMES: Record<Voice, string> = {
	S: 'Soprano',
	A: 'Contralto',
	T: 'Tenore',
	B: 'Basso'
};

const NAME_PATTERNS: [Voice, RegExp][] = [
	['S', /^(s|sop(rano)?)\b/i],
	['A', /^(a|alt[oi]?|contralt[oi]?)\b/i],
	['T', /^(t|ten(or|ore)?)\b/i],
	['B', /^(b|bass[oi]?|bassi)\b/i]
];

export function voiceFromName(name: string): Voice | undefined {
	const n = name.trim();
	return NAME_PATTERNS.find(([, re]) => re.test(n))?.[0];
}

/**
 * Assegna una voce a ciascuna traccia: prima dal nome; se le tracce sono
 * esattamente 4, quelle senza nome riconosciuto ricevono le voci rimaste
 * in base all'altezza media, dalla più acuta alla più grave.
 */
export function assignVoices(tracks: { name: string; meanPitch: number }[]): (Voice | undefined)[] {
	const out = tracks.map((t) => voiceFromName(t.name));
	if (tracks.length === 4 && new Set(out.filter(Boolean)).size === out.filter(Boolean).length) {
		const free = VOICES.filter((v) => !out.includes(v));
		tracks
			.map((t, i) => [t.meanPitch, i] as const)
			.filter(([, i]) => !out[i])
			.sort((a, b) => b[0] - a[0])
			.forEach(([, i], rank) => (out[i] = free[rank]));
	}
	return out;
}
