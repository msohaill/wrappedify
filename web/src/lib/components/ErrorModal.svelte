<script lang="ts">
  import { AlertOctagon, X } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';

  export let open = false;
  export let title: string;
  export let message: string;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') open = false;
  };
</script>

{#if open}
  <div
    in:fade={{ duration: 300 }}
    out:fade={{ duration: 100 }}
    tabindex={0}
    autofocus
    class="modal"
    on:click|self={() => (open = false)}
    on:keydown={handleKeyDown}
    role="button"
  >
    <div class="modal-content" in:fly={{ duration: 500, y: 200 }}>
      <button class="absolute right-5 top-5 text-white" on:click={() => (open = false)}
        ><X /></button
      >
      <span class="flex gap-4 items-center">
        <span class="error-icon"
          ><AlertOctagon color="#c15067" absoluteStrokeWidth strokeWidth={3} size="40" /></span
        >
        <h2>{title}</h2>
      </span>
      <p class="leading-snug">{@html message}</p>
    </div>
  </div>
{/if}

<style lang="postcss">
  .modal {
    @apply w-screen h-screen fixed top-0 left-0 bg-black
    bg-opacity-70 z-50 flex justify-center items-center cursor-default;
  }

  .modal :global(*) {
    @apply max-w-[90vw] max-h-[90vh];
  }

  .modal-content {
    @apply flex flex-col w-[800px] h-[300px] p-8 relative rounded-[30px] gap-10;
    background: rgba(27, 21, 31, 0.9)
      radial-gradient(circle at top left, rgba(194, 109, 122, 0.4), transparent 50%);
  }

  .error-icon {
  }
</style>
