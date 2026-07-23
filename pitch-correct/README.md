# Pitch Correct

A standalone, browser-based audio pitch correction app. Give it a vocal take
and a reference MIDI melody, and it snaps the take's pitch and timing onto
the MIDI notes — pitch-class-accurate, register-preserving, click-free.

It's a self-contained package (its own `package.json`/build, no dependency
on the rest of this repo) so it can be lifted out into its own repo later
with a plain copy.

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

## Known library quirk (already worked around)

`signalsmith-stretch`'s `AudioWorkletNode.schedule({active: false, ...})`,
when called *after* an earlier `active: true` schedule point, silences the
**entire** render — not just the region after that point. Confirmed via
`test/harness3.ts` during development (since removed; see git history if
you want to reproduce it). The engine works around this by keeping the
stretch node `active: true` for the whole render and doing all muting with
a normal Web Audio `GainNode` + `AudioParam` automation downstream. If you
upgrade `signalsmith-stretch`, it's worth re-testing whether this is still
needed.

## Development

```sh
npm install
npm run dev      # Vite dev server
npm run check    # tsc --noEmit
npm run build    # production build (dist/)
npm run test:e2e # full pipeline smoke test in headless Chromium
```

`test:e2e` boots its own Vite dev server, loads `test/harness.html`, and
drives the entire MIDI → pitch-detect → align → render pipeline against a
synthesized (deliberately mistuned/mistimed) vocal take, asserting the
output lands within half a semitone of each target note and is silent
outside the matched range. It needs a real Chromium (AudioWorklet/WASM
don't run under jsdom) — set `PLAYWRIGHT_CHROMIUM_PATH` if Playwright's own
browser download isn't available in your environment.

## What's not done yet

- No automated test of `liveEngine.ts` (real-time mode) — the offline
  pipeline is fully covered, live mode was validated only by reasoning
  from the same (now-tested) scheduling primitives, not a dedicated test.
- No UI polish pass / cross-browser check beyond headless Chromium.
- `npm audit` reports a few moderate/high advisories, all inside
  `vitest`'s bundled dev-only `esbuild`/`vite` (dev-server request
  spoofing) — not part of the shipped bundle, low priority.
- The `vitest` unit-test runner is wired up (`npm test`) but no unit tests
  have been written yet; today's only coverage is the e2e smoke test.
