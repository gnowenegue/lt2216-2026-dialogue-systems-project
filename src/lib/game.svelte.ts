import { createActor } from "xstate";

import { dmMachine } from "./dm";
import type { DMEvents } from "./types";

export const createGame = (inspector: any) => {
  const dmActor = createActor(dmMachine, {
    inspect: inspector,
  }).start();

  // raw state (the source of truth)
  let snapshot = $state(dmActor.getSnapshot());

  dmActor.subscribe((newSnapshot) => {
    snapshot = newSnapshot;
  });

  // derived internal logic for child actors
  const speechstateRef = $derived(snapshot.context.speechstateRef);

  let speechstateSnapshot = $state(
    dmActor.getSnapshot().context.speechstateRef.getSnapshot(),
  );

  $effect(() => {
    const sub = speechstateRef.subscribe((s) => {
      speechstateSnapshot = s;
    });
    return () => sub.unsubscribe();
  });

  const metaValues = $derived(
    Object.values(
      (speechstateSnapshot?.getMeta() as Record<string, { view?: string }>) ?? {},
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
      // simulate SPEAK_COMPLETE immediately
      dmActor.send({ type: "SPEAK_COMPLETE" });
    },
    submitText: (text: string) => {
      dmActor.send({
        type: "RECOGNISED",
        value: [{ utterance: text }],
        nluValue: null,
      } as DMEvents);

      const asrRef = speechstateRef.getSnapshot().context.asrRef;
      if (asrRef) {
        asrRef.send({ type: "STOP" });
      } else {
        dmActor.send({ type: "LISTEN_COMPLETE" });
      }
    },
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
