<script lang="ts">
  interface Props {
    isRecognising: boolean;
    onSubmit: (text: string) => void;
  }

  let { isRecognising, onSubmit }: Props = $props();

  let textInputValue = $state("");
  let textInputRef: HTMLInputElement | undefined = $state(undefined);

  $effect(() => {
    if (isRecognising && textInputRef) {
      textInputRef.focus();
    }
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const text = textInputValue.trim();
    if (text) {
      onSubmit(text);
      textInputValue = "";
    }
  };
</script>

<form onsubmit={handleSubmit} class="flex max-w-md gap-2 mx-auto mt-6">
  <input
    bind:this={textInputRef}
    bind:value={textInputValue}
    disabled={!isRecognising}
    type="text"
    placeholder="Type your guess or question..."
    class="w-full px-4 py-2 text-sm border rounded-lg shadow-sm bg-slate-50 border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder-zinc-500 dark:focus:ring-indigo-500/40"
  />
  <button
    type="submit"
    disabled={!isRecognising}
    class="px-5 py-2 text-sm font-medium text-white transition-colors duration-300 ease-in-out bg-indigo-500 rounded-lg shadow-sm hover:bg-indigo-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Send
  </button>
</form>
