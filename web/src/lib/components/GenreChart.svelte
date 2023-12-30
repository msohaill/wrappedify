<script lang="ts">
  import type { ListeningInformation } from '$lib/types';
  import unknownCover from '$static/no-cover.png';
  import { ExternalLink } from 'lucide-svelte';
  import { quadOut } from 'svelte/easing';
  import { fly, slide } from 'svelte/transition';
  import AudioToggle from './AudioToggle.svelte';

  export let info: ListeningInformation;
  export let playingTrack: HTMLAudioElement;
  export let show = false;

  const barWidth = (plays: number) => (plays / info.top.genres[0].plays) * 100;
  let selectedGenre = -1;

  $: if (!show) selectedGenre = -1;

  const handleClick = (index: number) => (selectedGenre = selectedGenre === index ? -1 : index);
</script>

<div class="flex flex-col gap-4 w-full sm:w-4/5 min-h-96">
  {#each info.top.genres as genre, i}
    {#if show}
      <button
        class="genre-label keyword-pink"
        style="width: {barWidth(genre.plays)}%"
        in:fly={{ x: '50vw', duration: 500, delay: i * 50, easing: quadOut }}
        on:click={() => handleClick(i)}>#{i + 1} - {genre.name}</button
      >
    {/if}
    {#if selectedGenre == i}
      <div
        transition:slide={{ duration: 750 }}
        class="w-full bg-black bg-opacity-60 p-4 flex flex-col items-center gap-8 text-center"
      >
        <h3 class="key-stat keyword-pink">
          <span class="">{Math.round(genre.timeListened / (1000 * 60)).toLocaleString()}</span> minutes.
        </h3>
        <div class="flex gap-4 flex-wrap justify-center">
          {#each genre.topArtists as artist}
            <div class="flex flex-col items-center">
              <img
                src={artist.topSong.coverUrl || unknownCover}
                alt="Cover for {artist.topSong.name}"
                class="w-32"
              />
              <h4 class="text-sm mt-2 w-32">{artist.topSong.name}</h4>
              <p class="text-[8pt] text-neutral-300 mb-2 w-32">
                {artist.topSong.artists.join(', ')}
              </p>
              <div class="flex gap-2">
                {#if artist.topSong.url}
                  <a href={artist.topSong.url} target="_blank" rel="noopener noreferrer"
                    ><ExternalLink size={16} /></a
                  >
                {/if}
                {#if artist.topSong.previewLink}
                  <AudioToggle size={16} src={artist.topSong.previewLink} bind:playingTrack />
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/each}
</div>

<style lang="postcss">
  .genre-label {
    @apply font-serif italic text-[8pt] sm:text-sm p-1 sm:p-2 bg-white w-full text-left font-bold;
    box-shadow: 3px 3px 0 rgb(229, 155, 190);
  }
  .key-stat {
    @apply p-2 lg:p-4 bg-white lg:text-2xl;
    box-shadow: 5px 5px 0 rgb(229, 155, 190);
  }
</style>
