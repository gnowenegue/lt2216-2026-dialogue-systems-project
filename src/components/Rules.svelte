<script lang="ts">
  import Card from "./Card.svelte";
</script>

<Card>
  <h2 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">
    How to play
  </h2>
  <ul class="pl-5 space-y-2 list-disc list-outside">
    <li>I will think of a secret word from a category you choose.</li>
    <li>
      You can ask up to 20 <strong>Yes or No</strong> questions to guess the word.
    </li>
    <li>
      You win if you guess the word correctly before running out of questions!
    </li>
  </ul>
</Card>
