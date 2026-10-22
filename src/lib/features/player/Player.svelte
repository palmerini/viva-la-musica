<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { ScorePlayer } from './engine';
	import ScoreView from './ScoreView.svelte';
	import { VOICES, VOICE_NAMES, type Voice } from './voices';
	import { scoreUrl, type Song } from '../repertoire/songs';
	import type { Score } from './midi';

	// Il componente viene ricreato (con {#key}) a ogni cambio di brano.
	// svelte-ignore state_referenced_locally
	let { song, score }: { song: Song; score: Score } = $props();

	const player = new ScorePlayer(score);
	let playing = $state(false);
	let progress = $state(0);
	let ticks = $state(0);
	// Mostra/nascondi lo spartito: di default è nascosto; la scelta resta sul dispositivo.
	let showScore = $state(false);
	try {
		showScore = localStorage.getItem('showScore') === '1';
	} catch {}
	function toggleScore() {
		showScore = !showScore;
		try {
			localStorage.setItem('showScore', showScore ? '1' : '0');
		} catch {}
	}
	let rate = $state(1);
	let volumes = $state(score.parts.map(() => 1));
	/** Voci scelte (vuoto = tutte). */
	let selected = $state<Voice[]>([]);
	/** Con voci scelte: le altre restano in sottofondo invece di tacere. */
	let background = $state(false);
	let raf = 0;
	let voicesReady = $state(false);
	player.ready.then(() => (voicesReady = true));

	const available = VOICES.filter((v) => score.parts.some((p) => p.voice === v));

	function tick() {
		progress = player.progress;
		ticks = player.ticks;
		playing = player.playing;
		raf = requestAnimationFrame(tick);
	}
	onMount(() => (raf = requestAnimationFrame(tick)));
	onDestroy(() => {
		cancelAnimationFrame(raf);
		player.dispose();
	});

	function applyVolumes() {
		volumes.forEach((v, i) => player.setVolume(i, v));
	}

	/** Nessuna voce scelta = tutte a pieno volume; altrimenti le scelte a pieno volume e le altre mute (o basse). */
	function applySelection() {
		volumes = score.parts.map((p) =>
			!selected.length || (p.voice && selected.includes(p.voice)) ? 1 : background ? 0.25 : 0
		);
		applyVolumes();
	}

	function toggleVoice(v: Voice) {
		selected = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
		applySelection();
	}

	function selectAll() {
		selected = [];
		applySelection();
	}

	function toggleBackground() {
		background = !background;
		applySelection();
	}
</script>

<svelte:head><title>{song.title} · Viva la musica</title></svelte:head>

<a class="back" href="/">← Repertorio</a>
<h1>{song.title}</h1>
{#if song.composer}<p class="muted">{song.composer}</p>{/if}
{#if song.notes}<p class="notes">{song.notes}</p>{/if}

<div class="transport">
	<button class="on play" onclick={() => (playing ? player.pause() : player.play())}>
		{playing ? '⏸ Pausa' : voicesReady ? '▶ Play' : '▶ Play (carico le voci…)'}
	</button>
	<button onclick={() => player.stop()}>⏹ Stop</button>
	{#if song.hasScore}
		<button class:on={showScore} aria-pressed={showScore} onclick={toggleScore}>🎼 Spartito</button>
	{/if}
</div>
<input
	type="range" min="0" max="1" step="0.001" value={progress} aria-label="Posizione"
	oninput={(e) => player.seek(+e.currentTarget.value)}
/>

{#if song.hasScore && showScore}
	<ScoreView url={scoreUrl(song.id)} ppq={score.ppq} {ticks} voices={selected} partVoices={score.parts.map((p) => p.voice)} />
{/if}

<h2>Le mie voci</h2>
<div class="row">
	<button class:on={!selected.length} aria-pressed={!selected.length} onclick={selectAll}>Tutte</button>
	{#each available as v}
		<button class:on={selected.includes(v)} aria-pressed={selected.includes(v)} onclick={() => toggleVoice(v)}>
			{VOICE_NAMES[v]}
		</button>
	{/each}
</div>
{#if selected.length}
	<button class="link" class:active={background} aria-pressed={background} onclick={toggleBackground}>
		{background ? '✓ ' : ''}Fai sentire le altre voci a basso volume
	</button>
{/if}

<h2>Mixer</h2>
{#each score.parts as p, i}
	<label class="mix">
		<span>{p.voice ? VOICE_NAMES[p.voice] : p.name}</span>
		<input type="range" min="0" max="1" step="0.05" bind:value={volumes[i]} oninput={applyVolumes} />
	</label>
{/each}

<h2>Velocità</h2>
<label class="mix">
	<span>{Math.round(rate * 100)}%</span>
	<input type="range" min="0.4" max="1.2" step="0.05" bind:value={rate} oninput={() => player.setRate(rate)} />
</label>

<style>
	.back { color: var(--muted); text-decoration: none; }
	h1 { margin: 0.6rem 0 0.2rem; font-size: 1.4rem; }
	h2 { font-size: 1rem; margin: 1.6rem 0 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
	.notes { white-space: pre-wrap; margin: 0 0 1rem; }
	.muted { color: var(--muted); margin: 0 0 1rem; }
	.transport { display: flex; gap: 0.6rem; margin: 1rem 0 0.4rem; }
	.play { flex: 1; font-size: 1.1rem; }
	.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	input[type='range'] { width: 100%; accent-color: var(--brand); }
	.mix { display: grid; grid-template-columns: 6.5rem 1fr; align-items: center; gap: 0.6rem; margin: 0.3rem 0; }
	.link.active { color: var(--fg); }
	.link { border: none; background: none; color: var(--muted); text-decoration: underline; padding: 0.5rem 0; }
</style>
