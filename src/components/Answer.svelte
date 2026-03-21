<script lang="ts">
  import { fade } from "svelte/transition";

  interface Props {
    secretWord: string | null;
  }

  let { secretWord }: Props = $props();
</script>

<p
  transition:fade
  class="mt-4 font-semibold transition-opacity transition-discrete text-slate-700 dark:text-slate-300"
>
  The secret word:
  <span class="font-extrabold text-indigo-500 value">
    {secretWord}
  </span>
</p>
