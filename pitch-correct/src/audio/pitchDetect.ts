import type { PitchFrame, SungNote } from "./types";
import { hzToMidi } from "./types";
// `?worker&inline` bundles the worker as an inlined base64 data URL instead
// of a separate chunk, so the whole app (including this worker) can ship as
// a single self-contained HTML file.
import PitchWorker from "./pitchWorker?worker&inline";

export interface PitchDetectOptions {
  frameSize: number;
  hopSize: number;
  minHz: number;
  maxHz: number;
  /** YIN absolute threshold; lower = stricter voicing decision. */
  threshold: number;
  /** Frames quieter than this (RMS, linear 0-1) are treated as unvoiced/silence. */
  silenceRms: number;
}

export const DEFAULT_PITCH_OPTIONS: PitchDetectOptions = {
  frameSize: 2048,
  hopSize: 512,
  minHz: 70, // ~D2, covers low male voice
  maxHz: 1000, // ~B5, covers high female/falsetto
  threshold: 0.15,
  silenceRms: 0.01,
};

/**
 * Single-frame YIN pitch estimate. Returns null if no reliable period is found.
 */
export function yinFrame(
  frame: Float32Array,
  sampleRate: number,
  opts: PitchDetectOptions,
): { frequency: number; clarity: number } | null {
  const tauMin = Math.max(2, Math.floor(sampleRate / opts.maxHz));
  const tauMax = Math.min(frame.length - 1, Math.floor(sampleRate / opts.minHz));
  if (tauMax <= tauMin) return null;

  // Step 1: difference function d(tau), computed from tau=1 (not tauMin).
  // YIN's cumulative-mean normalization (step 2) needs the full low-lag
  // history to correctly suppress octave/harmonic errors - starting the
  // computation at tauMin instead of 1 breaks that and makes the tracker
  // prone to locking onto a harmonic instead of the true fundamental,
  // especially on higher/harmonically-rich voices. tauMin only bounds the
  // *search* for a minimum (step 3), not the difference function itself.
  const diff = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    const n = frame.length - tau;
    for (let j = 0; j < n; j++) {
      const delta = frame[j] - frame[j + tau];
      sum += delta * delta;
    }
    diff[tau] = sum;
  }

  // Step 2: cumulative mean normalized difference function, over the full range.
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    runningSum += diff[tau];
    cmnd[tau] = (diff[tau] * tau) / runningSum;
  }

  // Step 3: absolute threshold - find first local minimum below threshold,
  // restricted to the [tauMin, tauMax] window (our configured pitch range).
  let bestTau = -1;
  for (let tau = Math.max(tauMin, 1); tau < tauMax; tau++) {
    if (cmnd[tau] < opts.threshold && cmnd[tau] < cmnd[tau - 1] && cmnd[tau] <= cmnd[tau + 1]) {
      bestTau = tau;
      break;
    }
  }
  // Fallback: global minimum within the search window, if nothing crossed the threshold.
  if (bestTau === -1) {
    let minVal = Infinity;
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (cmnd[tau] < minVal) {
        minVal = cmnd[tau];
        bestTau = tau;
      }
    }
  }
  if (bestTau === -1) return null;

  // Step 4: parabolic interpolation around bestTau for sub-sample precision.
  let betterTau = bestTau;
  const x0 = bestTau > 1 ? bestTau - 1 : bestTau;
  const x2 = bestTau + 1 <= tauMax ? bestTau + 1 : bestTau;
  if (x0 !== bestTau && x2 !== bestTau) {
    const s0 = cmnd[x0];
    const s1 = cmnd[bestTau];
    const s2 = cmnd[x2];
    const denom = 2 * s1 - s2 - s0;
    if (Math.abs(denom) > 1e-12) {
      betterTau = bestTau + (s2 - s0) / (2 * denom);
    }
  }

  const clarity = 1 - Math.min(1, Math.max(0, cmnd[bestTau]));
  const frequency = sampleRate / betterTau;
  return { frequency, clarity };
}

export function rms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  return Math.sqrt(sum / frame.length);
}

/**
 * Single-shot pitch estimate for one frame of live audio (e.g. sampled from
 * an AnalyserNode), used by the real-time monitor. Returns null if the
 * frame is silent/unvoiced.
 */
export function detectPitchSingleFrame(
  frame: Float32Array,
  sampleRate: number,
  opts: PitchDetectOptions = DEFAULT_PITCH_OPTIONS,
): { frequency: number; clarity: number } | null {
  if (rms(frame) < opts.silenceRms) return null;
  const result = yinFrame(frame, sampleRate, opts);
  if (!result || result.clarity < 0.4) return null;
  return result;
}

