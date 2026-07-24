import { parseMidiTargets } from "../src/audio/midi";
import { detectPitchTrackAsync, segmentIntoNotes, detectPitchTrack } from "../src/audio/pitchDetect";
import { buildCorrectionPlan } from "../src/audio/align";
import { renderCorrectedAudio } from "../src/audio/correctionEngine";
import { audioBufferToWav, decodeAudioFile } from "../src/audio/wav";
import { hzToMidi } from "../src/audio/types";
import { TARGET_SPEC, buildTargetMidiArrayBuffer, synthesizeSungBuffer, SUNG_TOTAL_DURATION } from "./synth";

const statusEl = document.getElementById("status")!;
const log = (msg: string) => {
  console.log(msg);
  statusEl.textContent += `\n${msg}`;
};

interface HarnessResult {
  ok: boolean;
  error?: string;
  checks: Array<{ name: string; pass: boolean; detail: string }>;
}

async function main(): Promise<HarnessResult> {
  const checks: HarnessResult["checks"] = [];
  const check = (name: string, pass: boolean, detail: string) => {
    checks.push({ name, pass, detail });
    log(`${pass ? "PASS" : "FAIL"} ${name}: ${detail}`);
  };

  const sampleRate = 44100;
  const targetSpec = TARGET_SPEC;

  // --- Build a synthetic reference MIDI (3 notes: C4, E4, G4) ---
  const midiArrayBuffer = buildTargetMidiArrayBuffer();

  const targetNotes = await parseMidiTargets(midiArrayBuffer);
  check(
    "MIDI parse round-trip",
    targetNotes.length === 3 && targetNotes.every((n, i) => n.midi === targetSpec[i].midi),
    JSON.stringify(targetNotes),
  );

  // --- Synthesize a deliberately mistuned, mistimed "sung" take ---
  // Sung note i is offset from the target by a fixed number of semitones and
  // a small timing shift, so we can verify both pitch AND timing correction.
  const sungBuffer = synthesizeSungBuffer(sampleRate);
  const data = sungBuffer.getChannelData(0);

  check("Synthetic sung buffer non-silent", data.some((v) => Math.abs(v) > 0.05), `duration=${SUNG_TOTAL_DURATION}s`);

  // --- Round-trip through WAV encode/decode, exercising the real upload path ---
  const wavBlob = audioBufferToWav(sungBuffer);
  const decodeCtx = new AudioContext();
  const decoded = await decodeAudioFile(wavBlob, decodeCtx);
  check(
    "WAV round-trip duration",
    Math.abs(decoded.duration - sungBuffer.duration) < 0.02,
    `original=${sungBuffer.duration.toFixed(3)} decoded=${decoded.duration.toFixed(3)}`,
  );

  // --- Pitch detection + segmentation ---
  const pitchFrames = await detectPitchTrackAsync(decoded.getChannelData(0), decoded.sampleRate);
  const sungNotes = segmentIntoNotes(pitchFrames);
  check(
    "Segmented 3 sung notes",
    sungNotes.length === 3,
    `got ${sungNotes.length}: ${sungNotes.map((n) => n.midi.toFixed(2)).join(", ")}`,
  );

  // --- Alignment plan ---
  const plan = buildCorrectionPlan(sungNotes, targetNotes);
  check("Plan has 3 segments", plan.segments.length === 3, `got ${plan.segments.length}`);
  check(
    "Plan output duration matches last target end",
    Math.abs(plan.outputDuration - targetSpec[targetSpec.length - 1].time - targetSpec[targetSpec.length - 1].duration) < 1e-6,
    `outputDuration=${plan.outputDuration}`,
  );

  // --- Render corrected audio ---
  const corrected = await renderCorrectedAudio(decoded, plan);
  check(
    "Corrected buffer duration >= target duration",
    corrected.duration >= plan.outputDuration,
    `corrected=${corrected.duration.toFixed(3)} target=${plan.outputDuration.toFixed(3)}`,
  );

  const correctedData = corrected.getChannelData(0);

  const rmsAt = (centerTime: number, windowSec = 0.08) => {
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

  // Check pitch snapped near each target note's midpoint.
  for (const target of targetSpec) {
    const mid = target.time + target.duration / 2;
    const measured = pitchAt(mid);
    const withinTolerance = measured != null && Math.abs(measured - target.midi) < 0.5;
    check(
      `Corrected pitch near target ${target.midi} at t=${mid.toFixed(2)}`,
      withinTolerance,
      `measured=${measured?.toFixed(2) ?? "null"}`,
    );
  }

  // Check silence outside the matched range (after the last target note).
  const tailRms = rmsAt(plan.outputDuration + 0.2, 0.1);
  check("Silence after last target note", tailRms < 0.02, `rms=${tailRms.toFixed(4)}`);

  const ok = checks.every((c) => c.pass);
  return { ok, checks };
}

main()
  .then((result) => {
    (window as unknown as { __harnessResult: HarnessResult }).__harnessResult = result;
    statusEl.setAttribute("data-done", result.ok ? "pass" : "fail");
  })
  .catch((err) => {
    const message = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    log(`ERROR: ${message}`);
    (window as unknown as { __harnessResult: HarnessResult }).__harnessResult = {
      ok: false,
      error: message,
      checks: [],
    };
    statusEl.setAttribute("data-done", "fail");
  });
