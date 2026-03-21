<script lang="ts">
  import Card from "./Card.svelte";

  interface Props {
    logs: string[];
  }

  let { logs }: Props = $props();
  let scrollContainer: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (scrollContainer && logs.length > 0) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });
</script>

<Card>
  <h2 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">Logs</h2>
  <div
    bind:this={scrollContainer}
    class="flex flex-col gap-1 overflow-y-auto font-normal text-indigo-700 max-h-30 dark:text-indigo-300 scroll-smooth"
  >
    {#each logs as log}
      <p>{log}</p>
    {/each}
  </div>
</Card>
