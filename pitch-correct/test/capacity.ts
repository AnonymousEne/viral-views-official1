// Characterizes and guards the specific bug behind manynotes.ts: the
// signalsmith-stretch WASM engine has an undocumented, fixed-size internal
// queue for pending schedule() calls. Scheduling more points than it can
// hold - before any of them have been "consumed" by actual playback, which
// is exactly what happens when an OfflineAudioContext schedules an entire
// plan up front - silently evicts the whole earlier backlog instead of
// erroring, so all but the last few scheduled points render as silence.
// Empirically the limit is ~24 concurrent points (see git history for the
// original bisection across N=5..200). This test asserts our chosen safety
// margin (DEFAULT_ENGINE_OPTIONS.maxSegmentsPerChunk, currently 16) stays
// safely under whatever that limit actually is - if this starts failing
// after a signalsmith-stretch upgrade, the margin needs revisiting.
import SignalsmithStretch from "signalsmith-stretch";
import { DEFAULT_ENGINE_OPTIONS } from "../src/audio/correctionEngine";

const statusEl = document.getElementById("status")!;
const log = (m: string) => {
  console.log(m);
  statusEl.textContent += "\n" + m;
};

async function firstSurvivingSegmentIndex(numSegments: number): Promise<number> {
  const sampleRate = 44100;
  const segDur = 0.4;
  const length = Math.ceil(numSegments * segDur * sampleRate);

  const srcSeconds = 10;
  const srcBuf = new Float32Array(Math.ceil(srcSeconds * sampleRate));
  for (let i = 0; i < srcBuf.length; i++) srcBuf[i] = 0.3 * Math.sin((2 * Math.PI * 220 * i) / sampleRate);

  const offlineCtx = new OfflineAudioContext(1, length + Math.ceil(sampleRate), sampleRate);
  const node = await SignalsmithStretch(offlineCtx, { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
  await node.addBuffers([srcBuf]);
  node.connect(offlineCtx.destination);

  for (let k = 0; k < numSegments; k++) {
    const output = k * segDur;
    const input = (k * segDur) % (srcSeconds - segDur);
    await node.schedule({ output, active: true, input, rate: 1, semitones: 0, loopStart: input, loopEnd: input });
  }

  const rendered = await offlineCtx.startRendering();
  const data = rendered.getChannelData(0);
  const win = Math.floor(0.05 * sampleRate);
  for (let start = 0; start < data.length; start += win) {
    const end = Math.min(data.length, start + win);
    let s = 0;
    for (let i = start; i < end; i++) s += data[i] * data[i];
    if (Math.sqrt(s / (end - start)) > 0.01) return Math.round(start / sampleRate / segDur);
  }
  return -1;
}

async function main() {
  const safeCount = DEFAULT_ENGINE_OPTIONS.maxSegmentsPerChunk + 1; // +1 for the chunk's own lead-in point
  const firstIdx = await firstSurvivingSegmentIndex(safeCount);
  const ok = firstIdx === 0;
  log(
    `${ok ? "PASS" : "FAIL"} all ${safeCount} points survived (maxSegmentsPerChunk=${DEFAULT_ENGINE_OPTIONS.maxSegmentsPerChunk} + margin): ` +
      `first sound at segment index ${firstIdx}`,
  );

  statusEl.setAttribute("data-done", ok ? "pass" : "fail");
}

main().catch((err) => {
  log("ERROR: " + (err instanceof Error ? err.stack : String(err)));
  statusEl.setAttribute("data-done", "fail");
});
