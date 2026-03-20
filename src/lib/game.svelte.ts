import { createActor } from "xstate";

import { dmMachine } from "./dm";
import type { DMEvents } from "./types";

export const createGame = (inspector: any) => {
  const dmActor = createActor(dmMachine, {
    inspect: inspector,
  }).start();

  // Create a reactive state for the machine snapshot
  let snapshot = $state(dmActor.getSnapshot());

  dmActor.subscribe((newSnapshot) => {
    snapshot = newSnapshot;
  });

  // Derived internal logic for child actors (SpeechState)
  const spstRef = $derived(snapshot.context.spstRef);

  // We use a separate state to track the child actor's snapshot reactively
  let spstSnapshot = $state(
    dmActor.getSnapshot().context.spstRef.getSnapshot(),
  );

  $effect(() => {
    // When spstRef changes (e.g., machine restart), resubscribe
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

  // The "ViewModel" - purely derived state for the UI
  const view = $derived({
    snapshot, // Expose for .matches() and .context
    isRecognising,
    statusText: statusMessages[metaView ?? "idle"] || "Off",
    gameLoaded: !snapshot.matches("Prepare"),
    showGameButton:
      !snapshot.matches("Prepare") &&
      (snapshot.matches("WaitToStart") || snapshot.matches("Done")),
    showRules: snapshot.matches("Greeting") || snapshot.matches("Game"),
    showSkip: snapshot.matches({ Greeting: "Prompt" }),
    showForm: snapshot.matches("Game"),
    showInstruction: snapshot.matches("Greeting") || snapshot.matches("Game"),
    instructionHTML: snapshot.matches("Greeting")
      ? "Choose your category: <br /><span class='font-extrabold text-indigo-400 uppercase'>Animal, Celebrity, Country, Sports, or Random</span>"
      : snapshot.matches("Game")
        ? "Ask or type your question"
        : "",
  });

  // Encapsulated Actions
  const actions = {
    start: () => dmActor.send({ type: "CLICK" }),
    skip: () => dmActor.send({ type: "SPEAK_COMPLETE" }),
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
  };

  return {
    // We return getters to ensure reactivity works across file boundaries in Svelte 5
    get view() {
      return view;
    },
    get actions() {
      return actions;
    },
  };
};
