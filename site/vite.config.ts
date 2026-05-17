import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  server: {
    host: true, // bind to 0.0.0.0 — allows access from phone on same WiFi
  },
});
