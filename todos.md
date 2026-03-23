# Project Roadmap & Todos

## Phase 1: Setup & Design (Completed)

- [x] Scaffold baseline project.
- [x] Install and configure Tailwind CSS.
- [x] Design the architecture.
- [x] Compare Groq vs. Gemini API for LLM.
- [x] Choose the AI model.
- [x] Initial project documentation (`README.md`).
- [x] Define data structures and types in `src/types.ts`.
- [x] Create `src/words.ts` with categorized word lists (Animal, Celebrity, Country, Sports).
- [x] Define initial game prompts in `src/prompts.ts` (Greeting, Category Selection, Secret Word).

## Phase 2: State Machine Design (Completed)

- [x] Implement greeting and game rules explanation state.
- [x] Handle category selection state.
- [x] Implement secret word generation logic.
- [x] Develop the main game's question loop.
- [x] Implement game over logic.

## Phase 3: Azure CLU Integration (Completed)

- [x] Set up project and schema definition.
- [x] Prepare utterance file to train and deploy the model.
- [x] Implement intent and entities extraction for category selection.

## Phase 4: Groq Integration (Completed)

- [x] Set up GroqCloud account and generate API key.
- [x] Design system prompt for intent classification and yes/no question reasoning.
- [x] Integrate Groq API.

## Phase 5: Voice & UI Integration (Completed)

- [x] Add a text input field as a fallback for typed interaction.
- [x] Compare Svelte 5 vs. Lit for XState integration.
- [x] Implement a Physical UI Skip Button to resolve barge-in/acoustic echo issues.
- [x] Build a reactive UI to display:
  - [x] Game rules.
  - [x] Instructions.
  - [x] Mic status.
  - [x] Questions remaining.
  - [x] Logs.
  - [x] Game over result with secret word reveal.

## Phase 6: Testing & Validation (Completed)

- [x] Integrate `Vitest` for unit testing.
- [x] Implement unit testing for main game logic.
- [x] Add support for dynamic question limits via URL parameters.

## Phase 7: Final Polish & Reflection (Completed)

- [x] **UI/UX Refinement:** Polish the UI design and layout.
- [x] **Azure Integration:** Switch exclusively to Azure Speech Synthesizer for SSML support and improved audio control.
- [x] **ASR Optimization:** Improve single-word recognition and common phrases using Azure Custom Speech.
- [x] **Documentation:** Update README with key technical reflections.
- [x] **Presentation:** Prepare the slides.
