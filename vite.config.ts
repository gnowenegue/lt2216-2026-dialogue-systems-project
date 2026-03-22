import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  resolve: {
    // path aliases for cleaner imports
    alias: {
      $lib: path.resolve("./src/lib"),
      $components: path.resolve("./src/components"),
    },
  },
});
