<script lang="ts">
  interface Props {
    isRecognising: boolean;
    statusText: string;
  }

  let { isRecognising, statusText }: Props = $props();
</script>

<p
  class="mt-4 font-semibold transition-opacity text-slate-700 dark:text-slate-300"
>
  Mic Status:
  <span
    class="italic transition-colors duration-300 ease-in-out value {isRecognising
      ? 'text-green-500'
      : 'text-red-500'}"
  >
    {statusText}
  </span>
</p>
