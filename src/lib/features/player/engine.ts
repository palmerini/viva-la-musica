import * as Tone from 'tone';
import type { Score } from './midi';

/** Riproduce uno Score con un sintetizzatore per traccia e volume regolabile per ciascuna. */
export class ScorePlayer {
	private synths: Tone.PolySynth[] = [];
	private gains: Tone.Gain[] = [];
	private parts: Tone.Part[] = [];
	private rate = 1;

	constructor(private score: Score) {
		const transport = Tone.getTransport();
		transport.stop();
		transport.cancel();
		transport.PPQ = score.ppq;
		for (const part of score.parts) {
			const gain = new Tone.Gain(1).toDestination();
			const synth = new Tone.PolySynth(Tone.Synth, {
				oscillator: { type: 'triangle' },
				envelope: { attack: 0.03, decay: 0.1, sustain: 0.7, release: 0.25 }
			}).connect(gain);
			synth.maxPolyphony = 8;
			const p = new Tone.Part(
				(time, n) => synth.triggerAttackRelease(n.name, `${n.durationTicks}i`, time, n.velocity),
				part.notes.map((n) => ({ ...n, time: `${n.ticks}i` }))
			).start(0);
			this.gains.push(gain);
			this.synths.push(synth);
			this.parts.push(p);
		}
		for (const t of score.tempos) {
			transport.schedule(() => (transport.bpm.value = t.bpm * this.rate), `${t.ticks}i`);
		}
		this.setRate(1);
	}

	get playing() {
		return Tone.getTransport().state === 'started';
	}

	/** Posizione di riproduzione, da 0 a 1. */
	get progress() {
		return this.score.totalTicks ? Math.min(1, Tone.getTransport().ticks / this.score.totalTicks) : 0;
	}

	async play() {
		await Tone.start();
		if (this.progress >= 1) this.seek(0);
		Tone.getTransport().start();
	}

	pause() {
		Tone.getTransport().pause();
		this.synths.forEach((s) => s.releaseAll());
	}

	stop() {
		Tone.getTransport().stop();
		this.synths.forEach((s) => s.releaseAll());
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
		this.synths.forEach((s) => s.dispose());
		this.gains.forEach((g) => g.dispose());
	}
}
