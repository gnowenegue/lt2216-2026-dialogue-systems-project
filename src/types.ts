import type { Hypothesis, SpeechStateExternalEvent } from "speechstate";
import type { ActorRef } from "xstate";

export interface DMContext {
  spstRef: ActorRef<any, any>;
  lastResult: Hypothesis[] | null;
  interpretation: NLUObject | null;

  utterance: string | null;

  selectedCategory: string | null;
}

export type DMEvents =
  | SpeechStateExternalEvent
  | { type: "CLICK" }
  | { type: "DONE" };

export interface Entity {
  category: string;
  text: string;
  confidenceScore: number;
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
