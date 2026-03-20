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
  deploymentName: "Project",
  projectName: "Project",
};

export const settings: Settings = {
  azureLanguageCredentials,
  azureCredentials,
  azureRegion: "swedencentral",
  asrDefaultCompleteTimeout: 0,
  asrDefaultNoInputTimeout: 5000,
  locale: "en-US",
  ttsDefaultVoice: "en-US-DavisNeural",
  speechRecognitionEndpointId: "2b4b8761-8d0e-44ce-89a5-15ca6b7cd335",
};

const speechConfig = sdk.SpeechConfig.fromSubscription(KEY, "swedencentral");
// export const player = new sdk.SpeakerAudioDestination();
// export const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);
export const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

export const totalQuestionsAllowed = 20;
