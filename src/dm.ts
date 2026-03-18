import { createBrowserInspector } from "@statelyai/inspect";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { Hypothesis } from "speechstate";
import { speechstate } from "speechstate";
import { assign, createActor, setup } from "xstate";

import { settings, speechSynthesizer } from "./config";
import { prompts } from "./prompts";
import type { DMContext, DMEvents, NLUObject } from "./types";
import words from "./words";

const inspector = createBrowserInspector();
// const inspector = createBrowserInspector({
//   filter: (inspectEvent: any) => {
//     if (
//       inspectEvent.type === "@xstate.event" &&
//       !inspectEvent.event?.type.includes("xstate")
//     ) {
//       console.log("🖥️ [DM] Event:", inspectEvent.event);
//     }
//     return true;
//   },
// });

const audioContext = new AudioContext();

const getCategoryFromNLU = (nluResult: NLUObject | null): string | null => {
  if (!nluResult) return null;

  const intent = nluResult.topIntent;

  if (!intent || intent !== "SelectCategory") return null;

  const categoryEntity = nluResult.entities.find(
    (e) => e.category === "Category",
  );
  return categoryEntity ? categoryEntity.text : null;
};

const generateSecretWord = (category: string | null): string | null => {
  if (!category) return null;

  const categoryKey = category.toLowerCase() as keyof typeof words;
  const categoryWords = words[categoryKey];

  if (!categoryWords || categoryWords.length === 0) return null;

  return categoryWords[Math.floor(Math.random() * categoryWords.length)];
};

const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actors: {},
  actions: {
    speakSSML: ({ context, self }, params: { ssml: string }) => {
      speechSynthesizer.speakSsmlAsync(
        params.ssml,
        async (result) => {
          if (result.reason === sdk.ResultReason.Canceled) {
            console.error("⚠️ Speech Synthesis canceled.");
            console.error("⚠️ Speech Error Details:", result.errorDetails);

            self.send({ type: "SPEAK_COMPLETE" });

            return;
          }

          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            try {
              // ✅ decode the raw audio data from the result directly
              const audioData = result.audioData;
              const audioBuffer = await audioContext.decodeAudioData(
                audioData.slice(0), // slice to get a copy as ArrayBuffer
              );

              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);

              // ✅ this is a real, reliable onended
              source.onended = () => {
                console.log("✅ source.onended fired → SPEAK_COMPLETE");
                source.disconnect();
                self.send({ type: "SPEAK_COMPLETE" });
              };

              source.start();
            } catch (err) {
              console.error("⚠️ Error decoding audio:", err);
              self.send({ type: "SPEAK_COMPLETE" });
            }
          }
        },
        (error) => {
          console.log("❌ speakSsmlAsync error callback:", error);
          console.error("⚠️ Speech synthesis error:", error);

          self.send({ type: "SPEAK_COMPLETE" });
        },
      );
    },
    "spst.speak": ({ context }, params: { utterance: string }) => {
      if (!params.utterance) return;
      console.log("DM speaking:", params.utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: { utterance: params.utterance },
      });
    },
    /* "ssml.stop": () => {
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
    }, */
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
    "spst.recognised": assign(({ event, context }) => {
      const recognisedEvent = event as {
        type: "RECOGNISED";
        value: Hypothesis[];
        nluValue: NLUObject;
      };

      const utterance = recognisedEvent.value?.[0]?.utterance ?? null;

      return {
        lastResult: recognisedEvent.value,
        interpretation: recognisedEvent.nluValue,
        utterance,
      };
    }),
    "spst.clearTurn": assign({ lastResult: null, interpretation: null }),
    "spst.resetSession": assign({
      lastResult: null,
      interpretation: null,
      selectedCategory: null,
      secretWord: null,
    }),
    assignCategory: assign({
      selectedCategory: ({ context: { interpretation } }) => {
        return getCategoryFromNLU(interpretation);
      },
    }),
    assignSecretWord: assign({
      secretWord: ({ context: { selectedCategory } }) => {
        return generateSecretWord(selectedCategory);
      },
    }),
  },
  guards: {
    hasValidCategory: ({ context: { interpretation } }) => {
      return !!getCategoryFromNLU(interpretation);
    },
    hasNoInput: ({ context: { utterance } }) => {
      return !utterance;
    },
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    interpretation: null,
    utterance: null,
    selectedCategory: null,
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
          entry: [
            { type: "speakSSML", params: { ssml: prompts.greetingTemp } },
          ],
          on: {
            SPEAK_COMPLETE: "Listen",
          },
        },
        Listen: {
          entry: [
            () => console.log("Entering Listen state"),
            { type: "spst.listen" },
          ],
          on: {
            ASR_NOINPUT: { actions: "spst.clearTurn" },
            LISTEN_COMPLETE: { target: "CheckCategory" },
          },
        },
        CheckCategory: {
          always: [
            {
              guard: "hasValidCategory",
              target: "Done",
              actions: "assignCategory",
            },
            { guard: "hasNoInput", target: "NoInput" },
            { target: "InvalidCategory" },
          ],
        },
        InvalidCategory: {
          entry: {
            type: "spst.speak",
            params: { utterance: prompts.invalidCategory },
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        NoInput: {
          entry: { type: "spst.speak", params: { utterance: prompts.noInput } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Done: {
          type: "final",
        },
      },
      onDone: "Game",
    },
    Game: {
      initial: "Prompt",
      states: {
        Prompt: {
          entry: {
            type: "spst.speak",
            params: ({ context }) => ({
              utterance: prompts.categorySelected(context.selectedCategory),
            }),
          },
          on: { SPEAK_COMPLETE: "AssignSecretWord" },
        },
        AssignSecretWord: {
          always: {
            actions: "assignSecretWord",
            target: "PromptStartGame",
          },
        },
        PromptStartGame: {
          entry: {
            type: "spst.speak",
            params: { utterance: prompts.secretWordGenerated },
          },
          on: { SPEAK_COMPLETE: "#DM.Done" },
        },
      },
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
