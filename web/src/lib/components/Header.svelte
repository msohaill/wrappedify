<script lang="ts">
  import banner from '$static/banner.png';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let scrolled = false;

  const styleBanner = () => {
    scrolled = window.scrollY > 50;
  };

  onMount(() => {
    styleBanner();
    window.addEventListener('scroll', styleBanner);
    return () => window.removeEventListener('scroll', styleBanner);
  });
</script>

<header class="banner z-40 {scrolled ? 'darken' : ''}" data-sveltekit-noscroll>
  <button
    class="logo"
    on:click={() => ($page.url.pathname === '/' ? document.body.scrollIntoView() : goto('/'))}
  >
    <img src={banner} alt="Banner" class="logo" />
  </button>
</header>

<style lang="postcss">
  .banner {
    @apply flex justify-center items-center mb-6 h-16 hover:bg-black hover:bg-opacity-75
    transition-colors pointer-events-none fixed top-0 left-0 w-full duration-300 sm:h-[100px];
  }

  .logo {
    @apply h-full pointer-events-auto;
  }

  .darken {
    @apply bg-black bg-opacity-75;
  }
</style>
