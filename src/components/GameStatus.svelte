<script lang="ts">
  interface Props {
    gameWon: boolean | null;
    secretWord: string | null;
  }

  let { gameWon, secretWord }: Props = $props();
</script>

{#if gameWon !== null}
  <div
    class="fixed inset-0 z-10 flex items-center justify-center p-4 duration-300 bg-slate-900/80 backdrop-blur-md"
  >
    <div
      class="w-full max-w-md p-8 duration-300 border shadow-2xl bg-slate-50 border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700"
    >
      <div class="text-center">
        {#if gameWon}
          <div
            class="inline-flex items-center justify-center w-20 h-20 mb-6 bg-green-100 rounded-full dark:bg-green-900/30"
          >
            <span class="text-5xl">🏆</span>
          </div>
          <h2
            class="mb-2 text-4xl font-black tracking-tight uppercase text-slate-900 dark:text-white"
          >
            Victory!
          </h2>
          <p class="mb-8 text-lg text-slate-600 dark:text-slate-400">
            Brilliant! You've unmasked the secret word!
          </p>
        {:else}
          <div
            class="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-rose-100 dark:bg-rose-900/30"
          >
            <span class="text-5xl">⌛</span>
          </div>
          <h2
            class="mb-2 text-4xl font-black tracking-tight uppercase text-slate-900 dark:text-white"
          >
            Game Over
          </h2>
          <p class="mb-8 text-lg text-slate-600 dark:text-slate-400">
            Better luck next time!
          </p>
        {/if}

        <div
          class="inline-flex flex-col items-center justify-center w-full px-6 py-8 mb-10 border-2 border-indigo-200 border-dashed rounded-lg bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-800"
        >
          <span
            class="mb-1 text-xs font-bold tracking-widest text-indigo-400 uppercase"
            >Secret Word</span
          >
          <span
            class="text-4xl font-black tracking-wider text-indigo-600 uppercase dark:text-indigo-300"
          >
            {secretWord}
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
