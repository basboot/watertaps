import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: "src/background.js",
        "read-jwt": "src/read-jwt.js",
        "show-alert": "src/show-alert.js",
      },
      output: {
        entryFileNames: "assets/[name].js",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  publicDir: "public",
});
