<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
</script>

<svelte:head><title>Admin · Viva la musica</title></svelte:head>

<div class="top">
	<h1>Gestione repertorio</h1>
	<form method="POST" action="?/logout"><button>Esci</button></form>
</div>
<a class="add" href="/admin/new">＋ Nuovo brano</a>

<ul>
	{#each data.songs as s (s.id)}
		<li>
			<a href="/admin/{s.id}"><strong>{s.title}</strong>{#if s.composer}<small>{s.composer}</small>{/if}</a>
			<form method="POST" action="?/delete" use:enhance onsubmit={(e) => !confirm(`Eliminare «${s.title}»?`) && e.preventDefault()}>
				<input type="hidden" name="id" value={s.id} />
				<button aria-label="Elimina {s.title}">🗑</button>
			</form>
		</li>
	{:else}
		<li class="empty">Nessun brano. Caricane uno.</li>
	{/each}
</ul>

<style>
	.top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
	h1 { font-size: 1.4rem; }
	.add { display: inline-block; padding: 0.7rem 1rem; background: var(--brand); color: var(--accent); border-radius: 0.6rem; text-decoration: none; font-weight: 600; }
	ul { list-style: none; padding: 0; display: grid; gap: 0.6rem; margin: 1rem 0; }
	li { display: flex; align-items: center; gap: 0.5rem; background: var(--card); border: 1px solid var(--line); border-radius: 0.8rem; padding-right: 0.5rem; }
	li a { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1rem; text-decoration: none; }
	small, .empty { color: var(--muted); }
	.empty { padding: 0.9rem 1rem; }
</style>
