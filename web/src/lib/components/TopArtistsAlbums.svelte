<script lang="ts">
  import type { ListeningInformation } from '$lib/types';
  import unknownCover from '$static/no-cover.png';
  import 'flickity/css/flickity.css';
  import { ExternalLink, StepBack, StepForward } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import AudioToggle from './AudioToggle.svelte';
  import GenreChart from './GenreChart.svelte';

  export let info: ListeningInformation;

  let artistCoverCarousel: Flickity;
  let artistInfoCarousel: Flickity;
  let albumCoverCarousel: Flickity;
  let albumInfoCarousel: Flickity;

  let artistIndex = 0;
  let albumIndex = 0;

  let playingTrack: HTMLAudioElement;

  const baseOptions = {
    draggable: true,
    pageDots: false,
    prevNextButtons: false,
    friction: 0.15,
    selectedAttraction: 0.01,
    dragThreshold: 10,
    wrapAround: true,
  };

  $: {
    if (artistCoverCarousel) {
      artistCoverCarousel.select(artistIndex);
    }
    if (artistInfoCarousel) {
      artistInfoCarousel.select(artistIndex);
    }
    if (albumCoverCarousel) {
      albumCoverCarousel.select(albumIndex);
    }
    if (albumInfoCarousel) {
      albumInfoCarousel.select(albumIndex);
    }
  }

  onMount(async () => {
    const Flickity = (await import('flickity')).default;
    artistCoverCarousel = new Flickity('.artist-covers', {
      ...baseOptions,
      on: { change: i => (artistIndex = i) },
    });
    artistInfoCarousel = new Flickity('.artist-infos', {
      ...baseOptions,
      on: { change: i => (artistIndex = i) },
    });
    albumCoverCarousel = new Flickity('.album-covers', {
      ...baseOptions,
      on: { change: i => (albumIndex = i) },
    });
    albumInfoCarousel = new Flickity('.album-infos', {
      ...baseOptions,
      on: { change: i => (albumIndex = i) },
    });
  });

  let genreHeading: Element;
  let showGenres = false;

  onMount(() => {
    playingTrack = new Audio();

    const observer = new IntersectionObserver(e => {
      if (!showGenres) {
        showGenres = e[0].isIntersecting;
      } else {
        showGenres = e[0].isIntersecting || e[0].boundingClientRect.top < 0;
      }
    });
    observer.observe(genreHeading);

    return () => playingTrack.pause();
  });

  const inc = (x: number, total: number) => (x === total - 1 ? 0 : x + 1);
  const dec = (x: number, total: number) => (x === 0 ? total - 1 : x - 1);
</script>

