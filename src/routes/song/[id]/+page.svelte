<script lang="ts">
	import Player from '#lib/features/player/Player.svelte';

	let { data } = $props();
</script>

{#key data.song.id}
	<Player song={data.song} score={data.score} />
{/key}
