<!-- Taken from 'svelte-loading-spinners' at https://github.com/Schum123/svelte-loading-spinners/tree/master -->

<script lang="ts">
  export let color = '#FF3E00';
  export let unit = 'px';
  export let duration = '1.5s';
  export let size: string | number = '60';
  export let pause = false;
  let className: string = '';
  export { className as class };
</script>

<span
  style="--size: {size}{unit}; --color:{color}; --duration: {duration};"
  class:pause-animation={pause}
  class={className}
>
  <div></div>
  <div></div>
  <div></div>
</span>

<style>
  span {
    width: var(--size);
    height: calc(var(--size) / 4);
    position: relative;
    display: block;
  }
  div {
    width: calc(var(--size) / 4);
    height: calc(var(--size) / 4);
    position: absolute;
    left: 0%;
    top: 0;
    border-radius: 2px;
    background: var(--color);
    transform: translateX(-50%) rotate(45deg) scale(0);
    animation: diamonds var(--duration) linear infinite;
  }
  div:nth-child(1) {
    animation-delay: calc(var(--duration) * 2 / 3 * -1);
  }
  div:nth-child(2) {
    animation-delay: calc(var(--duration) * 2 / 3 * -2);
  }
  div:nth-child(3) {
    animation-delay: calc(var(--duration) * 2 / 3 * -3);
  }
  .pause-animation div {
    animation-play-state: paused;
  }

  @keyframes diamonds {
    50% {
      left: 50%;
      transform: translateX(-50%) rotate(45deg) scale(1);
    }
    100% {
      left: 100%;
      transform: translateX(-50%) rotate(45deg) scale(0);
    }
  }
</style>
