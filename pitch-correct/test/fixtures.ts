import { audioBufferToWav } from "../src/audio/wav";
import { buildTargetMidiArrayBuffer, synthesizeSungBuffer } from "./synth";

const statusEl = document.getElementById("status")!;

function toBase64(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < arr.length; i += chunkSize) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function main() {
  const sungBuffer = synthesizeSungBuffer(44100);
  const wavBlob = audioBufferToWav(sungBuffer);
  const wavBytes = await wavBlob.arrayBuffer();
  const midiBytes = buildTargetMidiArrayBuffer();

  (window as unknown as { __fixtures: { wavBase64: string; midiBase64: string } }).__fixtures = {
    wavBase64: toBase64(wavBytes),
    midiBase64: toBase64(midiBytes),
  };
  statusEl.setAttribute("data-done", "true");
}

main().catch((err) => {
  console.error(err);
  statusEl.setAttribute("data-done", "false");
  statusEl.textContent = String(err);
});
