// Estrae i campioni "choir aahs" da FluidR3_GM (midi-js-soundfonts di gleitz) in static/soundfonts/choir_aahs/
// Uso: node scripts/extract-soundfont.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/choir_aahs-mp3.js';
const OUT = 'static/soundfonts/choir_aahs';

const js = await (await fetch(URL)).text();
mkdirSync(OUT, { recursive: true });
let n = 0;
for (const [, note, b64] of js.matchAll(/"([A-G][b#]?\d)":\s*"data:audio\/mp3;base64,([^"]+)"/g)) {
	writeFileSync(`${OUT}/${note}.mp3`, Buffer.from(b64, 'base64'));
	n++;
}
console.log(`${n} campioni scritti in ${OUT}`);
