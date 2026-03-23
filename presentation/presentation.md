---
marp: true
theme: default
paginate: true
header: "LT2216 Dialogue Systems"
footer: "20-Questions Game | Eugene Wong"
style: |
  section {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
  }
  h1 {
    color: #3a53ef;
  }
  h2 {
    color: #1e293b;
    border-bottom: 3px solid #3a53ef;
    padding-bottom: 0.2em;
  }
  strong {
    color: #3a53ef;
  }
  img[alt~="logo"] {
    width: 250px;
    height: auto;
    display: block;
  }

---

# LT2216 Dialogue Systems

![logo](../public/logo.svg)

## 20-Questions Game

/ Eugene Wong

---

## 🎮 The Game: What Does It Do?

- A classic **20-Questions** game where the system "thinks" of a secret word.
- The user tries to guess the word by asking **Yes/No** questions.
- **Categories:** Animal, Celebrity, Country, Sports, or Random.
- **Rules:**
  - Max 20 questions to guess the word.
  - Correct guess = Win!
  - Run out of questions = Game Over.
- **Voice and Visuals:** Spoken responses + visual cues.

---

## ⚙️ Technicalities & Architecture

- **Backbone:**
  - **XState —** Statechart implementation for dialogue flow.
  - **SpeechState —** Orchestrate the ASR and TTS lifecycle.
- **Hybrid Intelligence:**
  - **Azure CLU (NLU) —** Category Selection.
  - **GroqCloud (LLM) —** Question Loop.
- **Azure Speech Services:**
  - **ASR:** Enhanced with **Custom Speech**.
  - **TTS:** **Azure Speech Synthesizer** with **SSML**.
- **Frontend:** Svelte, Tailwind CSS

---

## 🚧 Challenges (1/2): Interaction & UX

- **The Interruption Loop (Barge-in):**
  - *Challenge:* **High coding complexity** + Acoustic Echo.
  - *Solution:* Pivoted to a **UI Button** to skip/stop audio.
- **Pure Voice vs. Multimodal UX:**
  - *Challenge:* Initial "voice-only" goal was unintuitive; players felt lost without visual grounding.
  - *Solution:* Added **logs**, **mic status indicators**, and a **text input fallback** to guide the player.

---

## 🚧 Challenges (2/2): Technical & Accuracy

- **Single-Word Recognition:**
  - *Challenge:* ASR struggles with short, isolated words ("Animal").
  - *Solution:* Utilized **Azure Custom Speech** to improve the recognition.
- **Testing Voice Apps:**
  - *Challenge:* Technically challenging to mock all speech services for unit testing.
  - *Solution:* Implemented complex **Mock Actors** for Audio nodes in `Vitest`.

---

## 📚 Useful Concepts & Evaluation

- **Most Useful Concepts (Lab 4 on Custom Speech):**
  - *The "Animal" Problem:* Why does ASR struggle with a simple, single word?
  - *The Lesson:* Standard ASR expects full sentences for context. Custom Speech solved this by heavily biasing the model.
- **Statecharts Evaluation:**
  - *Suitable?* **Yes.**
  - **Why:** The game flows naturally from state to state (Greeting → Category → Question Loop), making it highly suitable for a state machine.
  - **Benefit:** Provided a strong backbone that made the complex logic easy to visualize, build, and debug.

---

## 🤝 Development Process

1. Setup & Design
2. State Machine Design
3. Azure CLU Integration
4. Groq Integration
5. Voice & UI Integration
6. Testing & Validation
7. Final Polish & Reflection
8. Deployment

---

## ⚖️ Ethical Concerns

- **Accent Bias:** ASR systems tend to underperform for non-native speakers or non-standard accents.
- **Accessibility:** Purely voice-driven interfaces can exclude those with speech or hearing impairments (mitigated via text fallback and visual logs).

---

## 🚀 Future Work

- **Hybrid Category Selection:** Groq-based fallback to handle out-of-domain requests and guide users back.
- **Levels of Difficulty:** Adjust word complexity or the question limit for varied challenges.
- **On-the-fly Word Generation:** Use Groq to generate unique secret words instead of a fixed list.
- **Score System:** Reward efficiency with question count and time-based bonuses.
- **Advanced Memory:** Remember previously played words across sessions to avoid repetition.

---

## 🎙️ Demo Time

[Let's play the 20-questions game!](https://lt2216-2026-dialogue-systems-projec.vercel.app/)
