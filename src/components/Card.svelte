<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div
  class="p-6 m-6 mx-auto text-sm text-left border shadow-sm rounded-xl border-slate-200 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
>
  {@render children?.()}
</div>
