// Genera samples/esempio-3voci.mid e .musicxml: soprani, contralti e uomini (a tre voci)
import pkg from '@tonejs/midi';
import { writeFileSync } from 'node:fs';
const { Midi } = pkg;

const chords = [
	{ S: 'E5', A: 'G4', U: 'C3' },
	{ S: 'F5', A: 'A4', U: 'F3' },
	{ S: 'D5', A: 'G4', U: 'G3' },
	{ S: 'E5', A: 'G4', U: 'C3' },
	{ S: 'F5', A: 'A4', U: 'F3' },
	{ S: 'D5', A: 'F4', U: 'G3' },
	{ S: 'C5', A: 'G4', U: 'C3' }
];
const names = { S: 'Soprano', A: 'Contralto', U: 'Uomini' };
const voices = ['S', 'A', 'U'];

const midi = new Midi();
for (const v of voices) {
	const track = midi.addTrack();
	track.name = names[v];
	chords.forEach((c, i) =>
		track.addNote({ name: c[v], ticks: i * 960, durationTicks: i === chords.length - 1 ? 1920 : 900, velocity: 0.8 })
	);
}
writeFileSync('samples/esempio-3voci.mid', Buffer.from(midi.toArray()));

const note = (p, dur, type) =>
	`<note><pitch><step>${p[0]}</step><octave>${p[1]}</octave></pitch><duration>${dur}</duration><type>${type}</type></note>`;
const clef = { S: '<sign>G</sign><line>2</line>', A: '<sign>G</sign><line>2</line>', U: '<sign>F</sign><line>4</line>' };
const part = (v, i) => {
	const m = [];
	for (let k = 0; k < 3; k++) {
		const attrs = k === 0 ? `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef>${clef[v]}</clef></attributes>` : '';
		m.push(`<measure number="${k + 1}">${attrs}${note(chords[k * 2][v], 2, 'half')}${note(chords[k * 2 + 1][v], 2, 'half')}</measure>`);
	}
	m.push(`<measure number="4">${note(chords[6][v], 4, 'whole')}</measure>`);
	return `<part id="P${i + 1}">${m.join('')}</part>`;
};
writeFileSync(
	'samples/esempio-3voci.musicxml',
	`<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="3.1"><part-list>${voices.map((v, i) => `<score-part id="P${i + 1}"><part-name>${names[v]}</part-name></score-part>`).join('')}</part-list>${voices.map(part).join('')}</score-partwise>\n`
);
console.log('samples/esempio-3voci.mid e .musicxml scritti');
