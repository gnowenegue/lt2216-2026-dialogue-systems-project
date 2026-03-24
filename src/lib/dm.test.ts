import { describe, it, expect, vi, beforeEach } from "vitest";
import { createActor, fromPromise, setup } from "xstate";
import type { GroqResponse, NLUObject } from "./types";

// mock browser APIs before importing dm.ts
const audioContextMock = {
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    disconnect: vi.fn(),
    stop: vi.fn(),
  })),
  decodeAudioData: vi.fn(),
  destination: {},
};

vi.stubGlobal(
  "AudioContext",
  vi.fn(() => audioContextMock),
);

vi.stubGlobal("window", { location: { search: "" } });

vi.mock("microsoft-cognitiveservices-speech-sdk", () => {
  return {
    SpeechConfig: {
      fromSubscription: vi.fn(() => ({})),
    },
    SpeechSynthesizer: class {
      speakSsmlAsync = vi.fn();
    },
    ResultReason: {
      Canceled: 1,
      SynthesizingAudioCompleted: 2,
    },
  };
});

vi.stubEnv("VITE_KEY", "mock-key");
vi.stubEnv("VITE_NLU_KEY", "mock-nlu-key");
vi.stubEnv("VITE_GROQ_API_KEY", "mock-groq-key");
vi.stubEnv("VITE_NGROK_URL", "http://mock-ngrok-url.com");

// mock speechstate to avoid real device access
vi.mock("speechstate", () => {
  return {
    speechstate: setup({}).createMachine({
      id: "mockSpeechState",
      initial: "idle",
      states: { idle: {} },
    }),
  };
});

import { dmMachine } from "./dm";

