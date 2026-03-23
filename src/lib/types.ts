import type { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import type { ActorRef } from "xstate";

// context data for the state machine
export interface DMContext {
  speechstateRef: ActorRef<any, any>;
  lastResult: Hypothesis[] | null;
  interpretation: NLUObject | null;

  utterance: string | null;

  selectedCategory: string | null;
  secretWord: string | null;
  questionStatus: GroqResponse | null;
  questionsRemaining: number;
  gameWon: boolean | null;

  logs: string[];
}

// events that can be sent to the state machine
export type DMEvents =
  | SpeechStateExternalEvent
  | { type: "CLICK" }
  | { type: "DONE" }

export interface ExtraInformation {
  extraInformationKind: string;
  key: string;
}

// entity extracted from speech
export interface Entity {
  category: string;
  text: string;
  confidenceScore: number;
  extraInformation: ExtraInformation[];
}

export interface Intent {
  category: string;
  confidenceScore: number;
}

// structured result from NLU analysis
export interface NLUObject {
  entities: Entity[];
  intents: Intent[];
  topIntent: string;
}

// response structure from Groq API
export interface GroqResponse {
  intent: "ASK_QUESTION" | "GUESS_WORD" | "INVALID_INTENT";
  answer: "Yes" | "No" | null;
  is_correct_guess: boolean;
  is_yes_no_question: boolean;
  explanation: string;
}
