# 20-Questions Game

[View Project Todos](./todos.md) | [Live Demo](https://lt2216-2026-dialogue-systems-projec.vercel.app/)

A classic voice-enabled 20-Questions dialogue system where the game "thinks" of a word, and the user tries to guess it by asking Yes/No questions.

---

## 📋 Table of Contents

- [20-Questions Game](#20-questions-game)
  - [📋 Table of Contents](#-table-of-contents)
  - [🎮 Game Flow \& Rules](#-game-flow--rules)
  - [🛠 Tech Stack \& Tools](#-tech-stack--tools)
  - [📊 Presentation](#-presentation)
  - [🚀 Running the Project](#-running-the-project)
  - [📂 Project Structure](#-project-structure)
  - [🧠 System Architecture](#-system-architecture)
    - [Category Selection — NLU](#category-selection--nlu)
    - [Question Loop — LLM with GroqCloud](#question-loop--llm-with-groqcloud)
      - [Example Groq Reasoning Response](#example-groq-reasoning-response)
    - [Safety \& Schema Validation](#safety--schema-validation)
  - [🧪 Testing](#-testing)
  - [👾 Developer Experience](#-developer-experience)
  - [🚀 Future Work](#-future-work)
  - [📝 Lessons Learned](#-lessons-learned)
    - [1. The Interruption Challenge \& The UI Pivot](#1-the-interruption-challenge--the-ui-pivot)
    - [2. Moving Beyond `SpeechState` TTS](#2-moving-beyond-speechstate-tts)
    - [3. Solving the "Single Word" Problem](#3-solving-the-single-word-problem)
    - [4. Technical Hurdles: Mocking AudioContext](#4-technical-hurdles-mocking-audiocontext)
    - [5. Balancing Voice and Visuals (Multimodal)](#5-balancing-voice-and-visuals-multimodal)
  - [📜 License](#-license)

---

## 🎮 Game Flow & Rules

1. **Greeting & Instructions**: The game introduces itself and explains the rules.
2. **Category Selection**: Choose from `Animal`, `Celebrity`, `Country`, `Sports`, or `Random`.
3. **Secret Word Generation**: The game picks a word from `src/words.ts` and starts the counter.
4. **The Question Loop**:
    - **User Input**: Ask a Yes/No question or make a direct guess (via **voice** or **text input**).
    - **Validation**: Groq determines if the question is valid and provides the answer.
    - **Penalty**: Invalid questions (non-Yes/No) do not decrement the counter.
5. **Game Over**: Win by guessing correctly, or lose if the counter reaches 0.

---

## 🛠 Tech Stack & Tools

- **XState**: State machine management.
- **Svelte**: Reactive UI frontend library. Evaluated against `Lit` but chosen for its excellent `XState` integration and a strong curiosity to explore `Svelte`.
- **Azure Cognitive Services**: Using `SpeechState` as a wrapper for ASR, and the Azure Speech SDK directly for TTS with full SSML support. Azure CLU is also used as NLU for intent and entity extraction, and Custom Speech for single-word and common phrase recognition.
- **GroqCloud**: Powered by the `Llama-3.3-70b-versatile` model. Chose Groq over Gemini API due to its fast response speeds. `Llama-3.3-70b-versatile` was selected for its strong performance and positive results in early project prototyping.
- **Tailwind CSS**: Modern utility-first styling. Chosen to build a clean, responsive UI quickly without the overhead of manual CSS management.
- **Vitest**: Vite-native unit testing library. A perfect pairing with the Vite development environment for fast, reliable testing.
- **TypeScript**: Full type safety across the project, ensuring robust data structures.
- **Marp**: Markdown-based presentation slides. An easy and efficient way to create a presentation that lives alongside the code in Markdown format.

---

## 📊 Presentation

You can view the project presentation slides here: [presentation.md](./presentation/presentation.md). The slides are formatted for **Marp**.

---

## 🚀 Running the Project

Ensure you have **Node.js** installed and **pnpm** (either installed globally or enabled via **corepack**).

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure API Keys:**
   Create a `.env` file in the root of the project to configure your API keys and environment variables. The following variables are required:
   - `VITE_KEY`: Your Azure Speech service subscription key.
   - `VITE_NLU_KEY`: Your Azure Language service (CLU) subscription key.
   - `VITE_GROQ_API_KEY`: Your GroqCloud API key.
   - `VITE_NGROK_URL`: Your base URL (e.g., ngrok tunnel or localhost) used for serving background audio in SSML.

   You can use the `.env.example` file as a reference.

3. **Run dev server:**

   ```bash
   pnpm dev
   ```

4. **Run Tests:**

   ```bash
   pnpm test
   ```

---

## 📂 Project Structure

- `src/components/`: Svelte UI components.
- `src/lib/dm.ts`: Core dialogue management state machine.
- `src/lib/game.svelte.ts`: Reactive game logic.
- `src/lib/prompts.ts`: All the prompts used in the game.
- `src/lib/words.ts`: Static dataset of categorized secret words.
- `src/lib/types.ts`: Centralized TypeScript interfaces and type definitions.

---

## 🧠 System Architecture

The system uses a **Hybrid NLU & LLM** approach, leveraging specialized tools for different parts of the dialogue.

### Category Selection — NLU

During the initial phase, the system uses **Natural Language Understanding (NLU)** via **Azure Conversational Language Understanding (CLU)** to identify the user's chosen category. This ensures fast and reliable extraction of intent (`SelectCategory`) and entity before the game logic begins.

### Question Loop — LLM with GroqCloud

Once the game starts, Groq provides the intent that triggers the state transitions in the question loop:

- **`ASK_QUESTION`**: Provide Yes/No answer.
- **`GUESS_WORD`**: Guess the secret word.
- **`INVALID_INTENT`**: Prompt user for a valid Yes/No question.

#### Example Groq Reasoning Response

```json
{
  "intent": "ASK_QUESTION",
  "is_yes_no_question": true,
  "answer": "Yes",
  "is_correct_guess": false,
  "explanation": "It is indeed a mammal."
}
```

### Safety & Schema Validation

*Note: While GroqCloud offers strict JSON schema enforcement (Structured Outputs), this feature is currently only available on select models. Since our chosen model (`llama-3.3-70b-versatile`) does not yet support this natively, we rely on prompt engineering to guide the model into returning the correct JSON structure.*

1. **Prompt-Based Constraints**: The System Prompt strongly guides the LLM to select from a specific set of intent values.
2. **Guard-Based Validation**: XState guards validate the Groq response before transitions.

---

## 🧪 Testing

The project includes a unit testing suite in **Vitest** to ensure dialogue stability:

- **Coverage**: `dmMachine` is tested for category selection, win/loss states, and error handling.
- **Mocking**: All external APIs (Azure, Groq) and browser APIs (`AudioContext`) are fully mocked.
- **Manual Testing Helper**: Append `?q=<number>` to the URL to override the default limit (e.g., `?q=3`). This is particularly useful for quickly verifying win/loss conditions without playing a full 20-question session.

## 👾 Developer Experience

- **Coding Guidelines**:
  - **Simplicity**: Code must be simple and readable.
  - **Modular**: Functions and files are kept small and focused.
  - **Naming**: Variable and function names must be meaningful and descriptive, prioritizing clarity over brevity.
  - **Syntax**: Arrow functions are preferred.
  - **Comments**: Follow a "simple and short" style with lowercase first characters for maximum readability.

---

## 🚀 Future Work

- **Hybrid Category Selection**: Implement a Groq-based fallback to gracefully handle out-of-domain category requests (e.g., "Let's play cars") and guide users back to supported options.
- **Levels of Difficulty**: Allow players to choose between difficulty levels that adjust word complexity or the question limit.
- **On-the-fly Word Generation**: Use Groq to generate unique secret words instead of picking from a fixed list in `words.ts`.

- **Score System**: Reward players for guessing correctly with fewer questions and include time-based bonuses for fast responses.

- **Advanced Memory**: Remember previously played words across sessions to avoid repetition.

---

## 📝 Lessons Learned

### 1. The Interruption Challenge & The UI Pivot

During development, we struggled to get "barge-in" (user interrupting the system) to work reliably. While we couldn't strictly prove the root cause, we suspect **Acoustic Echo**—where the system's own voice was being picked up by the mic—prevented the ASR from detecting user speech during prompts. Because interruptions remained unreliable, we pivoted to using a **Physical UI Button** to allow users to skip the introduction, ensuring a consistent and frustration-free experience.

### 2. Moving Beyond `SpeechState` TTS

We faced a significant challenge in getting the Azure Speech Synthesizer to work in harmony with the built-in TTS logic in `SpeechState`, particularly when we needed the audio to stop immediately. Furthermore, we wanted the game host, Davis, to feel more "alive" through expressive prosody. We ultimately decided to bypass `SpeechState`'s TTS entirely and use **Azure Speech SDK** directly, which supports SSML, giving us full control over both the audio lifecycle and the emotional tone of the voice.

### 3. Solving the "Single Word" Problem

Voice recognition often struggles with very short answers like "Sports" or "Random." We improved the system's accuracy by utilizing **Azure Custom Speech** for expected words. This helped the system "listen" specifically for our game categories, making the start of the game feel much smoother and more responsive.

### 4. Technical Hurdles: Mocking AudioContext

Testing a voice-based application in a Node.js environment (Vitest) is uniquely difficult because the `Web Audio API` does not exist. The biggest challenge was mocking the AudioContext and its associated nodes. We had to implement complex mock actors and lazy-loading patterns to simulate audio playback and lifecycle events, allowing us to verify the dialogue logic without a real browser or microphone.

### 5. Balancing Voice and Visuals (Multimodal)

We feel that mixing in visual cues improves the overall gameplay experience. We added a **Logs Feature** (a chat-like history) so players wouldn't lose track of previous clues, a **Visual Status** indicator to show exactly when the mic is "listening," and a **Text Input Fallback** for players who prefer typing or are in noisy environments. This multimodal approach ensures the player always feels grounded in the conversation, even if they miss a spoken word.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
