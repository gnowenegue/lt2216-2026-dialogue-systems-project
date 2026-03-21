import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { Hypothesis } from "speechstate";
import { speechstate } from "speechstate";
import { assign, fromPromise, setup } from "xstate";

import { GROQ_API_KEY } from "./azure";
import { settings, speechSynthesizer, totalQuestionsAllowed } from "./config";
import { prompts, ssmlWrapper } from "./prompts";
import type { DMContext, DMEvents, GroqResponse, NLUObject } from "./types";
import words from "./words";

const audioContext = new AudioContext();
let currentAudioSource: AudioBufferSourceNode | null = null;
let playbackCancelled = false;

const playSSML = (ssml: string, onComplete: () => void) => {
  playbackCancelled = false;

  console.log("SSML", ssml);

  speechSynthesizer.speakSsmlAsync(
    ssml,
    async (result) => {
      if (result.reason === sdk.ResultReason.Canceled) {
        console.error("⚠️ Speech Synthesis canceled.");
        console.error("⚠️ Speech Error Details:", result.errorDetails);
        onComplete();
        return;
      }

      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        try {
          const audioData = result.audioData;
          const audioBuffer = await audioContext.decodeAudioData(
            audioData.slice(0),
          );

          if (playbackCancelled) {
            onComplete();
            return;
          }

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          currentAudioSource = source;

          source.onended = () => {
            console.log("✅ source.onended fired → SPEAK_COMPLETE");
            source.disconnect();
            if (currentAudioSource === source) currentAudioSource = null;
            onComplete();
          };

          source.start();
        } catch (err) {
          console.error("⚠️ Error decoding audio:", err);
          onComplete();
        }
      }
    },
    (error) => {
      console.log("❌ speakSsmlAsync error callback:", error);
      console.error("⚠️ Speech synthesis error:", error);
      onComplete();
    },
  );
};

const getCategoryFromNLU = (nluResult: NLUObject | null): string | null => {
  if (!nluResult) return null;

  const intent = nluResult.topIntent;

  if (!intent || intent !== "SelectCategory") return null;

  const categoryEntity = nluResult.entities.find(
    (e) => e.category === "Category",
  );

  const extraInformation = categoryEntity?.extraInformation;

  if (!extraInformation) return null;

  const category = extraInformation.find(
    (e) => e.extraInformationKind === "ListKey",
  )?.key;

  return category ?? null;
};

const generateSecretWord = (category: string | null): string | null => {
  if (!category) return null;

  const categoryKey = category.toLowerCase();
  let categoryWords: string[];

  if (categoryKey === "random") {
    categoryWords = Object.values(words).flat();
  } else {
    categoryWords = words[categoryKey as keyof typeof words];
  }

  if (!categoryWords || categoryWords.length === 0) return null;

  return categoryWords[Math.floor(Math.random() * categoryWords.length)];
};

const processQuestionWithGroq = async (
  utterance: string,
  secretWord: string,
): Promise<GroqResponse | null> => {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: prompts.systemPrompt(secretWord) },
            { role: "user", content: utterance },
          ],
          response_format: { type: "json_object" },
          temperature: 0.5, // Allow for varied conversational feedback
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as GroqResponse;
  } catch (error) {
    console.error("⚠️ Error processing question with Groq:", error);
    return null;
  }
};