describe("Dialogue Management Machine (dmMachine)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockNLU = (category: string): NLUObject => ({
    topIntent: "SelectCategory",
    intents: [{ category: "SelectCategory", confidenceScore: 1 }],
    entities: [
      {
        category: "Category",
        text: category,
        confidenceScore: 1,
        extraInformation: [{ extraInformationKind: "ListKey", key: category }],
      },
    ],
  });

  it("Initialization & Category Selection: should transition to Greeting and handle category selection", async () => {
    const testMachine = dmMachine.provide({
      actions: {
        speakSSML: () => {},
        stopAudio: () => {},
      },
    });

    const actor = createActor(testMachine);
    actor.start();

    // machine starts in Prepare state
    expect(actor.getSnapshot().value).toEqual("Prepare");

    // simulate ASR/TTS being ready
    actor.send({ type: "ASRTTS_READY" } as any);
    expect(actor.getSnapshot().value).toEqual("WaitToStart");

    // simulate user clicking start button
    actor.send({ type: "CLICK" } as any);

    // state is now Greeting prompt
    expect(actor.getSnapshot().value).toEqual({ Greeting: "Prompt" });

    // simulate speech synthesis finishing
    actor.send({ type: "SPEAK_COMPLETE" } as any);
    expect(actor.getSnapshot().value).toEqual({ Greeting: "Listen" });

    // simulate user saying "animal"
    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "I want to play animal" }],
      nluValue: mockNLU("animal"),
    } as any);

    // simulate listening completing
    actor.send({ type: "LISTEN_COMPLETE" } as any);
    const snapshot = actor.getSnapshot();
    expect(snapshot.context.selectedCategory).toBe("animal");
    expect(snapshot.context.secretWord).toBeDefined();
    expect(snapshot.value).toEqual({ Game: "Prompt" });
  });

  it("Asking a Valid Question: should decrement questionsRemaining", async () => {
    // provide a mocked Groq actor
    const testMachine = dmMachine.provide({
      actions: {
        speakSSML: () => {},
        stopAudio: () => {},
      },
      actors: {
        processQuestionWithGroq: fromPromise<
          GroqResponse | null,
          { utterance: string; secretWord: string }
        >(async () => ({
          intent: "ASK_QUESTION",
          is_yes_no_question: true,
          answer: "Yes",
          is_correct_guess: false,
          explanation: "Yes, it is alive.",
        })),
      },
    });

    const actor = createActor(testMachine);
    actor.start();

    // fast forward to Game Listen state
    actor.send({ type: "ASRTTS_READY" } as any);
    actor.send({ type: "CLICK" } as any);
    actor.send({ type: "SPEAK_COMPLETE" } as any);

    // send valid category
    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "animal" }],
      nluValue: mockNLU("animal"),
    } as any);

    actor.send({ type: "LISTEN_COMPLETE" } as any);

    // state is Game Prompt
    actor.send({ type: "SPEAK_COMPLETE" } as any);
    // move to PromptStartGame
    actor.send({ type: "SPEAK_COMPLETE" } as any);
    // move to Listen state

    const initialRemaining = actor.getSnapshot().context.questionsRemaining;
    expect(initialRemaining).toBe(20);

    // ask a question
    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "Is it alive?" }],
      nluValue: null,
    } as any);

    // simulate LISTEN_COMPLETE
    actor.send({ type: "LISTEN_COMPLETE" } as any);

    // state machine invokes Groq
    // wait a tick for promise to resolve
    await new Promise((r) => setTimeout(r, 0));

    const snapshot = actor.getSnapshot();
    expect(snapshot.context.questionsRemaining).toBe(19);
    expect(snapshot.value).toEqual({ Game: "HandleAskingQuestion" });
  });

  it("Winning the Game: should transition to GameOver with gameWon true", async () => {
    const testMachine = dmMachine.provide({
      actions: { speakSSML: () => {}, stopAudio: () => {} },
      actors: {
        processQuestionWithGroq: fromPromise<
          GroqResponse | null,
          { utterance: string; secretWord: string }
        >(async () => ({
          intent: "GUESS_WORD",
          is_yes_no_question: false,
          answer: "Yes",
          is_correct_guess: true,
          explanation: "You got it!",
        })),
      },
    });

    const actor = createActor(testMachine);
    actor.start();

    actor.send({ type: "ASRTTS_READY" } as any);
    actor.send({ type: "CLICK" } as any);
    actor.send({ type: "SPEAK_COMPLETE" } as any);

    // select category
    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "animal" }],
      nluValue: mockNLU("animal"),
    } as any);

    actor.send({ type: "LISTEN_COMPLETE" } as any);

    actor.send({ type: "SPEAK_COMPLETE" } as any); // Prompt -> AssignSecretWord -> PromptStartGame
    actor.send({ type: "SPEAK_COMPLETE" } as any); // PromptStartGame -> Listen

    // guess correct word
    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "Is it a lion?" }],
      nluValue: null,
    } as any);

    actor.send({ type: "LISTEN_COMPLETE" } as any);

    await new Promise((r) => setTimeout(r, 0));

    const snapshot = actor.getSnapshot();
    // handle guess and transition to GameOver
    expect(snapshot.value).toEqual({ Game: "HandleGuessingWord" });
    expect(snapshot.context.gameWon).toBe(true);

    actor.send({ type: "SPEAK_COMPLETE" } as any);
    expect(actor.getSnapshot().value).toEqual({ Game: "GameOver" });
  });

  it("Losing the Game: should transition to GameOver with gameWon false when questions run out", async () => {
    const testMachine = dmMachine.provide({
      actions: { speakSSML: () => {}, stopAudio: () => {} },
      actors: {
        processQuestionWithGroq: fromPromise<
          GroqResponse | null,
          { utterance: string; secretWord: string }
        >(async () => ({
          intent: "GUESS_WORD",
          is_yes_no_question: false,
          answer: "No",
          is_correct_guess: false,
          explanation: "Nope, not a lion.",
        })),
      },
    });

    const actor = createActor(testMachine);
    actor.start();

    actor.send({ type: "ASRTTS_READY" } as any);
    actor.send({ type: "CLICK" } as any);
    actor.send({ type: "SPEAK_COMPLETE" } as any);

    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "animal" }],
      nluValue: mockNLU("animal"),
    } as any);

    actor.send({ type: "LISTEN_COMPLETE" } as any);

    actor.send({ type: "SPEAK_COMPLETE" } as any);
    actor.send({ type: "SPEAK_COMPLETE" } as any);

    // guess incorrectly 20 times to run out of questions
    const initialRemaining = actor.getSnapshot().context.questionsRemaining;
    for (let i = 0; i < initialRemaining; i++) {
      actor.send({
        type: "RECOGNISED",
        value: [{ utterance: "lion" }],
        nluValue: null,
      } as any);
      actor.send({ type: "LISTEN_COMPLETE" } as any);
      await new Promise((r) => setTimeout(r, 0));
      actor.send({ type: "SPEAK_COMPLETE" } as any);
    }

    let snapshot = actor.getSnapshot();
    expect(snapshot.context.questionsRemaining).toBe(0);
    expect(snapshot.context.gameWon).toBe(false);
    expect(snapshot.value).toEqual({ Game: "GameOver" });
  });

  it("Handling Invalid Intent: should not decrement questionsRemaining", async () => {
    const testMachine = dmMachine.provide({
      actions: { speakSSML: () => {}, stopAudio: () => {} },
      actors: {
        processQuestionWithGroq: fromPromise<
          GroqResponse | null,
          { utterance: string; secretWord: string }
        >(async () => ({
          intent: "INVALID_INTENT",
          is_yes_no_question: false,
          answer: null,
          is_correct_guess: false,
          explanation: "That is not a valid yes/no question.",
        })),
      },
    });

    const actor = createActor(testMachine);
    actor.start();

    actor.send({ type: "ASRTTS_READY" } as any);
    actor.send({ type: "CLICK" } as any);
    actor.send({ type: "SPEAK_COMPLETE" } as any);

    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "animal" }],
      nluValue: mockNLU("animal"),
    } as any);

    actor.send({ type: "LISTEN_COMPLETE" } as any);

    actor.send({ type: "SPEAK_COMPLETE" } as any);
    actor.send({ type: "SPEAK_COMPLETE" } as any);

    const initialRemaining = actor.getSnapshot().context.questionsRemaining;

    // ask invalid question
    actor.send({
      type: "RECOGNISED",
      value: [{ utterance: "What color is it?" }],
      nluValue: null,
    } as any);
    actor.send({ type: "LISTEN_COMPLETE" } as any);

    await new Promise((r) => setTimeout(r, 0));

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toEqual({ Game: "HandleInvalidIntent" });
    expect(snapshot.context.questionsRemaining).toBe(initialRemaining); // counter remains untouched
  });
});
