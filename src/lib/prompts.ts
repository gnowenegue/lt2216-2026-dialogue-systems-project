import { NGROK_URL } from "./azure";

// wraps text in SSML for Davis voice
export const ssmlWrapper = (
  utterance: string,
  style: string = "chat",
  rate: string = "1.1",
) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="en-US-DavisNeural"><mstts:express-as style="${style}"><prosody rate="${rate}">${utterance}</prosody></mstts:express-as></voice></speak>`;

// predefined game prompts and templates
export const prompts = {
  greetingTemp: `<speak version="1.0"
  xmlns="http://www.w3.org/2001/10/synthesis"
  xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="en-US-DavisNeural">
    temporary greeting
  </voice>
</speak>`,
  greeting: `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US"><mstts:backgroundaudio src="${NGROK_URL}/Ascent_of_the_Champion.mp3" volume="0.15" /><voice name="en-US-DavisNeural"><mstts:express-as style="excited"><prosody rate="1.2"><break time="1.5s" /> Ladies and gentlemen! Welcome to <prosody pitch="-5%"><emphasis level="moderate">The 20-question game!</emphasis></prosody>I'm your host, Davis! Today, your wits will be put to the ultimate test. <prosody pitch="-5%">Your objective?</prosody>To guess the secret word I'm thinking of, using nothing but <prosody pitch="-5%"><emphasis level="moderate">yes or no</emphasis></prosody> questions. Choose from Animal, Celebrity, Country, or Sports to begin, or... if you're feeling truly adventurous... ask for a <prosody pitch="-5%"><emphasis level="moderate">random</emphasis></prosody> word! <break time="0.5s" /> The clock is ticking... <prosody pitch="-5%"><emphasis level="moderate">Choose your category now.</emphasis></prosody></prosody></mstts:express-as></voice></speak>`,
  noInput: ssmlWrapper(
    `<prosody pitch="-5%">I can't hear you!</prosody>`,
    "shouting",
  ),
  invalidCategory: ssmlWrapper(
    "I didn't quite catch that. Please choose Animal, Celebrity, Country, Sports, or Random.",
    "chat",
    "1.1",
  ),
  categorySelected: (category: string | null) =>
    ssmlWrapper(`You've selected the category ${category}.`, "cheerful"),
  secretWordGenerated: ssmlWrapper(
    "I've generated a secret word. You may begin to ask questions!",
    "cheerful",
  ),
  gameOver: (isCorrectGuess: boolean) =>
    ssmlWrapper(
      `${!isCorrectGuess ? "Unfortunately, you have ran out of questions.<break time='0.5s' />" : ""}Game over! Thanks for playing!`,
      isCorrectGuess ? "excited" : "sad",
      "1.2",
    ),
  // instructions for Groq to behave as a game master
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
