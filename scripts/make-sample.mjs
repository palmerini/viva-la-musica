// Genera un brano di esempio a 4 voci in static/songs/esempio.mid
import pkg from '@tonejs/midi';
const { Midi } = pkg;
import { writeFileSync } from 'node:fs';

const midi = new Midi();
const chords = [
	{ S: 'E5', A: 'G4', T: 'C4', B: 'C3' },
	{ S: 'F5', A: 'A4', T: 'C4', B: 'F3' },
	{ S: 'D5', A: 'G4', T: 'B3', B: 'G3' },
	{ S: 'E5', A: 'G4', T: 'C4', B: 'C3' },
	{ S: 'F5', A: 'A4', T: 'C4', B: 'F3' },
	{ S: 'D5', A: 'F4', T: 'B3', B: 'G3' },
	{ S: 'C5', A: 'G4', T: 'C4', B: 'C3' }
];
const names = { S: 'Soprano', A: 'Alto', T: 'Tenore', B: 'Basso' };
for (const v of ['S', 'A', 'T', 'B']) {
	const track = midi.addTrack();
	track.name = names[v];
	chords.forEach((c, i) => track.addNote({ name: c[v], ticks: i * 960, durationTicks: i === chords.length - 1 ? 1920 : 900, velocity: 0.8 }));
}
writeFileSync('static/songs/esempio.mid', Buffer.from(midi.toArray()));
writeFileSync('static/songs/index.json', JSON.stringify([{ id: 'esempio', title: 'Esempio (cadenza a 4 voci)', composer: 'Brano di prova', midi: '/songs/esempio.mid' }], null, 2));