export const dmMachine = setup({
  types: {
    context: {} as DMContext,
    events: {} as DMEvents,
  },
  actors: {
    processQuestionWithGroq: fromPromise(
      ({ input }: { input: { utterance: string; secretWord: string } }) =>
        processQuestionWithGroq(input.utterance, input.secretWord),
    ),
  },
  actions: {
    speakSSML: ({ self }, params: { ssml: string }) => {
      playSSML(params.ssml, () => self.send({ type: "SPEAK_COMPLETE" }));
    },
    "spst.speak": ({ context }, params: { utterance: string }) => {
      if (!params.utterance) return;
      console.log("DM speaking:", params.utterance);
      context.spstRef.send({
        type: "SPEAK",
        value: { utterance: params.utterance },
      });
    },
    stopAudio: () => {
      playbackCancelled = true;
      if (currentAudioSource) {
        currentAudioSource.onended = null; // Prevent duplicate SPEAK_COMPLETE
        try {
          currentAudioSource.stop();
        } catch (e) {}
        currentAudioSource.disconnect();
        currentAudioSource = null;
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

      const utterance = recognisedEvent.value?.[0]?.utterance ?? null;

      return {
        lastResult: recognisedEvent.value,
        interpretation: recognisedEvent.nluValue,
        utterance,
      };
    }),
    "spst.clearTurn": assign({
      lastResult: null,
      interpretation: null,
      utterance: null,
    }),
    "spst.resetSession": assign({
      lastResult: null,
      interpretation: null,
      utterance: null,
      selectedCategory: null,
      secretWord: null,
      questionStatus: null,
      questionsRemaining: totalQuestionsAllowed,
      gameWon: null,
      logs: [],
    }),
    assignCategory: assign({
      selectedCategory: ({ context: { interpretation } }) => {
        return getCategoryFromNLU(interpretation);
      },
      /* logs: ({ context: { logs, interpretation } }) => {
        return [
          ...logs,
          `You have selected the category: ${getCategoryFromNLU(interpretation)}`,
        ];
      }, */
    }),
    assignSecretWord: assign({
      secretWord: ({ context: { selectedCategory } }) => {
        return generateSecretWord(selectedCategory);
      },
    }),
    decrementQuestionsRemaining: assign({
      questionsRemaining: ({ context: { questionsRemaining } }) =>
        questionsRemaining - 1,
    }),
    assignGameWon: assign({
      gameWon: ({ context: { questionStatus } }) => {
        return !!questionStatus?.is_correct_guess;
      },
    }),
    addLog: assign({
      logs: ({ context }, params: { log: string }) => {
        return [...context.logs, params.log];
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
    isAskingQuestion: ({ context: { questionStatus } }) => {
      return (
        questionStatus?.intent === "ASK_QUESTION" &&
        questionStatus.is_yes_no_question
      );
    },
    isGuessingWord: ({ context: { questionStatus } }) => {
      return questionStatus?.intent === "GUESS_WORD";
    },
    isInvalidIntent: ({ context: { questionStatus } }) => {
      return questionStatus?.intent === "INVALID_INTENT";
    },
    isGuessCorrect: ({ context: { questionStatus } }) => {
      return !!questionStatus?.is_correct_guess;
    },
    isGameOver: ({ context: { questionsRemaining } }) => {
      return questionsRemaining <= 0;
    },
  },
}).createMachine({
  context: ({ spawn }) => ({
    spstRef: spawn(speechstate, { input: settings }),
    lastResult: null,
    interpretation: null,
    utterance: null,
    selectedCategory: null,
    secretWord: null,
    questionStatus: null,
    questionsRemaining: totalQuestionsAllowed,
    gameWon: null,
    logs: [],
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
          // entry: { type: "speakSSML", params: { ssml: prompts.greetingTemp } },
          entry: { type: "speakSSML", params: { ssml: prompts.greeting } },
          exit: "stopAudio",
          on: {
            SPEAK_COMPLETE: "Listen",
          },
        },
        Listen: {
          entry: "spst.listen",
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
              actions: [
                "assignCategory",
                {
                  type: "addLog",
                  params: ({ context: { selectedCategory } }) => ({
                    log: `You have selected the category: ${selectedCategory?.toUpperCase()}`,
                  }),
                },
              ],
            },
            { guard: "hasNoInput", target: "NoInput" },
            { target: "InvalidCategory" },
          ],
        },
        InvalidCategory: {
          entry: {
            type: "speakSSML",
            params: { ssml: prompts.invalidCategory },
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        NoInput: {
          entry: { type: "speakSSML", params: { ssml: prompts.noInput } },
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
            type: "speakSSML",
            params: ({ context }) => ({
              ssml: prompts.categorySelected(context.selectedCategory),
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
            type: "speakSSML",
            params: { ssml: prompts.secretWordGenerated },
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        Listen: {
          entry: { type: "spst.listen", params: { noInputTimeout: 10000 } },
          on: {
            ASR_NOINPUT: { actions: "spst.clearTurn" },
            LISTEN_COMPLETE: { target: "CheckInput" },
          },
        },
        CheckInput: {
          always: [
            {
              guard: "hasNoInput",
              target: "NoInput",
            },
            "AskQuestion",
          ],
        },
        NoInput: {
          entry: { type: "speakSSML", params: { ssml: prompts.noInput } },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        AskQuestion: {
          invoke: {
            src: "processQuestionWithGroq",
            input: ({ context: { utterance, secretWord } }) => ({
              utterance: utterance ?? "",
              secretWord: secretWord ?? "",
            }),
            onDone: {
              target: "ProcessQuestion", // Or next state logic
              actions: assign({ questionStatus: ({ event }) => event.output }),
            },
          },
        },
        ProcessQuestion: {
          entry: [
            ({ context }) => {
              console.log("Question Status:", context.questionStatus);
            },
            {
              type: "addLog",
              params: ({ context: { utterance } }) => ({
                log: `You asked: ${utterance}`,
              }),
            },
          ],
          always: [
            {
              target: "HandleAskingQuestion",
              guard: "isAskingQuestion",
              actions: "decrementQuestionsRemaining",
            },
            {
              target: "HandleGuessingWord",
              guard: "isGuessCorrect",
              actions: ["decrementQuestionsRemaining", "assignGameWon"],
            },
            {
              target: "HandleGuessingWord",
              guard: "isGuessingWord",
              actions: "decrementQuestionsRemaining",
            },
            { target: "HandleInvalidIntent" },
          ],
        },
        HandleAskingQuestion: {
          entry: {
            type: "speakSSML",
            params: ({ context: { questionStatus } }) => ({
              ssml: ssmlWrapper(
                `${questionStatus?.answer}. ${questionStatus?.explanation}`,
                questionStatus?.answer?.toLowerCase() === "yes"
                  ? "cheerful"
                  : "sad",
                "1.2",
              ),
            }),
          },

          on: { SPEAK_COMPLETE: "CheckQuestionsRemaining" },
        },
        HandleGuessingWord: {
          entry: {
            type: "speakSSML",
            params: ({ context: { questionStatus } }) => ({
              ssml: ssmlWrapper(
                questionStatus?.explanation ?? "",
                questionStatus?.is_correct_guess ? "excited" : "sad",
                "1.2",
              ),
            }),
          },
          on: {
            SPEAK_COMPLETE: [
              { guard: "isGuessCorrect", target: "GameOver" },
              { target: "CheckQuestionsRemaining" },
            ],
          },
        },
        HandleInvalidIntent: {
          entry: {
            type: "speakSSML",
            params: ({ context: { questionStatus } }) => ({
              ssml: ssmlWrapper(
                questionStatus?.explanation ?? "",
                "sad",
                "1.2",
              ),
            }),
          },
          on: { SPEAK_COMPLETE: "Listen" },
        },
        CheckQuestionsRemaining: {
          always: [
            {
              guard: "isGameOver",
              actions: "assignGameWon",
              target: "GameOver",
            },
            "Listen",
          ],
        },
        GameOver: {
          entry: {
            type: "speakSSML",
            params: ({ context: { questionStatus } }) => ({
              ssml: prompts.gameOver(questionStatus!.is_correct_guess),
            }),
          },
          on: { SPEAK_COMPLETE: "Delay" },
        },
        Delay: {
          after: {
            3000: "Done",
          },
        },
        Done: {
          type: "final",
        },
      },
      onDone: "Done",
    },
    Done: {
      entry: "spst.resetSession",
      on: { CLICK: "Greeting" },
    },
  },
});
