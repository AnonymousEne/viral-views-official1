import { Midi } from "@tonejs/midi";
import { midiToHz } from "../src/audio/types";

/** Shared synthetic scenario used by both the pipeline harness and the fixture generator: a 3-note melody, sung deliberately flat and off-time. */
export const TARGET_SPEC = [
  { midi: 60, time: 0.0, duration: 0.6 },
  { midi: 64, time: 0.6, duration: 0.6 },
  { midi: 67, time: 1.2, duration: 0.8 },
];

export const SUNG_SPEC = [
  { midi: 58.7, start: 0.05, end: 0.5 },
  { midi: 63.4, start: 0.68, end: 1.25 },
  { midi: 66.2, start: 1.3, end: 2.05 },
];

export const SUNG_TOTAL_DURATION = 2.3;

export function buildTargetMidiArrayBuffer(): ArrayBuffer {
  const midi = new Midi();
  const track = midi.addTrack();
  for (const n of TARGET_SPEC) {
    track.addNote({ midi: n.midi, time: n.time, duration: n.duration, velocity: 0.8 });
  }
  const bytes = midi.toArray();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function synthesizeSungBuffer(sampleRate: number): AudioBuffer {
  const length = Math.ceil(SUNG_TOTAL_DURATION * sampleRate);
  const ctx = new OfflineAudioContext(1, length, sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const fadeSamples = Math.floor(0.01 * sampleRate);

  for (const note of SUNG_SPEC) {
    const freq = midiToHz(note.midi);
    const startSample = Math.floor(note.start * sampleRate);
    const endSample = Math.floor(note.end * sampleRate);
    for (let s = startSample; s < endSample && s < length; s++) {
      const tRel = (s - startSample) / sampleRate;
      let amp = 0.4;
      const distFromStart = s - startSample;
      const distFromEnd = endSample - s;
      if (distFromStart < fadeSamples) amp *= distFromStart / fadeSamples;
      if (distFromEnd < fadeSamples) amp *= distFromEnd / fadeSamples;
      data[s] += amp * Math.sin(2 * Math.PI * freq * tRel);
    }
  }

  return buffer;
}
