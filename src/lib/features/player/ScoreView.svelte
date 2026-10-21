<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

	let { url, ppq, ticks }: { url: string; ppq: number; ticks: number } = $props();

	let box: HTMLDivElement;
	let osmd: OpenSheetMusicDisplay | undefined;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	/** Posizione (in semibrevi) di ogni passo del cursore. Segue i ritornelli, come il MIDI esportato da MuseScore. */
	let stamps: number[] = [];
	let at = 0;
	let destroyed = false;

	onMount(async () => {
		try {
			// OSMD è pesante (~1 MB): si carica solo se c'è uno spartito da mostrare.
			const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
			const data = await (await fetch(url)).arrayBuffer();
			if (destroyed) return;
			osmd = new OpenSheetMusicDisplay(box, {
				autoResize: true,
				backend: 'svg',
				drawTitle: false,
				drawComposer: false,
				drawCredits: false,
				drawPartNames: true,
				followCursor: false,
				cursorsOptions: [{ type: 0, color: '#e6a817', alpha: 0.55, follow: false }]
			});
			await osmd.load(new Blob([data]) as unknown as string);
			osmd.render();
			osmd.cursor.show();
			stamps = [];
			const it = osmd.cursor.Iterator;
			while (!it.EndReached) {
				stamps.push(it.CurrentEnrolledTimestamp.RealValue);
				osmd.cursor.next();
			}
			osmd.cursor.reset();
			at = 0;
			status = 'ready';
		} catch (e) {
			console.warn('Spartito non visualizzabile', e);
			status = 'error';
		}
	});

	onDestroy(() => {
		destroyed = true;
		osmd?.clear();
	});

	// Il cursore segue la riproduzione: 1 semibreve = 4 quarti = 4 * ppq ticks.
	$effect(() => {
		if (status !== 'ready' || !osmd || !stamps.length) return;
		const whole = ticks / (ppq * 4);
		let target = at;
		while (target + 1 < stamps.length && stamps[target + 1] <= whole + 1e-6) target++;
		while (target > 0 && stamps[target] > whole + 1e-6) target--;
		if (target === at) return;
		if (target < at) {
			osmd.cursor.reset();
			at = 0;
		}
		while (at < target) {
			osmd.cursor.next();
			at++;
		}
		keepInView();
	});

	function keepInView() {
		const el = osmd?.cursor.cursorElement;
		if (!el) return;
		const b = box.getBoundingClientRect();
		const c = el.getBoundingClientRect();
		if (c.top < b.top + 20 || c.bottom > b.bottom - 20) {
			// Scorrimento morbido per l'avanzamento normale, immediato per i salti (seek).
			const far = c.top < b.top - b.height || c.top > b.bottom + b.height;
			box.scrollTo({ top: box.scrollTop + (c.top - b.top) - 40, behavior: far ? 'instant' : 'smooth' });
		}
	}
</script>

<div class="wrap">
	{#if status === 'loading'}<p class="msg">Carico lo spartito…</p>{/if}
	{#if status === 'error'}<p class="msg">Impossibile mostrare lo spartito.</p>{/if}
	<div class="paper" bind:this={box} hidden={status === 'error'}></div>
</div>

<style>
	.wrap { margin-top: 1rem; }
	.paper { position: relative; background: #fffdf7; border: 1px solid var(--line); border-radius: 0.8rem; max-height: 55vh; overflow: auto; padding: 0.5rem; }
	.msg { color: var(--muted); margin: 0.5rem 0; }
</style>
