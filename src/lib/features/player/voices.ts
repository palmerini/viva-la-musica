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
 * Assegna una voce a ciascuna traccia: prima dal nome, poi (se le tracce sono
 * esattamente 4) dall'altezza media, dalla più acuta alla più grave.
 */
export function assignVoices(tracks: { name: string; meanPitch: number }[]): (Voice | undefined)[] {
	const byName = tracks.map((t) => voiceFromName(t.name));
	if (byName.every(Boolean) && new Set(byName).size === byName.length) return byName;
	if (tracks.length === 4) {
		const order = tracks.map((t, i) => [t.meanPitch, i] as const).sort((a, b) => b[0] - a[0]);
		const out: (Voice | undefined)[] = [];
		order.forEach(([, i], rank) => (out[i] = VOICES[rank]));
		return out;
	}
	return byName;
}
