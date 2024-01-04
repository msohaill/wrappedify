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
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <!-- <script async src="https://www.googletagmanager.com/gtag/js?id=G-VXV78TSSFG"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', 'G-VXV78TSSFG');
    </script> -->
  {/if}
</svelte:head>

<!-- Dummy div for background styling -->
<div id="bg" />

{#if isReducedMotion}
  <div>
    <slot />
  </div>
{:else}
  {#key data.pathname}
    <div in:fly={{ x: -10, duration: 350, delay: 350 }} out:fly={{ y: 5, duration: 350 }}>
      <slot />
    </div>
  {/key}
{/if}
