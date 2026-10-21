<script lang="ts">
	import SongForm from '#lib/features/admin/SongForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head><title>Modifica brano · Viva la musica</title></svelte:head>
<a class="back" href="/admin">← Gestione</a>
{#if data.song}
	<h1>Modifica brano</h1>
	{#key data.song.id}
		<SongForm song={data.song} error={form?.error} submit="Salva modifiche" />
	{/key}
{/if}

<style>.back { color: var(--muted); text-decoration: none; }</style>
