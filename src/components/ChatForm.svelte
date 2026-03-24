<script lang="ts">
  import Button from "./Button.svelte";

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

<form onsubmit={handleSubmit} class="flex max-w-xl gap-2 mx-auto mt-6">
  <input
    bind:this={textInputRef}
    bind:value={textInputValue}
    disabled={!isRecognising}
    type="text"
    placeholder="Type your guess or question..."
    class="w-full px-4 py-2 text-sm border rounded-lg shadow-sm bg-slate-200 border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 dark:focus:ring-indigo-500/40"
  />
  <Button type="submit" variant="primary" disabled={!isRecognising}>
    Send
  </Button>
</form>
