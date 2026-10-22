<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
	import { VOICES, voiceFromName, type Voice } from './voices';

	/** `voices`: voci scelte nel player (vuoto = tutte). */
	let { url, ppq, ticks, voices }: { url: string; ppq: number; ticks: number; voices: Voice[] } = $props();

	let box: HTMLDivElement;
	let osmd: OpenSheetMusicDisplay | undefined;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	/** Una sola riga che scorre in orizzontale (comoda sul telefono) oppure righe a pagina. */
	let horizontal = $state(false);
	let zoom = $state(1);
	/** Con voci scelte, mostra solo i loro righi. */
	let mineOnly = $state(true);
	/** Posizione (in semibrevi) di ogni passo del cursore. Segue i ritornelli, come il MIDI esportato da MuseScore. */
	let stamps: number[] = [];
	let at = 0;
	let destroyed = false;

	onMount(async () => {
		try {
			const narrow = box.clientWidth < 600;
			horizontal = narrow;
			zoom = narrow ? 0.8 : 1;
			// OSMD è pesante (~1 MB): si carica solo se c'è uno spartito da mostrare.
			const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
			const data = await (await fetch(url)).arrayBuffer();
			if (destroyed) return;
			osmd = new OpenSheetMusicDisplay(box, {
				autoResize: !narrow,
				backend: 'svg',
				drawTitle: false,
				drawComposer: false,
				drawCredits: false,
				followCursor: false,
				cursorsOptions: [{ type: 0, color: '#2fa36d', alpha: 0.55, follow: false }]
			});
			await osmd.load(new Blob([data]) as unknown as string);
			status = 'ready';
			rebuild();
		} catch (e) {
			console.warn('Spartito non visualizzabile', e);
			status = 'error';
		}
	});

	onDestroy(() => {
		destroyed = true;
		osmd?.clear();
	});

	/** Ridisegna lo spartito con le opzioni correnti e riallinea il cursore alla riproduzione. */
	function rebuild() {
		if (!osmd) return;
		const only = mineOnly && voices.length ? [...voices] : null;
		osmd.setOptions({ renderSingleHorizontalStaffline: horizontal, drawPartNames: !only });
		osmd.zoom = zoom;
		osmd.Sheet.Instruments.forEach((inst, i) => {
			const v = voiceFromName(inst.Name) ?? VOICES[i];
			inst.Visible = !only || (!!v && only.includes(v));
		});
		osmd.render();
		osmd.cursor.show();
		// Dopo render() il cursore resta dov'era: senza reset l'elenco dei passi partirebbe da metà brano.
		osmd.cursor.reset();
		stamps = [];
		const it = osmd.cursor.Iterator;
		while (!it.EndReached) {
			stamps.push(it.CurrentEnrolledTimestamp.RealValue);
			osmd.cursor.next();
		}
		osmd.cursor.reset();
		at = 0;
		sync(true);
	}

	// Ridisegna quando cambiano le preferenze di visualizzazione o la voce scelta.
	let first = true;
	$effect(() => {
		void [horizontal, zoom, mineOnly, voices.join()];
		if (first || status !== 'ready') {
			first = false;
			return;
		}
		// untrack: rebuild() legge `ticks`; senza, l'effetto si rilancerebbe a ogni avanzamento e ridisegnerebbe tutto di continuo.
		untrack(rebuild);
	});

	/** Porta il cursore al punto di riproduzione: 1 semibreve = 4 quarti = 4 * ppq ticks. */
	function sync(jump = false) {
		if (!osmd || !stamps.length) return;
		const whole = ticks / (ppq * 4);
		const from = at;
		let target = at;
		while (target + 1 < stamps.length && stamps[target + 1] <= whole + 1e-6) target++;
		while (target > 0 && stamps[target] > whole + 1e-6) target--;
		if (target !== at) {
			if (target < at) {
				osmd.cursor.reset();
				at = 0;
			}
			while (at < target) {
				osmd.cursor.next();
				at++;
			}
		}
		if (target !== from || jump) keepInView(jump);
	}

	$effect(() => {
		void ticks;
		if (status === 'ready') sync();
	});

	function keepInView(instant: boolean) {
		const el = osmd?.cursor.cursorElement;
		if (!el) return;
		const b = box.getBoundingClientRect();
		const c = el.getBoundingClientRect();
		const outX = c.left < b.left + 24 || c.right > b.right - 24;
		const outY = c.top < b.top + 20 || c.bottom > b.bottom - 20;
		if (!outX && !outY) return;
		// Scorrimento morbido per l'avanzamento normale, immediato per i salti (seek).
		const far = instant || c.left < b.left - b.width || c.left > b.right + b.width || c.top < b.top - b.height || c.top > b.bottom + b.height;
		box.scrollTo({
			left: outX ? box.scrollLeft + (c.left - b.left) - b.width * 0.25 : box.scrollLeft,
			top: outY ? box.scrollTop + (c.top - b.top) - 40 : box.scrollTop,
			behavior: far ? 'instant' : 'smooth'
		});
	}

	const clamp = (z: number) => Math.min(1.6, Math.max(0.4, Math.round(z * 10) / 10));
</script>

<div class="wrap">
	{#if status === 'ready'}
		<div class="bar">
			<button class:on={horizontal} onclick={() => (horizontal = !horizontal)} aria-pressed={horizontal}>
				{horizontal ? 'Una riga' : 'A pagina'}
			</button>
			<button onclick={() => (zoom = clamp(zoom - 0.1))} aria-label="Rimpicciolisci">−</button>
			<span class="zoom">{Math.round(zoom * 100)}%</span>
			<button onclick={() => (zoom = clamp(zoom + 0.1))} aria-label="Ingrandisci">＋</button>
			{#if voices.length}
				<button class:on={mineOnly} onclick={() => (mineOnly = !mineOnly)} aria-pressed={mineOnly}>{voices.length > 1 ? 'Solo le voci scelte' : 'Solo la mia voce'}</button>
			{/if}
		</div>
	{/if}
	{#if status === 'loading'}<p class="msg">Carico lo spartito…</p>{/if}
	{#if status === 'error'}<p class="msg">Impossibile mostrare lo spartito.</p>{/if}
	<div class="paper" class:horizontal bind:this={box} hidden={status === 'error'}></div>
</div>

<style>
	.wrap { margin-top: 1rem; }
	.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; }
	.bar button { min-height: 2.4rem; padding: 0.4rem 0.7rem; }
	.zoom { min-width: 3rem; text-align: center; color: var(--muted); }
	.paper { position: relative; background: #fffdf7; border: 1px solid var(--line); border-radius: 0.8rem; max-height: 55vh; overflow: auto; padding: 0.5rem; }
	.paper.horizontal { max-height: none; overflow-x: auto; overflow-y: hidden; }
	.msg { color: var(--muted); margin: 0.5rem 0; }
</style>
