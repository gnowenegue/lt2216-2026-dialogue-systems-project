<script lang="ts">
  import { createGame } from "$lib/game.svelte";

  import { createBrowserInspector } from "@statelyai/inspect";

  import Answer from "$components/Answer.svelte";
  import Button from "$components/Button.svelte";
  import ChatForm from "$components/ChatForm.svelte";
  import GameStatus from "$components/GameStatus.svelte";
  import Instruction from "$components/Instruction.svelte";
  import Logo from "$components/Logo.svelte";
  import Logs from "$components/Logs.svelte";
  import MicStatus from "$components/MicStatus.svelte";
  import Rules from "$components/Rules.svelte";

  const inspector = createBrowserInspector();
  const game = createGame(inspector.inspect);

  let {
    isGameLoaded,
    isRecognising,
    showForm,
    showGameButton,
    showGameStatus,
    showInstruction,
    showLogs,
    showQuestionsRemaining,
    showRules,
    showSecretWord,
    showSkipButton,
  } = $derived(game.conditions);

  let { instructionHTML, statusText, secretWord, gameWon } = $derived(
    game.values,
  );

  // log state updates for dev convenience
  $effect(() => {
    console.group("State update");
    console.log("DM State:", $state.snapshot(game.state.value));
    console.log("DM Context:", $state.snapshot(game.state.context));
    console.groupEnd();
  });
</script>

<div class="px-4 mx-auto text-center max-w-7xl">
  <Logo />

  {#if showGameButton}
    <Button disabled={!isGameLoaded} onclick={game.actions.start}>
      {isGameLoaded ? "Start Game" : "Loading Game..."}
    </Button>
  {/if}

  {#if showRules}
    <Rules />
  {/if}

  {#if showInstruction}
    <Instruction instruction={instructionHTML} />
  {/if}

  {#if showSkipButton}
    <Button onclick={game.actions.skip}>Skip Introduction</Button>
  {/if}

  {#if showLogs}
    <Logs logs={game.state.context.logs} />
  {/if}

  <MicStatus {isRecognising} {statusText} />

  {#if showForm}
    <ChatForm {isRecognising} onSubmit={game.actions.submitText} />
  {/if}

  {#if showQuestionsRemaining}
    <h3 class="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
      Questions Remaining:
      <span class="font-extrabold text-indigo-500">
        {game.state.context.questionsRemaining}
      </span>
    </h3>
  {/if}

  <!-- {#if showSecretWord}
    <Answer {secretWord} />
  {/if} -->

  {#if gameWon !== null}
    <GameStatus {gameWon} {secretWord} onReset={game.actions.reset} />
  {/if}
</div>
