import type { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import type { ActorRef } from "xstate";

export interface DMContext {
  spstRef: ActorRef<any, any>;
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

export type DMEvents =
  | SpeechStateExternalEvent
  | { type: "CLICK" }
  | { type: "DONE" }
  | { type: "RESET" };

export interface ExtraInformation {
  extraInformationKind: string;
  key: string;
}

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

export interface NLUObject {
  entities: Entity[];
  intents: Intent[];
  topIntent: string;
}

export interface GroqResponse {
  intent: "ASK_QUESTION" | "GUESS_WORD" | "INVALID_INTENT";
  answer: "Yes" | "No" | null;
  is_correct_guess: boolean;
  is_yes_no_question: boolean;
  explanation: string;
}
