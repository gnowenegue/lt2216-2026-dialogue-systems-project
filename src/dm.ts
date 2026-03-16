import { createBrowserInspector } from "@statelyai/inspect";
import type { Hypothesis } from "speechstate";
import { speechstate } from "speechstate";
import { assign, createActor, setup } from "xstate";
import { settings, sharedSynthesizer } from "./config";
import { prompts } from "./prompts";
import type { DMContext, DMEvents, NLUObject } from "./types";

const inspector = createBrowserInspector();

// const categories = ["animal", "celebrity", "country", "sports"] as const;

const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actions: {
    "spst.speak": ({ context }, params: { utterance: string }) => {
      if (!params.utterance) return;
      console.log("DM speaking:", params.utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: { utterance: params.utterance },
      });
    },
    "sdk.speak": ({ self }, params: { ssml: string }) => {
      if (!params.ssml) return;
      sharedSynthesizer.speakSsmlAsync(
        params.ssml,
        () => {
          self.send({ type: "SPEAK_COMPLETE" });
        },
        (error) => {
          console.error("Speech synthesis error:", error);
          self.send({ type: "SPEAK_COMPLETE" });
        },
      );
    },
    "spst.listen": ({ context }) =>
      context.spstRef.send({ type: "LISTEN", value: { nlu: true } }),
    "spst.recognised": assign(({ event }) => {
      const recognisedEvent = event as {
        type: "RECOGNISED";
        value: Hypothesis[];
        nluValue: NLUObject;
      };
      return {
        lastResult: recognisedEvent.value,
        interpretation: recognisedEvent.nluValue,
      };
    }),
    "spst.clearTurn": assign({ lastResult: null, interpretation: null }),
    "spst.resetSession": assign({
      lastResult: null,
      interpretation: null,
    }),
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    interpretation: null,
  }),
  id: "DM",
  initial: "Prepare",
  on: {
    RECOGNISED: { actions: "spst.recognised" },
  },
  states: {
    Prepare: {
      entry: ({ context }) => context.spstRef.send({ type: "PREPARE" }),
      on: { ASRTTS_READY: "WaitToStart" },
    },
    WaitToStart: {
      on: { CLICK: "Greeting" },
    },
    Greeting: {
      initial: "Prompt",
      entry: "spst.resetSession",
      states: {
        Prompt: {
          entry: { type: "sdk.speak", params: { ssml: prompts.greeting } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Ask: {
          entry: { type: "spst.listen" },
          on: {
            ASR_NOINPUT: { actions: "spst.clearTurn", target: "NoInput" },
            LISTEN_COMPLETE: { target: "Done" },
          },
        },
        NoInput: {
          entry: { type: "spst.speak", params: { utterance: prompts.noInput } },
          on: { SPEAK_COMPLETE: "Ask" },
        },
        Done: {
          type: "final",
        },
      },
      onDone: "Done",
    },
    Done: {
      on: { CLICK: "Greeting" },
    },
  },
});

const dmActor = createActor(dmMachine, { inspect: inspector.inspect }).start();

dmActor.subscribe((snapshot) => {
  console.group("State update");
  console.log("DM State:", snapshot.value);
  console.log("DM Context:", snapshot.context);
  console.groupEnd();
});

export function setupButton(element: HTMLButtonElement) {
  element.addEventListener("click", () => {
    dmActor.send({ type: "CLICK" });
  });
  dmActor.subscribe((snapshot) => {
    const spstSnap = snapshot.context.spstRef.getSnapshot();
    const meta: { view?: string } = Object.values(
      spstSnap.getMeta() as Record<string, any>,
    )[0] || { view: undefined };
    element.innerHTML = `${meta.view}`;
  });
}
