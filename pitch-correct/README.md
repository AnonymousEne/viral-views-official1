# Pitch Correct

A standalone, browser-based audio pitch correction app. Give it a vocal take
and a reference MIDI melody, and it snaps the take's pitch and timing onto
the MIDI notes — pitch-class-accurate, register-preserving, click-free.

It's a self-contained package (its own `package.json`/build, no dependency
on the rest of this repo) so it can be lifted out into its own repo later
with a plain copy.

## Try it now

**[Live demo (single-file build)](https://claude.ai/code/artifact/cd5dbe20-e0b2-4e5c-af6c-d94786a57998)**
— private by default; share it from the page's share menu if you want to
send it to someone. Works fully for the core flow: upload a vocal
recording + a `.mid` reference, hit **Snap to MIDI**, download the
corrected WAV. Everything runs client-side in your browser; no audio or
MIDI data leaves your machine.

**Not available in that embedded preview:** the mic-based "Record from
mic" button and the "Live monitor" tab, because they need microphone
access, which browsers only grant to a page running as a real top-level
site (a `https://`/`http://localhost` origin), not inside a sandboxed
iframe preview. Run it locally (`npm run dev`, below) to use those — file
upload works everywhere, including the embedded preview.

## How it works

1. **MIDI parsing** (`src/audio/midi.ts`, via `@tonejs/midi`) — reads the
   reference `.mid` file into a flat, monophonic, time-sorted note timeline.
2. **Pitch detection** (`src/audio/pitchDetect.ts`) — a from-scratch YIN
   (autocorrelation) pitch tracker, run in a Web Worker so long takes don't
   freeze the UI. Frames are grouped into discrete sung notes.
3. **Alignment** (`src/audio/align.ts`) — dynamic time warping matches sung
   notes to target MIDI notes using octave-invariant pitch-class distance,
   so a singer performing in a different octave than the reference still
   aligns correctly. Each sung note is snapped to the *nearest octave* of
   its matched target (keeps the singer's register, corrects the pitch
   class) — the classic "target note" behavior of pitch-correction tools.
4. **Rendering** (`src/audio/correctionEngine.ts`) — uses
   [`signalsmith-stretch`](https://signalsmith-audio.co.uk/code/stretch/)
   (WASM, MIT-licensed, formant-aware) inside an `OfflineAudioContext`.
   Each matched segment is time-stretched to exactly fill its target
   window and pitch-shifted onto the target note. Regions outside any
   matched segment (lead-in, trailing audio, rests in the MIDI) render as
   silence, via a downstream `GainNode`'s native `AudioParam` automation —
   **not** the stretch node's own `active` flag. See the note below.
5. **Live monitor** (`src/audio/liveEngine.ts`) — a real-time bonus mode:
   sings along to a MIDI transport with live pitch-only correction (timing
   can't be corrected live, since that requires knowing audio that hasn't
   been sung yet).

## Known quirks (already worked around)

- **`signalsmith-stretch`'s `active: false` bug.** Calling
  `AudioWorkletNode.schedule({active: false, ...})` *after* an earlier
  `active: true` schedule point silences the **entire** render, not just
  the region after that point. Found by bisecting with an isolated
  headless-Chromium test (`test/harness3.ts` during development, since
  removed — see git history to reproduce). Worked around by keeping the
  stretch node `active: true` for the whole render and doing all muting
  with a normal Web Audio `GainNode` + `AudioParam` automation downstream.
  Worth re-testing if you upgrade `signalsmith-stretch`.
- **One literal U+FFFD in the bundled WASM glue code.** The Emscripten
  UTF-8 decoder inside `signalsmith-stretch` has a legitimate string
  literal containing the Unicode replacement character (its own fallback
  for malformed input). Harmless at runtime, but some content scanners
  (including the one behind the live demo link above) reject any file
  containing that literal codepoint. `scripts/fix-replacement-char.mjs`
  runs after the single-file build and swaps the raw character for the
  equivalent `�` JS escape — byte-different, behavior-identical.

## Development

```sh
npm install
npm run dev             # Vite dev server (full app, including mic/live mode)
npm run check           # tsc --noEmit
npm run build            # normal multi-file production build -> dist/
npm run build:singlefile # single self-contained HTML file -> dist-singlefile/
npm run test:e2e         # pipeline smoke test in headless Chromium
npm run test:ui          # (see below) drives the real UI with real file uploads
```

`test:e2e` boots its own Vite dev server, loads `test/harness.html`, and
drives the entire MIDI → pitch-detect → align → render pipeline directly
(calling the audio modules, not the UI) against a synthesized (deliberately
mistuned/mistimed) vocal take, asserting the output lands within half a
semitone of each target note and is silent outside the matched range.

`npm run test:ui` goes one level up: it generates real WAV/MIDI fixture
files, serves the actual
`dist-singlefile/index.html` production build over HTTP, and drives it
through Playwright exactly like a user would — clicks the real upload
inputs, clicks the real "Snap to MIDI" button, and asserts the real result
panel and download link appear, with zero console errors. Run
`npm run build:singlefile` first.

Both test scripts need a real Chromium (AudioWorklet/WASM don't run under
jsdom) — set `PLAYWRIGHT_CHROMIUM_PATH` if Playwright's own browser
download isn't available in your environment.

## What's not done yet

- No automated test of `liveEngine.ts` (real-time mode) — the offline
  pipeline and the upload-through-download UI flow are both covered
  end-to-end; live mode was validated only by reasoning from the same
  (now-tested) scheduling primitives, not a dedicated test.
- No cross-browser check beyond headless Chromium.
- `npm audit` reports a few moderate/high advisories, all inside
  `vitest`'s bundled dev-only `esbuild`/`vite` (dev-server request
  spoofing) — not part of the shipped bundle, low priority.
- The `vitest` unit-test runner is wired up (`npm test`) but no unit tests
  have been written yet; today's coverage is the two Playwright-driven
  smoke tests above.
