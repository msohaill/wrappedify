<script lang="ts">
  import { AudioLines, PlayCircle } from 'lucide-svelte';

  export let size: number;
  export let src: string;
  export let playingTrack: HTMLAudioElement;

  $: isPlaying = playingTrack && playingTrack.src === src && !playingTrack.paused;

  const toggleTrack = (url: string) => {
    if (playingTrack.src != url) {
      playingTrack.src = url;
      playingTrack.volume = 0.15;
      playingTrack.play();
      playingTrack.onended = () => (playingTrack = playingTrack);
      playingTrack.onpause = () => (playingTrack = playingTrack);
      playingTrack.onplay = () => (playingTrack = playingTrack);
    } else {
      playingTrack.paused ? playingTrack.play() : playingTrack.pause();
    }
    playingTrack = playingTrack;
  };
</script>

<button on:click={() => toggleTrack(src)}>
  {#if isPlaying}
    <AudioLines {size} class="animate-pulse" />
  {:else}
    <PlayCircle {size} />
  {/if}
</button>
