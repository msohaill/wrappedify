<script lang="ts">
  import { goto } from '$app/navigation';
  import ErrorModal from '$lib/components/ErrorModal.svelte';
  import Metadata from '$lib/components/Metadata.svelte';
  import type { ListeningRecord } from '$lib/types';
  import { steps, UploadError, errorData, aggregateListening } from './utils';

  let files: FileList;
  let fileInput: HTMLInputElement;
  let error = UploadError.None;
  let isError = false;

  const handleFileUpload = async (files: File[]) => {
    const badNames = files.filter(f => !/^StreamingHistory\d+\.json$/.test(f.name));
    if (badNames.length) {
      fileInput.value = '';
      error = UploadError.IncorrectFiles;
      isError = true;
      return;
    }

    const unorderedNames = files
      .sort()
      .map(f => f.name.slice(16, -5))
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

    const listeningData = (await Promise.all(files.map(f => f.text())))
      .map(t => JSON.parse(t))
      .reduce((p, c) => p.concat(c), [])
      .map((record: any) => ({ ...record, endTime: new Date(Date.parse(record.endTime + 'Z')) }))
      .filter(
        (record: ListeningRecord) =>
          record.endTime.getFullYear() == 2021 && record.msPlayed > 30000,
      );

    const listeningInfo = aggregateListening(listeningData);

    const uniqueArtists = Object.keys(listeningInfo).length;
    const uniqueSongs = Object.values(listeningInfo).reduce(
      (total, tracks) => total + Object.keys(tracks).length,
      0,
    );

    if (uniqueArtists < 5 || uniqueSongs < 30) {
      fileInput.value = '';
      error = UploadError.InsufficientData;
      isError = true;
      return;
    }

    console.log(JSON.stringify(listeningInfo));

    goto('/processing');
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
          <img src={step.image} alt="Graphic for step {i + 1}" class="step-image" />
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
  <button class="sample">Or, click here to try Wrappedify with sample data.</button>
</div>

<style lang="postcss">
  .step {
    @apply flex justify-between w-full sm:gap-20 gap-5 even:flex-row-reverse items-center;
  }

  .step-image {
    @apply w-1/4;
  }

  .sample {
    @apply text-[9pt] decoration-dotted underline underline-offset-8
        hover:scale-[1.01] hover:opacity-75 transition-all;
  }
</style>
