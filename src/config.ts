import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { Settings } from "speechstate";
import { KEY, NLU_KEY } from "./azure";

const azureCredentials = {
  endpoint:
    "https://swedencentral.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: KEY,
};

const azureLanguageCredentials = {
  endpoint:
    "https://lt2216.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: NLU_KEY,
  deploymentName: "Lab-5",
  projectName: "Lab-5",
};

export const settings: Settings = {
  azureLanguageCredentials,
  azureCredentials,
  azureRegion: "swedencentral",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
};

// Create a single, reusable synthesizer instance to reduce latency and overhead
const speechConfig = sdk.SpeechConfig.fromSubscription(KEY, "swedencentral");
const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
export const sharedSynthesizer = new sdk.SpeechSynthesizer(
  speechConfig,
  audioConfig,
);
