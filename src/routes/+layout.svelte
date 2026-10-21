<script lang="ts">
	import '../app.css';

	let { children } = $props();

</script>

<header>
	<a href="/" class="brand">♪ Viva la musica</a>
</header>
<main>{@render children()}</main>
