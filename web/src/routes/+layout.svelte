<script lang="ts">
  import { browser, dev } from '$app/environment';
  import '@fontsource/libre-baskerville';
  import { fly } from 'svelte/transition';
  import '../app.css';
  import type { LayoutServerData } from './$types';

  export let data: LayoutServerData;

  const isReducedMotion = browser && matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<svelte:head>
  {#if !dev}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-1ESEB7QTES"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());

      gtag('config', 'G-1ESEB7QTES');
    </script>
  {/if}
</svelte:head>

<!-- Dummy div for background styling -->
<div id="bg" />

{#if isReducedMotion}
  <div id="content">
    <slot />
  </div>
{:else}
  {#key data.pathname}
    <div
      id="content"
      in:fly={{ x: -10, duration: 350, delay: 350 }}
      out:fly={{ y: 5, duration: 350 }}
    >
      <slot />
    </div>
  {/key}
{/if}

<style lang="postcss">
  #content {
    @apply flex flex-col justify-between min-h-screen;
  }
</style>
