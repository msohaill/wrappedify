<script lang="ts">
  import Activity from '$lib/components/Activity.svelte';
  import DataNav from '$lib/components/DataNav.svelte';
  import Metadata from '$lib/components/Metadata.svelte';
  import TopArtistsAlbums from '$lib/components/TopArtistsAlbums.svelte';
  import TopSongs from '$lib/components/TopSongs.svelte';
  import { DataTab } from '$lib/types';
  import { fly } from 'svelte/transition';
  import type { PageData } from './$types';

  export let data: PageData;
  let activeTab = DataTab.TopSongs;

  const tabComponents = {
    [DataTab.TopSongs]: TopSongs,
    [DataTab.TopArtistsAlbums]: TopArtistsAlbums,
    [DataTab.Activity]: Activity,
  };

  const info = data.info;
</script>

<Metadata title="Wrappedify – Your data" description="View your analyzed Spotify listening." />

<DataNav bind:activeTab wrappedDate={info.wrappedDate} />

{#key activeTab}
  <main
    in:fly={{ duration: 300, y: 400, delay: 300 }}
    out:fly={{ duration: 300, y: -400 }}
    class="md:ml-56 mt-32 md:mt-16"
  >
    <svelte:component this={tabComponents[activeTab]} {info} />
  </main>
{/key}
