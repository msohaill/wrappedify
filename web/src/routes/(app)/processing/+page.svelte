<script lang="ts">
  import { goto } from '$app/navigation';
  import { PUBLIC_SERVER_ENDPOINT as serverEndpoint } from '$env/static/public';
  import DiamondLoader from '$lib/components/DiamondLoader.svelte';
  import Metadata from '$lib/components/Metadata.svelte';
  import io, { Socket } from 'socket.io-client';
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';
  import { fly } from 'svelte/transition';

  const progress = tweened(0, { easing: cubicOut });
  let socket: Socket;
  let connected = false;
  let finished = false;
  let jobId: string | null;

  onMount(() => {
    jobId = localStorage.getItem('jobId');
    socket = io(`${serverEndpoint}`, { withCredentials: true });
    socket.on('connect', () => (connected = true));

    let pollTimeout: number;

    const poll = () => {
      socket.emit('requestProgress', jobId);
      if (!finished) pollTimeout = setTimeout(poll, 2000);
    };

    poll();

    socket.on('progressUpdate', ({ total, completed }: { total: number; completed: number }) => {
      progress.update(p => Math.max((completed / total) * 100, p));
      if (completed === total) {
        finished = true;
        clearTimeout(pollTimeout);
        socket.close();
      }
    });

    socket.on('taskFailed', () => {
      clearTimeout(pollTimeout);
      socket.close();
      localStorage.removeItem('jobId');

      goto('/');
    });

    return () => {
      socket.close();
      clearTimeout(pollTimeout);
    };
  });

  const requestInfo = async () => {
    const serverResp = await fetch(`${serverEndpoint}/listening?jobId=${jobId}`, { method: 'GET' });

    if (serverResp.status != 200) {
      console.error(serverResp);
      console.error(await serverResp.json());
      return;
    }

    const { listeningInfo } = await serverResp.json();
    localStorage.setItem('wrappedifyListening', JSON.stringify(listeningInfo));

    await fetch('/api/state', {
      method: 'POST',
      body: JSON.stringify(['hasRetrievedInfo']),
    });

    goto('/your-data');
  };
</script>

<Metadata
  title="Wrappedify – Processing your data"
  description="Please wait while we analyze your listening information."
/>

<div class="flex flex-col items-center text-center justify-center h-[40vh] sm:mt-12 mt-20">
  <h1>Hang tight while we analyse your listening.</h1>
  <p class="mt-12">
    The more diverse your listening, the longer this may take. That's something to be proud of.
  </p>

  <div class="mt-24">
    {#if !connected}
      <DiamondLoader color="white" size="40" />
    {:else if !finished}
      <div class="loading-shell" in:fly={{ y: 50 }}>
        <div class="loading-bar" style="width: {$progress}%" />
      </div>
    {:else}
      <div class="flex flex-col items-center gap-4" in:fly={{ y: 50, duration: 750 }}>
        <p>Your listening is ready!</p>
        <button class="button bg-[#392b40]" on:click={requestInfo}>Let's take a look</button>
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .loading-shell {
    @apply w-[80vw] sm:w-[60vw] h-1 rounded-md flex;
    background: rgba(57, 43, 64, 0.3);
  }
  .loading-bar {
    @apply bg-white h-1;
  }
</style>
