import * as Tone from 'tone';
import type { Score } from './midi';

const SAMPLES_URL = '/soundfonts/choir_aahs/';
const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

/** Un campione ogni 3 semitoni nell'estensione del brano (±2): basta a mantenere naturale il timbro. */
function sampleNotes(score: Score): string[] {
	const midis = score.parts.flatMap((p) => p.notes.map((n) => Tone.Frequency(n.name).toMidi()));
	const lo = Math.max(21, Math.min(...midis) - 2);
	const hi = Math.min(108, Math.max(...midis) + 2);
	const out: string[] = [];
	for (let m = lo - (lo % 3); m <= hi + 2; m += 3) if (m >= 21 && m <= 108) out.push(noteName(m));
	return out;
}

type Instrument = Tone.PolySynth | Tone.Sampler;

/**
 * Riproduce uno Score con un campionatore "coro" per traccia (campioni condivisi
 * tra le tracce) e volume regolabile per ciascuna. Finché i campioni si caricano,
 * e se il caricamento fallisce, suona un sintetizzatore semplice.
 */
export class ScorePlayer {
	/** Si risolve quando le voci campionate sono pronte (o si è ripiegato sul sintetizzatore). */
	readonly ready: Promise<'samples' | 'synth'>;
	private instruments: Instrument[] = [];
	private gains: Tone.Gain[] = [];
	private parts: Tone.Part[] = [];
	private buffers: Tone.ToneAudioBuffers | null = null;
	private rate = 1;

	constructor(private score: Score) {
		const transport = Tone.getTransport();
		transport.stop();
		transport.cancel();
		transport.PPQ = score.ppq;
		score.parts.forEach((part, i) => {
			const gain = new Tone.Gain(1).toDestination();
			this.gains.push(gain);
			this.instruments.push(this.makeSynth(gain));
			this.parts.push(
				new Tone.Part(
					(time, n) =>
						this.instruments[i].triggerAttackRelease(n.name, `${n.durationTicks}i`, time, n.velocity),
					part.notes.map((n) => ({ ...n, time: `${n.ticks}i` }))
				).start(0)
			);
		});
		for (const t of score.tempos) {
			transport.schedule(() => (transport.bpm.value = t.bpm * this.rate), `${t.ticks}i`);
		}
		this.setRate(1);
		this.ready = this.loadSamples();
	}

	private makeSynth(out: Tone.Gain) {
		const synth = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: 'triangle' },
			envelope: { attack: 0.03, decay: 0.1, sustain: 0.7, release: 0.25 }
		}).connect(out);
		synth.maxPolyphony = 8;
		return synth;
	}

	private async loadSamples(): Promise<'samples' | 'synth'> {
		try {
			const urls = Object.fromEntries(sampleNotes(this.score).map((n) => [n, `${n}.mp3`]));
			// Un solo gruppo di buffer, condiviso da tutte le voci, per non moltiplicare la memoria.
			this.buffers = new Tone.ToneAudioBuffers({ urls, baseUrl: SAMPLES_URL });
			await Tone.loaded();
			const old = this.instruments;
			this.instruments = this.gains.map((gain) => {
				const sampler = new Tone.Sampler({ attack: 0.05, release: 0.6 }).connect(gain);
				for (const note of Object.keys(urls)) sampler.add(note as Tone.Unit.Note, this.buffers!.get(note));
				return sampler;
			});
			old.forEach((s) => s.dispose());
			return 'samples';
		} catch (e) {
			console.warn('Campioni voce non disponibili, uso il sintetizzatore', e);
			return 'synth';
		}
	}

	get playing() {
		return Tone.getTransport().state === 'started';
	}

	/** Posizione di riproduzione, da 0 a 1. */
	get progress() {
		return this.score.totalTicks ? Math.min(1, Tone.getTransport().ticks / this.score.totalTicks) : 0;
	}

	/** Posizione in ticks del file MIDI. */
	get ticks() {
		return Tone.getTransport().ticks;
	}

	async play() {
		await Tone.start();
		await this.ready;
		if (this.progress >= 1) this.seek(0);
		Tone.getTransport().start();
	}

	pause() {
		Tone.getTransport().pause();
		this.instruments.forEach((s) => s.releaseAll());
	}

	stop() {
		Tone.getTransport().stop();
		this.instruments.forEach((s) => s.releaseAll());
	}

	seek(fraction: number) {
		Tone.getTransport().ticks = Math.round(fraction * this.score.totalTicks);
	}

	setVolume(partIndex: number, volume: number) {
		this.gains[partIndex].gain.rampTo(volume, 0.05);
	}

	setRate(rate: number) {
		this.rate = rate;
		const transport = Tone.getTransport();
		const current = [...this.score.tempos].reverse().find((t) => t.ticks <= transport.ticks);
		transport.bpm.value = (current?.bpm ?? this.score.tempos[0].bpm) * rate;
	}

	dispose() {
		const transport = Tone.getTransport();
		transport.stop();
		transport.cancel();
		this.parts.forEach((p) => p.dispose());
		this.instruments.forEach((s) => s.dispose());
		this.gains.forEach((g) => g.dispose());
		this.buffers?.dispose();
	}
}
