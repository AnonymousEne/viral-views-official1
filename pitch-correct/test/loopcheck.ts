import { buildCorrectionPlan } from "../src/audio/align";
import { renderCorrectedAudio } from "../src/audio/correctionEngine";
import { detectPitchTrack } from "../src/audio/pitchDetect";
import { hzToMidi, midiToHz } from "../src/audio/types";
import type { SungNote, TargetNote } from "../src/audio/types";

const statusEl = document.getElementById("status")!;
const log = (m: string) => {
  console.log(m);
  statusEl.textContent += "\n" + m;
};

async function main() {
  const sampleRate = 44100;

  // A 150ms sung blip at midi 60, matched to a 3-second target note - the
  // "loop to sustain" path in buildSchedule() should kick in here.
  const blipDuration = 0.15;
  const blipMidi = 60.2;
  const targetMidi = 60;
  const targetDuration = 3.0;

  const length = Math.ceil((blipDuration + 0.1) * sampleRate);
  const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
  const inputBuffer = offlineCtx.createBuffer(1, length, sampleRate);
  const data = inputBuffer.getChannelData(0);
  const freq = midiToHz(blipMidi);
  const fadeSamples = Math.floor(0.01 * sampleRate);
  const blipSamples = Math.floor(blipDuration * sampleRate);
  for (let i = 0; i < blipSamples; i++) {
    let amp = 0.35;
    if (i < fadeSamples) amp *= i / fadeSamples;
    if (i > blipSamples - fadeSamples) amp *= (blipSamples - i) / fadeSamples;
    data[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }

  const sungNotes: SungNote[] = [{ startTime: 0, endTime: blipDuration, midi: blipMidi, frames: [] }];
  const targetNotes: TargetNote[] = [{ startTime: 0, endTime: targetDuration, midi: targetMidi, velocity: 0.8 }];
  const plan = buildCorrectionPlan(sungNotes, targetNotes);

  log(`plan segments=${plan.segments.length} outputDuration=${plan.outputDuration}`);

  const corrected = await renderCorrectedAudio(inputBuffer, plan);
  const correctedData = corrected.getChannelData(0);
  log(`corrected duration=${corrected.duration.toFixed(2)}s`);

  const rmsAt = (t: number, win = 0.15) => {
    const start = Math.max(0, Math.floor((t - win / 2) * corrected.sampleRate));
    const end = Math.min(correctedData.length, Math.floor((t + win / 2) * corrected.sampleRate));
    let s = 0;
    for (let i = start; i < end; i++) s += correctedData[i] * correctedData[i];
    return Math.sqrt(s / Math.max(1, end - start));
  };

  const pitchAt = (t: number, win = 0.15) => {
    const start = Math.max(0, Math.floor((t - win / 2) * corrected.sampleRate));
    const end = Math.min(correctedData.length, Math.floor((t + win / 2) * corrected.sampleRate));
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

  let allOk = true;
  for (const t of [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 2.9]) {
    const rms = rmsAt(t);
    const midi = pitchAt(t);
    const sustained = rms > 0.05;
    const inTune = midi != null && Math.abs(midi - targetMidi) < 0.5;
    const ok = sustained && inTune;
    allOk = allOk && ok;
    log(`${ok ? "PASS" : "FAIL"} t=${t.toFixed(1)}s rms=${rms.toFixed(4)} midi=${midi?.toFixed(2) ?? "null"} (sustained=${sustained} inTune=${inTune})`);
  }

  statusEl.setAttribute("data-done", allOk ? "pass" : "fail");
}

main().catch((err) => {
  log("ERROR: " + (err instanceof Error ? err.stack : String(err)));
  statusEl.setAttribute("data-done", "fail");
});
