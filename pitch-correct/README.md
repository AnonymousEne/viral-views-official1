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
   **not** the stretch node's own `active` flag. A sung note far shorter
   than its target window is looped (via the node's native `loopStart`/
   `loopEnd`) to sustain naturally instead of being stretched to mush; one
   far longer than its target window is capped at a sane speed-up rather
   than played back unnaturally fast. See the note below.
5. **Live monitor** (`src/audio/liveEngine.ts`) — a real-time bonus mode:
   sings along to a MIDI transport with live pitch-only correction (timing
   can't be corrected live, since that requires knowing audio that hasn't
   been sung yet).

## Known quirks (already worked around)

- **YIN difference-function range bug (real accuracy bug, fixed).** The
  original pitch tracker computed YIN's difference function only across
  `[tauMin, tauMax]` (the configured pitch-search range) instead of from
  `tau=1`. That breaks the algorithm's cumulative-mean normalization,
  which depends on the full low-lag history to suppress octave/harmonic
  errors — in practice it caused wrong-octave and harmonic-locked pitch
  estimates on harmonically rich signals, worse at higher pitches (i.e.
  worse for a lot of female voices). Found via `test/accuracy.ts`, a
  battery of synthesized voice-like signals (harmonics + vibrato + breath
  noise across the vocal range) that failed badly before the fix and pass
  within a few cents after it. Fixed by computing the difference function
  over the full range and only restricting the *search* for a minimum to
  `[tauMin, tauMax]`.
- **Extreme stretch ratios (real robustness gap, fixed).** A sung note far
  shorter or far longer than its matched target window used to demand an
  extreme, audibly-broken stretch factor (tens of x in either direction).
  `correctionEngine.ts`'s `buildSchedule()` now clamps this via
  `maxStretchRate` (default 3x): too-long sources get capped and trimmed;
  too-short sources loop instead of stretching. Verified against the real
  WASM engine in `test/loopcheck.ts` and stress-tested against several
  sung/target mismatch shapes in `test/stress.ts`.
- **Sung-note over-splitting into sub-millisecond fragments (real bug,
  fixed).** When one short sung note got DTW-matched to many target notes
  (routine when the MIDI reference is much denser than the actual take -
  e.g. an auto-transcribed reference with hundreds of notes against a
  singer who produced far fewer), `align.ts` used to slice that note's
  audio *proportionally* across all of them. With a large target:sung
  ratio this produced source fragments under a single millisecond -
  shorter than one pitch period for any vocal frequency, so the stretch
  engine had no coherent waveform to loop or shift, rendering silence or
  buzzing garbage. Found against a real ~4.5 minute song (610 dense
  auto-transcribed target notes, 169 actual sung notes): 336 of 610
  segments had source fragments under 20ms, some under 1ms. Fixed by
  reusing the *whole* sung note for every target it's matched to instead
  of slicing it, and leaning on the loop/clamp handling above for whatever
  duration mismatch results per target - the same "hold this syllable
  across these notes" a human engineer would do by ear.
- **signalsmith-stretch's internal schedule queue silently drops events
  past ~24 pending (real bug, fixed - the big one).** The engine has an
  undocumented, fixed-size internal queue for pending `schedule()` calls.
  Scheduling a point before the engine has "consumed" (played through) an
  earlier one - which is exactly what happens in offline rendering, since
  the whole plan is scheduled up front before `startRendering()` ever
  runs - silently evicts the entire earlier backlog once the queue fills,
  with no error, no rejected promise, nothing. On the same real song
  above (610 matched notes), only the *last ~15* scheduled points survived
  and rendered; the preceding ~97% of the song was pure silence. Bisected
  the exact capacity empirically (`git log` for the original N=5..200
  sweep) and fixed by rendering in chunks of `maxSegmentsPerChunk` (16,
  safely under the ~24 limit) - each chunk gets its own fresh stretch-node
  instance, and the resulting buffers are concatenated. `capacity.ts`
  guards the safety margin; `manynotes.ts` regression-tests that a
  real-world-scale plan renders correct audio across its *entire*
  duration, not just the first chunk.
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
npm run test:live        # (see below) drives the real Live Monitor tab with a fake mic
```

`test:e2e` boots its own Vite dev server and runs six browser-based
pages in headless Chromium (calling the audio modules directly, not the
UI):
- `harness.html` — full MIDI → pitch-detect → align → render pipeline
  against a synthesized mistuned/mistimed take.
- `accuracy.html` — YIN pitch-tracker accuracy across the vocal range
  (harmonics, vibrato, breath noise); this is what caught the difference-
  function bug above.
- `stress.html` — alignment-plan sanity under mismatched note counts
  (skipped notes, ad-libs, severe under/over-singing).
- `loopcheck.html` — the loop-to-sustain fallback for a short sung note
  matched to a much longer target note.
- `capacity.html` — guards the safety margin against signalsmith-stretch's
  undocumented internal schedule-queue capacity limit.
- `manynotes.html` — a real-world-scale plan (well past the single-chunk
  limit) renders correctly-pitched audio across its *entire* duration;
  this is what caught the schedule-queue bug above.

`npm run test:ui` goes one level up: it generates real WAV/MIDI fixture
files, serves the actual `dist-singlefile/index.html` production build
over HTTP, and drives it through Playwright exactly like a user would —
clicks the real upload inputs, clicks the real "Snap to MIDI" button, and
asserts the real result panel and download link appear, with zero console
errors. Run `npm run build:singlefile` first.

`npm run test:live` drives the real Live Monitor tab against the real
engine: it uses Chromium's `--use-file-for-fake-audio-capture` to feed a
synthesized, known-pitch tone (A3) as the "microphone" input, loads a
one-note MIDI reference (C4) into the real UI, clicks the real "Start
singing" button, and reads the real on-screen status readout to confirm
the live engine actually detects A3 and computes the correct +3 semitone
correction — not a simulation of the code path, the actual getUserMedia →
AnalyserNode → YIN → signalsmith-stretch pipeline running live.

All test scripts need a real Chromium (AudioWorklet/WASM don't run under
jsdom) — set `PLAYWRIGHT_CHROMIUM_PATH` if Playwright's own browser
download isn't available in your environment. **They only run against
Chromium in this environment** (no Firefox/Safari binaries are installed
here) — Firefox and Safari both support AudioWorklet/WASM/WebAudio, but
I haven't been able to verify this app against them.

## What's not done yet

- **No Firefox/Safari testing.** Everything here — offline pipeline,
  pitch-tracker accuracy, alignment robustness under mismatched note
  counts, the loop/clamp fallback, live mode, and the full upload-through-
  download UI flow — is verified against the real engine in headless
  Chromium, because that's the only browser binary available in the
  environment this was built in. If you hit something that only breaks in
  Firefox or Safari, that's the gap to check first.
- `npm audit` reports a few moderate/high advisories, all inside
  `vitest`'s bundled dev-only `esbuild`/`vite` (dev-server request
  spoofing) — not part of the shipped bundle, low priority.
- The `vitest` unit-test runner is wired up (`npm test`) but no unit tests
  have been written yet; today's coverage is the Playwright-driven smoke
  tests above.
- Mic access inside the embedded artifact preview is blocked by the
  browser's Permissions Policy for cross-origin iframes (see "Try it now"
  above) — this is a platform constraint the app can't override from
  inside the page, not a bug in this code. When mic access is denied, the
  UI now explains why and points at "Upload audio file" instead of
  showing a raw browser error (`src/util/micError.ts`).
