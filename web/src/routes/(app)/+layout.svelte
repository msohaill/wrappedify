<script lang="ts">
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';
</script>

<div id="bg" />
<!-- Dummy div for background styling -->

<Header />
<main class="pt-[100px]">
  <slot />
</main>
<Footer />
