/** S, A, T, B; U = voci maschili insieme (brani a tre voci). */
export type Voice = 'S' | 'A' | 'T' | 'B' | 'U';

/** Le quattro voci del coro misto, dalla più acuta alla più grave. */
export const VOICES: Voice[] = ['S', 'A', 'T', 'B'];

/** Tutte le voci che si possono assegnare a una traccia. */
export const ALL_VOICES: Voice[] = ['S', 'A', 'T', 'B', 'U'];

export const VOICE_NAMES: Record<Voice, string> = {
	S: 'Soprano',
	A: 'Contralto',
	T: 'Tenore',
	B: 'Basso',
	U: 'Uomini'
};

const NAME_PATTERNS: [Voice, RegExp][] = [
	['S', /^(s|sop(rano)?)\b/i],
	['A', /^(a|alt[oi]?|contralt[oi]?)\b/i],
	['T', /^(t|ten(or|ore)?)\b/i],
	['B', /^(b|bass[oi]?|bassi)\b/i],
	['U', /^(u|uom(o|ini)|men|maschil[ei]|voci maschili)\b/i]
];

export function voiceFromName(name: string): Voice | undefined {
	const n = name.trim();
	return NAME_PATTERNS.find(([, re]) => re.test(n))?.[0];
}

/**
 * Assegna una voce a ciascuna traccia: prima dal nome; poi, se le tracce sono
 * 4 (S, A, T, B) o 3 (S, A, Uomini), quelle senza nome riconosciuto ricevono
 * le voci rimaste in base all'altezza media, dalla più acuta alla più grave.
 */
export function assignVoices(tracks: { name: string; meanPitch: number }[]): (Voice | undefined)[] {
	const out = tracks.map((t) => voiceFromName(t.name));
	const layout = tracks.length === 4 ? VOICES : tracks.length === 3 ? (['S', 'A', 'U'] as Voice[]) : null;
	const named = out.filter((v): v is Voice => !!v);
	if (layout && new Set(named).size === named.length) {
		// A tre voci un tenore o un basso riconosciuto vale "Uomini" (vedi normalizeThreeVoices).
		const taken = tracks.length === 3 ? named.map((v) => (v === 'T' || v === 'B' ? 'U' : v)) : named;
		const free = layout.filter((v) => !taken.includes(v));
		tracks
			.map((t, i) => [t.meanPitch, i] as const)
			.filter(([, i]) => !out[i])
			.sort((a, b) => b[0] - a[0])
			.forEach(([, i], rank) => (out[i] = free[rank]));
	}
	return out;
}

/**
 * Con tre voci (soprani, contralti e uomini) la voce maschile è sempre "Uomini",
 * anche se la traccia era stata chiamata o assegnata a Tenore o Basso.
 */
export function normalizeThreeVoices(voices: (Voice | undefined)[]): (Voice | undefined)[] {
	const assigned = voices.filter((v): v is Voice => !!v);
	const set = new Set(assigned);
	const threeVoices =
		assigned.length === 3 && set.has('S') && set.has('A') && (set.has('T') || set.has('B') || set.has('U'));
	return threeVoices ? voices.map((v) => (v === 'T' || v === 'B' ? 'U' : v)) : voices;
}
