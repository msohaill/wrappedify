<script lang="ts">
  import CoverGallery from '$lib/components/CoverGallery.svelte';
  import Metadata from '$lib/components/Metadata.svelte';
  import { onMount } from 'svelte';
  import type { PageServerData } from './$types';
  import { fade } from 'svelte/transition';

  export let data: PageServerData;
  let visible = false;
  onMount(() => (visible = true));
</script>

<Metadata
  title="Wrappedify – Analyze your listening"
  description="Wrappedify allows you to understand your Spotify streaming, without waiting until the end of the year."
/>

{#if visible}
  <div class="home-content" in:fade={{ duration: 350 }}>
    <div class="flex flex-col gap-4 sm:gap-6 lg:gap-10 items-center lg:items-start">
      <h1>Why wait a year to see how you listened?</h1>
      <p class="leading-snug">
        We all love Spotify's Wrapped. But let's be honest, no one deserves to wait 365 days to
        understand their listening. Get started with Wrappedify below!
      </p>
      <a class="button mt-8 bg-[#392b40]" href="/start">Analyze your listening</a>
    </div>
    <CoverGallery albums={data.albums} />
  </div>
{/if}

<style lang="postcss">
  .home-content {
    @apply flex justify-between items-start flex-col-reverse lg:flex-row gap-10;
  }
</style>
