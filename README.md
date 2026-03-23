# 20-Questions Game

[View Project Todos](./todos.md)

A classic voice-enabled 20-Questions dialogue system where the game "thinks" of a word, and the user tries to guess it by asking Yes/No questions.

---

## 🎮 Game Flow & Rules

1. **Greeting & Instructions**: The game introduces itself and explains the rules.
2. **Category Selection**: Choose from `Animal`, `Celebrity`, `Country`, `Sports`, or `Random`.
3. **Secret Word Generation**: The game picks a word from `src/words.ts` and starts the counter.
4. **The Question Loop**:
    * **User Input**: Ask a Yes/No question or make a direct guess.
    * **Validation**: Groq determines if the question is valid and provide the answer.
    * **Penalty**: Invalid questions (non-Yes/No) do not decrement the counter.
5. **Game Over**: Win by guessing correctly, or lose if the counter reaches 0.

---

## 🛠 Tech Stack & Tools

* **XState (v5)**: State machine management.
* **Svelte (v5)**: Reactive UI frontend library. Evaluated against Lit but chosen for its excellent XState integration and a strong curiosity to explore Svelte.
* **Azure Cognitive Services**: High-quality ASR (Speech-to-Text) and TTS (Text-to-Speech). Chosen to provide more dynamic sounding voice response via SSML.
* **Groq Cloud**: Powered by the **Llama-3.3-70b-versatile** model. Chose Groq over Gemini API due to its significantly faster inference speeds. **Llama 3.3** was selected for its strong performance and positive results in early project prototyping.
* **Tailwind CSS**: Modern utility-first styling. Chosen to build a clean, responsive UI quickly without the overhead of manual CSS management.
* **Vitest**: Vite-native unit testing for dialogue logic. A perfect pairing with the Vite development environment for fast, reliable testing.
* **TypeScript**: Full type safety across the project, ensuring robust data structures.
* **Marp**: Markdown-based presentation slides. An easy and efficient way to create a presentation that lives alongside the code in Markdown format.

---

## 📊 Presentation

You can view the project presentation slides here: [presentation.md](./presentation.md). These slides are formatted for **Marp** and provide a high-level summary of the project goals, architecture, and results.

---

## 🚀 Running the Project

Ensure you have **Node.js** installed and **pnpm** (either installed globally or enabled via **corepack**).

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure API Keys:**
   Create a `src/lib/azure.ts` file to include your API keys for Groq and Azure. (Note: this file is git-ignored).
3. **Run Dev Server:**

   ```bash
   pnpm dev
   ```

4. **Run Tests:**

   ```bash
   pnpm test
   ```

---

## 🧠 System Architecture (Deep Dive)

The system uses a **Hybrid NLU & LLM** approach, leveraging specialized tools for different parts of the dialogue.

### Category Selection (NLU)

During the initial phase, the system uses **NLU** (Natural Language Understanding) via Azure Conversational Language Understanding (CLU) to identify the user's chosen category. This ensures fast and reliable extraction of specific intents and entities (e.g., `SelectCategory`) before the game logic begins.

### Intent & Reasoning Interaction (Groq)

Once the game starts, Groq provides the "intent" that triggers transitions in the question loop:

* **`ASK_QUESTION`**: Provide Yes/No answer.
* **`GUESS_WORD`**: Guess the secret word.
* **`INVALID_INTENT`**: Prompt user for a valid question.

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

1. **Strict JSON Mode**: Groq is forced to return structured data.
2. **Intent Constraints**: The System Prompt restricts intent values to a strict Enum.
3. **Guard-Based Validation**: XState guards validate the Groq response before transitions.

---

## 🧪 Testing & Developer Experience

The project includes a robust unit testing suite in **Vitest** to ensure dialogue stability:

* **Coverage**: `dmMachine` is tested for category selection, win/loss states, and error handling.
* **Mocking**: All external APIs (Azure, Groq) and browser APIs (`AudioContext`) are fully mocked.
* **Coding Standards**:
  * **Simplicity**: Code must be simple and readable.
  * **Modular**: Functions and files are kept small and focused.
  * **Naming**: Variable and function names must be meaningful and descriptive, prioritizing clarity over brevity.
  * **Syntax**: Arrow functions are preferred.
  * **Comments**: Follow a "simple and short" style with lowercase first characters for maximum readability.

---

## 🚀 Future Work

* **Hybrid Category Selection**: Implement a Groq-based fallback for category selection to handle filler words and natural phrasing ("Uhh, let's do sports").
* **Levels of Difficulty**: Allow players to choose between difficulty levels that adjust word complexity or the question limit.
* **On-the-fly Word Generation**: Use Groq to generate unique secret words instead of picking from a fixed list in `words.ts`.
* **Score System**: Reward players for guessing correctly with fewer questions.
* **Advanced Memory**: Remember previously played words across sessions to avoid repetition.

---

## 📝 Lessons Learned

### 1. The Interruption Challenge & The UI Pivot

During development, we struggled to get "barge-in" (user interrupting the system) to work reliably. While we couldn't strictly prove the root cause, we suspect **Acoustic Echo**—where the system's own voice was being picked up by the mic—prevented the ASR from detecting user speech during prompts. Because interruptions remained unreliable, we pivoted to using a **Physical UI Button** to allow users to skip the introduction, ensuring a consistent and frustration-free experience.

### 2. Moving Beyond speechstate TTS

We faced a significant challenge in getting the Azure Speech Synthesizer to work in harmony with the built-in TTS logic in `speechstate`, particularly when we needed the audio to stop immediately. Furthermore, we wanted the game host, Davis, to feel more "alive" through expressive prosody. We ultimately decided to **bypass speechstate's TTS entirely** and use Azure's SSML (Speech Synthesis Markup Language) directly, giving us full control over both the audio lifecycle and the emotional tone of the voice.

### 3. Solving the "Single Word" Problem

Voice recognition often struggles with very short answers like "Sports" or "Random." In a noisy room, these can easily be missed or misunderstood. We improved the system's accuracy by utilizing **Azure Custom Speech** for expected words. This helped the system "listen" specifically for our game categories, making the start of the game feel much smoother and more responsive.

### 4. Technical Hurdles: Mocking AudioContext

Testing a voice-based application in a Node.js environment (Vitest) is uniquely difficult because the `Web Audio API` does not exist. The biggest challenge was **mocking the AudioContext** and its associated nodes. We had to implement complex mock actors and lazy-loading patterns to simulate audio playback and lifecycle events, allowing us to verify the dialogue logic without a real browser or microphone.

### 5. Balancing Voice and Visuals (Multimodal)

We feel that mixing in visual cues improves the overall gameplay experience. We added a **Logs Feature** (a chat-like history) so players wouldn't lose track of previous clues, and a **Visual Status** indicator to show exactly when the game is "listening" versus "thinking." This multimodal approach ensures the player always feels grounded in the conversation, even if they miss a spoken word.
