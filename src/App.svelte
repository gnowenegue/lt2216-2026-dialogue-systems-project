<script lang="ts">
  import { createBrowserInspector } from "@statelyai/inspect";

  import { createGame } from "$lib/game.svelte";

  import Button from "$components/Button.svelte";
  import ChatForm from "$components/ChatForm.svelte";
  import Logo from "$components/Logo.svelte";
  import MicStatus from "$components/MicStatus.svelte";
  import Rules from "$components/Rules.svelte";

  const inspector = createBrowserInspector();
  const game = createGame(inspector.inspect);

  // Still logging for convenience in dev
  $effect(() => {
    console.group("State update");
    console.log("DM State:", $state.snapshot(game.view.snapshot.value));
    console.log("DM Context:", $state.snapshot(game.view.snapshot.context));
    console.groupEnd();
  });
</script>

<div class="p-8 mx-auto text-center max-w-7xl">
  <Logo />

  <div class="p-8 pt-0">
    {#if game.view.showGameButton}
      <Button disabled={!game.view.gameLoaded} onclick={game.actions.start}>
        {game.view.gameLoaded ? "Start Game" : "Loading Game..."}
      </Button>
    {/if}

    {#if game.view.showRules}
      <Rules />
    {/if}

    {#if game.view.showSkip}
      <div class="mt-4">
        <Button onclick={game.actions.skip}>Skip Introduction</Button>
      </div>
    {/if}

    {#if game.view.showInstruction}
      <p class="mt-4 font-semibold text-slate-700 dark:text-slate-300">
        Instruction:
        <span class="text-indigo-500">
          {@html game.view.instructionHTML}
        </span>
      </p>
    {/if}

    <MicStatus
      isRecognising={game.view.isRecognising}
      statusText={game.view.statusText}
    />

    {#if game.view.showForm}
      <ChatForm
        isRecognising={game.view.isRecognising}
        onSubmit={game.actions.submitText}
      />
    {/if}

    {#if game.view.snapshot.matches("Game")}
      <h3 class="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
        Questions Remaining:
        <span class="font-extrabold text-indigo-500">
          {game.view.snapshot.context.questionsRemaining}
        </span>
      </h3>
    {/if}
  </div>
</div>
