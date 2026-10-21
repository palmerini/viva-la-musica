<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { ScorePlayer } from './engine';
	import { VOICES, VOICE_NAMES, type Voice } from './voices';
	import type { Song } from '../repertoire/songs';
	import type { Score } from './midi';

	// Il componente viene ricreato (con {#key}) a ogni cambio di brano.
	// svelte-ignore state_referenced_locally
	let { song, score }: { song: Song; score: Score } = $props();

	const player = new ScorePlayer(score);
	let playing = $state(false);
	let progress = $state(0);
	let rate = $state(1);
	let volumes = $state(score.parts.map(() => 1));
	let focus = $state<Voice | 'all'>('all');
	let raf = 0;

	const available = VOICES.filter((v) => score.parts.some((p) => p.voice === v));

	function tick() {
		progress = player.progress;
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

	/** all = tutte; solo = solo la voce scelta; with = la voce scelta in evidenza, le altre basse. */
	function preset(voice: Voice | 'all', mode: 'solo' | 'with' = 'solo') {
		focus = voice;
		volumes = score.parts.map((p) =>
			voice === 'all' || p.voice === voice ? 1 : mode === 'with' ? 0.25 : 0
		);
		applyVolumes();
	}
</script>

<svelte:head><title>{song.title} · Viva la musica</title></svelte:head>

<a class="back" href="/">← Repertorio</a>
<h1>{song.title}</h1>
{#if song.composer}<p class="muted">{song.composer}</p>{/if}

<div class="transport">
	<button class="on play" onclick={() => (playing ? player.pause() : player.play())}>
		{playing ? '⏸ Pausa' : '▶ Play'}
	</button>
	<button onclick={() => player.stop()}>⏹ Stop</button>
</div>
<input
	type="range" min="0" max="1" step="0.001" value={progress} aria-label="Posizione"
	oninput={(e) => player.seek(+e.currentTarget.value)}
/>

<h2>La mia voce</h2>
<div class="row">
	<button class:on={focus === 'all'} onclick={() => preset('all')}>Tutte</button>
	{#each available as v}
		<button class:on={focus === v} onclick={() => preset(v, 'solo')}>{VOICE_NAMES[v]}</button>
	{/each}
</div>
{#if focus !== 'all'}
	<button class="link" onclick={() => preset(focus, 'with')}>… oppure ascoltala sopra le altre voci</button>
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
	.muted { color: var(--muted); margin: 0 0 1rem; }
	.transport { display: flex; gap: 0.6rem; margin: 1rem 0 0.4rem; }
	.play { flex: 1; font-size: 1.1rem; }
	.row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	input[type='range'] { width: 100%; accent-color: var(--brand); }
	.mix { display: grid; grid-template-columns: 6.5rem 1fr; align-items: center; gap: 0.6rem; margin: 0.3rem 0; }
	.link { border: none; background: none; color: var(--muted); text-decoration: underline; padding: 0.5rem 0; }
</style>
