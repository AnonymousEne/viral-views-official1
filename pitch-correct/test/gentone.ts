import { Midi } from "@tonejs/midi";
import { midiToHz } from "../src/audio/types";
import { audioBufferToWav } from "../src/audio/wav";

const statusEl = document.getElementById("status")!;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function main() {
  // Chromium's --use-file-for-fake-audio-capture reads a WAV file (parses
  // the header for format, loops the samples for the capture stream).
  const sampleRate = 48000;
  const midi = 57; // A3 - deliberately different from the target MIDI note
  const duration = 4;
  const freq = midiToHz(midi);
  const length = sampleRate * duration;

  const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
  const buffer = offlineCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  const fadeSamples = Math.floor(0.02 * sampleRate);
  for (let i = 0; i < length; i++) {
    let amp = 0.5;
    if (i < fadeSamples) amp *= i / fadeSamples;
    if (i > length - fadeSamples) amp *= (length - i) / fadeSamples;
    data[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }

  const wavBlob = audioBufferToWav(buffer);
  const wavBytes = new Uint8Array(await wavBlob.arrayBuffer());

  // One-note MIDI reference: C4 (midi 60), deliberately different from the
  // fake mic tone above (A3, midi 57) so a real correction is observable.
  const targetMidi = 60;
  const midiFile = new Midi();
  const track = midiFile.addTrack();
  track.addNote({ midi: targetMidi, time: 0, duration, velocity: 0.8 });
  const midiBytes = midiFile.toArray();

  (
    window as unknown as {
      __tone: { wavBase64: string; midi: number; sampleRate: number; midiBase64: string; targetMidi: number };
    }
  ).__tone = {
    wavBase64: toBase64(wavBytes),
    midi,
    sampleRate,
    midiBase64: toBase64(midiBytes),
    targetMidi,
  };
  statusEl.setAttribute("data-done", "true");
}

main().catch((err) => {
  console.error(err);
  statusEl.textContent = String(err);
  statusEl.setAttribute("data-done", "false");
});