/**
 * Run frame-by-frame YIN pitch detection across an entire audio channel.
 */
export function detectPitchTrack(
  channelData: Float32Array,
  sampleRate: number,
  opts: PitchDetectOptions = DEFAULT_PITCH_OPTIONS,
): PitchFrame[] {
  const frames: PitchFrame[] = [];
  const { frameSize, hopSize } = opts;

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.subarray(start, start + frameSize);
    const level = rms(frame);
    const time = start / sampleRate;

    if (level < opts.silenceRms) {
      frames.push({ time, frequency: 0, clarity: 0, rms: level });
      continue;
    }

    const result = yinFrame(frame, sampleRate, opts);
    if (!result) {
      frames.push({ time, frequency: 0, clarity: 0, rms: level });
      continue;
    }

    frames.push({ time, frequency: result.frequency, clarity: result.clarity, rms: level });
  }

  return frames;
}

export interface SegmentOptions {
  /** Minimum clarity to consider a frame voiced. */
  minClarity: number;
  /** Minimum note duration to keep (seconds); shorter blips are discarded. */
  minNoteDuration: number;
  /** Max semitone jump within a segment before it's split into a new note. */
  maxSemitoneJump: number;
  /** Max gap (seconds) of unvoiced frames tolerated before splitting a note. */
  maxGap: number;
}

export const DEFAULT_SEGMENT_OPTIONS: SegmentOptions = {
  minClarity: 0.5,
  minNoteDuration: 0.06,
  maxSemitoneJump: 0.75,
  maxGap: 0.08,
};

/**
 * Group a raw pitch track into discrete sung notes: contiguous voiced runs
 * with roughly stable pitch. This is the sung-audio analogue of the MIDI
 * note list, used for note-to-note alignment against the target melody.
 */
export function segmentIntoNotes(
  frames: PitchFrame[],
  opts: SegmentOptions = DEFAULT_SEGMENT_OPTIONS,
): SungNote[] {
  const notes: SungNote[] = [];
  let current: PitchFrame[] = [];
  let lastVoicedTime = -Infinity;

  const flush = () => {
    if (current.length === 0) return;
    const startTime = current[0].time;
    const endTime = current[current.length - 1].time;
    if (endTime - startTime >= opts.minNoteDuration) {
      notes.push({ startTime, endTime, midi: medianMidi(current), frames: current });
    }
    current = [];
  };

  for (const frame of frames) {
    const voiced = frame.frequency > 0 && frame.clarity >= opts.minClarity;
    if (!voiced) {
      if (frame.time - lastVoicedTime > opts.maxGap) flush();
      continue;
    }

    const midi = hzToMidi(frame.frequency);
    if (current.length > 0) {
      const refMidi = medianMidi(current);
      const gapTooLarge = frame.time - lastVoicedTime > opts.maxGap;
      const jumpTooLarge = Math.abs(midi - refMidi) > semitoneSplitThreshold(current, opts);
      if (gapTooLarge || jumpTooLarge) flush();
    }

    current.push(frame);
    lastVoicedTime = frame.time;
  }
  flush();

  return notes;
}

function semitoneSplitThreshold(current: PitchFrame[], opts: SegmentOptions): number {
  // Allow a bit more wobble once a note is established (vibrato), but split
  // quickly on a clean jump to a new pitch.
  return current.length < 4 ? opts.maxSemitoneJump : opts.maxSemitoneJump * 2.5;
}

function medianMidi(frames: PitchFrame[]): number {
  const midis = frames.map((f) => hzToMidi(f.frequency)).sort((a, b) => a - b);
  const mid = Math.floor(midis.length / 2);
  return midis.length % 2 === 0 ? (midis[mid - 1] + midis[mid]) / 2 : midis[mid];
}

/**
 * Run pitch detection off the main thread so the UI stays responsive on
 * longer takes. Falls back to synchronous detection if Workers aren't
 * available (e.g. under a test runner).
 */
export function detectPitchTrackAsync(
  channelData: Float32Array,
  sampleRate: number,
  opts: Partial<PitchDetectOptions> = {},
): Promise<PitchFrame[]> {
  if (typeof Worker === "undefined") {
    return Promise.resolve(detectPitchTrack(channelData, sampleRate, { ...DEFAULT_PITCH_OPTIONS, ...opts }));
  }

  return new Promise((resolve, reject) => {
    const worker = new PitchWorker();
    worker.onmessage = (event: MessageEvent<{ frames: PitchFrame[] }>) => {
      resolve(event.data.frames);
      worker.terminate();
    };
    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };
    const copy = channelData.slice();
    worker.postMessage({ channelData: copy, sampleRate, options: opts }, [copy.buffer]);
  });
}
