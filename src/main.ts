import { setupButton } from "./dm.js";

import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <div class="p-8">
      <button id="counter" type="button" class="cursor-pointer rounded-lg border border-transparent bg-[#f9f9f9] px-5 py-2.5 text-base font-medium transition-colors hover:border-[#646cff] hover:text-[#646cff] focus:outline-4 dark:bg-[#1a1a1a] dark:hover:border-[#646cff] dark:hover:text-[#646cff]">Start Dialogue</button>
    </div>
  </div>
`;

setupButton(document.querySelector<HTMLButtonElement>("#counter")!);
