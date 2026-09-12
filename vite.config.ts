import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH ?? "/miniflags",
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              test: /lib\/encoder/,
              name: "encoder",
            },
            {
              test: /lib\/renderer/,
              name: "renderer",
            },
            {
              test: /lib\/minidecode/,
              name: "minidecode",
            },
          ],
        },
      },
    },
  },
});
