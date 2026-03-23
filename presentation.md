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

![logo](./public/logo.svg)

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

- **State Management:**
  - **XState (v5) —** Statechart implementation for dialogue flow.
  - **speechstate —** Wrapper for integrating the Web Speech API.
- **Hybrid Intelligence:**
  - **Azure CLU (NLU) —** Category Selection.
  - **GroqCloud (LLM) —** Question Loop.
- **Azure Speech:**
  - **ASR:** Enhanced with **Custom Speech** for single words.
  - **TTS:** Exclusively **Azure Speech Synthesizer** with **SSML**.
- **Frontend & Testing:** Svelte 5, Tailwind CSS, and **Vitest** (for strict logic testing).

---

## 🚧 Challenges & Solutions

- **Interruption Challenge (Barge-in):**
  - *Challenge:* Microphone picking up system voice, creating echo/interruption loops.
  - *Solution:* Pivoted to a **Physical UI Button** for 100% reliability.
- **Moving Beyond speechstate TTS:**
  - *Challenge:* Difficult to immediately stop audio and inject expressive prosody.
  - *Solution:* Bypassed `speechstate` TTS entirely to use direct Azure SSML controls.
- **Single-Word Recognition:**
  - *Challenge:* Voice recognition struggles with very short, isolated words ("Animal", "Sports").
  - *Solution:* Optimized ASR configuration and utilized **Azure Custom Speech**.

---

## 📚 Relation to Course Contents (1/2)

- **Most Useful Concepts (Lab 4 on Custom Speech):**
  - *The "Animal" Problem:* Why does ASR struggle with a simple, single word?
  - *The Lesson:* Standard ASR expects full sentences for context. Custom Speech solved this by heavily biasing the model toward my game categories.
- **Statecharts Evaluation:**
  - *Suitable?* **Yes.** XState is a robust implementation of the statechart standard.
  - Provided a strict "Skeleton" to tame the non-deterministic "Brain" (LLM) using **guard-based validation**.
  - Handled hierarchical states (Greeting -> Game -> Game Over) elegantly.

---

## 🤝 Relation to Course Contents (2/2)

- **Development Process:**
  - *Initial Goal:* A **fully voice-only** experience.
  - *The Pivot:* Realized pure voice is unintuitive and easy to lose track of. Added UI/UX cues (visual logs, status indicators) for a multimodal approach.
- **Ethical Concerns:**
  - *Linguistic Bias:* ASR systems historically underperform for non-native speakers or non-standard accents, risking exclusion.
  - *Accessibility:* A purely voice-driven game excludes those with speech or hearing impairments. My text-fallback UI mitigates this.

---

## 🚀 Future Work

- **Hybrid Category Selection:** Groq-based fallback for messy phrasing ("Uhh, let's do sports").
- **Difficulty Levels:** Adjust word complexity and question limits.
- **Dynamic Words:** Use the LLM to generate unique secret words on the fly.
- **Score System:** Reward efficiency and remember past words to avoid repetition.

---

## 🎙️ Demo Time

*Let's play 20 questions!*
