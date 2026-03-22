<script lang="ts">
  import Card from "./Card.svelte";

  interface Props {
    logs: string[];
  }

  let { logs }: Props = $props();
  let scrollContainer: HTMLDivElement | undefined = $state();

  // get tailwind classes based on log content
  const getLogClass = (log: string) => {
    if (log.startsWith("Davis: Yes"))
      return "text-emerald-600 dark:text-emerald-400 font-bold";
    if (log.startsWith("Davis: "))
      return "text-rose-600 dark:text-rose-400 font-bold";
    return "text-indigo-700 dark:text-indigo-300";
  };

  // auto-scroll to bottom when new logs arrive
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
    class="flex flex-col gap-1 overflow-y-auto font-normal max-h-30 scroll-smooth"
  >
    {#each logs as log}
      <p class={getLogClass(log)}>
        {log}
      </p>
    {/each}
  </div>
</Card>
