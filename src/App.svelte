<script lang="ts">
  import { useMachine } from "@xstate/svelte";
  import { createBrowserInspector } from "@statelyai/inspect";
  import { dmMachine } from "./dm";
  import type { DMEvents } from "./types";

  const inspector = createBrowserInspector();
  const { snapshot, send, actorRef: dmActor } = useMachine(dmMachine, {
    inspect: inspector.inspect,
  });

  const spstRef = dmActor.getSnapshot().context.spstRef;

  let gameLoaded = $state(false);
  let textInputValue = $state("");
  let textInputRef: HTMLInputElement | undefined = $state(undefined);

  let metaValues = $derived(
    Object.values($spstRef.getMeta() as Record<string, { view?: string }>),
  );
  let metaView = $derived(metaValues[0]?.view);

  let isRecognising = $derived(metaView === "recognising");

  let statusMessages: Record<string, string> = {
    recognising: "You can speak now",
    speaking: "Hold on...",
    idle: "Off",
  };

  $effect(() => {
    if (!gameLoaded && metaView === "idle") {
      gameLoaded = true;
    }
  });

  $effect(() => {
    if (isRecognising && textInputRef) {
      textInputRef.focus();
    }
  });

  function handleStartGame() {
    send({ type: "CLICK" });
  }

  function handleSkip() {
    send({ type: "SPEAK_COMPLETE" });
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const text = textInputValue.trim();
    if (text) {
      send({
        type: "RECOGNISED",
        value: [{ utterance: text }],
        nluValue: null,
      } as DMEvents);

      const spstRef = $snapshot.context.spstRef;
      const asrRef = spstRef.getSnapshot().context.asrRef;
      if (asrRef) {
        asrRef.send({ type: "STOP" });
      } else {
        send({ type: "LISTEN_COMPLETE" });
      }

      textInputValue = "";
    }
  }

  let showGameButton = $derived(
    !gameLoaded || $snapshot.matches("Done") || $snapshot.matches("WaitToStart"),
  );
  let showRules = $derived(
    $snapshot.matches("Greeting") || $snapshot.matches("Game"),
  );
  let showSkip = $derived($snapshot.matches({ Greeting: "Prompt" }));
  let showForm = $derived($snapshot.matches("Game"));
  let showInstruction = $derived(
    $snapshot.matches("Greeting") || $snapshot.matches("Game"),
  );

  let instructionText = $derived(
    $snapshot.matches("Greeting")
      ? "Say your category: Animal, Celebrity, Country, Sports, or Random"
      : $snapshot.matches("Game")
        ? "Ask or type your question"
        : "",
  );
</script>

<div class="p-8 mx-auto text-center max-w-7xl">
  <!-- Logo Section -->
  <div class="relative flex items-center justify-center mx-auto w-max">
    <svg width="0" height="0" class="absolute pointer-events-none">
      <filter id="svg-outline">
        <feMorphology
          in="SourceAlpha"
          result="expanded"
          operator="dilate"
          radius="5"
        />
        <feFlood flood-color="white" />
        <feComposite in2="expanded" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
    <img
      src="/logo.svg"
      alt="Game Logo"
      class="relative transition-transform duration-500 ease-in-out w-96 h-96 hover:scale-105"
      style="filter: url(#svg-outline) drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3));"
    />
  </div>

  <div>
    <div class="p-8 pt-0">
      <div>
        {#if showGameButton}
          <button
            type="button"
            disabled={!gameLoaded}
            onclick={handleStartGame}
            class="rounded-lg border border-transparent bg-slate-50 px-5 py-2.5 text-base font-medium transition-colors duration-300 ease-in-out enabled:cursor-pointer enabled:hover:border-indigo-500 enabled:hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:enabled:hover:border-indigo-500 dark:enabled:hover:text-indigo-500"
          >
            {gameLoaded ? "Start Game" : "Loading Game..."}
          </button>
        {/if}
      </div>

      {#if showRules}
        <div
          class="max-w-md p-6 m-6 mx-auto mt-8 text-sm text-left border shadow-sm rounded-xl border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-slate-300"
        >
          <h2 class="mb-3 text-xl font-bold text-slate-900 dark:text-white">
            How to play:
          </h2>
          <ul class="pl-5 space-y-2 list-disc list-outside">
            <li>I will think of a secret word from a category you choose.</li>
            <li>
              You can ask up to 20 <strong>Yes or No</strong> questions to guess
              the word.
            </li>
            <li>
              You win if you guess the word correctly before running out of
              questions!
            </li>
          </ul>
        </div>
      {/if}

      {#if showSkip}
        <div>
          <button
            type="button"
            onclick={handleSkip}
            class="rounded-lg border border-transparent bg-slate-50 px-5 py-2.5 text-base font-medium transition-colors duration-300 ease-in-out enabled:cursor-pointer enabled:hover:border-indigo-500 enabled:hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:enabled:hover:border-indigo-500 dark:enabled:hover:text-indigo-500"
          >
            Skip Introduction
          </button>
        </div>
      {/if}

      {#if showInstruction}
        <p
          class="mt-4 font-semibold transition-opacity text-slate-700 dark:text-slate-300"
        >
          Instruction:
          <span
            class="text-indigo-500 transition-colors duration-300 ease-in-out value"
          >
            {instructionText}
          </span>
        </p>
      {/if}

      <p
        class="mt-4 font-semibold transition-opacity text-slate-700 dark:text-slate-300"
      >
        Mic Status:
        <span
          class="italic transition-colors duration-300 ease-in-out value {isRecognising
            ? 'text-green-500'
            : 'text-red-500'}"
        >
          {statusMessages[metaView ?? "idle"] || "Off"}
        </span>
      </p>

      {#if showForm}
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
      {/if}

      {#if $snapshot.matches("Game")}
        <h3
          class="mt-4 text-lg font-semibold transition-opacity text-slate-700 dark:text-slate-300"
        >
          Questions Remaining:
          <span class="font-extrabold text-indigo-500 value">
            {$snapshot.context.questionsRemaining}
          </span>
        </h3>
      {/if}
    </div>
  </div>
</div>