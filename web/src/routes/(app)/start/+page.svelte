<script lang="ts">
  import { goto } from '$app/navigation';
  import ErrorModal from '$lib/components/ErrorModal.svelte';
  import Metadata from '$lib/components/Metadata.svelte';
  import type { ListeningRecord } from '$lib/types';
  import sampleData from '$static/sample-data.json';
  import { UploadError, aggregateListening, errorData, steps } from './utils';
  import { PUBLIC_SERVER_ENDPOINT as serverEndpoint } from '$env/static/public';
  import DiamondLoader from '$lib/components/DiamondLoader.svelte';
  import { fade } from 'svelte/transition';
  import _ from 'lodash';

  let files: FileList;
  let fileInput: HTMLInputElement;
  let error = UploadError.None;
  let isError = false;
  let loading = false;

  const handleFileUpload = async (files: File[]) => {
    const badNames = files.filter(f => !/^StreamingHistory_music_\d+\.json$/.test(f.name));
    if (badNames.length) {
      fileInput.value = '';
      error = UploadError.IncorrectFiles;
      isError = true;
      return;
    }

    const unorderedNames = files
      .map(f => f.name.slice(23, -5))
      .sort()
      .filter((n, i) => i.toString() != n);
    if (unorderedNames.length) {
      fileInput.value = '';
      error = UploadError.IncompleteFiles;
      isError = true;
      return;
    }

    const totalMb = files.map(f => f.size / (1024 * 1024)).reduce((s, c) => s + c, 0);
    if (totalMb > 16) {
      fileInput.value = '';
      error = UploadError.TooLarge;
      isError = true;
      return;
    }

    let rawData: ListeningRecord[] = (await Promise.all(files.map(f => f.text())))
      .map(t => JSON.parse(t))
      .reduce((p, c) => p.concat(c), [])
      .map((record: any) => ({ ...record, endTime: new Date(record.endTime + 'Z') }));

    const year = parseInt(
      _.maxBy(
        _.entries(_.countBy(rawData, (record: ListeningRecord) => record.endTime.getFullYear())),
        e => e[1],
      )![0],
    );
    rawData = rawData.filter(
      (record: ListeningRecord) => record.endTime.getFullYear() == year && record.msPlayed > 30000,
    );

    const listeningData = aggregateListening(rawData);

    const uniqueArtists = Object.keys(listeningData).length;
    const uniqueSongs = Object.values(listeningData).reduce(
      (total, tracks) => total + Object.keys(tracks).length,
      0,
    );

    if (uniqueArtists < 5 || uniqueSongs < 30) {
      fileInput.value = '';
      error = UploadError.InsufficientData;
      isError = true;
      return;
    }

    loading = true;
    const serverResp = await fetch(`${serverEndpoint}/listening`, {
      method: 'POST',
      body: JSON.stringify({ listeningData }),
      headers: { 'Content-Type': 'application/json' },
    });
    loading = false;

    if (serverResp.status != 200) {
      fileInput.value = '';
      error = UploadError.Unknown;
      isError = true;
      return;
    }

    const cookieResp = await fetch('/api/state', {
      method: 'POST',
      body: JSON.stringify(['hasUploaded']),
    });

    if (cookieResp.status != 200) {
      fileInput.value = '';
      error = UploadError.Unknown;
      isError = true;
      return;
    }

    const { jobId } = await serverResp.json();
    localStorage.setItem('jobId', jobId);

    goto('/processing');
  };

  const triggerSample = async () => {
    const resp = await fetch('/api/state', {
      method: 'POST',
      body: JSON.stringify(['hasUploaded', 'hasRetrievedInfo']),
    });

    if (resp.status != 200) {
      fileInput.value = '';
      error = UploadError.Unknown;
      isError = true;
      return;
    }

    localStorage.setItem('wrappedifyListening', JSON.stringify(sampleData));

    goto('/your-data');
  };

  $: if (files) handleFileUpload(Array.from(files));
</script>

<Metadata
  title="Wrappedify – Get started"
  description="Get started with Wrappedify by requesting your Spotify listening information."
/>
<ErrorModal bind:open={isError} title={errorData[error].title} message={errorData[error].message} />

<div class="flex flex-col items-center lg:px-20 gap-28">
  <h1 class="pb-12 border-b-2 border-white">Let's get started.</h1>
  <div class="flex flex-col items-center gap-20">
    {#each steps as step, i}
      <div class="step">
        <div class="flex flex-col items-start gap-3 flex-grow">
          <h2>Step {i + 1}.</h2>
          <p class="leading-snug">{@html step.desc}</p>
        </div>
        {#if step.image}
          <div class="image-container">
            <div
              class="w-[10vw] h-[10vw] {step
                .colours[0]} absolute top-[0vw] left-[-2vw] -z-50 rounded-full"
            ></div>
            <img src={step.image} alt="Graphic for step {i + 1}" class="step-image" />
            <div
              class="w-[10vw] h-[10vw] {step
                .colours[1]} absolute bottom-[-1vw] right-[-1vw] -z-50 rounded-full"
            ></div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
  <input
    type="file"
    id="file-upload"
    accept="application/json"
    multiple
    hidden
    bind:files
    bind:this={fileInput}
  />
  <label class="button bg-[rgb(35,47,110)] mb-[-80px] cursor-pointer" for="file-upload"
    >Select files</label
  >
  <button class="sample" on:click={triggerSample}
    >Or, click here to try Wrappedify with sample data.</button
  >
  {#if loading}
    <div
      class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[60] flex flex-col items-center justify-center gap-4"
    >
      <p class="text-[9pt]" in:fade={{ delay: 2000 }}>
        <em>Please wait while our servers spring to life!</em>
      </p>
      <DiamondLoader color="white" size="42" />
    </div>
  {/if}
</div>

<style lang="postcss">
  .step {
    @apply flex justify-between w-full sm:gap-20 gap-5 even:flex-row-reverse items-center;
  }

  .image-container {
    @apply w-[20vw] shrink-0 relative;
  }

  .white {
    @apply bg-[#ffffff];
  }

  .blue {
    @apply bg-[#18205f];
  }

  .purple {
    @apply bg-[#2b2031];
  }

  .step-image {
    @apply rounded-full border-white border-2;
  }

  .sample {
    @apply text-[9pt] decoration-dotted underline underline-offset-8
        hover:scale-[1.01] hover:opacity-75 transition-all;
  }
</style>
