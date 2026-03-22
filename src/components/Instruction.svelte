<script lang="ts">
  import Card from "./Card.svelte";

  interface Props {
    instruction: string;
  }

  let { instruction }: Props = $props();
</script>

<Card>
  <h2 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">
    Instructions
  </h2>
  <p class="font-semibold text-indigo-700 dark:text-indigo-300">
    {@html instruction}
  </p>
</Card>
