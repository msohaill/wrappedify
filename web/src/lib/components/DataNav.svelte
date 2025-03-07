<script lang="ts">
  import { DataTab } from '$lib/types';
  import banner from '$static/banner.png';

  export let activeTab: DataTab = DataTab.TopSongs;
  export let wrappedDate: Date;

  const switchTab = (tab: DataTab) => {
    activeTab = tab;
  };
</script>

<nav>
  <div class="flex md:flex-col">
    <a href="/"><img src={banner} alt="Banner" class="px-4 w-36 md:w-auto" /></a>
    <div class="flex md:flex-col md:mt-2 gap-4 grow justify-center">
      {#each Object.values(DataTab) as tab}
        <button class="tab" class:active={tab == activeTab} on:click={() => switchTab(tab)}
          >{tab}</button
        >
      {/each}
    </div>
  </div>
  <div class="info-footer">
    <p class="md:text-[10pt] text-[8pt]">
      Wrapped up to {wrappedDate.toLocaleString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </p>
    <a
      class="text-[8pt] underline decoration-dotted underline-offset-4"
      href="https://www.google.com/search?q=how+to+clear+cookies"
      target="_blank"
      rel="noopener noreferrer"
    >
      Clear cookies to use new data
    </a>
  </div>
</nav>

<style lang="postcss">
  nav {
    @apply md:w-56 md:h-full w-full absolute md:fixed top-0 left-0 bg-black bg-opacity-30;
    @apply transition-colors hover:bg-opacity-50 duration-100;
    @apply flex md:flex-col flex-col-reverse;
  }

  .tab {
    @apply md:text-left md:px-10 md:py-2 leading-tight text-[8pt] sm:text-base px-2 grow;
    font-family: CircularStd-Black;
  }

  @media (max-width: 768px) {
    .active,
    .tab:hover {
      @apply border-white transition-all border-b-[5px] mb-[-5px];
      background-image: linear-gradient(0deg, rgba(255, 255, 255, 0.219), transparent);
    }
  }

  @media (min-width: 768px) {
    .active,
    .tab:hover {
      @apply border-l-[5px] pl-[35px];
      background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.219), transparent);
    }
  }

  .info-footer {
    @apply md:absolute bottom-0 left-0 p-2 md:mb-4 flex md:flex-col justify-between items-center w-full text-center gap-4;
  }
</style>
