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

const speechStateMeta = document.getElementById("spst-meta");
const speechStateMetaValue = speechStateMeta?.querySelector("span");

const questionsRemaining = document.getElementById("questions-remaining");
const questionsRemainingValue = questionsRemaining?.querySelector("span");

const rules = document.getElementById("rules");

gameButton?.addEventListener("click", () => {
  dmActor.send({ type: "CLICK" });

  gameButton.classList.add("hidden");
});

let gameLoaded = false;

dmActor.subscribe((snapshot) => {
  const spstSnap = snapshot.context.spstRef.getSnapshot();

  const metaValues = Object.values(
    spstSnap.getMeta() as Record<string, { view?: string }>,
  );
  const meta = metaValues[0];

  if (!gameLoaded && meta.view === "idle") {
    gameLoaded = true;
    gameButton!.innerText = "Start Game";
    gameButton?.attributes.removeNamedItem("disabled");
  }

  if (meta.view === "recognising") {
    speechStateMetaValue!.innerText = "You can speak now";
  }

  if (meta.view === "speaking") {
    speechStateMetaValue!.innerText = "Hold on...";
  }

  questionsRemainingValue!.innerText =
    snapshot.context.questionsRemaining.toString();

  if (snapshot.matches("Game")) {
    questionsRemaining?.classList.remove("hidden");
  } else {
    questionsRemaining?.classList.add("hidden");
  }

  if (snapshot.matches("Greeting") || snapshot.matches("Game")) {
    rules?.classList.remove("hidden");
  } else {
    rules?.classList.add("hidden");
  }

  if (snapshot.matches({ Greeting: "Prompt" })) {
    gameButton?.classList.remove("hidden");
  }
});
