<script lang="ts">
	let { data } = $props();
	let q = $state('');
	const shown = $derived(
		data.songs.filter((s) => `${s.title} ${s.composer ?? ''}`.toLowerCase().includes(q.toLowerCase()))
	);
</script>

<svelte:head><title>Viva la musica</title></svelte:head>

<img class="logo" src="/icon-512.png" alt="Coro Viva La Musica, Milano" width="160" height="160" />
<h1>Repertorio</h1>
<input type="search" placeholder="Cerca un brano…" bind:value={q} />
<ul>
	{#each shown as s (s.id)}
		<li><a href="/song/{s.id}"><strong>{s.title}</strong>{#if s.composer}<small>{s.composer}</small>{/if}</a></li>
	{:else}
		<li class="empty">Nessun brano.</li>
	{/each}
</ul>

<style>
	.logo { display: block; margin: 0.5rem auto 0; width: 9rem; height: auto; border-radius: 1rem; }
	h1 { margin: 0.5rem 0 1rem; font-size: 1.4rem; }
	input { width: 100%; padding: 0.75rem; font: inherit; border: 1px solid var(--line); border-radius: 0.6rem; background: var(--card); color: var(--fg); }
	ul { list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.6rem; }
	li a { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1rem; background: var(--card); border: 1px solid var(--line); border-radius: 0.8rem; text-decoration: none; }
	small, .empty { color: var(--muted); }
</style>
