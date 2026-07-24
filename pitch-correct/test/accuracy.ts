import { detectPitchTrack, segmentIntoNotes, DEFAULT_PITCH_OPTIONS } from "../src/audio/pitchDetect";
import { hzToMidi, midiToHz } from "../src/audio/types";

const statusEl = document.getElementById("status")!;
const log = (m: string) => {
  console.log(m);
  statusEl.textContent += "\n" + m;
};

interface Case {
  name: string;
  midi: number;
  duration: number;
  vibratoRate: number;
  vibratoDepthSemitones: number;
  noiseLevel: number;
  harmonics: number[]; // relative amplitudes of harmonics 1..N
}

const cases: Case[] = [
  { name: "low male A2, no vibrato, clean", midi: 45, duration: 1.5, vibratoRate: 0, vibratoDepthSemitones: 0, noiseLevel: 0, harmonics: [1, 0.5, 0.3, 0.15, 0.08] },
  { name: "male A3, natural vibrato", midi: 57, duration: 2.0, vibratoRate: 5.5, vibratoDepthSemitones: 0.4, noiseLevel: 0.01, harmonics: [1, 0.6, 0.35, 0.2, 0.1, 0.05] },
  { name: "female A4, vibrato + breath noise", midi: 69, duration: 2.0, vibratoRate: 6, vibratoDepthSemitones: 0.5, noiseLevel: 0.03, harmonics: [1, 0.4, 0.25, 0.1] },
  { name: "high female A5, light vibrato", midi: 81, duration: 1.2, vibratoRate: 6.5, vibratoDepthSemitones: 0.3, noiseLevel: 0.02, harmonics: [1, 0.3, 0.1] },
  { name: "falsetto-ish D5 sustained", midi: 74, duration: 2.5, vibratoRate: 5, vibratoDepthSemitones: 0.6, noiseLevel: 0.02, harmonics: [1, 0.2] },
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function synth(c: Case, sampleRate: number): Float32Array {
  const length = Math.floor(c.duration * sampleRate);
  const data = new Float32Array(length);
  const rand = mulberry32(42);
  const fadeSamples = Math.floor(0.03 * sampleRate);
  // Correct FM synthesis: accumulate phase from the instantaneous frequency
  // rather than plugging a time-varying f(t) into sin(2*pi*f(t)*t), which
  // does not preserve the intended instantaneous frequency over time.
  const phase = new Float32Array(c.harmonics.length);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const vibrato = c.vibratoRate > 0 ? Math.sin(2 * Math.PI * c.vibratoRate * t) * c.vibratoDepthSemitones : 0;
    const f0 = midiToHz(c.midi + vibrato);
    let sample = 0;
    for (let h = 0; h < c.harmonics.length; h++) {
      phase[h] += (2 * Math.PI * f0 * (h + 1)) / sampleRate;
      sample += c.harmonics[h] * Math.sin(phase[h]);
    }
    sample += (rand() * 2 - 1) * c.noiseLevel;

    let amp = 0.35;
    if (i < fadeSamples) amp *= i / fadeSamples;
    if (i > length - fadeSamples) amp *= (length - i) / fadeSamples;
    data[i] = sample * amp;
  }
  return data;
}

async function main() {
  const sampleRate = 44100;
  let allPass = true;

  for (const c of cases) {
    const data = synth(c, sampleRate);
    const frames = detectPitchTrack(data, sampleRate, DEFAULT_PITCH_OPTIONS);
    const notes = segmentIntoNotes(frames);

    const voicedFrames = frames.filter((f) => f.frequency > 0 && f.clarity > 0.4);
    if (voicedFrames.length === 0) {
      log(`FAIL ${c.name}: no voiced frames detected at all`);
      allPass = false;
      continue;
    }

    const midis = voicedFrames.map((f) => hzToMidi(f.frequency));
    midis.sort((a, b) => a - b);
    const medianMidi = midis[Math.floor(midis.length / 2)];
    const errorSemitones = Math.abs(medianMidi - c.midi);
    const errorCents = errorSemitones * 100;

    // Octave errors (a classic pitch-tracker failure mode) show up as ~12
    // semitones off; flag those separately from fine-grained error.
    const octaveError = Math.abs(errorSemitones - Math.round(errorSemitones / 12) * 12) < 0.5 && Math.round(errorSemitones / 12) !== 0;

    const voicedCoverage = voicedFrames.length / frames.length;
    const notesOk = notes.length >= 1;

    const pass = errorCents < 15 && !octaveError && notesOk && voicedCoverage > 0.5;
    allPass = allPass && pass;

    log(
      `${pass ? "PASS" : "FAIL"} ${c.name}: median=${medianMidi.toFixed(2)} expected=${c.midi} error=${errorCents.toFixed(1)}cents ` +
        `voicedCoverage=${(voicedCoverage * 100).toFixed(0)}% notesFound=${notes.length}${octaveError ? " [OCTAVE ERROR]" : ""}`,
    );
  }

  statusEl.setAttribute("data-done", allPass ? "pass" : "fail");
}

main().catch((err) => {
  log("ERROR: " + (err instanceof Error ? err.stack : String(err)));
  statusEl.setAttribute("data-done", "fail");
});
