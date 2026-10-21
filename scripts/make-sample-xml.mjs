// Genera samples/esempio.musicxml: lo spartito corrispondente a samples/esempio.mid
import { writeFileSync } from 'node:fs';

const chords = [
	{ S: 'E5', A: 'G4', T: 'C4', B: 'C3' },
	{ S: 'F5', A: 'A4', T: 'C4', B: 'F3' },
	{ S: 'D5', A: 'G4', T: 'B3', B: 'G3' },
	{ S: 'E5', A: 'G4', T: 'C4', B: 'C3' },
	{ S: 'F5', A: 'A4', T: 'C4', B: 'F3' },
	{ S: 'D5', A: 'F4', T: 'B3', B: 'G3' },
	{ S: 'C5', A: 'G4', T: 'C4', B: 'C3' }
];
const names = { S: 'Soprano', A: 'Contralto', T: 'Tenore', B: 'Basso' };
const clef = { S: '<sign>G</sign><line>2</line>', A: '<sign>G</sign><line>2</line>', T: '<sign>G</sign><line>2</line><clef-octave-change>-1</clef-octave-change>', B: '<sign>F</sign><line>4</line>' };
const note = (p, dur, type) =>
	`<note><pitch><step>${p[0]}</step><octave>${p[1]}</octave></pitch><duration>${dur}</duration><type>${type}</type></note>`;

const part = (v, i) => {
	const measures = [];
	for (let m = 0; m < 3; m++) {
		const attrs = m === 0 ? `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef>${clef[v]}</clef></attributes>` : '';
		measures.push(`<measure number="${m + 1}">${attrs}${note(chords[m * 2][v], 2, 'half')}${note(chords[m * 2 + 1][v], 2, 'half')}</measure>`);
	}
	measures.push(`<measure number="4">${note(chords[6][v], 4, 'whole')}</measure>`);
	return `<part id="P${i + 1}">${measures.join('')}</part>`;
};
const voices = ['S', 'A', 'T', 'B'];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part-list>${voices.map((v, i) => `<score-part id="P${i + 1}"><part-name>${names[v]}</part-name></score-part>`).join('')}</part-list>${voices.map(part).join('')}</score-partwise>
`;
writeFileSync('samples/esempio.musicxml', xml);
