# Project Roadmap & Todos

## Phase 1: Setup & Design (Completed)
- [x] Scaffold Vite + TypeScript project.
- [x] Install and configure Tailwind CSS.
- [x] Initial project documentation (`README.md`).
- [x] Define data structures and types in `src/types.ts`.
- [x] Design the "Unified Groq-First" architecture.

## Phase 2: Core Data & Prompts
- [ ] Create `src/words.ts` with categorized word lists (Animal, Celebrity, Country, Sports).
- [ ] Define initial game prompts in `src/prompts.ts` (Greeting, Rules, Error messages).

## Phase 3: Dialogue Management (XState Skeleton)
- [ ] Implement `dmMachine` in `src/dm.ts`:
    - [ ] State: `Prepare` (Azure SDK initialization).
    - [ ] State: `Welcome` (Greet and explain rules).
    - [ ] State: `SelectingCategory` (Wait for category choice).
    - [ ] State: `GeneratingWord` (Select secret word, init counter).
    - [ ] State: `QuestioningLoop` (Main game loop).
    - [ ] State: `GameOver` (Win/Loss logic).

## Phase 4: The Brain (Groq Integration)
- [ ] Setup Groq API client/fetch utility.
- [ ] Design System Prompts for:
    - [ ] Intent classification (Category selection, Questions, Guesses).
    - [ ] Yes/No reasoning based on the secret word.
- [ ] Implement runtime schema validation for Groq JSON responses.

## Phase 5: Voice & UI Integration
- [ ] Add a text input field as a fallback for typed interaction (multimodal).
- [ ] Connect Groq response to Azure TTS (Text-to-Speech).
- [ ] Build a simple, reactive UI to display:
    - [ ] Current Game State (e.g., "Awaiting Question").
    - [ ] Questions remaining (20 -> 0).
    - [ ] A "Visualizer" or feedback for when the system is listening/thinking.

## Phase 6: Testing & Refinement
- [ ] Test edge cases (e.g., user changes mind mid-game).
- [ ] Fine-tune Groq prompts for better "Yes/No" accuracy.
- [ ] Optimize latency between ASR -> Groq -> TTS.
