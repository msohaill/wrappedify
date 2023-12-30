<script lang="ts">
  import Activity from '$lib/components/Activity.svelte';
  import DataNav from '$lib/components/DataNav.svelte';
  import Metadata from '$lib/components/Metadata.svelte';
  import TopArtistsAlbums from '$lib/components/TopArtistsAlbums.svelte';
  import TopSongs from '$lib/components/TopSongs.svelte';
  import { DataTab, type ListeningInformation } from '$lib/types';
  import { fly } from 'svelte/transition';
  import _ from './test.json';

  let activeTab = DataTab.TopSongs;

  const tabComponents = {
    [DataTab.TopSongs]: TopSongs,
    [DataTab.TopArtistsAlbums]: TopArtistsAlbums,
    [DataTab.Activity]: Activity,
  };
  const testData: ListeningInformation = { ..._, wrappedDate: new Date(Date.parse(_.wrappedDate)) };
</script>

<Metadata title="Wrappedify – Your data" description="View your analyzed Spotify listening." />

<DataNav bind:activeTab wrappedDate={testData.wrappedDate} />
{#key activeTab}
  <div
    in:fly={{ duration: 300, y: 400, delay: 300 }}
    out:fly={{ duration: 300, y: -400 }}
    class="md:ml-56 mt-32 sm:mt-16 md:mt-0 data-tab"
  >
    <svelte:component this={tabComponents[activeTab]} info={testData} />
  </div>
{/key}
