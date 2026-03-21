<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "outline";
    disabled?: boolean;
    onclick?: () => void;
    children?: Snippet;
  }

  let {
    type = "button",
    variant = "outline",
    disabled = false,
    onclick,
    children,
  }: Props = $props();

  const baseClasses =
    "rounded-lg px-5 py-2.5 text-sm font-medium transition-colors duration-300 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
  const primaryClasses = "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600";
  const outlineClasses =
    "border border-transparent bg-slate-50 text-base enabled:cursor-pointer enabled:hover:border-indigo-500 enabled:hover:text-indigo-500 dark:bg-slate-900 dark:enabled:hover:border-indigo-500 dark:enabled:hover:text-indigo-500";
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="{baseClasses} {variant === 'primary' ? primaryClasses : outlineClasses}"
>
  {@render children?.()}
</button>
