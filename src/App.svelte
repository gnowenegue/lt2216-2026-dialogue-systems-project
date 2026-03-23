<script lang="ts">
  import { createGame } from "$lib/game.svelte";

  import { createBrowserInspector } from "@statelyai/inspect";

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
    showInstruction,
    showLogs,
    showQuestionsRemaining,
    showRules,
    showSkipButton,
  } = $derived(game.conditions);

  let { gameWon, instructionHTML, secretWord, statusText } = $derived(
    game.values,
  );

  let { skip, start, submitText } = $derived(game.actions);

  // log state updates
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
    <Button disabled={!isGameLoaded} onclick={start}>
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
    <Button onclick={skip}>Skip Introduction</Button>
  {/if}

  {#if showLogs}
    <Logs logs={game.state.context.logs} />
  {/if}

  <MicStatus {isRecognising} {statusText} />

  {#if showForm}
    <ChatForm {isRecognising} onSubmit={submitText} />
  {/if}

  {#if showQuestionsRemaining}
    <h3 class="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
      Questions Remaining:
      <span class="font-extrabold text-indigo-500 dark:text-indigo-400">
        {game.state.context.questionsRemaining}
      </span>
    </h3>
  {/if}

  {#if gameWon !== null}
    <GameStatus {gameWon} {secretWord} />
  {/if}
</div>
