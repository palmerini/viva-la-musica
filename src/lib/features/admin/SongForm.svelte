<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Score } from '#lib/features/player/midi';
	import { midiUrl, type Song } from '#lib/features/repertoire/songs';
	import { VOICES, VOICE_NAMES, type Voice } from '#lib/features/player/voices';

	let { song, error, submit }: { song?: Song; error?: string; submit: string } = $props();

	interface Row { name: string; notes: number; voice: Voice | '' }
	let rows = $state<Row[]>([]);
	let parseError = $state('');

	function show(score: Score) {
		rows = score.parts.map((p) => ({ name: p.name, notes: p.notes.length, voice: p.voice ?? '' }));
	}

	async function onFile(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		parseError = '';
		if (!file) return;
		try {
			// Import dinamico: la libreria MIDI gira solo nel browser.
			const { parseScore } = await import('#lib/features/player/midi');
			show(parseScore(await file.arrayBuffer()));
		} catch {
			rows = [];
			parseError = 'Impossibile leggere il file MIDI';
		}
	}

	$effect(() => {
		if (!song) return;
		fetch(midiUrl(song.id))
			.then((r) => r.arrayBuffer())
			.then(async (b) => {
				const { parseScore } = await import('#lib/features/player/midi');
				show(parseScore(b, song.voices));
			})
			.catch(() => (parseError = 'Impossibile leggere il MIDI attuale'));
	});
</script>

<form method="POST" enctype="multipart/form-data" use:enhance>
	<label>Titolo <input name="title" value={song?.title ?? ''} required maxlength="200" /></label>
	<label>Compositore / autore <input name="composer" value={song?.composer ?? ''} maxlength="200" /></label>
	<label>Note <textarea name="notes" rows="3" maxlength="2000">{song?.notes ?? ''}</textarea></label>
	<label>
		{song ? 'Sostituisci il file MIDI (facoltativo)' : 'File MIDI (da MuseScore)'}
		<input type="file" name="file" accept=".mid,.midi,audio/midi" required={!song} onchange={onFile} />
	</label>

	<label>
		Spartito (MusicXML, facoltativo)
		<input type="file" name="score" accept=".mxl,.musicxml,.xml" />
		<small class="hint">In MuseScore: File → Esporta → MusicXML compresso (.mxl).</small>
	</label>
	{#if song?.hasScore}
		<label class="check"><input type="checkbox" name="removeScore" /> Rimuovi lo spartito attuale</label>
	{/if}

	{#if parseError}<p class="err">{parseError}</p>{/if}
	{#if rows.length}
		<fieldset>
			<legend>Tracce e voci</legend>
			<p class="hint">Controlla a quale voce corrisponde ogni traccia.</p>
			{#each rows as r}
				<label class="track">
					<span>{r.name}<small>{r.notes} note</small></span>
					<select name="voice" bind:value={r.voice}>
						<option value="">—</option>
						{#each VOICES as v}<option value={v}>{VOICE_NAMES[v]}</option>{/each}
					</select>
				</label>
			{/each}
		</fieldset>
	{/if}

	{#if error}<p class="err">{error}</p>{/if}
	<button class="on">{submit}</button>
</form>

<style>
	form { display: grid; gap: 1rem; margin-top: 1rem; }
	label { display: grid; gap: 0.3rem; font-weight: 600; }
	input, textarea, select { font: inherit; font-weight: 400; padding: 0.7rem; border: 1px solid var(--line); border-radius: 0.6rem; background: var(--card); color: var(--fg); }
	fieldset { border: 1px solid var(--line); border-radius: 0.8rem; padding: 0.8rem; display: grid; gap: 0.6rem; }
	.track { grid-template-columns: 1fr 9rem; align-items: center; }
	.track span { display: flex; flex-direction: column; }
	small, .hint { color: var(--muted); font-weight: 400; }
	.hint { margin: 0; }
	.check { display: flex; align-items: center; gap: 0.5rem; font-weight: 400; }
	.err { color: var(--err); margin: 0; }
</style>
