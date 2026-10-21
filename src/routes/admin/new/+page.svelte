<script lang="ts">
	import SongForm from '#lib/features/admin/SongForm.svelte';
	let { form } = $props();
</script>

<svelte:head><title>Nuovo brano · Viva la musica</title></svelte:head>
<a class="back" href="/admin">← Gestione</a>
<h1>Nuovo brano</h1>
<SongForm error={form?.error} submit="Carica brano" />

<style>.back { color: var(--muted); text-decoration: none; }</style>
