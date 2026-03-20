<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    disabled?: boolean;
    onclick?: () => void;
    children?: Snippet;
  }

  let { disabled = false, onclick, children }: Props = $props();
</script>

<button
  type="button"
  {disabled}
  {onclick}
  class="rounded-lg border border-transparent bg-slate-50 px-5 py-2.5 text-base font-medium transition-colors duration-300 ease-in-out enabled:cursor-pointer enabled:hover:border-indigo-500 enabled:hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:enabled:hover:border-indigo-500 dark:enabled:hover:text-indigo-500"
>
  {@render children?.()}
</button>
