<script lang="ts">
  import type { ListeningInformation } from '$lib/types';
  import { scaleLinear } from 'd3-scale';
  import { curveMonotoneX, line } from 'd3-shape';

  export let info: ListeningInformation;

  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let graphWidth: number = 0;
  let innerWidth: number = 0;
  $: ratio = innerWidth > 1280 ? 0.85 : innerWidth > 1024 ? 0.9 : 1;
  $: height = innerWidth > 768 ? 300 : 200;

  let tzOffset = Math.floor(new Date().getTimezoneOffset() / 60);
  let adjustedActivity = Array(24)
    .fill(0)
    .map((_, i) => info.activity.byHour[(i + tzOffset) % 24]);

  $: xScaleHour = scaleLinear([0, 23], [15, ratio * (graphWidth - 15)]);
  $: yScaleHour = scaleLinear([0, Math.max(...info.activity.byHour)], [height - 20, 20]);
  $: hourLine = line()
    .curve(curveMonotoneX)
    .x(d => xScaleHour(d[0]))
    .y(d => yScaleHour(d[1]));

  $: xScaleMonth = scaleLinear([0, 11], [15, ratio * (graphWidth - 15)]);
  $: yScaleMonth = scaleLinear([0, Math.max(...info.activity.byMonth) + 20], [height - 20, 20]);
  $: monthLine = line()
    .curve(curveMonotoneX)
    .x(d => xScaleMonth(d[0]))
    .y(d => yScaleMonth(d[1]));

  const maxHour = adjustedActivity.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
  const maxMonth = info.activity.byMonth.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
</script>

<svelte:window bind:innerWidth />

<div class="flex flex-col items-center">
  <h1 class="leading-snug w-full">
    Your listening by the <span class="keyword-lime">hour</span> and
    <span class="keyword-lime">month</span>.
  </h1>
  <hr class="my-3 w-full" />
  <p class="leading-snug w-full">
    Sure, Spotify Wrappedy has funky graphics and an interface that allows you to easily share your
    listening. But, do they have cool graphs that show you how you've listened?
  </p>
  <p class="w-full mt-3">We didn't think so either.</p>
  <div class="mt-6 w-full flex flex-col items-center" bind:clientWidth={graphWidth}>
    <p class="tracking-widest text-sm font-serif italic font-bold">Your listening by the hour.</p>
    <svg class="lg:w-[85%] xl:[90%] w-full md:h-[300px] h-[200px] mt-6">
      <g>
        {#each xScaleHour.ticks(innerWidth > 1024 ? 24 : 12) as tick}
          <line
            class="stroke-white stroke-[0.5px]"
            x1={xScaleHour(tick)}
            x2={xScaleHour(tick)}
            y1={0}
            y2={height - 20}
          />
          <text
            class="fill-white text-[6pt] xl:text-[8pt] font-[CircularStd-Bold]"
            text-anchor="middle"
            x={xScaleHour(tick)}
            y={height}
          >
            {tick % 12 == 0 ? 12 : tick % 12}{tick < 12 ? 'AM' : 'PM'}
          </text>
        {/each}
      </g>
      <path
        class="stroke-[#d5f479] stroke-[1.5px] fill-none"
        d={hourLine(adjustedActivity.entries())}
      />
    </svg>
    <p class="text-[28pt] lg:text-[50pt] keyword-lime mt-12">
      {maxHour % 12 == 0 ? 12 : maxHour % 12}:00<span
        class="lg:text-[30pt] text-[17pt] italic font-serif font-bold"
        >{maxHour < 12 ? 'am' : 'pm'}</span
      >
    </p>
    <p class="graph-small -mt-2">
      Most Active Hour ({Intl.DateTimeFormat().resolvedOptions().timeZone})
    </p>
  </div>
  <div class="mt-12 w-full flex flex-col items-center" bind:clientWidth={graphWidth}>
    <p class="tracking-widest text-sm font-serif italic font-bold">
      Your listening for {info.wrappedDate.getFullYear()}.
    </p>
    <svg class="lg:w-[85%] xl:[90%] w-full md:h-[305px] h-[205px] mt-6">
      <g>
        {#each xScaleMonth.ticks(12) as tick}
          <line
            class="stroke-white stroke-[0.5px]"
            x1={xScaleMonth(tick)}
            x2={xScaleMonth(tick)}
            y1={0}
            y2={height - 20}
          />
          <text
            class="fill-white text-[6pt] xl:text-[8pt] font-[CircularStd-Bold]"
            text-anchor="middle"
            x={xScaleMonth(tick)}
            y={height}
          >
            {MONTHS[tick].slice(0, 3)}
          </text>
        {/each}
      </g>
      <path
        class="stroke-[#d5f479] stroke-[1.5px] fill-none"
        d={monthLine(info.activity.byMonth.entries())}
      />
    </svg>
    <div class="flex mt-12 items-center justify-center w-full text-center">
      <div class="flex-1 border-r-[1px] border-white">
        <p
          class="lg:text-[30pt] sm:text-[18pt] text-[14pt] keyword-lime font-serif italic font-bold"
        >
          {MONTHS[maxMonth]}
        </p>
        <p class="graph-small">was your most active month</p>
      </div>
      <div class="flex-1">
        <p class="lg:text-[30pt] sm:text-[18pt] text-[14pt] keyword-lime">
          {Math.round(info.activity.byMonth[maxMonth] / (1000 * 60 * 60)).toLocaleString()}
          <span class="font-[CircularStd-Black] not-italic">hours</span>
        </p>
        <p class="graph-small font-serif italic">of music streamed in {MONTHS[maxMonth]}</p>
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .graph-small {
    @apply text-[8pt] md:text-[10pt] text-[#d5f479];
  }
</style>