<div class="flex flex-col items-center">
  <h1 class="leading-snug w-full">
    It's one thing to enjoy music. It's another to listen to <span class="keyword-pink"
      >{info.total.artists.toLocaleString()}</span
    >
    unique artists and come across <span class="keyword-pink">{info.total.albums}</span> amazing albums.
  </h1>
  <hr class="my-8 w-full" />
  <p class="leading-relaxed">
    Add <span class="keyword-pink">{info.total.genres.toLocaleString()}</span> genres into the mix, and
    that's quite the musical resumé. We're sure you want to know more, so we figured out what music characterizes
    you best.
  </p>

  <h1 class="section-head">Your top artists</h1>
  <div class="artist-covers w-full text-center">
    {#each info.top.artists as artist, i}
      <div class="cover-pane" class:opacity-30={artistIndex != i}>
        <img src={artist.coverUrl || unknownCover} alt="Cover for {artist.name}" />
        <h3 class="font-[CircularStd-Black] text-[12pt] left-1.5 relative">
          <span class="keyword-pink"> #{i + 1}</span> - {artist.name}
          {#if artist.url}
            <a href={artist.url} target="_blank" rel="noopener noreferrer"
              ><ExternalLink class="inline ml-1.5 align-baseline" size={15} /></a
            >
          {/if}
        </h3>
      </div>
    {/each}
  </div>
  <div class="carousel-controls">
    <button on:click={() => (artistIndex = dec(artistIndex, info.top.artists.length))}>
      <StepBack />
    </button>
    <button on:click={() => (artistIndex = inc(artistIndex, info.top.artists.length))}>
      <StepForward />
    </button>
  </div>
  <div class="artist-infos">
    {#each info.top.artists as artist}
      <div class="info-pane">
        <div class="flex flex-col gap-3 lg:items-start">
          <h3 class="key-stat keyword-pink">
            <span class="font-serif italic"
              >{Math.round(artist.timeListened / (1000 * 60)).toLocaleString()}</span
            > minutes.
          </h3>
          <h3 class="key-stat keyword-pink">
            {artist.plays.toLocaleString()} <span class="font-serif italic">plays.</span>
          </h3>
        </div>
        <div class="flex flex-col items-center gap-2">
          <h4 class="font-black italic font-serif">Most played song</h4>
          <div class="flex flex-col items-center gap-1">
            <img
              src={artist.topSong.coverUrl || unknownCover}
              alt="Cover for {artist.topSong.name}"
              class="w-40"
            />
            <p class="text-[9pt] w-40">{artist.topSong.name}</p>
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
        </div>
      </div>
    {/each}
  </div>

  <h1 class="section-head">Your top albums</h1>
  <div class="album-covers w-full text-center">
    {#each info.top.albums as album, i}
      <div class="cover-pane" class:opacity-30={albumIndex != i}>
        <img src={album.coverUrl || unknownCover} alt="Cover for {album.name}" />
        <h3 class="font-[CircularStd-Black] text-[12pt] left-1.5 relative">
          <span class="keyword-pink"> #{i + 1}</span> - {album.name}
          <a href={album.url} target="_blank" rel="noopener noreferrer"
            ><ExternalLink class="inline ml-1.5 align-baseline" size={15} /></a
          >
        </h3>
        <p class="text-[8pt] -mt-4 italic text-neutral-300">{album.artists.join(', ')}</p>
      </div>
    {/each}
  </div>
  <div class="carousel-controls">
    <button on:click={() => (albumIndex = dec(albumIndex, info.top.albums.length))}>
      <StepBack />
    </button>
    <button on:click={() => (albumIndex = inc(albumIndex, info.top.albums.length))}>
      <StepForward />
    </button>
  </div>
  <div class="album-infos">
    {#each info.top.albums as album}
      <div class="info-pane lg:!flex-row-reverse">
        <div class="flex flex-col gap-3 lg:items-end">
          <h3 class="key-stat keyword-pink">
            <span class="font-serif italic"
              >{Math.round(album.timeListened / (1000 * 60)).toLocaleString()}</span
            > minutes.
          </h3>
          <h3 class="key-stat keyword-pink">
            {album.plays.toLocaleString()} <span class="font-serif italic">plays.</span>
          </h3>
        </div>
        <div class="flex flex-col items-center gap-2">
          <h4 class="font-black italic font-serif">Most played song</h4>
          <div class="flex flex-col items-center gap-1">
            <img
              src={album.topSong.coverUrl || unknownCover}
              alt="Cover for {album.topSong.name}"
              class="w-40"
            />
            <p class="text-[9pt] w-40">{album.topSong.name}</p>
            <div class="flex gap-2">
              {#if album.topSong.url}
                <a href={album.topSong.url} target="_blank" rel="noopener noreferrer"
                  ><ExternalLink size={16} /></a
                >
              {/if}
              {#if album.topSong.previewLink}
                <AudioToggle size={16} src={album.topSong.previewLink} bind:playingTrack />
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <h1 class="section-head" bind:this={genreHeading}>Your top genres</h1>
  <p class="mb-4">Click each genre to learn more about your listening.</p>
  <GenreChart {info} show={showGenres} bind:playingTrack />
</div>

<style lang="postcss">
  .section-head {
    @apply my-6 font-serif italic text-center w-full overflow-hidden py-2;
  }

  .section-head:before,
  .section-head:after {
    @apply content-[""];
    @apply inline-block w-1/2 align-middle border-b-[1px];
    margin: 0 0.2em 0 -55%;
  }
  .section-head:after {
    margin: 0 -55% 0 0.5em;
  }
  .cover-pane {
    @apply mx-8 p-4 w-full lg:w-1/3;
    @apply flex flex-col justify-center items-center gap-4;
    @apply bg-black bg-opacity-70 transition-opacity duration-500;
  }
  .artist-infos,
  .album-infos {
    @apply w-full text-center bg-black bg-opacity-40 border-white border-y-4 p-5;
  }
  .info-pane {
    @apply w-full flex flex-col gap-8 lg:flex-row justify-around items-center;
  }
  .carousel-controls {
    @apply flex w-1/2 md:w-1/3 justify-around my-4;
  }
  .key-stat {
    @apply p-2 lg:p-4 bg-white lg:text-5xl;
    box-shadow: 5px 5px 0 rgb(229, 155, 190);
  }
  :global(.flickity-slider) {
    @apply flex items-center;
  }
</style>
