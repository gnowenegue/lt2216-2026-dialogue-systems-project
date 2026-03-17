import { createBrowserInspector } from "@statelyai/inspect";
import type { Hypothesis } from "speechstate";
import { speechstate } from "speechstate";
import { assign, createActor, setup, fromPromise } from "xstate";
import { settings, speechSynthesizer, player } from "./config";
import { prompts } from "./prompts";
import type { DMContext, DMEvents, NLUObject } from "./types";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// const inspector = createBrowserInspector();
const inspector = createBrowserInspector({
  filter: (inspectEvent: any) => {
    if (
      inspectEvent.type === "@xstate.event" &&
      !inspectEvent.event?.type.includes("xstate")
    ) {
      console.log("🖥️ [DM] Event:", inspectEvent.event);
    }
    return true;
  },
});

const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actors: {
    speakSSML: fromPromise(async ({ input }: { input: { ssml: string } }) => {
      return new Promise<void>((resolve, reject) => {
        speechSynthesizer.speakSsmlAsync(
          input.ssml,
          (result) => {
            if (result.reason === sdk.ResultReason.Canceled) {
              console.error("⚠️ Speech Synthesis canceled.");
              console.error("⚠️ Speech Error Details:", result.errorDetails);
              reject(new Error("Synthesis canceled"));
            } else {
              resolve();
            }
          },
          (error) => {
            console.error("⚠️ Speech synthesis error:", error);
            reject(error);
          },
        );
      });
    }),
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
    "ssml.stop": () => {
      player.pause();

      try {
        const audioNode = (player as any).internalAudio;
        // Ensure the node exists and the duration is a valid, finite number
        if (audioNode && Number.isFinite(audioNode.duration)) {
          audioNode.currentTime = audioNode.duration;
        }
      } catch (err) {
        console.error("⚠️ Failed to safely clear the audio buffer:", err);
      }
    },
    "spst.listen": ({ context }, params?: { noInputTimeout?: number }) =>
      context.spstRef.send({
        type: "LISTEN",
        value: {
          nlu: true,
          ...(params?.noInputTimeout !== undefined
            ? { noInputTimeout: params.noInputTimeout }
            : {}),
        },
      }),
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
          invoke: {
            src: "speakSSML",
            input: { ssml: prompts.greetingTemp },
            onDone: { target: "Ask" },
            onError: { target: "Ask" },
          },
        },
        Ask: {
          entry: [
            () => console.log("Entering Ask state"),
            { type: "spst.listen" },
          ],
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
