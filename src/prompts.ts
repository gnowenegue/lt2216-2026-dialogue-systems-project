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
    "I didn't quite catch that. Please choose Animal, Celebrity, Country, Sports, or say Random.",
};
