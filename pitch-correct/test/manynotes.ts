// Regression test for a real bug found against real-world input: the
// signalsmith-stretch WASM engine has an undocumented, fixed-size internal
// queue for pending schedule() calls (empirically ~24, see capacity.ts).
// Since offline rendering schedules an entire plan up front - nothing is
// "consumed" until startRendering() runs - any plan with more matched
// notes than that limit silently lost almost all of its audio: a real
// ~4.5 minute song with 610 notes rendered as ~97% silence. Fixed by
// rendering in chunks (src/audio/correctionEngine.ts). This test builds a
// plan well past the single-chunk limit and checks the *whole* duration,
// not just the start, both for presence of audio and for correct pitch -
// a chunk-boundary bug could produce non-silent but wrong audio.
//
// The CorrectionPlan is constructed directly (not via buildCorrectionPlan/
// DTW) so this only exercises chunked rendering: a long, pitch-varied note
// sequence gives DTW many equally-cheap pitch-class-tied alignment paths
// (which one it picks is a separate concern, covered by stress.ts and the
// full pipeline in harness.ts), and that ambiguity has nothing to do with
// what this test is checking.
import { renderCorrectedAudio, DEFAULT_ENGINE_OPTIONS } from "../src/audio/correctionEngine";
import { detectPitchTrack } from "../src/audio/pitchDetect";
import { hzToMidi, midiToHz } from "../src/audio/types";
import type { CorrectionPlan, CorrectionSegment } from "../src/audio/types";

const statusEl = document.getElementById("status")!;
const log = (m: string) => {
  console.log(m);
  statusEl.textContent += "\n" + m;
};

async function main() {
  const sampleRate = 44100;
  const noteDur = 0.4;
  const numNotes = 5 * DEFAULT_ENGINE_OPTIONS.maxSegmentsPerChunk + 7; // several chunks' worth, deliberately not a clean multiple

  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const targetMidis: number[] = [60];
  for (let i = 1; i < numNotes; i++) {
    const step = Math.round((rand() - 0.5) * 8); // +/-4 semitone steps
    targetMidis.push(Math.min(79, Math.max(48, targetMidis[i - 1] + (step === 0 ? 1 : step))));
  }

  // Sung source: each note's own short pure tone, deliberately flat by 1
  // semitone so a real correction is required, laid out back-to-back.
  const totalDuration = numNotes * noteDur;
  const length = Math.ceil(totalDuration * sampleRate);
  const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
  const inputBuffer = offlineCtx.createBuffer(1, length, sampleRate);
  const data = inputBuffer.getChannelData(0);
  const fadeSamples = Math.floor(0.01 * sampleRate);
  const segments: CorrectionSegment[] = [];
  for (let i = 0; i < numNotes; i++) {
    const start = i * noteDur;
    const end = start + noteDur;
    const sourceMidi = targetMidis[i] - 1;
    const freq = midiToHz(sourceMidi);
    const startSample = Math.floor(start * sampleRate);
    const endSample = Math.floor(end * sampleRate);
    for (let s = startSample; s < endSample && s < length; s++) {
      const tRel = (s - startSample) / sampleRate;
      let amp = 0.4;
      const df = s - startSample;
      const de = endSample - s;
      if (df < fadeSamples) amp *= df / fadeSamples;
      if (de < fadeSamples) amp *= de / fadeSamples;
      data[s] += amp * Math.sin(2 * Math.PI * freq * tRel);
    }
    segments.push({
      sungStart: start,
      sungEnd: end,
      outStart: start,
      outEnd: end,
      targetMidi: targetMidis[i],
      sourceMidi,
    });
  }

  const plan: CorrectionPlan = { segments, outputDuration: totalDuration };
  log(`built ${numNotes} explicit 1:1 segments over ${totalDuration.toFixed(1)}s (> single-chunk limit of ${DEFAULT_ENGINE_OPTIONS.maxSegmentsPerChunk})`);

  const corrected = await renderCorrectedAudio(inputBuffer, plan);
  const correctedData = corrected.getChannelData(0);
  log(`corrected duration=${corrected.duration.toFixed(1)}s`);

  let nanCount = 0;
  let clipCount = 0;
  for (let i = 0; i < correctedData.length; i++) {
    if (Number.isNaN(correctedData[i])) nanCount++;
    if (Math.abs(correctedData[i]) > 1) clipCount++;
  }
  log(`nanCount=${nanCount} clipCount=${clipCount}`);

  const rmsAt = (centerTime: number, windowSec = 0.2) => {
    const start = Math.max(0, Math.floor((centerTime - windowSec / 2) * corrected.sampleRate));
    const end = Math.min(correctedData.length, Math.floor((centerTime + windowSec / 2) * corrected.sampleRate));
    let sum = 0;
    for (let i = start; i < end; i++) sum += correctedData[i] * correctedData[i];
    return Math.sqrt(sum / Math.max(1, end - start));
  };

  const pitchAt = (centerTime: number, windowSec = 0.2) => {
    const start = Math.max(0, Math.floor((centerTime - windowSec / 2) * corrected.sampleRate));
    const end = Math.min(correctedData.length, Math.floor((centerTime + windowSec / 2) * corrected.sampleRate));
    const frame = correctedData.subarray(start, end);
    const frames = detectPitchTrack(frame, corrected.sampleRate, {
      frameSize: Math.min(2048, frame.length - 1),
      hopSize: 512,
      minHz: 70,
      maxHz: 1000,
      threshold: 0.15,
      silenceRms: 0.005,
    });
    const voiced = frames.filter((f) => f.frequency > 0);
    if (voiced.length === 0) return null;
    return hzToMidi(voiced[Math.floor(voiced.length / 2)].frequency);
  };

  // Check early, middle, AND late notes - not just the start. A chunk-
  // boundary bug (or the discovered capacity bug) could easily produce
  // correct audio in the first chunk and silence/garbage from the second
  // chunk onward, which only checking the start would miss entirely.
  const checkIndices = [2, Math.floor(numNotes * 0.25), Math.floor(numNotes * 0.5), Math.floor(numNotes * 0.75), numNotes - 3];
  let allOk = true;
  for (const idx of checkIndices) {
    const seg = segments[idx];
    const mid = (seg.outStart + seg.outEnd) / 2;
    const rms = rmsAt(mid);
    const measuredMidi = pitchAt(mid);
    const sustained = rms > 0.05;
    const inTune = measuredMidi != null && Math.abs(measuredMidi - (seg.targetMidi as number)) < 0.5;
    const ok = sustained && inTune;
    allOk = allOk && ok;
    log(
      `${ok ? "PASS" : "FAIL"} note ${idx}/${numNotes} at t=${mid.toFixed(1)}s: rms=${rms.toFixed(4)} ` +
        `midi=${measuredMidi?.toFixed(2) ?? "null"} expected=${seg.targetMidi} (sustained=${sustained} inTune=${inTune})`,
    );
  }

  const ok = allOk && nanCount === 0 && clipCount === 0;
  statusEl.setAttribute("data-done", ok ? "pass" : "fail");
}

main().catch((err) => {
  log("ERROR: " + (err instanceof Error ? err.stack : String(err)));
  statusEl.setAttribute("data-done", "fail");
});
