import { NGROK_URL } from "./azure";

export const prompts = {
  greetingTemp: `<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="en-US-DavisNeural">
    temporary greeting
  </voice>
</speak>`,
  greeting: `<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
  <mstts:backgroundaudio
    src="${NGROK_URL}/Ascent_of_the_Champion.mp3"
    volume="0.15" />
  <voice name="en-US-DavisNeural">
    <mstts:express-as style="excited">
      <break time="1.5s" /> Ladies and gentlemen! <break time="0.2s" /> Welcome to <prosody
        pitch="-5%">
        <emphasis level="strong">The 20-question game!</emphasis>
      </prosody>
      <break time="0.5s" />
      I'm your host, Andrew! Today, your wits will be put to the ultimate
        test. Your objective? To guess the secret word I'm thinking of, using nothing but <emphasis
          level="strong">yes or no</emphasis> questions.
      <break time="0.6s" />
      Choose from one of our exciting categories to begin, or... if you're
        feeling truly adventurous... ask for a <emphasis level="moderate">random</emphasis> word!
      <break time="1.0s" />
      <prosody pitch="+5%"> The clock is ticking... <break time="0.4s" />
    <emphasis
          level="strong">Are you ready to play?!</emphasis>
      </prosody>
    </mstts:express-as>
  </voice>
</speak>`,
  noInput: "I can't hear you!",
  invalidCategory:
    "I didn't quite catch that. Please choose Animal, Celebrity, Country, Sports, or Random.",
  categorySelected: (category: string | null) =>
    `You've selected the category ${category}.`,
  secretWordGenerated:
    "I've generated a secret word. You may begin to ask questions!",
  systemPrompt: (
    secretWord: string,
  ) => `You are the host of a 20 Questions game.
The secret word is "${secretWord}".
The user will ask a yes/no question or make a guess.
Respond strictly in JSON format with the following schema:
{
  "intent": "ASK_QUESTION" | "GUESS_WORD" | "INVALID_INTENT",
  "answer": "Yes" | "No" | null,
  "is_correct_guess": boolean,
  "is_yes_no_question": boolean,
  "explanation": "Brief explanation of your reasoning. CRITICAL: Do NOT reveal the secret word here, either directly or indirectly! If intent is GUESS_WORD, provide highly varied, conversational, and playful feedback (e.g., 'Oh, so close, but no!', 'Nice try, but that is not it.'). Do not use repetitive phrasing."
}
If the user asks something that is not a yes/no question, set intent to "INVALID_INTENT".`,
};
