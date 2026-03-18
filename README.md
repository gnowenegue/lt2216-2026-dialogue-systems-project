# 20-Questions Game

[View Project Todos](./todos.md)

A classic voice-enabled 20-Questions dialogue system where the game "thinks" of a word, and the user tries to guess it by asking Yes/No questions.

## Game Flow & Rules

1.  **Greeting & Instructions**:
    *   The game introduces itself.
    *   Explains that it has a secret word.
    *   Explains the "20 questions" limit.
2.  **Category Selection**:
    *   The user can choose: `Animal`, `Celebrity`, `Country`, `Sports`, or `Random`.
    *   If the user says something invalid, the game re-prompts for a category.
3.  **Secret Word Generation (Option A)**:
    *   The game picks a random word from a local `src/words.ts` list based on the chosen category.
    *   Internal counter `questionsRemaining` is set to 20.
4.  **The Question Loop**:
    *   **User Input**: Can be a Yes/No question (e.g., "Is it alive?") or a direct guess (e.g., "Is it a lion?").
    *   **Validation & Reasoning (via Groq)**:
        *   **Yes/No question**: The game answers "Yes" or "No" and decrements the counter.
        *   **Guess**: Correct guess triggers **Win**. Incorrect guess answers "No" and decrements the counter.
        *   **Invalid Input**: If the question isn't Yes/No (e.g., "What color is it?"), the game reminds the user of the rules. The counter is **NOT** decremented.
5.  **Game Over**:
    *   **Win**: User guesses correctly within 20 questions.
    *   **Loss**: `questionsRemaining` reaches 0. The game reveals the word.

## Technical Implementation (Unified Groq-First)

The system uses **Groq** as the central reasoning engine for all text-based interactions, paired with **XState** for dialogue management.

*   **ASR & TTS**: Microsoft Azure Cognitive Services.
*   **Dialogue Management**: [XState](https://xstate.js.org/). XState acts as the skeleton, managing high-level states (e.g., `Welcome`, `SelectingCategory`, `Questioning`, `GameOver`).
*   **The Brain (Groq API)**: Groq interprets user intent and provides game logic in a single JSON response.
    *   **Zero-Shot Knowledge**: Groq "knows" word properties (e.g., a "lion" is a mammal), so we don't need a manual database of traits.
    *   **Latency**: Sub-second inference ensures a fluid voice experience.

### Example Groq Reasoning Response
```json
{
  "intent": "ASK_QUESTION",
  "is_yes_no_question": true,
  "answer": "Yes",
  "is_guess": false,
  "is_correct_guess": false,
  "explanation": "A lion is indeed a mammal.",
  "new_category": null
}
```

## Safety & Schema Validation

To ensure the "Brain" (Groq) stays in sync with the "Skeleton" (XState), the following safety measures are implemented:

1.  **Strict JSON Mode**: Groq is configured to return only structured JSON.
2.  **Intent Constraints**: The System Prompt explicitly defines the allowed Enum values for `intent` and `selected_category`.
3.  **Runtime Sanitization**: Before passing the Groq response to XState, the system validates that the `intent` exists in the codebase's allowed list. If a hallucinated intent is detected, it defaults to `INVALID_INPUT`.
4.  **Fallback Logic**: If the Groq API call fails or returns malformed data, XState transitions to a `Retry` or `Help` state to maintain the dialogue flow.

## NLU & Interaction Design

While XState manages the state, Groq provides the "intent" that triggers state transitions:
- **`SELECT_CATEGORY`**: Pick the word list.
- **`ASK_QUESTION`**: Decrement counter, provide Yes/No answer.
- **`GUESS_WORD`**: Check for win/loss.
- **`CHANGE_CATEGORY`**: Allows the user to reset the game mid-flow (XState must have a transition back to `SelectingCategory`).
- **`INVALID_INPUT`**: Prompt user for a Yes/No question without penalizing the count.

### Category Selection Strategy (Hybrid Waterfall)
To balance speed and robustness during the `Greeting.Listen` state when a user selects a category:
- **Initial Implementation (Fast Path):** Use simple Regular Expressions and string matching (e.g., `.includes()`) to classify user input into the 5 available categories. This provides instant, zero-cost classification for direct, clear answers (e.g., "Animal").
- **Future Enhancement (Slow Path / Groq Fallback):** If the basic regex fails due to conversational padding ("Uhh, let's do sports"), synonyms ("famous person"), or ASR mishears (e.g., "Enamel" instead of "Animal"), the system falls back to Groq to extract the true intent before rejecting the input.

---

## Lessons Learned

### 1. Acoustic Echo & "Barge-in" Design
During the development of the voice-enabled flow, we encountered a significant hardware/software hurdle regarding **Acoustic Echo Cancellation (AEC)**.

#### The Problem: The Echo Loop
Initially, we aimed for a natural "barge-in" feature where the user could interrupt a long greeting prompt by saying a command like "skip." This required opening the microphone (ASR) at the same time the speakers (TTS) were active.

However, we found that unless the hardware or browser has perfect AEC, the microphone picks up the system's own voice. This created a race condition where the bot would interpret its own speech as user input, immediately triggering a `RECOGNIZED` event and cutting itself off.

#### The Resolution: The UI Pivot
To ensure a robust and predictable user experience, we pivoted from a voice-triggered interrupt to a **physical UI button** for skipping prompts.

**Key Benefits:**
1.  **Eliminates Feedback Loops:** By keeping the microphone off during long system prompts, we remove the risk of the system "hearing" itself.
2.  **Reliability:** A physical button provides a 100% success rate for interrupting the flow, regardless of the user's acoustic environment or hardware quality.
3.  **Clean State Management:** XState handles the button event by instantly stopping the audio player, discarding any pending speech promises, and transitioning safely to the next state.


