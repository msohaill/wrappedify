<script lang="ts">
  import { Github } from 'lucide-svelte';
</script>

<footer class="layout mt-10 relative pb-4">
  <div class="flex flex-row justify-center items-center">
    <a class="link" href="https://github.com/msohaill/wrappedify"><Github size={20} /></a>
  </div>
  <p class="absolute right-3 bottom-2 text-xs text-neutral-200">
    &copy; {new Date().getFullYear()}
  </p>
</footer>
