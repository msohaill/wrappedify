<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  type Cover = {
    url: string;
    image: string;
    name: string;
  };

  export let albums: Cover[];
  let visible = false;

  onMount(() => (visible = true));
</script>

{#if visible}
  <div class="cover-gallery" in:fly={{ x: 200, duration: 500, delay: 100 }}>
    {#each albums as album (album.url)}
      <a href={album.url} target="_blank" rel="noopener noreferrer">
        <img src={album.image} class="cover" alt={album.name} />
      </a>
    {/each}
  </div>
{/if}

<style lang="postcss">
  .cover-gallery {
    @apply grid grid-cols-3 gap-5 lg:w-[700px] flex-shrink-[0.3];
  }

  .cover {
    @apply w-auto transition-transform hover:scale-[1.025];
    box-shadow: 10px 10px 0px rgba(0, 0, 0, 0.4);
  }
</style>
