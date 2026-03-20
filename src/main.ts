import { mount } from "svelte";

import App from "./App.svelte";

import "./style.css";

document.getElementById("cover")?.remove();

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
