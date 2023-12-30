<script lang="ts">
  import { browser, dev } from '$app/environment';
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';
  import { fly } from 'svelte/transition';
  import '@fontsource/libre-baskerville';
  import '../app.css';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  const isReducedMotion = browser && matchMedia('(prefers-reduced-motion: reduce)').matches;
  $: isData = data.pathname === '/your-data';
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

<div id="bg" />
<!-- Dummy div for background styling -->

{#if !isData}
  <Header />
{/if}
{#if isReducedMotion}
  <main class={isData ? '' : 'pt-[100px]'}>
    <slot />
  </main>
{:else}
  {#key data.pathname}
    <main
      class={isData ? '' : 'pt-[100px]'}
      in:fly={{ x: -10, duration: 350, delay: 350 }}
      out:fly={{ y: 5, duration: 350 }}
    >
      <slot />
    </main>
  {/key}
{/if}
{#if !isData}
  <Footer />
{/if}
