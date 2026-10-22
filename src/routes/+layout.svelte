<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Repertorio', match: (p: string) => p === '/' || p.startsWith('/song') },
		{ href: '/documentazione', label: 'Documentazione', match: (p: string) => p.startsWith('/documentazione') }
	];
	const wide = $derived(page.url.pathname.startsWith('/documentazione'));
</script>

<div class="app">
<header>
	<a href="/" class="brand">
		<img src="/icon-192.png" alt="" width="40" height="40" />
		<span>Viva la musica</span>
	</a>
	<nav>
		{#each links as l}
			<a href={l.href} class:active={l.match(page.url.pathname)}>{l.label}</a>
		{/each}
	</nav>
</header>
<main class:wide>{@render children()}</main>
<footer>
	<p>
		«Viva la musica» è <strong>software libero</strong>: puoi usarlo, studiarlo, modificarlo e condividerlo secondo
		la licenza
		<a href="https://github.com/palmerini/viva-la-musica/blob/main/LICENSE" target="_blank" rel="noopener">Apache 2.0</a>.
	</p>
	<p>
		Il codice è su
		<a href="https://github.com/palmerini/viva-la-musica" target="_blank" rel="noopener">GitHub</a>.
	</p>
</footer>
</div>

<style>
	.app { min-height: 100dvh; display: flex; flex-direction: column; }
	header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
	.brand { display: flex; align-items: center; gap: 0.6rem; }
	.brand img { border-radius: 0.5rem; background: #f8f8f8; }
	nav { display: flex; gap: 0.25rem; }
	nav a { color: var(--nav); text-decoration: none; padding: 0.45rem 0.7rem; border-radius: 0.5rem; font-size: 0.95rem; }
	footer { margin-top: auto; padding: 1.2rem 1rem calc(1.2rem + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); text-align: center; font-size: 0.85rem; color: var(--muted); }
	footer p { margin: 0.2rem auto; max-width: 36rem; }
	footer a { color: inherit; text-underline-offset: 0.15em; }
	footer a:hover { color: var(--fg); }
	nav a.active { background: rgb(255 255 255 / 0.14); color: #fff; }
</style>
