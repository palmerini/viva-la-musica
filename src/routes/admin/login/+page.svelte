<script lang="ts">
	let { form } = $props();
</script>

<svelte:head><title>Accesso admin · Viva la musica</title></svelte:head>

<h1>Accesso admin</h1>
<form method="POST">
	<input type="password" name="password" placeholder="Password" autocomplete="current-password" required />
	{#if form?.error}<p class="err">{form.error}</p>{/if}
	<button class="on">Entra</button>
</form>

<style>
	form { display: grid; gap: 0.8rem; margin-top: 1rem; }
	input { padding: 0.75rem; font: inherit; border: 1px solid var(--line); border-radius: 0.6rem; background: var(--card); color: var(--fg); }
	.err { color: var(--err); margin: 0; }
</style>
