import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import type { Settings } from "speechstate";

// import { KEY, NLU_KEY } from "./azure";

const azureCredentials = {
  endpoint:
    "https://swedencentral.api.cognitive.microsoft.com/sts/v1.0/issuetoken",
  key: import.meta.env.VITE_KEY,
};

const azureLanguageCredentials = {
  endpoint:
    "https://lt2216.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2024-11-15-preview",
  key: import.meta.env.VITE_NLU_KEY,
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

const speechConfig = sdk.SpeechConfig.fromSubscription(
  import.meta.env.VITE_KEY,
  "swedencentral",
);

// initialize SpeechSynthesizer
export const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

// get total questions from URL query parameter
const getQuestionsFromUrl = () => {
  if (typeof window === "undefined") return 20;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  return q && !isNaN(parseInt(q)) ? parseInt(q) : 20;
};

export const totalQuestionsAllowed = getQuestionsFromUrl();
