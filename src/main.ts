import { createBrowserInspector } from "@statelyai/inspect";
import { createActor } from "xstate";
import { dmMachine } from "./dm";
import "./style.css";

document.getElementById("cover")?.remove();

const inspector = createBrowserInspector();
// const inspector = createBrowserInspector({
//   filter: (inspectEvent: any) => {
//     if (
//       inspectEvent.type === "@xstate.event" &&
//       !inspectEvent.event?.type.includes("xstate")
//     ) {
//       console.log("🖥️ [DM] Event:", inspectEvent.event);
//     }
//     return true;
//   },
// });

const dmActor = createActor(dmMachine, { inspect: inspector.inspect }).start();

dmActor.subscribe((snapshot) => {
  console.group("State update");
  console.log("DM State:", snapshot.value);
  console.log("DM Context:", snapshot.context);
  console.groupEnd();
});

const gameButton = document.getElementById("game");
const skipButton = document.getElementById("skip");

const speechStateMeta = document.getElementById("spst-meta");
const speechStateMetaValue = speechStateMeta?.querySelector("span");

const questionsRemaining = document.getElementById("questions-remaining");
const questionsRemainingValue = questionsRemaining?.querySelector("span");

const rules = document.getElementById("rules");

gameButton?.addEventListener("click", () => {
  dmActor.send({ type: "CLICK" });

  gameButton.classList.add("hidden");
});

skipButton?.addEventListener("click", () => {
  dmActor.send({ type: "SPEAK_COMPLETE" });
});

let gameLoaded = false;

dmActor.subscribe((snapshot) => {
  const { context } = snapshot;
  const spstSnap = context.spstRef.getSnapshot();

  const metaValues = Object.values(
    spstSnap.getMeta() as Record<string, { view?: string }>,
  );
  const metaView = metaValues[0]?.view;

  // 1. Initial Load State
  if (!gameLoaded && metaView === "idle" && gameButton) {
    gameLoaded = true;
    gameButton.innerText = "Start Game";
    gameButton.removeAttribute("disabled"); // Much cleaner than attributes.removeNamedItem
  }

  // 2. Update Mic Status Text
  const statusMessages: Record<string, string> = {
    recognising: "You can speak now",
    speaking: "Hold on...",
    idle: "Off",
  };

  if (metaView && statusMessages[metaView] && speechStateMetaValue) {
    speechStateMetaValue.innerText = statusMessages[metaView];
    speechStateMetaValue.classList.toggle(
      "text-green-500",
      metaView === "recognising",
    );
    speechStateMetaValue.classList.toggle(
      "text-red-500",
      metaView !== "recognising",
    );
  }

  // 3. Update Questions Counter
  if (questionsRemainingValue) {
    questionsRemainingValue.innerText = context.questionsRemaining.toString();
  }

  // 4. Manage UI Visibility
  questionsRemaining?.classList.toggle("hidden", !snapshot.matches("Game"));
  rules?.classList.toggle(
    "hidden",
    !(snapshot.matches("Greeting") || snapshot.matches("Game")),
  );
  skipButton?.classList.toggle("hidden", !snapshot.matches({ Greeting: "Prompt" }));

  if (snapshot.matches("Done")) {
    gameButton?.classList.remove("hidden");
  }
});
