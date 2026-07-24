import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Produces one self-contained dist-singlefile/index.html with all JS/CSS
// inlined (the WASM pitch-shift engine is already embedded as base64 inside
// its own JS, and the pitch-detection worker is inlined via `?worker&inline`
// in pitchDetect.ts) - no external requests at all, so it can be dropped
// anywhere (a static host, a sandboxed preview, a USB stick) and just work.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: "esnext",
    outDir: "dist-singlefile",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
