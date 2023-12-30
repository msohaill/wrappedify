<script lang="ts">
  import { Github, Library } from 'lucide-svelte';
</script>

<footer class="layout mt-10 relative pb-4">
  <div class="social-links">
    <a class="link" href="https://github.com/msohaill/wrappedify"><Github /></a>
    <a class="link" href="/about"><Library /></a>
  </div>
  <p class="absolute right-3 bottom-2 text-xs text-neutral-200">
    &copy; {new Date().getFullYear()}
  </p>
</footer>

<style lang="postcss">
  .social-links {
    @apply space-x-6 flex flex-row justify-center items-center;
  }
</style>
