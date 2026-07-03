import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the repo name so built asset URLs resolve correctly
// under GitHub Pages at brad.tj/natal-quiz (not brad.tj/).
export default defineConfig({
  base: "/natal-quiz/",
  plugins: [react()],
});
