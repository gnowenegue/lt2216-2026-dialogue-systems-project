import { createActor } from "xstate";

import { dmMachine } from "./dm";
import type { DMEvents } from "./types";

export const createGame = (inspector: any) => {
  const dmActor = createActor(dmMachine, {
    inspect: inspector,
  }).start();

  // 1. Raw State (The Source of Truth)
  let snapshot = $state(dmActor.getSnapshot());

  dmActor.subscribe((newSnapshot) => {
    snapshot = newSnapshot;
  });

  // Derived internal logic for child actors (SpeechState)
  const spstRef = $derived(snapshot.context.spstRef);

  let spstSnapshot = $state(
    dmActor.getSnapshot().context.spstRef.getSnapshot(),
  );

  $effect(() => {
    const sub = spstRef.subscribe((s) => {
      spstSnapshot = s;
    });
    return () => sub.unsubscribe();
  });

  const metaValues = $derived(
    Object.values(
      (spstSnapshot?.getMeta() as Record<string, { view?: string }>) ?? {},
    ),
  );
  const metaView = $derived(metaValues[0]?.view);
  const isRecognising = $derived(metaView === "recognising");

  const statusMessages: Record<string, string> = {
    recognising: "You can speak now",
    speaking: "Hold on...",
    idle: "Off",
  };

  const conditions = $derived({
    isGameLoaded: !snapshot.matches("Prepare"),
    isRecognising,
    showForm: snapshot.matches("Game"),
    showGameButton: !(snapshot.matches("Greeting") || snapshot.matches("Game")),
    showInstruction: snapshot.matches("Greeting") || snapshot.matches("Game"),
    showLogs: snapshot.matches("Game"),
    showQuestionsRemaining: snapshot.matches("Game"),
    showRules: snapshot.matches("Greeting") || snapshot.matches("Game"),
    showGameStatus:
      snapshot.matches({ Game: "GameOver" }) ||
      snapshot.matches({ Game: "Delay" }),
    showSecretWord:
      snapshot.matches({
        Game: "GameOver",
      }) ||
      snapshot.matches({
        Game: "Delay",
      }) ||
      snapshot.matches("Done"),
    showSkipButton: snapshot.matches({
      Greeting: "Prompt",
    }),
  });

  const values = $derived({
    statusText: statusMessages[metaView ?? "idle"] || "Off",
    instructionHTML: snapshot.matches("Greeting")
      ? "Choose your category: <br /><span class='font-extrabold text-indigo-400 uppercase'>Animal, Celebrity, Country, Sports, or Random</span>"
      : snapshot.matches("Game")
        ? "Ask or type your question"
        : "",
    gameWon: snapshot.context.gameWon,
    secretWord: snapshot.context.secretWord,
  });

  const actions = {
    start: () => dmActor.send({ type: "CLICK" }),
    skip: () => {
      // dmActor.send({ type: "stopAudio" });
      dmActor.send({ type: "SPEAK_COMPLETE" });
    },
    submitText: (text: string) => {
      dmActor.send({
        type: "RECOGNISED",
        value: [{ utterance: text }],
        nluValue: null,
      } as DMEvents);

      const asrRef = spstRef.getSnapshot().context.asrRef;
      if (asrRef) {
        asrRef.send({ type: "STOP" });
      } else {
        dmActor.send({ type: "LISTEN_COMPLETE" });
      }
    },
    reset: () => dmActor.send({ type: "RESET" }),
  };

  return {
    get state() {
      return snapshot;
    },
    get conditions() {
      return conditions;
    },
    get values() {
      return values;
    },
    get actions() {
      return actions;
    },
  };
};
