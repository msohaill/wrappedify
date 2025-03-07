<script lang="ts">
  import {
    PUBLIC_CLIENT_ID as clientID,
    PUBLIC_REDIRECT_URL as redirectURL,
  } from '$env/static/public';
  import playlistCover from '$static/playlistcover.jpg?base64';
  import type { ListeningInformation } from '$lib/types';
  import unknownCover from '$static/no-cover.png';
  import { ExternalLink } from 'lucide-svelte';
  import { Scopes, SpotifyApi } from '@spotify/web-api-ts-sdk';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import AudioToggle from './AudioToggle.svelte';

  export let info: ListeningInformation;

  const first = info.top.tracks[Math.floor(Math.random() * info.top.tracks.length)];
  const second = info.top.tracks[Math.floor(Math.random() * info.top.tracks.length)];
  let playingTrack: HTMLAudioElement;

  onMount(() => {
    playingTrack = new Audio();
    return () => playingTrack.pause();
  });

  const client = SpotifyApi.withUserAuthorization(clientID, redirectURL, Scopes.playlistModify);
  const addPlaylist = async () => {
    const userId = (await client.currentUser.profile()).id;
    const playlist = await client.playlists.createPlaylist(userId, {
      name: 'Your Top Songs of the Year',
      description: `Your top songs for ${info.wrappedDate.getFullYear()}, courtesy of Wrappedify.`,
    });

    await client.playlists.addItemsToPlaylist(
      playlist.id,
      info.top.tracks.filter(t => t.trackUri).map(t => t.trackUri as string),
    );
    await client.playlists.addCustomPlaylistCoverImageFromBase64String(playlist.id, playlistCover);
  };

  if ($page.url.searchParams.has('code')) {
    addPlaylist();
  }
</script>

<div class="flex flex-col items-center">
  <h1 class="leading-snug w-full">
    When you listen to over <span class="keyword-green"
      >{Math.round(info.total.time / (1000 * 60 * 60)).toLocaleString()}</span
    > hours of music, it can be hard to keep track of your favourites.
  </h1>
  <hr class="my-8 w-full" />
  <p class="leading-relaxed">
    You've spent <span class="keyword-green"
      >{Math.round(info.total.time / (1000 * 60)).toLocaleString()}</span
    >
    minutes tuned in this year, and with each, you've found lots to love. From
    <span class="keyword-green">{first.name}</span>
    by <span class="keyword-green">{first.artists.join(', ')}</span> to
    <span class="keyword-green">{second.name}</span>
    by <span class="keyword-green">{second.artists.join(', ')}</span>, you listen like no one else.
    You've jammed to <span class="keyword-green">{info.total.tracks.toLocaleString()}</span> songs this
    year, so we went ahead and created a playlist of your personal favourites.
  </p>

  <div class="highlights">
    {#each info.top.tracks.slice(0, 5) as track, i}
      <div class="highlighted-track">
        <img src={track.coverUrl || unknownCover} alt="Cover for {track.name}" class="mb-4" />
        <h3>{track.name}</h3>
        <p class="text-neutral-300 text-[9pt]">{track.artists.join(', ')}</p>
        <p class="my-4">
          <span class="keyword-green">#{i + 1}</span> - {track.plays.toLocaleString()} plays
        </p>
        <div class="flex gap-2">
          {#if track.url}
            <a href={track.url} target="_blank" rel="noopener noreferrer"
              ><ExternalLink size={16} /></a
            >
          {/if}
          {#if track.previewLink}
            <AudioToggle size={16} src={track.previewLink} bind:playingTrack />
          {/if}
        </div>
      </div>
    {/each}
  </div>
  <button class="button bg-[#9adba8] text-[#392b40] mt-16" on:click={addPlaylist}
    >Add playlist to library</button
  >
  <table class="w-full mt-16">
    <thead>
      <tr>
        <th class="w-[10%] table-head">Rank.</th>
        <th class="w-[80%] table-head">Track.</th>
        <th class="w-[10%] table-head">Plays.</th>
      </tr>
    </thead>
    <tbody>
      {#each info.top.tracks.slice(5) as track, i}
        <tr class="top-track-row">
          <td class="text-center sm:text-left">#{i + 6}</td>
          <td class="flex gap-4 items-center">
            <img src={track.coverUrl || unknownCover} alt="Cover for {track.name}" class="w-16" />
            <div>
              <h4 class="text-[10pt] sm:text-base">{track.name}</h4>
              <p class="text-neutral-300 text-[9pt]">{track.artists}</p>
              <div class="flex gap-2 mt-2">
                {#if track.url}
                  <a href={track.url} target="_blank" rel="noopener noreferrer"
                    ><ExternalLink size={16} /></a
                  >
                {/if}
                {#if track.previewLink}
                  <AudioToggle size={16} src={track.previewLink} bind:playingTrack />
                {/if}
              </div>
            </div>
          </td>
          <td>{track.plays.toLocaleString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="postcss">
  .highlights {
    @apply flex flex-wrap mt-10 w-full justify-center gap-3 sm:gap-8 text-center;
  }

  .highlighted-track {
    @apply bg-black bg-opacity-30 p-2.5 pb-5 sm:p-5 flex flex-col items-center w-40 sm:w-[10.5rem];
    @apply transition-colors hover:bg-opacity-50;
  }

  .table-head {
    @apply text-left border-b-2 border-white p-2;
    background: linear-gradient(0deg, rgba(255, 255, 255, 0.1), transparent);
    font-family: CircularStd-Bold;
  }

  .top-track-row {
    @apply bg-black even:bg-opacity-30 odd:bg-opacity-50;
    @apply transition-colors even:hover:bg-opacity-40 odd:hover:bg-opacity-60;
  }

  .top-track-row > td {
    @apply sm:p-5 p-2;
  }
</style>
