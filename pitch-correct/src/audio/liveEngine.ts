import SignalsmithStretch from "signalsmith-stretch";
import type { StretchNode } from "signalsmith-stretch";
import { detectPitchSingleFrame } from "./pitchDetect";
import { snapToNearestOctave } from "./align";
import { hzToMidi } from "./types";
import type { TargetNote } from "./types";

export interface LiveStatus {
  running: boolean;
  elapsed: number;
  currentTargetMidi: number | null;
  detectedMidi: number | null;
  semitoneShift: number;
}

export interface LiveSession {
  stop: () => void;
}

const UPDATE_INTERVAL_MS = 50;
const ANALYSER_FFT_SIZE = 2048;
/** How far ahead of "now" we schedule pitch updates, to give the node time to react smoothly. */
const LOOKAHEAD_SECONDS = 0.08;

/**
 * Real-time monitor mode: mic input is pitch-shifted live so each moment
 * snaps to whichever MIDI note is "current" at that point on the timeline
 * (timeline starts the instant you press play). Unlike the offline
 * pipeline, timing can't be corrected live (we can't time-stretch audio
 * that hasn't been sung yet), so this only corrects pitch.
 */
export async function startLiveSession(
  audioContext: AudioContext,
  targetNotes: TargetNote[],
  onStatus: (status: LiveStatus) => void,
): Promise<LiveSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = ANALYSER_FFT_SIZE;
  source.connect(analyser);
  const analyserBuffer = new Float32Array(analyser.fftSize);

  const node: StretchNode = await SignalsmithStretch(audioContext, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });
  source.connect(node);
  node.connect(audioContext.destination);
  await node.schedule({ output: audioContext.currentTime, active: true, semitones: 0 });

  const startTime = audioContext.currentTime;
  let targetIndex = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) return;

    const elapsed = audioContext.currentTime - startTime;

    // Advance a cursor through the (time-sorted) target notes rather than
    // rescanning from the start every tick.
    while (targetIndex < targetNotes.length - 1 && targetNotes[targetIndex].endTime <= elapsed) {
      targetIndex++;
    }
    const current = targetNotes[targetIndex];
    const activeTarget = current && current.startTime <= elapsed && elapsed < current.endTime ? current : null;

    analyser.getFloatTimeDomainData(analyserBuffer);
    const pitch = detectPitchSingleFrame(analyserBuffer, audioContext.sampleRate);
    const detectedMidi = pitch ? hzToMidi(pitch.frequency) : null;

    let semitoneShift = 0;
    if (activeTarget && detectedMidi != null) {
      const snapped = snapToNearestOctave(detectedMidi, activeTarget.midi);
      semitoneShift = snapped - detectedMidi;
    }

    void node.schedule({
      output: audioContext.currentTime + LOOKAHEAD_SECONDS,
      active: true,
      semitones: semitoneShift,
    });

    onStatus({
      running: true,
      elapsed,
      currentTargetMidi: activeTarget?.midi ?? null,
      detectedMidi,
      semitoneShift,
    });
  };

  const interval = window.setInterval(tick, UPDATE_INTERVAL_MS);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(interval);
    void node.schedule({ output: audioContext.currentTime, active: false });
    source.disconnect();
    node.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    onStatus({ running: false, elapsed: audioContext.currentTime - startTime, currentTargetMidi: null, detectedMidi: null, semitoneShift: 0 });
  };

  return { stop };
}
